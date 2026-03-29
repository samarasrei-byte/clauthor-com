/**
 * Shared CORS headers and helpers for all edge functions.
 * Single source of truth — import this instead of defining inline.
 */

const ALLOWED_ORIGINS = [
  "https://clauthor-com.lovable.app",
  "https://clauthor.com",
  "https://www.clauthor.com",
  "http://localhost:5173",       // local dev
  "http://localhost:8080",       // local dev alt
];

export function getCorsOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return ALLOWED_ORIGINS[0]; // default to main app
}

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Standard OPTIONS preflight response */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { ...corsHeaders, "Access-Control-Allow-Origin": getCorsOrigin(req) },
    });
  }
  return null;
}

/** JSON response with CORS headers */
export function jsonResponse(body: unknown, status = 200, req?: Request): Response {
  const origin = req ? getCorsOrigin(req) : corsHeaders["Access-Control-Allow-Origin"];
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Access-Control-Allow-Origin": origin, "Content-Type": "application/json" },
  });
}

/** Error response with CORS headers */
export function errorResponse(message: string, status = 500, req?: Request): Response {
  return jsonResponse({ error: message }, status, req);
}

/** SSE streaming response with CORS headers */
export function streamResponse(body: ReadableStream, req?: Request): Response {
  const origin = req ? getCorsOrigin(req) : corsHeaders["Access-Control-Allow-Origin"];
  return new Response(body, {
    headers: { ...corsHeaders, "Access-Control-Allow-Origin": origin, "Content-Type": "text/event-stream" },
  });
}
