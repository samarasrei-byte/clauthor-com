/**
 * CLAUTHOR MCP Server
 * ─────────────────────────────────────────────────────────────
 * Expõe os 200 agentes WORKFORCE via Model Context Protocol (MCP)
 * compatível com Claude Desktop, Cursor, ChatGPT Desktop e qualquer
 * cliente MCP. Spec: https://modelcontextprotocol.io
 *
 * Transporte: HTTP+SSE (single-endpoint JSON-RPC 2.0)
 * Auth: Bearer token (Lovable Cloud anon ou JWT do usuário)
 *
 * Métodos suportados:
 *   - initialize
 *   - tools/list      → lista cada agente como uma "tool"
 *   - tools/call      → invoca agent-chat com o slug correspondente
 *   - resources/list  → lista departamentos/squads como recursos
 *   - resources/read  → retorna a ficha de um agente
 *   - ping
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, mcp-session-id",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = {
  name: "clauthor-workforce",
  version: "1.0.0",
  title: "CLAUTHOR Digital Workforce",
};

// ─── JSON-RPC helpers ────────────────────────────────────────
type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

const rpcResult = (id: JsonRpcId, result: unknown) => ({
  jsonrpc: "2.0",
  id,
  result,
});

const rpcError = (id: JsonRpcId, code: number, message: string, data?: unknown) => ({
  jsonrpc: "2.0",
  id,
  error: { code, message, ...(data !== undefined ? { data } : {}) },
});

// ─── Catalog (lazy-loaded, cached) ───────────────────────────
interface AgentEntry {
  slug: string;
  name: string;
  department: string;
  squad: string;
  responsibilities: string[];
  triggers: string[];
}

let CATALOG_CACHE: AgentEntry[] | null = null;

async function loadCatalog(): Promise<AgentEntry[]> {
  if (CATALOG_CACHE) return CATALOG_CACHE;
  // Inline minimal catalog snapshot — avoids importing TS source at runtime.
  // For now we fetch from the public API table if available; otherwise fall back
  // to a static seed that matches src/data/workforceArchitecture.ts top entries.
  // This keeps the edge function self-contained and fast (no cold-start import).
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceKey) {
      const sb = createClient(supabaseUrl, serviceKey);
      const { data } = await sb
        .from("workforce_agents_catalog")
        .select("slug,name,department,squad,responsibilities,triggers")
        .limit(500);
      if (data && data.length > 0) {
        CATALOG_CACHE = data as AgentEntry[];
        return CATALOG_CACHE;
      }
    }
  } catch (_) {
    // fall through to static seed
  }
  CATALOG_CACHE = STATIC_SEED;
  return CATALOG_CACHE;
}

// Minimal seed covering the most-used agents. The DB table is the
// source of truth when populated.
const STATIC_SEED: AgentEntry[] = [
  {
    slug: "content_strategist",
    name: "Content Strategist",
    department: "Marketing",
    squad: "Content Squad",
    responsibilities: ["Planejamento editorial", "Calendário de conteúdo", "Análise de gaps"],
    triggers: ["task_assigned", "campaign_launch", "monthly_planning"],
  },
  {
    slug: "blog_writer",
    name: "Blog Writer",
    department: "Marketing",
    squad: "Content Squad",
    responsibilities: ["Artigos SEO", "Posts longos", "Guest posts"],
    triggers: ["task_assigned", "keyword_opportunity"],
  },
  {
    slug: "sales_closer",
    name: "Sales Closer",
    department: "Sales",
    squad: "Closing Squad",
    responsibilities: ["Fechamento de deals", "Negociação", "Follow-up"],
    triggers: ["lead_qualified", "proposal_sent"],
  },
  {
    slug: "customer_success",
    name: "Customer Success",
    department: "Customer Success",
    squad: "Retention Squad",
    responsibilities: ["Onboarding", "Health score", "Renewals"],
    triggers: ["new_customer", "churn_risk"],
  },
  {
    slug: "hunter_prospector",
    name: "Hunter Prospector",
    department: "Sales",
    squad: "Hunter Squad",
    responsibilities: ["Prospecção LinkedIn", "ICP matching", "Icebreakers"],
    triggers: ["icp_defined", "daily_quota"],
  },
];

// ─── Tool / Resource builders ────────────────────────────────
function agentToTool(a: AgentEntry) {
  return {
    name: `agent_${a.slug}`,
    title: `${a.name} (${a.department})`,
    description: `${a.name} — ${a.squad}. Responsabilidades: ${a.responsibilities.join("; ")}.`,
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Mensagem ou tarefa para o agente executar.",
        },
        context: {
          type: "object",
          description: "Contexto adicional opcional (cliente, deal, etc).",
          additionalProperties: true,
        },
      },
      required: ["message"],
    },
  };
}

function agentToResource(a: AgentEntry) {
  return {
    uri: `clauthor://agent/${a.slug}`,
    name: a.name,
    title: `${a.name} — ${a.department}`,
    description: a.responsibilities.join("; "),
    mimeType: "application/json",
  };
}

// ─── tools/call → proxy para agent-chat ──────────────────────
async function callAgent(
  authHeader: string,
  slug: string,
  message: string,
  context: Record<string, unknown> | undefined,
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) throw new Error("SUPABASE_URL not configured");

  const res = await fetch(`${supabaseUrl}/functions/v1/agent-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      agentSlug: slug,
      messages: [{ role: "user", content: message }],
      context: context ?? {},
      source: "mcp",
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`agent-chat error ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json().catch(() => ({}));
  return data;
}

// ─── Dispatcher ──────────────────────────────────────────────
async function handleRpc(req: JsonRpcRequest, authHeader: string): Promise<unknown> {
  const { id = null, method, params = {} } = req;

  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false, subscribe: false },
          logging: {},
        },
        serverInfo: SERVER_INFO,
        instructions:
          "Use os agentes CLAUTHOR como ferramentas. Cada agente é especialista em seu domínio (marketing, vendas, CS, etc). Invoque via tools/call com agent_<slug>.",
      });

    case "ping":
      return rpcResult(id, {});

    case "tools/list": {
      const catalog = await loadCatalog();
      return rpcResult(id, { tools: catalog.map(agentToTool) });
    }

    case "tools/call": {
      const name = String(params.name ?? "");
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      if (!name.startsWith("agent_")) {
        return rpcError(id, -32602, `Unknown tool: ${name}`);
      }
      const slug = name.slice("agent_".length);
      const message = String(args.message ?? "").trim();
      if (!message) {
        return rpcError(id, -32602, "Parameter 'message' is required");
      }
      try {
        const result = await callAgent(
          authHeader,
          slug,
          message,
          args.context as Record<string, unknown> | undefined,
        );
        const text =
          (result as { message?: string; content?: string }).message ??
          (result as { content?: string }).content ??
          JSON.stringify(result);
        return rpcResult(id, {
          content: [{ type: "text", text }],
          isError: false,
        });
      } catch (err) {
        return rpcResult(id, {
          content: [
            { type: "text", text: `Erro ao invocar agente: ${(err as Error).message}` },
          ],
          isError: true,
        });
      }
    }

    case "resources/list": {
      const catalog = await loadCatalog();
      return rpcResult(id, { resources: catalog.map(agentToResource) });
    }

    case "resources/read": {
      const uri = String(params.uri ?? "");
      const match = uri.match(/^clauthor:\/\/agent\/(.+)$/);
      if (!match) return rpcError(id, -32602, `Invalid resource URI: ${uri}`);
      const catalog = await loadCatalog();
      const agent = catalog.find((a) => a.slug === match[1]);
      if (!agent) return rpcError(id, -32602, `Agent not found: ${match[1]}`);
      return rpcResult(id, {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(agent, null, 2),
          },
        ],
      });
    }

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

// ─── HTTP entrypoint ─────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // GET → discovery / health
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        ok: true,
        server: SERVER_INFO,
        protocolVersion: PROTOCOL_VERSION,
        transport: "http+jsonrpc",
        hint: "POST JSON-RPC 2.0 requests to this same endpoint.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify(rpcError(null, -32001, "Unauthorized — Bearer token required")),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify(rpcError(null, -32700, "Parse error")),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const out = Array.isArray(body)
      ? await Promise.all(body.map((r) => handleRpc(r, authHeader)))
      : await handleRpc(body, authHeader);
    return new Response(JSON.stringify(out), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("mcp-server fatal:", err);
    return new Response(
      JSON.stringify(rpcError(null, -32603, "Internal error", (err as Error).message)),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
