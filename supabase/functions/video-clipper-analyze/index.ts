// Video Clipper — Analyze source and propose the best clips.
//
// MVP scope:
//  - Accept a YouTube URL, a public video URL, or a Google Drive share link.
//  - Ask Gemini 2.5 to reason over the source (title/transcript hint if any)
//    and propose 3-6 highlight cuts (start, end, caption, hashtags, hook).
//  - Persist proposals to `clipper_jobs` + `clipper_clips`.
//  - Real trim/render/publish happens in follow-up functions.
//
// Auth: verify JWT; write rows on behalf of the caller.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  source_url: z.string().url().max(2000),
  formats: z.array(z.enum(['9:16', '1:1', '16:9'])).min(1).max(3),
  hint: z.string().max(500).optional(),
});

function detectSourceType(url: string): 'youtube' | 'drive' | 'direct' {
  if (/youtu\.be|youtube\.com/i.test(url)) return 'youtube';
  if (/drive\.google\.com|dropbox\.com/i.test(url)) return 'drive';
  return 'direct';
}

const SYSTEM_PROMPT = `You are Thor, an expert short-form video editor.
Given a source video (title/URL/hints), propose 3-6 highlight cuts optimized for social virality.

For each clip, output:
- start_s / end_s: integer seconds, clip length between 15-60s
- hook: 1 punchy line to open with (Portuguese, max 60 chars)
- caption: 1-2 sentences for the social post (Portuguese, includes 1 emoji)
- hashtags: array of 3-5 relevant Portuguese hashtags without #
- title: 3-6 word clip title (Portuguese)

Rules:
- Prioritize dopamine curves: bold statement, contrarian take, "aha" moment, or emotional peak.
- Each clip must stand alone.
- Never overlap start/end ranges between clips.
- Output STRICT JSON only, matching the schema.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const { source_url, formats, hint } = parsed.data;
    const source_type = detectSourceType(source_url);

    // Auth: pass through the caller's JWT.
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create job row (queued).
    const { data: job, error: jobErr } = await supabase
      .from('clipper_jobs')
      .insert({
        user_id: user.id,
        source_url,
        source_type,
        formats,
        hint: hint ?? null,
        status: 'analyzing',
      })
      .select('id')
      .single();
    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: 'job_create_failed', details: jobErr?.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ask Gemini for highlight proposals.
    const userPrompt = `Source URL: ${source_url}
Source type: ${source_type}
Target formats: ${formats.join(', ')}
${hint ? `Context hint from user: ${hint}` : ''}

Propose 4 clips. Respond as JSON:
{"clips":[{"start_s":int,"end_s":int,"hook":str,"caption":str,"hashtags":[str],"title":str}]}`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      await supabase.from('clipper_jobs').update({ status: 'failed', error: errText.slice(0, 500) }).eq('id', job.id);
      return new Response(
        JSON.stringify({ error: 'ai_gateway_failed', status: aiResp.status, details: errText }),
        { status: aiResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const aiJson = await aiResp.json();
    let clips: Array<{ start_s: number; end_s: number; hook: string; caption: string; hashtags: string[]; title: string }> = [];
    try {
      const parsedContent = JSON.parse(aiJson.choices?.[0]?.message?.content ?? '{}');
      clips = Array.isArray(parsedContent.clips) ? parsedContent.clips : [];
    } catch (e) {
      console.error('parse_clips_failed', e);
    }

    if (clips.length === 0) {
      await supabase.from('clipper_jobs').update({ status: 'failed', error: 'no_clips_returned' }).eq('id', job.id);
      return new Response(JSON.stringify({ error: 'no_clips_returned' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Persist clip proposals.
    const rows = clips.map((c) => ({
      job_id: job.id,
      user_id: user.id,
      start_s: c.start_s,
      end_s: c.end_s,
      hook: c.hook,
      caption: c.caption,
      hashtags: c.hashtags,
      title: c.title,
      status: 'proposed' as const,
    }));
    const { data: inserted, error: insErr } = await supabase.from('clipper_clips').insert(rows).select('*');
    if (insErr) {
      console.error('clips_insert_failed', insErr);
    }
    await supabase.from('clipper_jobs').update({ status: 'ready' }).eq('id', job.id);

    return new Response(JSON.stringify({ job_id: job.id, clips: inserted ?? rows }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('video-clipper-analyze error', err);
    return new Response(JSON.stringify({ error: 'internal', details: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
