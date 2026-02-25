import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { channel, credentials } = await req.json();
    const headers = { ...corsHeaders, "Content-Type": "application/json" };

    if (!channel || !credentials) {
      return new Response(JSON.stringify({ error: "channel and credentials required" }), {
        status: 400, headers,
      });
    }

    switch (channel) {
      // ── WhatsApp Business API validation ──
      case "whatsapp": {
        const { phone_id, access_token } = credentials;
        if (!phone_id || !access_token) {
          return new Response(JSON.stringify({
            valid: false,
            error: "phone_id e access_token são obrigatórios",
          }), { headers });
        }

        try {
          const res = await fetch(
            `https://graph.facebook.com/v18.0/${phone_id}`,
            {
              headers: { Authorization: `Bearer ${access_token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            return new Response(JSON.stringify({
              valid: true,
              message: "Conexão WhatsApp validada com sucesso! ✅",
              details: {
                verified_name: data.verified_name || data.display_phone_number || "OK",
                quality_rating: data.quality_rating || "unknown",
              },
            }), { headers });
          }

          const errData = await res.json().catch(() => ({}));
          return new Response(JSON.stringify({
            valid: false,
            error: errData?.error?.message || `Meta API retornou ${res.status}`,
            hint: "Verifique se o Phone Number ID e Access Token estão corretos no Meta Business.",
          }), { headers });
        } catch (err) {
          return new Response(JSON.stringify({
            valid: false,
            error: "Falha ao conectar com a Meta API",
            hint: "Verifique sua conexão e tente novamente.",
          }), { headers });
        }
      }

      // ── Email / SMTP validation ──
      case "email": {
        const { smtp_host, smtp_port, smtp_user, smtp_pass, api_key, provider } = credentials;

        // If using an API provider (SendGrid, Resend)
        if (provider === "sendgrid" && api_key) {
          try {
            const res = await fetch("https://api.sendgrid.com/v3/user/profile", {
              headers: { Authorization: `Bearer ${api_key}` },
            });
            if (res.ok) {
              return new Response(JSON.stringify({
                valid: true,
                message: "Conexão SendGrid validada com sucesso! ✅",
              }), { headers });
            }
            return new Response(JSON.stringify({
              valid: false,
              error: `SendGrid retornou ${res.status}`,
              hint: "Verifique sua API Key no painel do SendGrid.",
            }), { headers });
          } catch {
            return new Response(JSON.stringify({
              valid: false,
              error: "Falha ao conectar com SendGrid",
            }), { headers });
          }
        }

        if (provider === "resend" && api_key) {
          try {
            const res = await fetch("https://api.resend.com/domains", {
              headers: { Authorization: `Bearer ${api_key}` },
            });
            if (res.ok) {
              return new Response(JSON.stringify({
                valid: true,
                message: "Conexão Resend validada com sucesso! ✅",
              }), { headers });
            }
            return new Response(JSON.stringify({
              valid: false,
              error: `Resend retornou ${res.status}`,
              hint: "Verifique sua API Key no painel do Resend.",
            }), { headers });
          } catch {
            return new Response(JSON.stringify({
              valid: false,
              error: "Falha ao conectar com Resend",
            }), { headers });
          }
        }

        // Generic SMTP — we can only validate format since Deno can't do raw SMTP
        if (smtp_host && smtp_port && smtp_user) {
          const portNum = parseInt(smtp_port);
          if (![25, 465, 587, 2525].includes(portNum)) {
            return new Response(JSON.stringify({
              valid: false,
              error: `Porta SMTP inválida: ${smtp_port}`,
              hint: "Use 465 (SSL) ou 587 (TLS)",
            }), { headers });
          }
          return new Response(JSON.stringify({
            valid: true,
            message: "Configuração SMTP salva. A validação completa ocorrerá no primeiro envio. ✅",
            details: { host: smtp_host, port: portNum, user: smtp_user },
          }), { headers });
        }

        return new Response(JSON.stringify({
          valid: false,
          error: "Forneça credenciais SMTP ou API Key de um provedor (SendGrid/Resend)",
        }), { headers });
      }

      default:
        return new Response(JSON.stringify({
          valid: false,
          error: `Canal '${channel}' não suporta validação ainda.`,
        }), { headers });
    }
  } catch (err) {
    console.error("validate-credentials error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
