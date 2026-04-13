import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { linkedin_cookie } = await req.json();

    if (!linkedin_cookie || typeof linkedin_cookie !== "string") {
      return jsonResponse({ valid: false, error: "Cookie não fornecido" });
    }

    const trimmed = linkedin_cookie.trim();

    if (trimmed.length < 100) {
      return jsonResponse({
        valid: false,
        error: "Cookie muito curto. Certifique-se de copiar o valor completo do cookie li_at (geralmente tem 200+ caracteres).",
      });
    }

    if (!trimmed.startsWith("AQ")) {
      return jsonResponse({
        valid: false,
        error: "Cookie inválido. O cookie li_at do LinkedIn deve começar com 'AQ'. Verifique se copiou o cookie correto em Application → Cookies → linkedin.com → li_at.",
      });
    }

    return jsonResponse({ valid: true });
  } catch (e) {
    return errorResponse(e.message || "Erro interno", 500);
  }
});
