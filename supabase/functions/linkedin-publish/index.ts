import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

// Publica um post no LinkedIn como o usuário conectado.
// Body: { content: string, link_url?: string, visibility?: 'PUBLIC'|'CONNECTIONS' }
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
    const content: string = (body.content || "").toString().trim();
    const link_url: string | undefined = body.link_url;
    const visibility: "PUBLIC" | "CONNECTIONS" = body.visibility === "CONNECTIONS" ? "CONNECTIONS" : "PUBLIC";

    if (!content || content.length < 3) return errorResponse("Conteúdo obrigatório (mín. 3 caracteres)", 400);
    if (content.length > 3000) return errorResponse("Conteúdo excede 3000 caracteres", 400);

    // Recupera sessão LinkedIn do usuário
    const { data: session } = await supabase
      .from("hunter_linkedin_session")
      .select("access_token, linkedin_user_id, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!session?.access_token || !session?.linkedin_user_id) {
      return errorResponse("LinkedIn não conectado. Conecte em /settings/social", 400);
    }
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return errorResponse("Token do LinkedIn expirado. Reconecte em /settings/social", 401);
    }

    const author = `urn:li:person:${session.linkedin_user_id}`;
    const ugcBody: Record<string, unknown> = {
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: link_url ? "ARTICLE" : "NONE",
          ...(link_url ? { media: [{ status: "READY", originalUrl: link_url }] } : {}),
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": visibility },
    };

    const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(ugcBody),
    });

    const postJson = await postRes.json().catch(() => ({} as Record<string, unknown>));
    if (!postRes.ok) {
      const msg = (postJson as { message?: string })?.message || "Falha ao publicar no LinkedIn";
      await supabase.from("linkedin_posts").insert({
        user_id: user.id,
        linkedin_urn: "error",
        content,
        link_url,
        visibility,
        status: "failed",
        error_message: msg,
      });
      return errorResponse(msg, postRes.status);
    }

    const urn = (postJson as { id?: string }).id || `urn:li:share:${Date.now()}`;
    await supabase.from("linkedin_posts").insert({
      user_id: user.id,
      linkedin_urn: urn,
      content,
      link_url,
      visibility,
      status: "published",
    });

    return jsonResponse({ success: true, urn, url: `https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}` });
  } catch (e) {
    return errorResponse((e as Error).message || "Erro interno", 500);
  }
});
