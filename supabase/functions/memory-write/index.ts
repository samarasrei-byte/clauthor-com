// memory-write — Extrai eventos relevantes da conversa, gera embedding e persiste em agent_memories_episodic
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const EMBED_MODEL = "openai/text-embedding-3-small";

interface WriteBody {
  tenant_id: string;
  agent_id: string;
  user_id: string;
  event_type: "conversation" | "tool_call" | "outcome" | "feedback" | "escalation";
  content: string;
  subject_entity?: string;
  outcome?: "success" | "failure" | "pending" | "neutral";
  importance?: number; // 0-1, if omitted will be auto-classified
  metadata?: Record<string, unknown>;
}

async function embed(text: string): Promise<number[] | null> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: EMBED_MODEL, input: text.slice(0, 8000) }),
    });
    if (!r.ok) {
      console.error("[memory-write] embed failed", r.status, await r.text());
      return null;
    }
    const j = await r.json();
    return j.data?.[0]?.embedding ?? null;
  } catch (e) {
    console.error("[memory-write] embed error", e);
    return null;
  }
}

function quickImportance(content: string, event_type: string, outcome?: string): number {
  let score = 0.4;
  if (event_type === "outcome") score += 0.3;
  if (event_type === "escalation") score += 0.4;
  if (event_type === "feedback") score += 0.2;
  if (outcome === "success" || outcome === "failure") score += 0.15;
  const len = content.length;
  if (len > 400) score += 0.05;
  if (len > 1200) score += 0.05;
  return Math.min(1, Math.max(0, score));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as WriteBody;
    if (!body.tenant_id || !body.agent_id || !body.user_id || !body.event_type || !body.content) {
      return new Response(JSON.stringify({ error: "missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const embedding = await embed(body.content);
    const importance = body.importance ?? quickImportance(body.content, body.event_type, body.outcome);

    const { data, error } = await supabase
      .from("agent_memories_episodic")
      .insert({
        tenant_id: body.tenant_id,
        agent_id: body.agent_id,
        user_id: body.user_id,
        event_type: body.event_type,
        content: body.content,
        subject_entity: body.subject_entity ?? null,
        outcome: body.outcome ?? null,
        embedding,
        embedding_model: EMBED_MODEL,
        importance,
        metadata: body.metadata ?? {},
      })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, id: data.id, importance, embedded: !!embedding }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[memory-write] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
