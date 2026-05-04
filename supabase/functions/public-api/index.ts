import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

async function authenticateApiKey(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  const authHeader = req.headers.get("authorization");

  if (!apiKey && !authHeader) {
    return { user: null, error: "Missing authentication. Provide x-api-key header or Bearer token." };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Bearer token auth (standard Supabase)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { user: null, error: "Invalid bearer token" };
    return { user, supabase, error: null };
  }

  // x-api-key auth - look up in platform_credentials
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: cred } = await admin
    .from("platform_credentials")
    .select("*")
    .eq("integration_name", "public_api")
    .eq("credential_key", "api_key")
    .eq("credential_value", apiKey!)
    .eq("is_active", true)
    .maybeSingle();

  if (!cred) return { user: null, error: "Invalid API key" };

  // API keys act as service-level - return admin client
  return { user: { id: "api-key-user", api_key: true }, supabase: admin, error: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.replace(/^\/public-api\/?/, "").split("/").filter(Boolean);
  const resource = pathParts[0] || "";
  const resourceId = pathParts[1] || "";
  const method = req.method;

  // Health check - no auth required
  if (resource === "" || resource === "health") {
    return json({
      status: "operational",
      version: "1.0.0",
      platform: "CLAUTHOR",
      endpoints: [
        "GET /health",
        "GET /agents",
        "GET /agents/:id",
        "GET /agents/:id/chat (POST)",
        "GET /tasks",
        "POST /tasks",
        "PATCH /tasks/:id",
        "GET /knowledge",
        "POST /knowledge",
        "GET /executions",
        "GET /credits",
      ],
      docs: "https://clauthor-com.lovable.app/api-docs",
    });
  }

  // All other endpoints require auth
  const auth = await authenticateApiKey(req);
  if (auth.error) return err(auth.error, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  // For bearer-token users, scope to their user_id
  const userId = auth.user?.id;
  const isApiKey = auth.user?.api_key === true;

  try {
    // ──── AGENTS ────
    if (resource === "agents") {
      if (method === "GET" && !resourceId) {
        let query = adminClient.from("agents").select("id, name, description, tier, status, total_executions, created_at, updated_at");
        if (!isApiKey) query = query.eq("user_id", userId);
        const { data, error: e } = await query.order("created_at", { ascending: false }).limit(50);
        if (e) return err(e.message, 500);
        return json({ data, count: data?.length || 0 });
      }
      if (method === "GET" && resourceId) {
        let query = adminClient.from("agents").select("*").eq("id", resourceId);
        if (!isApiKey) query = query.eq("user_id", userId);
        const { data, error: e } = await query.maybeSingle();
        if (e) return err(e.message, 500);
        if (!data) return err("Agent not found", 404);
        return json({ data });
      }
      if (method === "POST" && resourceId && pathParts[2] === "chat") {
        // Delegate to agent-chat function
        const body = await req.json();
        const chatUrl = `${supabaseUrl}/functions/v1/agent-chat`;
        const resp = await fetch(chatUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.get("authorization") || "",
          },
          body: JSON.stringify({ ...body, agentId: resourceId }),
        });
        const chatData = await resp.json();
        return json(chatData, resp.status);
      }
    }

    // ──── TASKS ────
    if (resource === "tasks") {
      if (method === "GET") {
        let query = adminClient.from("agent_tasks").select("id, title, description, priority, status, category, due_date, agent_id, created_at, updated_at");
        if (!isApiKey) query = query.eq("user_id", userId);
        const status_filter = url.searchParams.get("status");
        if (status_filter) query = query.eq("status", status_filter);
        const { data, error: e } = await query.order("created_at", { ascending: false }).limit(100);
        if (e) return err(e.message, 500);
        return json({ data, count: data?.length || 0 });
      }
      if (method === "POST") {
        const body = await req.json();
        if (!body.title) return err("title is required");
        // Need tenant_id
        const { data: tenantId } = await adminClient.rpc("get_user_tenant_id", { _user_id: userId });
        if (!tenantId && !isApiKey) return err("No tenant found for user", 400);
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
        if (e) return err(e.message, 500);
        return json({ data }, 201);
      }
      if (method === "PATCH" && resourceId) {
        const body = await req.json();
        let query = adminClient.from("agent_tasks").update(body).eq("id", resourceId);
        if (!isApiKey) query = query.eq("user_id", userId);
        const { data, error: e } = await query.select().single();
        if (e) return err(e.message, 500);
        return json({ data });
      }
    }

    // ──── KNOWLEDGE ────
    if (resource === "knowledge") {
      if (method === "GET") {
        let query = adminClient.from("knowledge_documents").select("id, title, content, category, agent_id, created_at, updated_at");
        if (!isApiKey) query = query.eq("user_id", userId);
        const search = url.searchParams.get("q");
        if (search) {
          const { data, error: e } = await adminClient.rpc("search_knowledge", {
            _user_id: userId,
            _query: search,
            _limit: 10,
          });
          if (e) return err(e.message, 500);
          return json({ data, count: data?.length || 0 });
        }
        const { data, error: e } = await query.order("updated_at", { ascending: false }).limit(50);
        if (e) return err(e.message, 500);
        return json({ data, count: data?.length || 0 });
      }
      if (method === "POST") {
        const body = await req.json();
        if (!body.title) return err("title is required");
        const { data: tenantId } = await adminClient.rpc("get_user_tenant_id", { _user_id: userId });
        const { data, error: e } = await adminClient.from("knowledge_documents").insert({
          user_id: userId,
          tenant_id: tenantId,
          title: body.title,
          content: body.content || "",
          category: body.category || "general",
          agent_id: body.agent_id || null,
        }).select().single();
        if (e) return err(e.message, 500);
        return json({ data }, 201);
      }
    }

    // ──── EXECUTIONS ────
    if (resource === "executions") {
      if (method === "GET") {
        let query = adminClient.from("execution_logs").select("id, agent_id, action, status, details, execution_time_ms, created_at");
        if (!isApiKey) query = query.eq("user_id", userId);
        const agent = url.searchParams.get("agent_id");
        if (agent) query = query.eq("agent_id", agent);
        const { data, error: e } = await query.order("created_at", { ascending: false }).limit(100);
        if (e) return err(e.message, 500);
        return json({ data, count: data?.length || 0 });
      }
    }

    // ──── CREDITS ────
    if (resource === "credits") {
      if (method === "GET") {
        let query = adminClient.from("user_credits").select("total_credits, used_credits, plan_type, credits_reset_at");
        if (!isApiKey) query = query.eq("user_id", userId);
        const { data, error: e } = await query.maybeSingle();
        if (e) return err(e.message, 500);
        if (!data) return err("No credits found", 404);
        const remaining = data.total_credits - data.used_credits;
        return json({ ...data, remaining_credits: remaining, usage_pct: Math.round((data.used_credits / data.total_credits) * 100) });
      }
    }

    return err(`Unknown endpoint: ${method} /${resource}${resourceId ? "/" + resourceId : ""}`, 404);
  } catch (e: any) {
    console.error("API error:", e);
    return err("Internal server error", 500);
  }
});
