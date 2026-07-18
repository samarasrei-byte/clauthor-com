// video-clipper-post
// Publishes an approved & rendered clip to Meta (Instagram Reels / Facebook)
// and/or YouTube Shorts. Expects the clip to have a public MP4 URL in
// clipper_clips.rendered_urls[format].url — call video-clipper-render first
// and poll Shotstack for the final URL, or attach an upload URL directly.
//
// Body: { clip_id: uuid, platforms: ('instagram'|'facebook'|'youtube')[], format?: '9:16'|'1:1'|'16:9' }
//
// Required secrets (add via add_secret; per-user OAuth is the proper path,
// but env-scoped tokens are accepted as a fallback for single-tenant setups):
//   META_ACCESS_TOKEN, META_IG_USER_ID, META_PAGE_ID
//   YOUTUBE_ACCESS_TOKEN

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface PostBody {
  clip_id: string;
  platforms: Array<'instagram' | 'facebook' | 'youtube'>;
  format?: '9:16' | '1:1' | '16:9';
}

type PostResult = { platform: string; ok: boolean; id?: string; error?: string };

async function postInstagramReel(videoUrl: string, caption: string): Promise<PostResult> {
  const token = Deno.env.get('META_ACCESS_TOKEN');
  const igUserId = Deno.env.get('META_IG_USER_ID');
  if (!token || !igUserId) return { platform: 'instagram', ok: false, error: 'meta_not_configured' };

  // Step 1: create media container.
  const createUrl = `https://graph.facebook.com/v20.0/${igUserId}/media`;
  const createResp = await fetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      access_token: token,
    }),
  });
  if (!createResp.ok) {
    const err = await createResp.text();
    return { platform: 'instagram', ok: false, error: `create: ${err.slice(0, 300)}` };
  }
  const { id: creationId } = await createResp.json();

  // Step 2: publish.
  const publishUrl = `https://graph.facebook.com/v20.0/${igUserId}/media_publish`;
  const publishResp = await fetch(publishUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId, access_token: token }),
  });
  if (!publishResp.ok) {
    const err = await publishResp.text();
    return { platform: 'instagram', ok: false, error: `publish: ${err.slice(0, 300)}` };
  }
  const pub = await publishResp.json();
  return { platform: 'instagram', ok: true, id: pub?.id };
}

async function postFacebookReel(videoUrl: string, caption: string): Promise<PostResult> {
  const token = Deno.env.get('META_ACCESS_TOKEN');
  const pageId = Deno.env.get('META_PAGE_ID');
  if (!token || !pageId) return { platform: 'facebook', ok: false, error: 'meta_not_configured' };

  const url = `https://graph.facebook.com/v20.0/${pageId}/video_reels`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      upload_phase: 'start',
      file_url: videoUrl,
      description: caption,
      access_token: token,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    return { platform: 'facebook', ok: false, error: err.slice(0, 300) };
  }
  const data = await resp.json();
  return { platform: 'facebook', ok: true, id: data?.video_id ?? data?.id };
}

async function postYouTubeShort(videoUrl: string, title: string, description: string): Promise<PostResult> {
  const token = Deno.env.get('YOUTUBE_ACCESS_TOKEN');
  if (!token) return { platform: 'youtube', ok: false, error: 'youtube_not_configured' };

  // Fetch the MP4 bytes then use the resumable upload endpoint.
  const videoResp = await fetch(videoUrl);
  if (!videoResp.ok) return { platform: 'youtube', ok: false, error: `download: ${videoResp.status}` };
  const videoBytes = new Uint8Array(await videoResp.arrayBuffer());

  const metadata = {
    snippet: { title: title.slice(0, 95), description, categoryId: '22' },
    status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
  };

  // Initiate resumable upload.
  const initResp = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': String(videoBytes.byteLength),
      },
      body: JSON.stringify(metadata),
    },
  );
  if (!initResp.ok) {
    const err = await initResp.text();
    return { platform: 'youtube', ok: false, error: `init: ${err.slice(0, 300)}` };
  }
  const uploadUrl = initResp.headers.get('location');
  if (!uploadUrl) return { platform: 'youtube', ok: false, error: 'no_upload_url' };

  // Upload bytes.
  const upResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(videoBytes.byteLength) },
    body: videoBytes,
  });
  if (!upResp.ok) {
    const err = await upResp.text();
    return { platform: 'youtube', ok: false, error: `upload: ${err.slice(0, 300)}` };
  }
  const uploaded = await upResp.json();
  return { platform: 'youtube', ok: true, id: uploaded?.id };
}

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

    const body: PostBody = await req.json().catch(() => ({} as PostBody));
    if (!body?.clip_id || !Array.isArray(body?.platforms) || body.platforms.length === 0) {
      return new Response(JSON.stringify({ error: 'clip_id + platforms[] required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const format = body.format ?? '9:16';

    const { data: clip, error: clipErr } = await supabase
      .from('clipper_clips')
      .select('id,user_id,rendered_urls,caption,hook,title,hashtags,posted_to')
      .eq('id', body.clip_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (clipErr || !clip) {
      return new Response(JSON.stringify({ error: 'clip_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rendered = (clip.rendered_urls ?? {}) as Record<string, { url?: string; status?: string }>;
    const videoUrl = rendered?.[format]?.url;
    if (!videoUrl) {
      return new Response(JSON.stringify({
        error: 'clip_not_rendered',
        hint: 'Call video-clipper-render and wait for a public URL before posting',
      }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const hashtags = Array.isArray(clip.hashtags) ? clip.hashtags.join(' ') : '';
    const caption = [clip.hook, clip.caption, hashtags].filter(Boolean).join('\n\n').slice(0, 2000);
    const title = clip.title ?? clip.hook ?? 'New Clip';

    const results: PostResult[] = [];
    for (const platform of body.platforms) {
      try {
        if (platform === 'instagram') results.push(await postInstagramReel(videoUrl, caption));
        else if (platform === 'facebook') results.push(await postFacebookReel(videoUrl, caption));
        else if (platform === 'youtube') results.push(await postYouTubeShort(videoUrl, title, caption));
        else results.push({ platform, ok: false, error: 'unsupported_platform' });
      } catch (e) {
        results.push({ platform, ok: false, error: String(e).slice(0, 300) });
      }
    }

    const anyOk = results.some((r) => r.ok);
    const postedTo = { ...(clip.posted_to as Record<string, unknown> ?? {}) };
    for (const r of results) {
      postedTo[r.platform] = { ok: r.ok, id: r.id, error: r.error, at: new Date().toISOString() };
    }

    await supabase
      .from('clipper_clips')
      .update({
        status: anyOk ? 'posted' : 'failed',
        posted_to: postedTo,
      })
      .eq('id', clip.id);

    return new Response(JSON.stringify({ ok: anyOk, results }), {
      status: anyOk ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('video-clipper-post error', err);
    return new Response(JSON.stringify({ error: 'internal', details: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
