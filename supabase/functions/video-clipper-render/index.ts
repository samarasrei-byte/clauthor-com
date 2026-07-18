// video-clipper-render
// Renders approved clip segments into MP4 files via Shotstack Edit API.
// - Input: { clip_id: uuid } — the clipper_clips row to render.
// - Output: { render_id, poll_url, rendered_urls } once the job is queued.
// - Requires: SHOTSTACK_API_KEY (production) or SHOTSTACK_SANDBOX_API_KEY.
//
// Note: Deno edge runtime cannot spawn FFmpeg; we delegate to Shotstack
// (industry-standard cloud renderer). Add SHOTSTACK_API_KEY as a project
// secret before invoking. If missing, returns a clear 501.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface RenderBody { clip_id: string; format?: '9:16' | '1:1' | '16:9' }

const FORMAT_TO_SIZE: Record<string, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '1:1':  { width: 1080, height: 1080 },
  '16:9': { width: 1920, height: 1080 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = userData.user;

    const body: RenderBody = await req.json().catch(() => ({} as RenderBody));
    if (!body?.clip_id || typeof body.clip_id !== 'string') {
      return new Response(JSON.stringify({ error: 'clip_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const format = body.format ?? '9:16';
    const size = FORMAT_TO_SIZE[format] ?? FORMAT_TO_SIZE['9:16'];

    // Load clip + parent job (RLS enforced via service role + explicit user filter).
    const { data: clip, error: clipErr } = await supabase
      .from('clipper_clips')
      .select('id,user_id,job_id,start_s,end_s,caption,hook,title')
      .eq('id', body.clip_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (clipErr || !clip) {
      return new Response(JSON.stringify({ error: 'clip_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: job } = await supabase
      .from('clipper_jobs')
      .select('id,source_url,source_type')
      .eq('id', clip.job_id)
      .maybeSingle();
    if (!job) {
      return new Response(JSON.stringify({ error: 'job_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (job.source_type !== 'direct' && job.source_type !== 'upload') {
      // Shotstack needs a direct MP4 URL. YouTube/Drive must be resolved
      // to a signed/downloadable URL upstream before render.
      return new Response(JSON.stringify({
        error: 'source_not_renderable',
        details: `source_type=${job.source_type} — resolve to a direct MP4 URL first`,
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('SHOTSTACK_API_KEY') ?? Deno.env.get('SHOTSTACK_SANDBOX_API_KEY');
    const stage = Deno.env.get('SHOTSTACK_API_KEY') ? 'v1' : 'stage';
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'shotstack_not_configured',
        hint: 'Add SHOTSTACK_API_KEY (or SHOTSTACK_SANDBOX_API_KEY) via add_secret',
      }), { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const duration = Math.max(1, (clip.end_s ?? 0) - (clip.start_s ?? 0));
    const captionText = (clip.hook ?? clip.title ?? clip.caption ?? '').slice(0, 120);

    const edit = {
      timeline: {
        background: '#000000',
        tracks: [
          {
            clips: [
              {
                asset: { type: 'video', src: job.source_url, trim: clip.start_s ?? 0 },
                start: 0,
                length: duration,
                fit: 'cover',
              },
            ],
          },
          ...(captionText ? [{
            clips: [{
              asset: {
                type: 'title',
                text: captionText,
                style: 'minimal',
                color: '#ffffff',
                size: 'medium',
                background: '#00000088',
                position: 'bottom',
              },
              start: 0,
              length: duration,
            }],
          }] : []),
        ],
      },
      output: { format: 'mp4', resolution: 'hd', size },
    };

    const resp = await fetch(`https://api.shotstack.io/${stage}/render`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(edit),
    });
    if (!resp.ok) {
      const errorBody = await resp.text();
      console.error('shotstack_render_failed', resp.status, errorBody);
      await supabase.from('clipper_clips').update({ status: 'failed' }).eq('id', clip.id);
      return new Response(JSON.stringify({
        error: 'shotstack_error', status: resp.status, details: errorBody,
      }), { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const json = await resp.json();
    const renderId = json?.response?.id;
    if (!renderId) {
      return new Response(JSON.stringify({ error: 'no_render_id', details: json }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Persist render_id and mark clip as rendering.
    const rendered = {
      [format]: { provider: 'shotstack', stage, render_id: renderId, status: 'queued' },
    };
    await supabase
      .from('clipper_clips')
      .update({ status: 'rendering', rendered_urls: rendered })
      .eq('id', clip.id);

    return new Response(JSON.stringify({
      render_id: renderId,
      poll_url: `https://api.shotstack.io/${stage}/render/${renderId}`,
      rendered_urls: rendered,
    }), { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('video-clipper-render error', err);
    return new Response(JSON.stringify({ error: 'internal', details: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
