import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

/**
 * meta-publish — publica imagem ou vídeo no Facebook (Página) e/ou Instagram
 * usando as credenciais salvas em `meta_connections` (multi-tenant).
 *
 * Body:
 *   platform: "facebook" | "instagram"
 *   media_type: "image" | "video"
 *   media_url: string (URL pública/assinada, https)
 *   caption?: string
 *   page_id?: string        (facebook — default: primeira)
 *   ig_account_id?: string  (instagram — default: primeira)
 *   published?: boolean     (facebook — default: true; false = rascunho)
 */

const GRAPH = "https://graph.facebook.com/v19.0";

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
    const platform = body.platform as "facebook" | "instagram";
    const media_type = body.media_type as "image" | "video";
    const media_url = String(body.media_url || "");
    const caption = String(body.caption || "");
    const published = body.published !== false;

    if (!platform || !media_type || !media_url) {
      return errorResponse("platform, media_type e media_url são obrigatórios", 400);
    }
    if (!/^https:\/\//.test(media_url)) {
      return errorResponse("media_url precisa ser https público", 400);
    }

    const { data: conn, error: connErr } = await supabase
      .from("meta_connections")
      .select("access_token, pages, instagram_accounts")
      .eq("user_id", user.id)
      .maybeSingle();
    if (connErr) return errorResponse(connErr.message, 500);
    if (!conn) return jsonResponse({ ok: false, stage: "not_connected", detail: "Conecte sua conta Meta em Ajustes → Integrações." }, 200);

    // ============ FACEBOOK ============
    if (platform === "facebook") {
      const pages = (conn.pages ?? []) as Array<{ id: string; name: string; page_access_token: string }>;
      const page = body.page_id ? pages.find(p => p.id === body.page_id) : pages[0];
      if (!page) return jsonResponse({ ok: false, stage: "no_page", detail: "Nenhuma Página do Facebook conectada." }, 200);

      if (media_type === "image") {
        const form = new URLSearchParams();
        form.set("url", media_url);
        if (caption) form.set("caption", caption);
        form.set("published", String(published));
        form.set("access_token", page.page_access_token);
        const res = await fetch(`${GRAPH}/${page.id}/photos`, { method: "POST", body: form });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return jsonResponse({ ok: false, stage: "graph_error", error: json.error ?? json, hint: "Verifique pages_manage_posts e reconecte a conta." }, 200);
        return jsonResponse({ ok: true, platform, page: { id: page.id, name: page.name }, post_id: json.post_id ?? json.id, media_id: json.id, published });
      }

      // video
      const form = new URLSearchParams();
      form.set("file_url", media_url);
      if (caption) form.set("description", caption);
      form.set("published", String(published));
      form.set("access_token", page.page_access_token);
      const res = await fetch(`${GRAPH}/${page.id}/videos`, { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return jsonResponse({ ok: false, stage: "graph_error", error: json.error ?? json }, 200);
      return jsonResponse({ ok: true, platform, page: { id: page.id, name: page.name }, video_id: json.id, published, detail: "Vídeo enviado. O Facebook pode levar alguns minutos processando." });
    }

    // ============ INSTAGRAM ============
    if (platform === "instagram") {
      const igAccounts = (conn.instagram_accounts ?? []) as Array<{ id: string; username: string; page_id: string }>;
      const ig = body.ig_account_id ? igAccounts.find(a => a.id === body.ig_account_id) : igAccounts[0];
      if (!ig) return jsonResponse({ ok: false, stage: "no_ig", detail: "Nenhuma conta Instagram Business conectada." }, 200);

      // IG usa o token do usuário (não da página) para /media e /media_publish
      const token = conn.access_token as string;

      // 1) criar container
      const containerForm = new URLSearchParams();
      if (media_type === "image") {
        containerForm.set("image_url", media_url);
      } else {
        containerForm.set("media_type", "REELS");
        containerForm.set("video_url", media_url);
      }
      if (caption) containerForm.set("caption", caption);
      containerForm.set("access_token", token);

      const containerRes = await fetch(`${GRAPH}/${ig.id}/media`, { method: "POST", body: containerForm });
      const containerJson = await containerRes.json().catch(() => ({}));
      if (!containerRes.ok) return jsonResponse({ ok: false, stage: "ig_container_error", error: containerJson.error ?? containerJson }, 200);
      const creation_id = containerJson.id;

      // 2) para vídeo, esperar status FINISHED (poll simples ~60s)
      if (media_type === "video") {
        const deadline = Date.now() + 90_000;
        while (Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 4000));
          const st = await fetch(`${GRAPH}/${creation_id}?fields=status_code&access_token=${token}`);
          const sj = await st.json().catch(() => ({}));
          if (sj.status_code === "FINISHED") break;
          if (sj.status_code === "ERROR") {
            return jsonResponse({ ok: false, stage: "ig_container_processing_error", error: sj }, 200);
          }
        }
      }

      // 3) publicar
      const pubForm = new URLSearchParams();
      pubForm.set("creation_id", creation_id);
      pubForm.set("access_token", token);
      const pubRes = await fetch(`${GRAPH}/${ig.id}/media_publish`, { method: "POST", body: pubForm });
      const pubJson = await pubRes.json().catch(() => ({}));
      if (!pubRes.ok) return jsonResponse({ ok: false, stage: "ig_publish_error", error: pubJson.error ?? pubJson }, 200);

      return jsonResponse({ ok: true, platform, ig_account: { id: ig.id, username: ig.username }, media_id: pubJson.id, creation_id });
    }

    return errorResponse("platform inválido", 400);
  } catch (e) {
    return errorResponse((e as Error).message || "Erro interno", 500);
  }
});
