import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

const API_VERSION = "v1";
const SUPPORTED_VERSIONS = new Set(["v1"]);

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "X-API-Version": API_VERSION, ...extraHeaders },
  });
}
function err(message: string, status = 400, extra: Record<string, string> = {}) {
  return json({ error: message }, status, extra);
}

type AuthCtx = {
  userId: string | null;
  apiKeyId: string | null;
  plan: "free" | "paid";
  isApiKey: boolean;
  supabase: ReturnType<typeof createClient>;
};

async function authenticate(req: Request): Promise<{ ctx: AuthCtx | null; error?: string }> {
  const apiKey = req.headers.get("x-api-key");
  const authHeader = req.headers.get("authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  if (!apiKey && !authHeader) {
    return { ctx: null, error: "Missing authentication. Provide x-api-key header or Bearer token." };
  }

  // Bearer JWT
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return { ctx: null, error: "Invalid bearer token" };
    return {
      ctx: { userId: user.id, apiKeyId: null, plan: "paid", isApiKey: false, supabase: admin },
    };
  }

  // x-api-key (new format: sk_live_*)
  if (apiKey) {
    if (!apiKey.startsWith("sk_live_") && !apiKey.startsWith("sk_test_")) {
      return { ctx: null, error: "Invalid API key format. Expected sk_live_… or sk_test_…" };
    }
    const { data, error } = await admin.rpc("verify_api_key", { _key: apiKey });
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      return { ctx: null, error: "Invalid or revoked API key" };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      ctx: {
        userId: row.user_id,
        apiKeyId: row.api_key_id,
        plan: (row.plan as "free" | "paid") ?? "free",
        isApiKey: true,
        supabase: admin,
      },
    };
  }

  return { ctx: null, error: "Unauthorized" };
}

