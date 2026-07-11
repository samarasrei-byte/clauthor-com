// check-ttfv-alert: cron-invoked job que verifica se o p90 do time_to_first_value
// cruzou 90s na última hora e dispara webhook para Discord ou Slack.
// Autenticado apenas por header X-Cron-Secret (env CRON_SECRET).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const P90_THRESHOLD_MS = 90_000;
const WINDOW_MINUTES = 60;
const MIN_SAMPLE_SIZE = 10;
const DEBOUNCE_MINUTES = 30;

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function detectWebhookType(url: string): "discord" | "slack" | "unknown" {
  if (url.includes("discord.com/api/webhooks")) return "discord";
  if (url.includes("hooks.slack.com")) return "slack";
  return "unknown";
}

async function postAlert(url: string, p90: number, sample: number, p50: number) {
  const type = detectWebhookType(url);
  const title = "🚨 CLAUTHOR · p90 TTFV cruzou o limite";
  const description = `p90 = **${(p90 / 1000).toFixed(1)}s** (limite ${(P90_THRESHOLD_MS / 1000).toFixed(0)}s)\np50 = ${(p50 / 1000).toFixed(1)}s · amostras (${WINDOW_MINUTES}min) = ${sample}`;

  const body = type === "slack"
    ? {
        text: `${title}\n${description.replace(/\*\*/g, "*")}`,
      }
    : {
        // Discord (padrão)
        embeds: [
          {
            title,
            description,
            color: 0xef4444,
            timestamp: new Date().toISOString(),
          },
        ],
      };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`webhook ${res.status}: ${errText}`);
  }
}

Deno.serve(async (req) => {
  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret") ?? req.headers.get("X-Cron-Secret");
    if (!cronSecret || provided !== cronSecret) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const webhookUrl = Deno.env.get("TTFV_ALERT_WEBHOOK_URL");
    if (!webhookUrl) {
      return new Response(JSON.stringify({ skipped: true, reason: "webhook não configurado" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

    const { data, error } = await admin
      .from("kpi_events")
      .select("payload, created_at")
      .eq("event", "time_to_first_value")
      .gte("created_at", since);

    if (error) throw error;

    const values: number[] = (data ?? [])
      .map((r) => Number((r.payload as Record<string, unknown>)?.ttfv_ms))
      .filter((v) => Number.isFinite(v) && v > 0);

    if (values.length < MIN_SAMPLE_SIZE) {
      return new Response(
        JSON.stringify({ ok: true, alerted: false, sample: values.length, reason: "amostra insuficiente" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const p90 = percentile(values, 0.9);
    const p50 = percentile(values, 0.5);

    if (p90 <= P90_THRESHOLD_MS) {
      return new Response(JSON.stringify({ ok: true, alerted: false, p90_ms: p90, sample: values.length }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Debounce: já disparou nos últimos 30min?
    const debounceSince = new Date(Date.now() - DEBOUNCE_MINUTES * 60_000).toISOString();
    const { count } = await admin
      .from("kpi_events")
      .select("id", { count: "exact", head: true })
      .eq("event", "ttfv_alert_sent")
      .gte("created_at", debounceSince);

    if ((count ?? 0) > 0) {
      return new Response(
        JSON.stringify({ ok: true, alerted: false, p90_ms: p90, sample: values.length, reason: "debounce" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      await postAlert(webhookUrl, p90, values.length, p50);
    } catch (e) {
      console.error("[check-ttfv-alert] webhook failed:", (e as Error).message);
      return new Response(
        JSON.stringify({ ok: false, error: (e as Error).message, p90_ms: p90 }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    await admin.from("kpi_events").insert({
      event: "ttfv_alert_sent",
      payload: { p90_ms: p90, p50_ms: p50, sample: values.length, window_minutes: WINDOW_MINUTES },
    });

    return new Response(
      JSON.stringify({ ok: true, alerted: true, p90_ms: p90, p50_ms: p50, sample: values.length }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[check-ttfv-alert] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
