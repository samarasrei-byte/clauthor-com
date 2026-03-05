import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── Meta Webhook Verification (GET) ──
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "clauthor_webhook_2024";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[whatsapp-webhook] Verification successful");
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // ── Incoming Messages (POST) ──
  try {
    const body = await req.json();
    console.log("[whatsapp-webhook] Incoming:", JSON.stringify(body).slice(0, 500));

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.[0]) {
      // Status update or other non-message event
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = value.messages[0];
    const senderPhone = message.from;
    const messageText = message.text?.body || "";
    const phoneNumberId = value.metadata?.phone_number_id;

    if (!messageText || !senderPhone) {
      return new Response(JSON.stringify({ status: "no_text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find which user owns this phone_number_id
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up platform credentials to find the owner
    const { data: creds } = await supabaseAdmin
      .from("platform_credentials")
      .select("*")
      .eq("integration_name", "whatsapp")
      .eq("credential_key", "phone_id")
      .eq("credential_value", phoneNumberId)
      .eq("is_active", true)
      .limit(1);

    let accessToken: string | null = null;
    let companyContext = "";

    if (creds && creds.length > 0) {
      // Platform-level credential — get access token
      const { data: tokenCred } = await supabaseAdmin
        .from("platform_credentials")
        .select("credential_value")
        .eq("integration_name", "whatsapp")
        .eq("credential_key", "access_token")
        .eq("is_active", true)
        .limit(1);

      accessToken = tokenCred?.[0]?.credential_value || null;

      // Get company context from any user (platform mode)
      // For multi-tenant, we'd need to map phone_id to user_id
    } else {
      // Check agent-level credentials
      const { data: agentCreds } = await supabaseAdmin
        .from("agent_credentials")
        .select("*, agents!inner(user_id)")
        .eq("integration_name", "whatsapp")
        .eq("credential_key", "phone_id")
        .eq("credential_value", phoneNumberId)
        .limit(1);

      if (agentCreds && agentCreds.length > 0) {
        const userId = (agentCreds[0] as any).agents?.user_id;
        
        // Get access token
        const { data: tokenCred } = await supabaseAdmin
          .from("agent_credentials")
          .select("credential_value")
          .eq("agent_id", agentCreds[0].agent_id)
          .eq("integration_name", "whatsapp")
          .eq("credential_key", "access_token")
          .limit(1);

        accessToken = tokenCred?.[0]?.credential_value || null;

        // Load company board context
        if (userId) {
          const { data: boardData } = await supabaseAdmin
            .from("company_board")
            .select("category, title, content")
            .eq("user_id", userId);

          if (boardData && boardData.length > 0) {
            companyContext = boardData
              .map((b) => `[${b.category}] ${b.title}: ${b.content}`)
              .join("\n");
          }
        }
      }
    }

    if (!accessToken) {
      console.error("[whatsapp-webhook] No access token found for phone_id:", phoneNumberId);
      return new Response(JSON.stringify({ error: "no_credentials" }), {
        status: 200, // Return 200 to Meta to avoid retries
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Generate AI Response ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[whatsapp-webhook] LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "ai_not_configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um assistente virtual inteligente de uma empresa. Responda de forma natural, clara e útil.

${companyContext ? `## Contexto da Empresa\n${companyContext}` : "Você está representando uma empresa. Seja educado e profissional."}

## Regras:
- Responda em português do Brasil
- Seja conciso (máximo 300 palavras) — WhatsApp tem limite de leitura
- Se não souber a resposta, diga que vai encaminhar para um humano
- Nunca invente informações sobre preços ou serviços que não estejam no contexto
- Use emojis com moderação
- Termine mensagens complexas oferecendo mais ajuda`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: messageText },
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[whatsapp-webhook] AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const replyText = aiData.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem. Um humano entrará em contato.";

    // ── Send Reply via WhatsApp API ──
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: senderPhone,
          type: "text",
          text: { body: replyText },
        }),
      }
    );

    if (!whatsappResponse.ok) {
      const errBody = await whatsappResponse.text();
      console.error("[whatsapp-webhook] WhatsApp send error:", errBody);
    } else {
      console.log("[whatsapp-webhook] Reply sent to", senderPhone);
    }

    return new Response(JSON.stringify({ status: "replied" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[whatsapp-webhook] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 200, // Always 200 for Meta
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
