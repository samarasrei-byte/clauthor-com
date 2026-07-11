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

Deno.serve(async (req) => {
  const pre = handleCors(req);
  if (pre) return pre;
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

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
              send({ type: "done" });
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta: string | undefined = json?.choices?.[0]?.delta?.content;
              if (delta) send({ type: "delta", text: delta });
            } catch {
              /* ignore keepalives */
            }
          }
        }
        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
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
