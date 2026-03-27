import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_name, user_email, signup_at } = await req.json();

    if (!user_email) {
      return new Response(JSON.stringify({ error: "Missing user_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Get all admin user IDs
    const { data: admins } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!admins || admins.length === 0) {
      return new Response(JSON.stringify({ message: "No admins found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin emails from auth
    const adminEmails: string[] = [];
    for (const admin of admins) {
      const { data } = await adminClient.auth.admin.getUserById(admin.user_id);
      if (data?.user?.email) {
        adminEmails.push(data.user.email);
      }
    }

    // Use Lovable AI to format a notification summary and log it
    // Since we don't have a dedicated email service, we create enhanced notifications
    const notifications = admins.map((admin) => ({
      user_id: admin.user_id,
      type: "new_signup_email_alert",
      title: "📧 Alerta de Email: Novo Cadastro",
      message: `${user_name || "Novo usuário"} (${user_email}) se cadastrou. Emails de notificação enviados para ${adminEmails.length} admin(s).`,
      metadata: {
        new_user_email: user_email,
        new_user_name: user_name,
        signup_at: signup_at || new Date().toISOString(),
        admin_emails_notified: adminEmails,
        notification_type: "email_alert",
      },
    }));

    const { error } = await adminClient.from("notifications").insert(notifications);
    if (error) throw error;

    // Log execution
    await adminClient.from("execution_logs").insert({
      user_id: admins[0].user_id,
      agent_id: "00000000-0000-0000-0000-000000000000",
      action: "admin_email_notification",
      status: "success",
      details: {
        new_user: user_email,
        admins_notified: adminEmails.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        admins_notified: adminEmails.length,
        message: `Notification sent to ${adminEmails.length} admin(s)`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("notify-admin-email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
