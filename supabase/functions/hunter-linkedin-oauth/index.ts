import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

// LinkedIn OAuth 2.0 handler
// Actions:
//   - action="authorize" -> returns the LinkedIn authorize URL
//   - action="callback"  -> exchanges code for tokens and persists session
//   - action="disconnect"-> removes stored session
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

    const CLIENT_ID = Deno.env.get("LINKEDIN_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("LINKEDIN_CLIENT_SECRET");
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return errorResponse("LinkedIn não configurado no servidor", 500);
    }

    if (action === "authorize") {
      const redirect_uri = body.redirect_uri as string;
      if (!redirect_uri) return errorResponse("redirect_uri obrigatório", 400);
      const state = `${user.id}:${crypto.randomUUID()}`;
      const scope = "openid profile email w_member_social";
      const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", CLIENT_ID);
      url.searchParams.set("redirect_uri", redirect_uri);
      url.searchParams.set("scope", scope);
      url.searchParams.set("state", state);
      return jsonResponse({ url: url.toString(), state });
    }

    if (action === "callback") {
      const { code, redirect_uri } = body as { code: string; redirect_uri: string };
      if (!code || !redirect_uri) return errorResponse("code e redirect_uri obrigatórios", 400);

      // Exchange code for token
      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
      });
      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok) {
        return errorResponse(tokenJson.error_description || "Falha ao obter token", 400);
      }

      const access_token: string = tokenJson.access_token;
      const refresh_token: string = tokenJson.refresh_token || "";
      const expires_in: number = tokenJson.expires_in || 0;

      // Fetch profile via OIDC userinfo
      let linkedin_user_id = "";
      let profile_name = user.email?.split("@")[0] || "LinkedIn User";
      let profile_avatar_url = "";
      try {
        const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          linkedin_user_id = me.sub || "";
          profile_name = me.name || profile_name;
          profile_avatar_url = me.picture || "";
        }
      } catch (_) { /* non-blocking */ }

      const { error: upErr } = await supabase
        .from("hunter_linkedin_session")
        .upsert({
          user_id: user.id,
          access_token,
          refresh_token,
          linkedin_user_id,
          profile_name,
          profile_avatar_url,
          profile_url: linkedin_user_id ? `https://www.linkedin.com/in/${linkedin_user_id}` : "",
          expires_at: expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
          connected_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upErr) return errorResponse(upErr.message, 500);
      return jsonResponse({ success: true, profile_name, profile_avatar_url });
    }

    if (action === "disconnect") {
      const { error } = await supabase
        .from("hunter_linkedin_session")
        .delete()
        .eq("user_id", user.id);
      if (error) return errorResponse(error.message, 500);
      return jsonResponse({ success: true });
    }

    return errorResponse("Ação inválida", 400);
  } catch (e) {
    return errorResponse((e as Error).message || "Erro interno", 500);
  }
});
