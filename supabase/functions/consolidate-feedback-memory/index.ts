// Weekly job: consolidate negative feedback (👎) into procedural memory per tenant+agent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const since = new Date(Date.now() - 7 * 86400_000).toISOString();

  const { data: feedbacks, error } = await supabase
    .from("agent_feedback")
    .select("tenant_id, user_id, agent_id, agent_name, comment, user_message, assistant_message, created_at")
    .eq("rating", -1)
    .eq("applied", false)
    .gte("created_at", since)
    .not("agent_id", "is", null)
    .limit(1000);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Group by tenant+agent
  type Bucket = {
    tenant_id: string;
    user_id: string;
    agent_id: string;
    agent_name: string | null;
    lessons: Array<{ comment: string | null; user_message: string | null; assistant_message: string | null; at: string }>;
  };
  const buckets = new Map<string, Bucket>();
  for (const f of feedbacks ?? []) {
    const key = `${f.tenant_id}::${f.agent_id}`;
    const b = buckets.get(key) ?? {
      tenant_id: f.tenant_id,
      user_id: f.user_id,
      agent_id: f.agent_id!,
      agent_name: f.agent_name,
      lessons: [],
    };
    b.lessons.push({
      comment: f.comment,
      user_message: f.user_message,
      assistant_message: f.assistant_message,
      at: f.created_at,
    });
    buckets.set(key, b);
  }

  let written = 0;
  for (const b of buckets.values()) {
    const { error: insErr } = await supabase.from("agent_memory").insert({
      tenant_id: b.tenant_id,
      user_id: b.user_id,
      agent_id: b.agent_id,
      memory_type: "procedural",
      content: {
        kind: "negative_feedback_lessons",
        agent_name: b.agent_name,
        consolidated_at: new Date().toISOString(),
        period_days: 7,
        sample_size: b.lessons.length,
        avoid_patterns: b.lessons
          .map((l) => l.comment)
          .filter((c): c is string => !!c && c.trim().length > 0),
        examples: b.lessons.slice(0, 10),
        directive:
          "Evite repetir os padrões abaixo. Quando detectar contexto semelhante, ajuste tom, profundidade ou formato antes de responder.",
      },
    });
    if (!insErr) written += 1;
  }

  // Mark feedbacks as applied
  if (feedbacks && feedbacks.length > 0) {
    await supabase
      .from("agent_feedback")
      .update({ applied: true })
      .eq("rating", -1)
      .eq("applied", false)
      .gte("created_at", since);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      feedbacks_processed: feedbacks?.length ?? 0,
      memories_written: written,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
