// Generic outbound webhook dispatcher for Zapier / n8n / Make (Integromat)
// and any tool that accepts a POST JSON on a URL.
//
// Body: { url: string; payload?: unknown; auth_header?: string; secret?: string }
// - url: destination webhook URL (must be https)
// - payload: JSON body to send (defaults to {})
// - auth_header: optional value forwarded as `Authorization` (e.g. "Bearer xxx")
// - secret: optional HMAC-SHA256 shared secret; when set, sends header
//   `X-Clauthor-Signature: sha256=<hex>` computed over the raw JSON body.
//
// Auth: expects a Supabase user JWT (Authorization: Bearer <jwt>).
// Response: { ok, status, latency_ms, response_snippet }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface FireBody {
  url?: unknown;
  payload?: unknown;
  auth_header?: unknown;
  secret?: unknown;
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = (await req.json().catch(() => ({}))) as FireBody;
    const url = body.url;
    if (!isHttpsUrl(url)) {
      return jsonResponse({ error: "url é obrigatória e deve ser https://" }, 400);
    }

    // Guard: never forward to Supabase project URL or localhost — prevents SSRF loops
    const supabaseHost = new URL(Deno.env.get("SUPABASE_URL")!).host;
    const target = new URL(url);
    if (
      target.host === supabaseHost ||
      target.hostname === "localhost" ||
      target.hostname === "127.0.0.1"
    ) {
      return jsonResponse({ error: "URL de destino inválida" }, 400);
    }

    const payload = body.payload ?? {};
    const rawBody = JSON.stringify({
      source: "clauthor",
      fired_at: new Date().toISOString(),
      user_id: user.id,
      data: payload,
    });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof body.auth_header === "string" && body.auth_header.length > 0) {
      headers["Authorization"] = body.auth_header;
    }
    if (typeof body.secret === "string" && body.secret.length > 0) {
      const sig = await hmacSha256Hex(body.secret, rawBody);
      headers["X-Clauthor-Signature"] = `sha256=${sig}`;
    }

    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let status = 0;
    let snippet = "";
    try {
      const res = await fetch(target.toString(), {
        method: "POST",
        headers,
        body: rawBody,
        signal: controller.signal,
      });
      status = res.status;
      snippet = (await res.text().catch(() => "")).slice(0, 500);
    } catch (err) {
      clearTimeout(timeout);
      const message = err instanceof Error ? err.message : "network error";
      return jsonResponse({
        ok: false,
        status: 0,
        latency_ms: Date.now() - started,
        error: message,
      }, 502);
    }
    clearTimeout(timeout);

    return jsonResponse({
      ok: status >= 200 && status < 300,
      status,
      latency_ms: Date.now() - started,
      response_snippet: snippet,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error";
    return jsonResponse({ error: message }, 500);
  }
});
