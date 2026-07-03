import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

// Testa a conexão de uma plataforma social. Retorna { ok, latency_ms, detail }.
// Body: { provider: 'linkedin' | 'tiktok' | 'x' | 'youtube' | 'meta' }
Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return errorResponse("Unauthorized", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const provider = String(body.provider || "").toLowerCase();
    if (!["linkedin", "tiktok", "x", "youtube", "meta"].includes(provider)) {
      return errorResponse("provider inválido", 400);
    }

    const started = Date.now();

    if (provider === "linkedin") {
      const { data: session } = await supabase
        .from("hunter_linkedin_session")
        .select("access_token")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!session?.access_token) {
        return jsonResponse({ ok: false, detail: "Conta LinkedIn não conectada" });
      }
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const latency_ms = Date.now() - started;
      if (!res.ok) {
        return jsonResponse({ ok: false, latency_ms, detail: `LinkedIn respondeu ${res.status}. Token pode ter expirado — reconecte.` });
      }
      const me = await res.json();
      return jsonResponse({ ok: true, latency_ms, detail: `Token válido. Usuário: ${me.name || me.email || me.sub}` });
    }

    // Outros providers: verificar apenas se credenciais de plataforma existem
    const secretMap: Record<string, string[]> = {
      tiktok: ["TIKTOK_CLIENT_ID", "TIKTOK_CLIENT_SECRET"],
      x: ["TWITTER_CONSUMER_KEY", "TWITTER_CONSUMER_SECRET"],
      youtube: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      meta: ["META_APP_ID", "META_APP_SECRET"],
    };
    const required = secretMap[provider] ?? [];
    const missing = required.filter((k) => !Deno.env.get(k));
    const latency_ms = Date.now() - started;
    if (missing.length > 0) {
      return jsonResponse({
        ok: false,
        latency_ms,
        detail: `Aguardando configuração das credenciais: ${missing.join(", ")}. Adicione em Configurações → Secrets.`,
      });
    }
    return jsonResponse({
      ok: false,
      latency_ms,
      detail: "Credenciais de plataforma OK, mas OAuth por usuário ainda não implementado para este provider.",
    });
  } catch (e) {
    return errorResponse((e as Error).message || "Erro interno", 500);
  }
});
