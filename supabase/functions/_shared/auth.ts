/**
 * Shared auth helpers for edge functions.
 * Extrai o user do JWT enviado no header Authorization.
 * Retorna null se ausente/inválido — cabe à função decidir 401 vs. anônimo.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";

/** Retorna { user, error } — user é null se token ausente/inválido. */
export async function getUserFromRequest(req: Request): Promise<{ user: { id: string; email?: string } | null; error?: string }> {
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, error: "missing_authorization" };
  }
  const token = authHeader.slice(7);
  if (!token || token === ANON_KEY) {
    return { user: null, error: "anonymous_token" };
  }
  try {
    const client = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return { user: null, error: error?.message ?? "invalid_token" };
    return { user: { id: data.user.id, email: data.user.email } };
  } catch (e) {
    return { user: null, error: (e as Error).message };
  }
}

/** Devolve 401 padronizado com CORS. */
export function unauthorizedResponse(corsHeaders: Record<string, string>, reason = "unauthorized"): Response {
  return new Response(JSON.stringify({ error: reason }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
