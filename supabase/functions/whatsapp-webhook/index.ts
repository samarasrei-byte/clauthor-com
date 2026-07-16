/**
 * whatsapp-webhook · Meta Cloud API inbound webhook.
 *
 * GET  → verificação de subscription (hub.challenge)
 * POST → recebe mensagens: texto, áudio (transcreve via Lovable AI STT),
 *        imagem, documento. Persiste em whatsapp_messages e dispara THOR
 *        para classificar intenção + enfileirar task/aprovação.
 *
 * verify_jwt=false — Meta não envia JWT do Supabase.
 * Segurança: verify_token (query param) valida a subscription; assinatura
 * X-Hub-Signature-256 valida cada POST usando o app secret da Meta.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";
const META_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── HMAC signature verification (Meta X-Hub-Signature-256) ────────────────
async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!META_APP_SECRET) return true; // dev mode: sem app secret configurado
  if (!signature || !signature.startsWith("sha256=")) return false;
  const expected = signature.slice(7);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(META_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

// ── Download media via Meta Graph API ─────────────────────────────────────
async function downloadMedia(mediaId: string): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  if (!META_ACCESS_TOKEN) return null;
  try {
    const meta = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` },
    });
    if (!meta.ok) return null;
    const info = await meta.json();
    const bin = await fetch(info.url, { headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` } });
    if (!bin.ok) return null;
    const bytes = new Uint8Array(await bin.arrayBuffer());
    return { bytes, mimeType: info.mime_type ?? "application/octet-stream" };
  } catch (e) {
    console.error("[whatsapp-webhook] downloadMedia failed:", e);
    return null;
  }
}

// ── Transcribe audio via Lovable AI STT ───────────────────────────────────
async function transcribeAudio(bytes: Uint8Array, mimeType: string): Promise<string | null> {
  if (!LOVABLE_API_KEY) return null;
  try {
    // WhatsApp envia OGG/Opus — o gateway aceita. Nome com extensão coerente.
    const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp3") ? "mp3" : mimeType.includes("wav") ? "wav" : "ogg";
    const form = new FormData();
    form.append("model", "openai/gpt-4o-transcribe");
    form.append("file", new Blob([bytes], { type: mimeType }), `voice.${ext}`);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: form,
    });
    if (!res.ok) {
      console.error("[whatsapp-webhook] STT failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    return data.text ?? null;
  } catch (e) {
    console.error("[whatsapp-webhook] transcribeAudio error:", e);
    return null;
  }
}

// ── Ask THOR to classify and (if low-risk) execute ────────────────────────
async function askThor(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string,
  prompt: string,
): Promise<{ intent: string | null; run_id: string | null; reply: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("thor-first-output", {
      body: { prompt, tenant_id: tenantId, source: "whatsapp" },
      headers: { "x-service-user-id": userId },
    });
    if (error) {
      console.error("[whatsapp-webhook] askThor error:", error);
      return { intent: null, run_id: null, reply: null };
    }
    const payload = (data as any)?.payload;
    return {
      intent: payload?.routed_department ?? null,
      run_id: (data as any)?.run_id ?? null,
      reply: payload?.output_body ?? payload?.output_title ?? null,
    };
  } catch (e) {
    console.error("[whatsapp-webhook] askThor exception:", e);
    return { intent: null, run_id: null, reply: null };
  }
}

// ── Send an outbound WhatsApp reply ───────────────────────────────────────
async function sendReply(phoneNumberId: string, to: string, text: string): Promise<void> {
  if (!META_ACCESS_TOKEN) return;
  try {
    await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text.slice(0, 4000) },
      }),
    });
  } catch (e) {
    console.error("[whatsapp-webhook] sendReply failed:", e);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // ── GET: subscription verification ──────────────────────────────────────
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode !== "subscribe" || !token) {
      return new Response("bad_request", { status: 400, headers: cors });
    }

    const { data } = await admin
      .from("whatsapp_config")
      .select("tenant_id")
      .eq("verify_token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (!data) return new Response("forbidden", { status: 403, headers: cors });
    return new Response(challenge ?? "", { status: 200, headers: cors });
  }

  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405, headers: cors });
  }

  // ── POST: inbound events ────────────────────────────────────────────────
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!(await verifySignature(rawBody, signature))) {
    console.warn("[whatsapp-webhook] invalid signature");
    return new Response("invalid_signature", { status: 401, headers: cors });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("bad_json", { status: 400, headers: cors });
  }

  // Meta pode enviar múltiplos entries; iteramos.
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      if (!value) continue;
      const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      // Localiza a config do tenant pelo phone_number_id.
      const { data: cfg } = await admin
        .from("whatsapp_config")
        .select("tenant_id, created_by")
        .eq("phone_number_id", phoneNumberId)
        .eq("is_active", true)
        .maybeSingle();

      if (!cfg) {
        console.warn("[whatsapp-webhook] no config for phone_number_id:", phoneNumberId);
        continue;
      }
      const tenantId = cfg.tenant_id as string;
      const ownerUserId = cfg.created_by as string;

      // Status updates (delivered/read/failed) — atualiza mensagem outbound.
      for (const st of value?.statuses ?? []) {
        if (!st?.id) continue;
        await admin
          .from("whatsapp_messages")
          .update({ status: st.status ?? "sent" })
          .eq("wa_message_id", st.id);
      }

      // Mensagens de entrada.
      for (const msg of value?.messages ?? []) {
        try {
          const from: string = msg.from;
          const waId: string = msg.id;
          const type: string = msg.type;
          const profileName: string | undefined = value?.contacts?.[0]?.profile?.name;

          // Idempotência: se já existe, pula.
          const { data: existing } = await admin
            .from("whatsapp_messages")
            .select("id")
            .eq("wa_message_id", waId)
            .maybeSingle();
          if (existing) continue;

          // Upsert da conversa.
          let conversationId: string | null = null;
          const { data: conv } = await admin
            .from("whatsapp_conversations")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("contact_phone", from)
            .maybeSingle();

          if (conv) {
            conversationId = conv.id as string;
          } else {
            const { data: created } = await admin
              .from("whatsapp_conversations")
              .insert({
                tenant_id: tenantId,
                contact_phone: from,
                contact_name: profileName ?? null,
              })
              .select("id")
              .single();
            conversationId = created?.id as string;
          }
          if (!conversationId) continue;

          // Extração de conteúdo por tipo.
          let text_body: string | null = null;
          let media_url: string | null = null;
          let media_mime: string | null = null;
          let audio_transcript: string | null = null;
          let msg_type: string = "text";

          if (type === "text") {
            text_body = msg.text?.body ?? "";
            msg_type = "text";
          } else if (type === "audio" || type === "voice") {
            msg_type = "audio";
            const mediaId = msg.audio?.id ?? msg.voice?.id;
            if (mediaId) {
              const media = await downloadMedia(mediaId);
              if (media) {
                media_mime = media.mimeType;
                audio_transcript = await transcribeAudio(media.bytes, media.mimeType);
                text_body = audio_transcript;
              }
            }
          } else if (type === "image") {
            msg_type = "image";
            text_body = msg.image?.caption ?? null;
            media_mime = msg.image?.mime_type ?? null;
          } else if (type === "document") {
            msg_type = "document";
            text_body = msg.document?.filename ?? null;
            media_mime = msg.document?.mime_type ?? null;
          } else if (type === "video") {
            msg_type = "video";
            text_body = msg.video?.caption ?? null;
            media_mime = msg.video?.mime_type ?? null;
          }

          // Persiste a mensagem.
          await admin.from("whatsapp_messages").insert({
            tenant_id: tenantId,
            conversation_id: conversationId,
            wa_message_id: waId,
            direction: "inbound",
            message_type: msg_type,
            text_body,
            media_url,
            media_mime_type: media_mime,
            audio_transcript,
            status: "received",
            raw_payload: msg,
          });

          // Atualiza preview da conversa.
          await admin
            .from("whatsapp_conversations")
            .update({
              last_message_at: new Date().toISOString(),
              last_message_preview: (text_body ?? `[${msg_type}]`).slice(0, 200),
              contact_name: profileName ?? undefined,
              unread_count: (conv as any)?.unread_count != null ? undefined : 1,
            })
            .eq("id", conversationId);

          // Se for o dono do canal (número dele mesmo mandando), pipe pro THOR.
          // Heurística mínima: qualquer texto/áudio recebido é candidato a task.
          const promptForThor = (text_body ?? "").trim();
          if (promptForThor.length >= 3 && msg_type !== "document") {
            const thorRes = await askThor(admin, tenantId, ownerUserId, promptForThor);

            await admin
              .from("whatsapp_messages")
              .update({
                thor_intent: thorRes.intent,
                thor_run_id: thorRes.run_id,
                processed_at: new Date().toISOString(),
              })
              .eq("wa_message_id", waId);

            // Resposta automática (baixo risco): manda o output curto do THOR.
            if (thorRes.reply) {
              const reply = `🤖 THOR classificou: *${thorRes.intent ?? "geral"}*\n\n${thorRes.reply.slice(0, 800)}\n\n_Ações críticas ficam na Central de Aprovações no painel._`;
              await sendReply(phoneNumberId, from, reply);

              // Registra a resposta como outbound.
              await admin.from("whatsapp_messages").insert({
                tenant_id: tenantId,
                conversation_id: conversationId,
                direction: "outbound",
                message_type: "text",
                text_body: reply,
                status: "sent",
              });
            }
          }
        } catch (msgErr) {
          console.error("[whatsapp-webhook] message handling error:", msgErr);
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
