import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

// Retorna métricas resumidas da conexão LinkedIn do usuário:
//   - profile (via /v2/userinfo — valida o token, funciona como "teste")
//   - posts recentes publicados via nossa plataforma (últimos 30 dias)
//   - contadores agregados (publicados / falhados)
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

    const { data: session } = await supabase
      .from("hunter_linkedin_session")
      .select("access_token, linkedin_user_id, profile_name, profile_avatar_url, expires_at, connected_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!session?.access_token) {
      return jsonResponse({ connected: false });
    }

    // Ping /userinfo para validar token (funciona como "test integration")
    let tokenValid = false;
    let profile: Record<string, unknown> = {};
    try {
      const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      tokenValid = meRes.ok;
      if (meRes.ok) profile = await meRes.json();
    } catch (_) { /* offline / rate limit */ }

    // Métricas locais (últimos 30 dias)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentPosts } = await supabase
      .from("linkedin_posts")
      .select("id, content, link_url, status, created_at, linkedin_urn")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(10);

    const { count: totalPublished } = await supabase
      .from("linkedin_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "published");

    const { count: totalFailed } = await supabase
      .from("linkedin_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "failed");

    return jsonResponse({
      connected: true,
      token_valid: tokenValid,
      profile: {
        name: session.profile_name,
        avatar_url: session.profile_avatar_url,
        linkedin_id: session.linkedin_user_id,
        email: (profile as { email?: string }).email,
      },
      session: {
        connected_at: session.connected_at,
        expires_at: session.expires_at,
      },
      metrics: {
        total_published: totalPublished || 0,
        total_failed: totalFailed || 0,
        last_30_days_count: recentPosts?.length || 0,
      },
      recent_posts: recentPosts || [],
    });
  } catch (e) {
    return errorResponse((e as Error).message || "Erro interno", 500);
  }
});
