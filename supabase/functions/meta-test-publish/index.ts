import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

/**
 * meta-test-publish
 * Cria um post de RASCUNHO (unpublished) na primeira Página do Facebook
 * conectada pelo usuário, via Graph API (published=false).
 * Retorna o post_id, o preview (permalink de rascunho) e detalhes do request/response.
 *
 * Body (opcional):
 *   - message?: string    (default: mensagem de teste com timestamp)
 *   - page_id?: string    (default: primeira página conectada)
 */

const GRAPH = "https://graph.facebook.com/v19.0";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const started = Date.now();
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
    const customMessage: string | undefined = body?.message;
    const requestedPageId: string | undefined = body?.page_id;

    const { data: conn, error: connErr } = await supabase
      .from("meta_connections")
      .select("access_token, pages, profile_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connErr) return errorResponse(`DB: ${connErr.message}`, 500);
    if (!conn) return jsonResponse({ ok: false, stage: "no_connection", detail: "Conta Meta não conectada. Clique em Conectar no card do Meta." }, 200);

    const pages = (conn.pages ?? []) as Array<{ id: string; name: string; page_access_token: string }>;
    if (pages.length === 0) {
      return jsonResponse({
        ok: false,
        stage: "no_pages",
        detail: "Sua conta Meta está conectada, mas nenhuma Página do Facebook foi encontrada. Crie uma Página e reconecte.",
        profile_name: conn.profile_name,
      }, 200);
    }

    const page = requestedPageId ? pages.find(p => p.id === requestedPageId) : pages[0];
    if (!page) {
      return jsonResponse({ ok: false, stage: "page_not_found", detail: `Página ${requestedPageId} não está entre as conectadas.` }, 200);
    }

    const message =
      customMessage?.trim() ||
      `🧪 Post de teste do CLAUTHOR — ${new Date().toLocaleString("pt-BR")}\n\nEste é um rascunho não publicado (published=false) criado apenas para validar a integração. Você pode abri-lo, editar e publicar direto no Facebook, ou descartá-lo.`;

    const url = `${GRAPH}/${page.id}/feed`;
    const form = new URLSearchParams();
    form.set("message", message);
    form.set("published", "false"); // rascunho: fica em Publishing Tools > Rascunhos
    form.set("access_token", page.page_access_token);

    const res = await fetch(url, { method: "POST", body: form });
    const latency_ms = Date.now() - started;
    const raw = await res.text();
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }

    if (!res.ok) {
      const errObj = (parsed as { error?: { message?: string; code?: number; error_subcode?: number; type?: string } }).error;
      return jsonResponse({
        ok: false,
        stage: "graph_error",
        latency_ms,
        http_status: res.status,
        page: { id: page.id, name: page.name },
        request: { endpoint: `${GRAPH}/${page.id}/feed`, published: false, message_preview: message.slice(0, 120) },
        error: errObj ?? { message: raw.slice(0, 500) },
        hint: errObj?.code === 200 || errObj?.code === 190
          ? "Token pode ter expirado ou faltam permissões (pages_manage_posts). Reconecte a conta Meta."
          : undefined,
      }, 200);
    }

    const post_id = (parsed as { id?: string }).id;
    const [pageIdPart, postIdPart] = (post_id || "").split("_");
    const draft_url = pageIdPart && postIdPart
      ? `https://www.facebook.com/${pageIdPart}/posts/${postIdPart}`
      : undefined;
    const publishing_tools_url = `https://business.facebook.com/latest/posts/drafts?asset_id=${page.id}`;

    return jsonResponse({
      ok: true,
      stage: "draft_created",
      latency_ms,
      page: { id: page.id, name: page.name },
      post_id,
      draft_url,
      publishing_tools_url,
      request: { endpoint: `${GRAPH}/${page.id}/feed`, published: false, message_preview: message.slice(0, 120) },
      detail: `Rascunho criado na Página "${page.name}". Abra em Publishing Tools > Rascunhos para revisar/publicar.`,
    }, 200);
  } catch (e) {
    return jsonResponse({ ok: false, stage: "exception", detail: (e as Error).message, latency_ms: Date.now() - started }, 200);
  }
});
