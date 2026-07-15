// Polls provider APIs for in-flight video generations, downloads results,
// persists to storage, and updates progress. Called by cron every 15s.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch pending jobs (limit to prevent overrun)
    const { data: jobs, error } = await supa
      .from("video_generations")
      .select("*")
      .in("status", ["processing", "queued"])
      .not("provider_job_id", "is", null)
      .limit(20);

    if (error) throw error;
    if (!jobs || jobs.length === 0) {
      return json({ polled: 0 });
    }

    const results = await Promise.allSettled(jobs.map((job) => pollOne(supa, job)));
    const summary = results.map((r, i) => ({
      id: jobs[i].id,
      status: r.status,
      ...(r.status === "rejected" ? { error: String(r.reason) } : {}),
    }));

    return json({ polled: jobs.length, results: summary });
  } catch (e) {
    console.error("video-poll error:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

async function pollOne(supa: SupabaseClient, job: any) {
  const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_API_KEY");
  const replicateKey = Deno.env.get("LOVABLE_CONNECTOR_REPLICATE_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (job.provider === "replicate" && replicateKey) {
    const gateway = "https://connector-gateway.lovable.dev/replicate/v1";
    const res = await fetch(`${gateway}/predictions/${job.provider_job_id}`, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": replicateKey,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Replicate poll [${res.status}]: ${body}`);
    }
    const pred = await res.json();
    const s = pred.status;

    if (s === "starting" || s === "processing") {
      const prog = s === "starting" ? 20 : Math.min(90, (job.progress ?? 20) + 5);
      await supa.from("video_generations").update({ progress: prog }).eq("id", job.id);
      return;
    }
    if (s === "succeeded") {
      const outputUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
      if (!outputUrl) throw new Error("Replicate succeeded without output URL");
      await finalizeJob(supa, job, outputUrl);
      return;
    }
    if (s === "failed" || s === "canceled") {
      await supa
        .from("video_generations")
        .update({ status: "failed", error: pred.error ?? s })
        .eq("id", job.id);
      await logStep(supa, job.id, "error", "failed", `Replicate ${s}: ${pred.error ?? ""}`);
      return;
    }
    return;
  }

  if (job.provider === "veo3" && geminiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${job.provider_job_id}?key=${geminiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Veo3 poll [${res.status}]: ${body}`);
    }
    const op = await res.json();

    if (!op.done) {
      const prog = Math.min(90, (job.progress ?? 15) + 10);
      await supa.from("video_generations").update({ progress: prog }).eq("id", job.id);
      return;
    }
    if (op.error) {
      await supa
        .from("video_generations")
        .update({ status: "failed", error: op.error.message ?? "Veo3 failed" })
        .eq("id", job.id);
      await logStep(supa, job.id, "error", "failed", `Veo 3 falhou: ${op.error.message}`);
      return;
    }

    // Veo3 returns videos array with URI needing key appended for download
    const videos = op.response?.generateVideoResponse?.generatedSamples ?? [];
    const uri = videos[0]?.video?.uri;
    if (!uri) throw new Error("Veo3 done but no video URI");
    const downloadUrl = uri.includes("?") ? `${uri}&key=${geminiKey}` : `${uri}?key=${geminiKey}`;
    await finalizeJob(supa, job, downloadUrl);
    return;
  }
}

async function finalizeJob(supa: SupabaseClient, job: any, providerUrl: string) {
  await logStep(supa, job.id, "download", "in_progress", "Baixando vídeo do provider");

  const videoRes = await fetch(providerUrl);
  if (!videoRes.ok) throw new Error(`Download failed: ${videoRes.status}`);
  const videoBuf = new Uint8Array(await videoRes.arrayBuffer());

  const storagePath = `${job.tenant_id}/${job.id}.mp4`;
  const { error: uploadErr } = await supa.storage
    .from("videos")
    .upload(storagePath, videoBuf, {
      contentType: "video/mp4",
      upsert: true,
    });
  if (uploadErr) throw new Error(`Storage upload: ${uploadErr.message}`);

  // Signed URL 24h
  const { data: signed, error: signErr } = await supa.storage
    .from("videos")
    .createSignedUrl(storagePath, 60 * 60 * 24);
  if (signErr) throw new Error(`Signed URL: ${signErr.message}`);

  await logStep(supa, job.id, "persist", "completed", "Vídeo salvo no storage");
  await logStep(supa, job.id, "complete", "completed", "Pronto!");

  await supa
    .from("video_generations")
    .update({
      status: "completed",
      progress: 100,
      storage_path: storagePath,
      output_url: signed.signedUrl,
      completed_at: new Date().toISOString(),
    })
    .eq("id", job.id);
}

async function logStep(
  supa: SupabaseClient,
  generationId: string,
  stepType: string,
  status: "in_progress" | "completed" | "failed",
  message: string,
  payload: Record<string, unknown> = {},
) {
  await supa.from("video_generation_steps").insert({
    generation_id: generationId,
    step_type: stepType,
    status,
    message,
    payload,
  });
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
