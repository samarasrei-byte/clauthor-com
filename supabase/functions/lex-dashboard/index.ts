import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return errorResponse("Unauthorized", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    // Get advogado for this user
    const { data: advogado } = await supabase
      .from("lex_advogados")
      .select("id, nome, oab_numero, oab_estado, ativo")
      .eq("user_id", user.id)
      .eq("ativo", true)
      .single();

    if (!advogado) {
      return jsonResponse({ advogado: null, intimacoes: [] });
    }

    // Get intimacoes ordered by data_limite
    const { data: intimacoes, error: intError } = await supabase
      .from("lex_intimacoes")
      .select("*")
      .eq("advogado_id", advogado.id)
      .order("data_limite", { ascending: true });

    if (intError) return errorResponse(intError.message, 400);

    return jsonResponse({ advogado, intimacoes: intimacoes || [] });
  } catch (e) {
    return errorResponse(e.message || "Internal error", 500);
  }
});
