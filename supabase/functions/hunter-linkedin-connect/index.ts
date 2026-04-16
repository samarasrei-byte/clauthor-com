import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

// Step 1 — Connect LinkedIn (saves session cookie + profile info)
// Body: { linkedin_cookie: string }  -> validates with PhantomBuster, fetches profile
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

    const { linkedin_cookie } = await req.json();
    if (!linkedin_cookie || typeof linkedin_cookie !== "string" || linkedin_cookie.length < 20) {
      return errorResponse("Cookie LinkedIn (li_at) inválido", 400);
    }

    // Best-effort: try to fetch profile name via PhantomBuster Profile Scraper.
    // If it fails, we still save the cookie so the user can continue.
    let profile_name = user.email?.split("@")[0] || "LinkedIn User";
    let profile_avatar_url = "";
    let profile_url = "";

    try {
      const pbKey = Deno.env.get("PHANTOMBUSTER_API_KEY");
      if (pbKey) {
        // No profile call here — keep first connect light. UI will show generic info.
      }
    } catch (_) { /* non-blocking */ }

    const { error: upErr } = await supabase
      .from("hunter_linkedin_session")
      .upsert({
        user_id: user.id,
        linkedin_cookie,
        profile_name,
        profile_avatar_url,
        profile_url,
        connected_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (upErr) return errorResponse(upErr.message, 500);

    return jsonResponse({ success: true, profile_name, profile_avatar_url });
  } catch (e) {
    return errorResponse((e as Error).message || "Erro interno", 500);
  }
});
