import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

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
      // ── WhatsApp Business API validation (Meta official) ──
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
            { headers: { Authorization: `Bearer ${access_token}` } }
          );

          if (res.ok) {
            const data = await res.json();
            return new Response(JSON.stringify({
              valid: true,
              message: "Conexão WhatsApp (Meta) validada com sucesso! ✅",
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

      // ── LinkedIn API validation ──
      case "linkedin": {
        const { access_token, client_id } = credentials;
        if (!access_token) {
          return new Response(JSON.stringify({
            valid: false,
            error: "access_token é obrigatório",
          }), { headers });
        }

        try {
          const res = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
          });

          if (res.ok) {
            const data = await res.json();
            return new Response(JSON.stringify({
              valid: true,
              message: "Conexão LinkedIn validada com sucesso! ✅",
              details: {
                name: data.name || data.given_name || "OK",
                email: data.email || "não disponível",
              },
            }), { headers });
          }

          const errData = await res.json().catch(() => ({}));
          return new Response(JSON.stringify({
            valid: false,
            error: errData?.message || `LinkedIn API retornou ${res.status}`,
            hint: res.status === 401
              ? "Token expirado ou inválido. Gere um novo no LinkedIn Developer Portal."
              : "Verifique se o Access Token possui os escopos corretos (r_liteprofile, r_emailaddress).",
          }), { headers });
        } catch (err) {
          return new Response(JSON.stringify({
            valid: false,
            error: "Falha ao conectar com a LinkedIn API",
            hint: "Verifique sua conexão e tente novamente.",
          }), { headers });
        }
      }

      // ── Meta Ads (Marketing API) validation ──
      case "meta_ads": {
        const { access_token, ad_account_id } = credentials;
        if (!access_token || !ad_account_id) {
          return new Response(JSON.stringify({
            valid: false,
            error: "access_token e ad_account_id são obrigatórios",
          }), { headers });
        }

        try {
          const accountId = ad_account_id.startsWith("act_") ? ad_account_id : `act_${ad_account_id}`;
          const res = await fetch(
            `https://graph.facebook.com/v18.0/${accountId}?fields=name,account_status,currency,balance&access_token=${access_token}`
          );

          if (res.ok) {
            const data = await res.json();
            const statusMap: Record<number, string> = {
              1: "Ativa",
              2: "Desativada",
              3: "Não aprovada",
              7: "Revisão pendente",
              9: "Em período de carência",
              100: "Suspendia",
              101: "Fechada",
            };
            return new Response(JSON.stringify({
              valid: true,
              message: "Conexão Meta Ads validada com sucesso! ✅",
              details: {
                account_name: data.name || accountId,
                status: statusMap[data.account_status] || `Status ${data.account_status}`,
                currency: data.currency || "N/A",
              },
            }), { headers });
          }

          const errData = await res.json().catch(() => ({}));
          return new Response(JSON.stringify({
            valid: false,
            error: errData?.error?.message || `Meta Ads API retornou ${res.status}`,
            hint: res.status === 190
              ? "Token expirado. Gere um novo no Graph API Explorer."
              : "Verifique se o Ad Account ID e Access Token estão corretos.",
          }), { headers });
        } catch (err) {
          return new Response(JSON.stringify({
            valid: false,
            error: "Falha ao conectar com a Meta Ads API",
            hint: "Verifique sua conexão e tente novamente.",
          }), { headers });
        }
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
