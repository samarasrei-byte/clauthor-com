import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

/**
 * Meta (Facebook + Instagram) OAuth 2.0 handler — multi-tenant (per-user tokens).
 * Actions:
 *   - "authorize"  -> returns Facebook authorize URL
 *   - "callback"   -> exchanges code, fetches long-lived token, pages & IG accounts
 *   - "disconnect" -> removes stored connection
 */

const GRAPH = "https://graph.facebook.com/v19.0";
const SCOPES = [
  "public_profile",
  "email",
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_content_publish",
].join(",");

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
    const action = body.action || "authorize";

    const APP_ID = Deno.env.get("META_APP_ID");
    const APP_SECRET = Deno.env.get("META_APP_SECRET");
    if (!APP_ID || !APP_SECRET) {
      return errorResponse("Meta não configurado no servidor (META_APP_ID/SECRET ausentes)", 500);
    }

    if (action === "authorize") {
      const redirect_uri = String(body.redirect_uri || "");
      if (!redirect_uri) return errorResponse("redirect_uri obrigatório", 400);
      const state = `${user.id}:${crypto.randomUUID()}`;
      const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
      url.searchParams.set("client_id", APP_ID);
      url.searchParams.set("redirect_uri", redirect_uri);
      url.searchParams.set("scope", SCOPES);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("state", state);
      return jsonResponse({ url: url.toString(), state });
    }

    if (action === "callback") {
      const { code, redirect_uri } = body as { code: string; redirect_uri: string };
      if (!code || !redirect_uri) return errorResponse("code e redirect_uri obrigatórios", 400);

      // 1) Short-lived token
      const tokenUrl = new URL(`${GRAPH}/oauth/access_token`);
      tokenUrl.searchParams.set("client_id", APP_ID);
      tokenUrl.searchParams.set("client_secret", APP_SECRET);
      tokenUrl.searchParams.set("redirect_uri", redirect_uri);
      tokenUrl.searchParams.set("code", code);
      const tRes = await fetch(tokenUrl.toString());
      const tJson = await tRes.json();
      if (!tRes.ok) return errorResponse(tJson.error?.message || "Falha ao obter token", 400);
      const shortToken: string = tJson.access_token;

      // 2) Exchange for long-lived (~60 days)
      const llUrl = new URL(`${GRAPH}/oauth/access_token`);
      llUrl.searchParams.set("grant_type", "fb_exchange_token");
      llUrl.searchParams.set("client_id", APP_ID);
      llUrl.searchParams.set("client_secret", APP_SECRET);
      llUrl.searchParams.set("fb_exchange_token", shortToken);
      const llRes = await fetch(llUrl.toString());
      const llJson = await llRes.json();
      const access_token: string = llJson.access_token || shortToken;
      const expires_in: number = llJson.expires_in || 0;

      // 3) Profile
      let meta_user_id = "";
      let profile_name = user.email?.split("@")[0] || "Meta User";
      let profile_avatar_url = "";
      try {
        const meRes = await fetch(`${GRAPH}/me?fields=id,name,picture&access_token=${access_token}`);
        if (meRes.ok) {
          const me = await meRes.json();
          meta_user_id = me.id || "";
          profile_name = me.name || profile_name;
          profile_avatar_url = me.picture?.data?.url || "";
        }
      } catch (_) { /* non-blocking */ }

      // 4) Pages + linked Instagram business accounts
      const pages: Array<Record<string, unknown>> = [];
      const igAccounts: Array<Record<string, unknown>> = [];
      try {
        const pRes = await fetch(
          `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${access_token}`,
        );
        if (pRes.ok) {
          const pJson = await pRes.json();
          for (const p of pJson.data || []) {
            pages.push({ id: p.id, name: p.name, page_access_token: p.access_token });
            if (p.instagram_business_account) {
              igAccounts.push({
                id: p.instagram_business_account.id,
                username: p.instagram_business_account.username,
                avatar_url: p.instagram_business_account.profile_picture_url,
                page_id: p.id,
              });
            }
          }
        }
      } catch (_) { /* non-blocking */ }

      const { error: upErr } = await supabase
        .from("meta_connections")
        .upsert({
          user_id: user.id,
          access_token,
          expires_at: expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
          meta_user_id,
          profile_name,
          profile_avatar_url,
          pages,
          instagram_accounts: igAccounts,
          granted_scopes: SCOPES.split(","),
          connected_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      if (upErr) return errorResponse(upErr.message, 500);

      return jsonResponse({
        success: true,
        profile_name,
        profile_avatar_url,
        pages_count: pages.length,
        instagram_count: igAccounts.length,
      });
    }

    if (action === "disconnect") {
      const { error } = await supabase
        .from("meta_connections")
        .delete()
        .eq("user_id", user.id);
      if (error) return errorResponse(error.message, 500);
      return jsonResponse({ success: true });
    }

    if (action === "status") {
      const { data } = await supabase
        .from("meta_connections")
        .select("profile_name,profile_avatar_url,pages,instagram_accounts,expires_at,connected_at")
        .eq("user_id", user.id)
        .maybeSingle();
      return jsonResponse({ connected: !!data, connection: data || null });
    }

    return errorResponse("Ação inválida", 400);
  } catch (e) {
    return errorResponse((e as Error).message || "Erro interno", 500);
  }
});
