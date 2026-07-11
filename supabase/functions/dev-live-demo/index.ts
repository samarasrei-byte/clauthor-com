/**
 * dev-live-demo — public streaming endpoint for /developers page.
 * Takes an outcome (free text) and streams SSE narrating a multi-agent
 * orchestration in real time via Lovable AI Gateway. No auth required —
 * rate-limited by IP header at the edge (best-effort).
 */
import { corsHeaders, handleCors, errorResponse } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `You are the Clauthor orchestrator narrating a multi-agent run in real time.
Output ONLY newline-delimited events, one per line, no prose intro, no markdown fences.

Each line MUST be one of:
  CMD <shell-like command the user just ran>
  SYS <one line about decomposition / routing>
  AGT <agent.slug> | <what the agent is doing right now>
  OK  <success message> | <duration like 1.2s>
  WARN <a plausible warning / human-approval gate>
  DONE <summary> | <cost like $0.09>

Constraints:
- 8 to 12 lines total.
- Portuguese (pt-BR). Technical, terse, no fluff, no emoji.
- Agent slugs are lowercase.dotted (e.g. growth.strategist, copy.senior, design.motion, media.buyer, analyst.roas, sdr.inbound, sales.closer, cs.retention, ops.chief, finance.forecast).
- 3 to 5 different agents working in parallel.
- End with exactly one DONE line.`;

// In-memory sliding-window rate limiter (per isolate). Best-effort — Deno Deploy
// isolates are ephemeral, so limits are per-region-instance. Good enough to stop
// casual abuse of the public demo endpoint without a Redis dependency.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10; // 10 runs / minute / IP
const ipHits = new Map<string, number[]>();

function rateLimit(ip: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    return { ok: false, retryAfter: Math.ceil((RATE_WINDOW_MS - (now - arr[0])) / 1000) };
  }
  arr.push(now);
  ipHits.set(ip, arr);
  // Opportunistic GC
  if (ipHits.size > 5000) {
    for (const [k, v] of ipHits) {
      if (v.length === 0 || now - v[v.length - 1] > RATE_WINDOW_MS) ipHits.delete(k);
    }
  }
  return { ok: true, retryAfter: 0 };
}

Deno.serve(async (req) => {
  const pre = handleCors(req);
  if (pre) return pre;
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: "rate_limited", retry_after: rl.retryAfter }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfter),
        },
      },
    );
  }

  let outcome = "";
  try {
    const body = await req.json();
    outcome = String(body?.outcome ?? "").trim().slice(0, 400);
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }
  if (!outcome) return errorResponse("Missing 'outcome'", 400);

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return errorResponse("LOVABLE_API_KEY not configured", 500);

  const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Outcome: ${outcome}` },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text().catch(() => "");
    return errorResponse(`gateway ${upstream.status}: ${t.slice(0, 200)}`, 502);
  }

  // Prepare persistence: hash IP, buffer transcript, insert on stream end.
  const startedAt = Date.now();
  const runId = crypto.randomUUID();
  const ipHash = await sha256Hex(`${ip}|${Deno.env.get("SUPABASE_URL") ?? "salt"}`);
  let transcript = "";
  let lineCount = 0;
  let finalStatus: "completed" | "failed" | "aborted" = "completed";

  const persist = async () => {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseUrl || !serviceKey) return;
      await fetch(`${supabaseUrl}/rest/v1/demo_runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          id: runId,
          ip_hash: ipHash,
          outcome,
          transcript: transcript.slice(0, 20_000),
          line_count: lineCount,
          duration_ms: Date.now() - startedAt,
          status: finalStatus,
        }),
      });
    } catch (_) {
      /* best-effort */
    }
  };

  // Re-stream as SSE lines to the client. We forward raw text deltas; the
  // client splits by \n and colors each line by its prefix.
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";

      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

      try {
        // Announce the runId to the client so it can build a replay URL.
        send({ type: "run", id: runId });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n");
          buffer = parts.pop() ?? "";
          for (const line of parts) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              send({ type: "done", id: runId });
              controller.close();
              await persist();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta: string | undefined = json?.choices?.[0]?.delta?.content;
              if (delta) {
                transcript += delta;
                lineCount += (delta.match(/\n/g) ?? []).length;
                send({ type: "delta", text: delta });
              }
            } catch {
              /* ignore keepalives */
            }
          }
        }
        send({ type: "done", id: runId });
      } catch (err) {
        finalStatus = "failed";
        send({ type: "error", message: (err as Error).message });
      } finally {
        try {
          controller.close();
        } catch (_) {
          /* already closed */
        }
        await persist();
      }
    },
    cancel() {
      finalStatus = "aborted";
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
});

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

