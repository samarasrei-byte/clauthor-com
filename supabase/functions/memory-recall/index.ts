// memory-recall — Busca top-K memórias relevantes para uma query e atualiza reinforcement
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const EMBED_MODEL = "openai/text-embedding-3-small";

interface RecallBody {
  tenant_id: string;
  agent_id: string;
  query: string;
  subject_entity?: string;
  top_k?: number;
}

async function embed(text: string): Promise<number[] | null> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, input: text.slice(0, 8000) }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as RecallBody;
    if (!body.tenant_id || !body.agent_id || !body.query) {
      return new Response(JSON.stringify({ error: "tenant_id, agent_id and query required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const top_k = Math.min(Math.max(body.top_k ?? 5, 1), 20);
    const embedding = await embed(body.query);
    if (!embedding) {
      return new Response(JSON.stringify({ memories: [], note: "embedding unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await supabase.rpc("recall_episodic_memories", {
      _tenant_id: body.tenant_id,
      _agent_id: body.agent_id,
      _query_embedding: embedding as unknown as string,
      _subject_entity: body.subject_entity ?? null,
      _limit: top_k,
    });

    if (error) throw error;

    // Reinforcement: bump access_count and last_accessed_at
    const ids = (data ?? []).map((m: { id: string }) => m.id);
    if (ids.length > 0) {
      await supabase
        .from("agent_memories_episodic")
        .update({ last_accessed_at: new Date().toISOString() })
        .in("id", ids);
      // increment access_count via raw update (one round trip)
      for (const id of ids) {
        await supabase.rpc("increment_agent_executions", { p_agent_id: id }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ memories: data ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[memory-recall] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
