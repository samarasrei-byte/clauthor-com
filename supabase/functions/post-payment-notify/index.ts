import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { agent_name, is_department, agent_count, price, currency, subscription_id } = await req.json();

    // 1. Create user notification (acts as in-app receipt)
    await adminClient.from("notifications").insert({
      user_id: user.id,
      type: "payment_confirmed",
      title: "Pagamento confirmado",
      message: is_department
        ? `Departamento ${agent_name} ativado com ${agent_count} agentes. Assinatura mensal de ${currency} ${price}.`
        : `${agent_name} contratado com sucesso. Assinatura mensal de ${currency} ${price}.`,
      metadata: {
        agent_name,
        is_department,
        agent_count,
        price,
        currency,
        subscription_id,
        confirmed_at: new Date().toISOString(),
      },
    });

    // 2. Notify admins about new revenue
    const { data: admins } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      const userName = profile?.full_name || user.email || "Usuário";

      const adminNotifications = admins.map((admin) => ({
        user_id: admin.user_id,
        type: "new_revenue",
        title: "Nova receita",
        message: `${userName} contratou ${is_department ? `departamento ${agent_name}` : agent_name}. Valor: ${currency} ${price}/mês.`,
        metadata: {
          customer_id: user.id,
          customer_email: user.email,
          customer_name: userName,
          agent_name,
          is_department,
          price,
          currency,
          subscription_id,
        },
      }));

      await adminClient.from("notifications").insert(adminNotifications);
    }

    // 3. Log the event
    await adminClient.from("execution_logs").insert({
      user_id: user.id,
      agent_id: "00000000-0000-0000-0000-000000000000",
      action: "payment_confirmation_sent",
      status: "success",
      details: {
        agent_name,
        is_department,
        price,
        currency,
        admins_notified: admins?.length || 0,
      },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("post-payment-notify error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
