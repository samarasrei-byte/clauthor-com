// Video generation dispatcher — Veo 3 / Replicate / Lovable AI
// Creates a video_generations row + kicks off the provider job.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const BodySchema = z.object({
  provider: z.enum(["veo3", "replicate", "lovable"]),
  prompt: z.string().min(3).max(2000),
  input_image_url: z.string().url().optional().nullable(),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]).default("16:9"),
  duration_s: z.number().int().min(3).max(30).default(5),
  model: z.string().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client (validates JWT + gives us auth.uid())
    const supaUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supaUser.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);
    const userId = userData.user.id;

    // Service client for privileged writes/reads
    const supa = createClient(supabaseUrl, serviceKey);

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, 400);
    }
    const body = parsed.data;

    // Resolve tenant
    const { data: tenantRow } = await supa
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!tenantRow) return json({ error: "No tenant found for user" }, 400);
    const tenantId = tenantRow.tenant_id;

    // Check quota
    const { data: quota, error: quotaErr } = await supa.rpc("check_video_quota", {
      _user_id: userId,
    });
    if (quotaErr) return json({ error: "Quota check failed", details: quotaErr.message }, 500);

    const q = quota as {
      plan: string;
      monthly_limit: number;
      used: number;
      remaining: number;
      max_duration_s: number;
      allow_veo3: boolean;
      allow_replicate: boolean;
      allow_lovable: boolean;
      can_generate: boolean;
    };

    if (!q.can_generate) {
      return json({
        error: "quota_exceeded",
        message: `Você atingiu o limite mensal do plano ${q.plan} (${q.used}/${q.monthly_limit}). Faça upgrade para continuar.`,
        quota: q,
      }, 402);
    }

    if (body.duration_s > q.max_duration_s) {
      return json({
        error: "duration_exceeded",
        message: `Seu plano permite no máximo ${q.max_duration_s}s por vídeo.`,
        quota: q,
      }, 400);
    }

    const providerAllowed =
      (body.provider === "veo3" && q.allow_veo3) ||
      (body.provider === "replicate" && q.allow_replicate) ||
      (body.provider === "lovable" && q.allow_lovable);

    if (!providerAllowed) {
      return json({
        error: "provider_not_allowed",
        message: `Provider ${body.provider} não está disponível no plano ${q.plan}.`,
        quota: q,
      }, 403);
    }

    // Check provider credentials
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const replicateKey = Deno.env.get("LOVABLE_CONNECTOR_REPLICATE_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (body.provider === "veo3" && !geminiKey) {
      return json({
        error: "provider_not_configured",
        message: "Veo 3 precisa da GEMINI_API_KEY configurada. Peça ao admin para adicioná-la nos secrets.",
        provider: "veo3",
      }, 503);
    }
    if (body.provider === "replicate" && !replicateKey) {
      return json({
        error: "provider_not_configured",
        message: "Replicate precisa ser conectado. Vá em Configurações → Conectores.",
        provider: "replicate",
      }, 503);
    }
    if (body.provider === "lovable" && !lovableKey) {
      return json({ error: "LOVABLE_API_KEY missing" }, 500);
    }

    // Create job row
    const { data: gen, error: genErr } = await supa
      .from("video_generations")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        provider: body.provider,
        model: body.model ?? defaultModel(body.provider),
        prompt: body.prompt,
        input_image_url: body.input_image_url ?? null,
        aspect_ratio: body.aspect_ratio,
        duration_s: body.duration_s,
        status: "queued",
        progress: 0,
      })
      .select()
      .single();

    if (genErr || !gen) {
      return json({ error: "Failed to create generation", details: genErr?.message }, 500);
    }

    await logStep(supa, gen.id, "dispatch", "completed", `Job criado para ${body.provider}`, { model: gen.model });

    // Dispatch to provider (async — we fire-and-forget, poll takes over)
    dispatchProvider(supa, gen, { geminiKey, replicateKey, lovableKey }).catch(async (err) => {
      console.error("Provider dispatch error:", err);
      await supa
        .from("video_generations")
        .update({ status: "failed", error: String(err?.message ?? err) })
        .eq("id", gen.id);
      await logStep(supa, gen.id, "error", "failed", `Dispatch falhou: ${String(err?.message ?? err)}`);
    });

    return json({ generation: gen, quota: q }, 200);
  } catch (e) {
    console.error("video-generate error:", e);
    return json({ error: "Internal error", details: String((e as Error)?.message ?? e) }, 500);
  }
});

function defaultModel(provider: string): string {
  switch (provider) {
    case "veo3": return "veo-3.0-generate-preview";
    case "replicate": return "wan-video/wan-2.2-i2v-fast";
    case "lovable": return "lovable/video-1";
    default: return "";
  }
}

async function logStep(
  supa: ReturnType<typeof createClient>,
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

async function dispatchProvider(
  supa: ReturnType<typeof createClient>,
  gen: any,
  keys: { geminiKey?: string; replicateKey?: string; lovableKey?: string },
) {
  await supa.from("video_generations").update({ status: "processing", progress: 5 }).eq("id", gen.id);
  await logStep(supa, gen.id, "render", "in_progress", `Enviado ao provider ${gen.provider}`);

  if (gen.provider === "replicate") {
    const gateway = "https://connector-gateway.lovable.dev/replicate/v1";
    const input: Record<string, unknown> = {
      prompt: gen.prompt,
      num_frames: gen.duration_s * 24,
      aspect_ratio: gen.aspect_ratio,
    };
    if (gen.input_image_url) input.image = gen.input_image_url;

    const res = await fetch(`${gateway}/models/${gen.model}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keys.lovableKey}`,
        "X-Connection-Api-Key": keys.replicateKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Replicate [${res.status}]: ${errBody}`);
    }
    const pred = await res.json();
    await supa
      .from("video_generations")
      .update({ provider_job_id: pred.id, progress: 15 })
      .eq("id", gen.id);
    await logStep(supa, gen.id, "poll", "in_progress", `Job Replicate: ${pred.id}`, { predictionId: pred.id });
    return;
  }

  if (gen.provider === "veo3") {
    // Gemini Veo 3 long-running operation
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${gen.model}:predictLongRunning?key=${keys.geminiKey}`;
    const instances = [{ prompt: gen.prompt }];
    if (gen.input_image_url) {
      // Fetch image and inline
      const imgRes = await fetch(gen.input_image_url);
      const imgBuf = new Uint8Array(await imgRes.arrayBuffer());
      const b64 = btoa(String.fromCharCode(...imgBuf));
      (instances[0] as any).image = { bytesBase64Encoded: b64, mimeType: imgRes.headers.get("content-type") ?? "image/png" };
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances,
        parameters: {
          aspectRatio: gen.aspect_ratio,
          durationSeconds: gen.duration_s,
          personGeneration: "allow_all",
        },
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Veo3 [${res.status}]: ${errBody}`);
    }
    const op = await res.json();
    await supa
      .from("video_generations")
      .update({ provider_job_id: op.name, progress: 15 })
      .eq("id", gen.id);
    await logStep(supa, gen.id, "poll", "in_progress", `Operação Veo 3: ${op.name}`, { operation: op.name });
    return;
  }

  if (gen.provider === "lovable") {
    // Lovable AI does not yet expose a runtime video endpoint.
    // Fail cleanly so the UI can surface the message.
    throw new Error("Lovable AI video generation ainda não está disponível no runtime. Use Veo 3 ou Replicate.");
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
