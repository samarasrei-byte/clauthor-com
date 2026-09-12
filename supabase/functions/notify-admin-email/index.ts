import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors, jsonResponse } from "../_shared/cors.ts";
import { getUserFromRequest, unauthorizedResponse } from "../_shared/auth.ts";
import { EmailConfigurationError, EmailDeliveryError, sendEmail } from "../_shared/resend-email.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cleanText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);

  const { user } = await getUserFromRequest(req);
  if (!user) return unauthorizedResponse(corsHeaders);

  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const userName = cleanText(body?.user_name, 120);
    const userEmail = cleanText(body?.user_email, 254).toLowerCase();
    const signupAt = cleanText(body?.signup_at, 40);
    if (!EMAIL_PATTERN.test(userEmail)) return jsonResponse({ error: "Dados de entrada inválidos." }, 400);
    if (signupAt && Number.isNaN(Date.parse(signupAt))) return jsonResponse({ error: "Dados de entrada inválidos." }, 400);
    if (user.email && user.email.toLowerCase() !== userEmail) return jsonResponse({ error: "Dados de entrada inválidos." }, 403);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return jsonResponse({ error: "Serviço indisponível." }, 503);
    const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: admins, error: rolesError } = await adminClient.from("user_roles").select("user_id").eq("role", "admin");
    if (rolesError) throw new Error("admin_lookup_failed");
    if (!admins?.length) return jsonResponse({ error: "Nenhum destinatário administrativo configurado." }, 503);

    const recipients: string[] = [];
    for (const admin of admins) {
      const { data, error } = await adminClient.auth.admin.getUserById(admin.user_id);
      if (!error && data.user?.email && EMAIL_PATTERN.test(data.user.email)) recipients.push(data.user.email);
    }
    const uniqueRecipients = [...new Set(recipients)].slice(0, 20);
    if (!uniqueRecipients.length) return jsonResponse({ error: "Nenhum destinatário administrativo configurado." }, 503);

    const displayName = userName || "Novo usuário";
    const timestamp = signupAt ? new Date(signupAt).toISOString() : new Date().toISOString();
    const delivery = await sendEmail({
      to: uniqueRecipients,
      subject: "Novo cadastro na Clauthor",
      text: `${displayName} concluiu um cadastro em ${timestamp}. E-mail da conta: ${userEmail}.`,
    });

    const { error: notificationError } = await adminClient.from("notifications").insert(admins.map((admin) => ({
      user_id: admin.user_id,
      type: "new_signup_email_alert",
      title: "Novo cadastro",
      message: `${displayName} concluiu um cadastro.`,
      metadata: { signup_at: timestamp, delivery_id: delivery.id },
    })));
    if (notificationError) console.error("notification_persistence_failed");

    return jsonResponse({ success: true, delivery_id: delivery.id }, 200);
  } catch (error) {
    if (error instanceof EmailConfigurationError) return jsonResponse({ error: "Serviço de e-mail indisponível." }, 503);
    if (error instanceof EmailDeliveryError) return jsonResponse({ error: error.message }, error.status);
    console.error("notify_admin_email_failed");
    return jsonResponse({ error: "Não foi possível enviar o e-mail." }, 500);
  }
});
