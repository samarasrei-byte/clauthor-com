import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  approval_id: string;
  decision: "approve" | "reject";
  media_kind: "video" | "image";
  media_id: string;
  media_title: string;
  media_url?: string | null;
  notes?: string;
  networks?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "missing_authorization" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth-scoped client to identify the caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    const body = (await req.json()) as Payload;
    if (!body?.approval_id || !body?.decision) return json({ error: "invalid_body" }, 400);

    // Service client for privileged writes
    const admin = createClient(supabaseUrl, serviceKey);

    // Confirm approval belongs to this user's tenant
    const { data: approval, error: apprErr } = await admin
      .from("approvals")
      .select("id, tenant_id, agent_id, title, created_by")
      .eq("id", body.approval_id)
      .maybeSingle();
    if (apprErr || !approval) return json({ error: "approval_not_found" }, 404);

    const tenantId = approval.tenant_id;

    // Persist client feedback as an approval comment (audit trail)
    const commentBody = buildCommentBody(body);
    await admin.from("approval_comments").insert({
      approval_id: approval.id,
      user_id: userId,
      body: commentBody,
      kind: body.decision === "approve" ? "approval" : "revision_request",
    });

    // Find tenant admins/owners to notify (agent handlers)
    const { data: members } = await admin
      .from("tenant_members")
      .select("user_id, role")
      .eq("tenant_id", tenantId)
      .in("role", ["owner", "admin"]);

    const recipients = new Set<string>((members ?? []).map((m: any) => m.user_id));
    // Always include the client author so they see status in their own feed
    recipients.add(userId);

    const title =
      body.decision === "approve"
        ? `🎬 Cliente aprovou: ${body.media_title}`
        : `✏️ Cliente pediu ajuste: ${body.media_title}`;
    const message =
      body.decision === "approve"
        ? `Revise e publique nas redes selecionadas.${body.notes ? ` Observações: ${body.notes}` : ""}`
        : `Feedback do cliente: ${body.notes || "(sem observações)"}`;

    const notifications = Array.from(recipients).map((uid) => ({
      user_id: uid,
      type: body.decision === "approve" ? "media_approved" : "media_revision_requested",
      title,
      message,
      metadata: {
        approval_id: approval.id,
        media_kind: body.media_kind,
        media_id: body.media_id,
        media_url: body.media_url ?? null,
        networks: body.networks ?? [],
        client_id: userId,
        decision: body.decision,
      },
    }));

    if (notifications.length) {
      await admin.from("notifications").insert(notifications);
    }

    return json({ ok: true, notified: notifications.length });
  } catch (e) {
    console.error("[media-approval-notify]", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function buildCommentBody(b: Payload): string {
  const parts = [
    `Decisão do cliente: ${b.decision === "approve" ? "Aprovado" : "Ajuste solicitado"}`,
  ];
  if (b.notes?.trim()) parts.push(`Observações: ${b.notes.trim()}`);
  if (b.networks?.length) parts.push(`Redes: ${b.networks.join(", ")}`);
  return parts.join("\n");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
