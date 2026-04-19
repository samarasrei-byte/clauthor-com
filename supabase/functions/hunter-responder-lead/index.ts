import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    const user = userData.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { lead_linkedin_id, content, conversation_id } = body || {};
    if (!lead_linkedin_id || !content) {
      return new Response(JSON.stringify({ error: "lead_linkedin_id e content são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's hunter_config for cookie
    const { data: cfg } = await supabase
      .from("hunter_config")
      .select("phantombuster_api_key_encrypted, phantombuster_connect_agent_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: session } = await supabase
      .from("hunter_linkedin_session")
      .select("linkedin_cookie")
      .eq("user_id", user.id)
      .maybeSingle();

    const linkedinCookie = session?.linkedin_cookie || "";
    const pbApiKey = cfg?.phantombuster_api_key_encrypted || Deno.env.get("PHANTOMBUSTER_API_KEY") || "";
    const pbAgentId = cfg?.phantombuster_connect_agent_id || Deno.env.get("PHANTOMBUSTER_CONNECT_AGENT_ID") || "";

    if (!linkedinCookie) {
      return new Response(
        JSON.stringify({ error: "LinkedIn não conectado. Conecte em /hunter-linkedin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!pbApiKey || !pbAgentId) {
      return new Response(
        JSON.stringify({ error: "PhantomBuster não configurado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Launch PhantomBuster agent
    const pbResp = await fetch("https://api.phantombuster.com/api/v2/agents/launch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Phantombuster-Key-1": pbApiKey,
      },
      body: JSON.stringify({
        id: pbAgentId,
        argument: {
          sessionCookie: linkedinCookie,
          profileUrl: lead_linkedin_id.startsWith("http")
            ? lead_linkedin_id
            : `https://www.linkedin.com/in/${lead_linkedin_id}`,
          message: content,
        },
      }),
    });

    const pbResult = await pbResp.json().catch(() => ({}));

    // Update conversation status
    if (conversation_id) {
      await supabase
        .from("hunter_conversations")
        .update({ status: "respondido", last_message_at: new Date().toISOString() })
        .eq("id", conversation_id)
        .eq("user_id", user.id);
    }

    // Log
    await supabase.from("hunter_logs").insert({
      user_id: user.id,
      tipo: pbResp.ok ? "info" : "erro",
      mensagem: pbResp.ok
        ? `Resposta enviada via LinkedIn para ${lead_linkedin_id}`
        : `Falha ao enviar via PhantomBuster: ${JSON.stringify(pbResult).slice(0, 200)}`,
    });

    if (!pbResp.ok) {
      return new Response(JSON.stringify({ error: "PhantomBuster falhou", details: pbResult }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, container_id: pbResult?.containerId || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