async function checkRateLimit(ctx: AuthCtx): Promise<{ allowed: boolean; headers: Record<string, string>; status?: number; body?: unknown }> {
  if (!ctx.isApiKey || !ctx.apiKeyId) {
    return { allowed: true, headers: {} };
  }
  const { data } = await ctx.supabase.rpc("check_rate_limit", {
    _api_key_id: ctx.apiKeyId,
    _plan: ctx.plan,
  });
  const result = data as { allowed: boolean; limit: number; used: number; remaining?: number; reset_in_seconds?: number };
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.limit - result.used - 1)),
  };
  if (!result.allowed) {
    headers["Retry-After"] = String(result.reset_in_seconds ?? 60);
    return {
      allowed: false,
      headers,
      status: 429,
      body: { error: "Rate limit exceeded", limit: result.limit, retry_in_seconds: result.reset_in_seconds ?? 60 },
    };
  }
  return { allowed: true, headers };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  // Path normalization: strip /public-api and optional /v1
  let path = url.pathname.replace(/^\/public-api\/?/, "");
  let versionInPath: string | null = null;
  const versionMatch = path.match(/^(v\d+)\/?(.*)$/);
  if (versionMatch) {
    versionInPath = versionMatch[1];
    path = versionMatch[2];
    if (!SUPPORTED_VERSIONS.has(versionInPath)) {
      return err(`Unsupported API version: ${versionInPath}. Supported: ${[...SUPPORTED_VERSIONS].join(", ")}`, 400);
    }
  }
  const pathParts = path.split("/").filter(Boolean);
  const resource = pathParts[0] || "";
  const resourceId = pathParts[1] || "";
  const method = req.method;

  // ── Public: health / version discovery
  if (resource === "" || resource === "health") {
    return json({
      status: "operational",
      version: API_VERSION,
      supported_versions: [...SUPPORTED_VERSIONS],
      platform: "CLAUTHOR",
      base_url: `${url.origin}/functions/v1/public-api/${API_VERSION}`,
      endpoints: [
        "GET /v1/health",
        "GET /v1/agents",
        "GET /v1/agents/:id",
        "POST /v1/agents/:id/chat",
        "GET /v1/tasks",
        "POST /v1/tasks",
        "PATCH /v1/tasks/:id",
        "GET /v1/knowledge",
        "POST /v1/knowledge",
        "GET /v1/executions",
        "GET /v1/credits",
      ],
      docs: "https://clauthor-com.lovable.app/api-docs",
    });
  }

  // ── Auth (required for all other endpoints)
  const { ctx, error: authError } = await authenticate(req);
  if (!ctx) return err(authError || "Unauthorized", 401);

  // ── Rate limit (only for x-api-key)
  const rate = await checkRateLimit(ctx);
  if (!rate.allowed) {
    if (ctx.isApiKey && ctx.apiKeyId) {
      await ctx.supabase.rpc("log_api_call", { _api_key_id: ctx.apiKeyId, _endpoint: `${method} /${resource}`, _status: 429 });
    }
    return new Response(JSON.stringify(rate.body), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-API-Version": API_VERSION, ...rate.headers },
    });
  }

  const { supabase: adminClient, userId, isApiKey } = ctx;
  let responseStatus = 200;
  let response: Response;

  try {
    // ──── AGENTS ────
    if (resource === "agents") {
      if (method === "GET" && !resourceId) {
        let query = adminClient.from("agents").select("id, name, description, tier, status, total_executions, created_at, updated_at");
        if (userId) query = query.eq("user_id", userId);
        const { data, error: e } = await query.order("created_at", { ascending: false }).limit(50);
        if (e) { responseStatus = 500; response = err(e.message, 500, rate.headers); }
        else response = json({ data, count: data?.length || 0 }, 200, rate.headers);
      }
      else if (method === "GET" && resourceId) {
        let query = adminClient.from("agents").select("*").eq("id", resourceId);
        if (userId) query = query.eq("user_id", userId);
        const { data, error: e } = await query.maybeSingle();
        if (e) { responseStatus = 500; response = err(e.message, 500, rate.headers); }
        else if (!data) { responseStatus = 404; response = err("Agent not found", 404, rate.headers); }
        else response = json({ data }, 200, rate.headers);
      }
      else if (method === "POST" && resourceId && pathParts[2] === "chat") {
        const body = await req.json().catch(() => null);
        if (!body) { responseStatus = 400; response = err("Invalid JSON body", 400, rate.headers); }
        else {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const chatUrl = `${supabaseUrl}/functions/v1/agent-chat`;
          const resp = await fetch(chatUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: req.headers.get("authorization") || `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
            body: JSON.stringify({ ...body, agentId: resourceId, userId }),
          });
          const chatData = await resp.json();
          responseStatus = resp.status;
          response = json(chatData, resp.status, rate.headers);
        }
      }
      else { responseStatus = 405; response = err(`Method ${method} not allowed on /agents`, 405, rate.headers); }
    }
    // ──── TASKS ────
    else if (resource === "tasks") {
      if (method === "GET") {
        let query = adminClient.from("agent_tasks").select("id, title, description, priority, status, category, due_date, agent_id, created_at, updated_at");
        if (userId) query = query.eq("user_id", userId);
        const status_filter = url.searchParams.get("status");
        if (status_filter) query = query.eq("status", status_filter);
        const { data, error: e } = await query.order("created_at", { ascending: false }).limit(100);
        if (e) { responseStatus = 500; response = err(e.message, 500, rate.headers); }
        else response = json({ data, count: data?.length || 0 }, 200, rate.headers);
      }
      else if (method === "POST") {
        const body = await req.json().catch(() => null);
        if (!body || typeof body !== "object") { responseStatus = 400; response = err("Invalid JSON body", 400, rate.headers); }
        else if (!body.title || typeof body.title !== "string") { responseStatus = 400; response = err("title is required (string)", 400, rate.headers); }
        else {
          const { data: tenantId } = await adminClient.rpc("get_user_tenant_id", { _user_id: userId });
          const { data, error: e } = await adminClient.from("agent_tasks").insert({
            user_id: userId,
            tenant_id: tenantId,
            title: body.title,
            description: body.description || "",
            priority: body.priority || "medium",
            status: body.status || "open",
            category: body.category || "other",
            agent_id: body.agent_id || null,
            due_date: body.due_date || null,
          }).select().single();
          if (e) { responseStatus = 500; response = err(e.message, 500, rate.headers); }
          else { responseStatus = 201; response = json({ data }, 201, rate.headers); }
        }
      }
      else if (method === "PATCH" && resourceId) {
        const body = await req.json().catch(() => null);
        if (!body) { responseStatus = 400; response = err("Invalid JSON body", 400, rate.headers); }
        else {
          let query = adminClient.from("agent_tasks").update(body).eq("id", resourceId);
          if (userId) query = query.eq("user_id", userId);
          const { data, error: e } = await query.select().single();
          if (e) { responseStatus = 500; response = err(e.message, 500, rate.headers); }
          else response = json({ data }, 200, rate.headers);
        }
      }
      else { responseStatus = 405; response = err(`Method ${method} not allowed on /tasks`, 405, rate.headers); }
    }
    // ──── KNOWLEDGE ────
    else if (resource === "knowledge") {
      if (method === "GET") {
        const search = url.searchParams.get("q");
        if (search) {
          const { data, error: e } = await adminClient.rpc("search_knowledge", { _user_id: userId, _query: search, _limit: 10 });
          if (e) { responseStatus = 500; response = err(e.message, 500, rate.headers); }
          else response = json({ data, count: data?.length || 0 }, 200, rate.headers);
        } else {
          let query = adminClient.from("knowledge_documents").select("id, title, content, category, agent_id, created_at, updated_at");
          if (userId) query = query.eq("user_id", userId);
          const { data, error: e } = await query.order("updated_at", { ascending: false }).limit(50);
          if (e) { responseStatus = 500; response = err(e.message, 500, rate.headers); }
          else response = json({ data, count: data?.length || 0 }, 200, rate.headers);
        }
      }
      else if (method === "POST") {
        const body = await req.json().catch(() => null);
        if (!body?.title) { responseStatus = 400; response = err("title is required", 400, rate.headers); }
        else {
          const { data: tenantId } = await adminClient.rpc("get_user_tenant_id", { _user_id: userId });
          const { data, error: e } = await adminClient.from("knowledge_documents").insert({
            user_id: userId, tenant_id: tenantId,
            title: body.title, content: body.content || "",
            category: body.category || "general", agent_id: body.agent_id || null,
          }).select().single();
          if (e) { responseStatus = 500; response = err(e.message, 500, rate.headers); }
          else { responseStatus = 201; response = json({ data }, 201, rate.headers); }
        }
      }
      else { responseStatus = 405; response = err(`Method ${method} not allowed on /knowledge`, 405, rate.headers); }
    }
    // ──── EXECUTIONS ────
    else if (resource === "executions" && method === "GET") {
      let query = adminClient.from("execution_logs").select("id, agent_id, action, status, details, execution_time_ms, created_at");
      if (userId) query = query.eq("user_id", userId);
      const agent = url.searchParams.get("agent_id");
      if (agent) query = query.eq("agent_id", agent);
      const { data, error: e } = await query.order("created_at", { ascending: false }).limit(100);
      if (e) { responseStatus = 500; response = err(e.message, 500, rate.headers); }
      else response = json({ data, count: data?.length || 0 }, 200, rate.headers);
    }
    // ──── CREDITS ────
    else if (resource === "credits" && method === "GET") {
      let query = adminClient.from("user_credits").select("total_credits, used_credits, plan_type, credits_reset_at");
      if (userId) query = query.eq("user_id", userId);
      const { data, error: e } = await query.maybeSingle();
      if (e) { responseStatus = 500; response = err(e.message, 500, rate.headers); }
      else if (!data) { responseStatus = 404; response = err("No credits found", 404, rate.headers); }
      else {
        const remaining = data.total_credits - data.used_credits;
        response = json({ ...data, remaining_credits: remaining, usage_pct: Math.round((data.used_credits / data.total_credits) * 100) }, 200, rate.headers);
      }
    }
    else {
      responseStatus = 404;
      response = err(`Unknown endpoint: ${method} /${resource}${resourceId ? "/" + resourceId : ""}`, 404, rate.headers);
    }
  } catch (e) {
    console.error("API error:", e);
    responseStatus = 500;
    response = err("Internal server error", 500, rate.headers);
  }

  // Log API key usage (fire-and-forget)
  if (isApiKey && ctx.apiKeyId) {
    ctx.supabase.rpc("log_api_call", { _api_key_id: ctx.apiKeyId, _endpoint: `${method} /${resource}`, _status: responseStatus }).then(() => {});
  }

  return response!;
});
