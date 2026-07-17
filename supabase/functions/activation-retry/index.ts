// Retry a specific activation step for a contracted department.
// Enforces ownership + max 5 attempts per step.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Step = "checkout" | "subscription" | "provisioning" | "deploy" | "first_execution";
const VALID_STEPS: Step[] = ["checkout", "subscription", "provisioning", "deploy", "first_execution"];
const MAX_ATTEMPTS = 5;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json(401, { error: "unauthorized" });

    const body = await req.json().catch(() => ({}));
    const { contracted_department_id, step } = body ?? {};
    if (!contracted_department_id || typeof contracted_department_id !== "string") {
      return json(400, { error: "contracted_department_id required" });
    }
    if (!VALID_STEPS.includes(step)) return json(400, { error: "invalid step" });

    const admin = createClient(supabaseUrl, serviceKey);

    // Ownership
    const { data: dept } = await admin
      .from("contracted_departments")
      .select("id, user_id, department_id, subscription_id, monthly_price_cents, agent_ids, agent_count, currency, status")
      .eq("id", contracted_department_id)
      .maybeSingle();
    if (!dept || dept.user_id !== user.id) return json(404, { error: "not_found" });

    // Rate limit: max 5 attempts / step
    const { data: existing } = await admin
      .from("department_activation_steps")
      .select("id, attempts, status")
      .eq("contracted_department_id", contracted_department_id)
      .eq("step", step)
      .maybeSingle();

    const currentAttempts = existing?.attempts ?? 0;
    if (currentAttempts >= MAX_ATTEMPTS) {
      return json(429, {
        error: "max_attempts_reached",
        message: `Você atingiu o limite de ${MAX_ATTEMPTS} tentativas. Fale com o suporte.`,
      });
    }

    // Mark running + bump attempts
    const now = new Date().toISOString();
    if (existing) {
      await admin
        .from("department_activation_steps")
        .update({
          status: "running",
          attempts: currentAttempts + 1,
          error_message: null,
          started_at: now,
        })
        .eq("id", existing.id);
    } else {
      await admin.from("department_activation_steps").insert({
        contracted_department_id,
        user_id: user.id,
        step,
        status: "running",
        attempts: 1,
        started_at: now,
      });
    }

    const markDone = async (metadata: Record<string, unknown> = {}) => {
      await admin
        .from("department_activation_steps")
        .update({
          status: "done",
          completed_at: new Date().toISOString(),
          error_message: null,
          metadata,
        })
        .eq("contracted_department_id", contracted_department_id)
        .eq("step", step);
    };

    const markFailed = async (message: string) => {
      await admin
        .from("department_activation_steps")
        .update({
          status: "failed",
          error_message: message,
        })
        .eq("contracted_department_id", contracted_department_id)
        .eq("step", step);
    };

    try {
      switch (step as Step) {
        case "checkout": {
          // Not retryable server-side: frontend should reopen ActivateModal.
          await markFailed("Reabra o modal de ativação para tentar novamente.");
          return json(200, {
            success: false,
            action: "reopen_activate_modal",
            department_id: dept.department_id,
          });
        }

        case "subscription": {
          if (!dept.subscription_id) {
            await markFailed("Nenhum subscription_id salvo. Refaça o checkout.");
            return json(200, { success: false, action: "reopen_activate_modal" });
          }
          const now2 = new Date();
          const periodEnd = new Date(now2);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          const { data: subExist } = await admin
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", dept.subscription_id)
            .maybeSingle();

          if (!subExist) {
            await admin.from("subscriptions").insert({
              user_id: user.id,
              agent_id: null,
              monthly_price: dept.monthly_price_cents,
              status: "active",
              stripe_subscription_id: dept.subscription_id,
              current_period_start: now2.toISOString(),
              current_period_end: periodEnd.toISOString(),
            });
          }
          await markDone({ subscription_id: dept.subscription_id });
          return json(200, { success: true });
        }

        case "provisioning": {
          // Idempotent: seed catalog agents for this department.
          const { data: catalog } = await admin
            .from("agents_catalog")
            .select("slug, name")
            .eq("is_active", true);

          const seeded: string[] = [];
          for (const row of catalog ?? []) {
            const { data: templ } = await admin
              .from("agent_templates")
              .select("*")
              .eq("slug", row.slug)
              .eq("is_active", true)
              .maybeSingle();
            if (!templ) continue;
            const { data: exists } = await admin
              .from("agents")
              .select("id")
              .eq("user_id", user.id)
              .eq("name", templ.name)
              .maybeSingle();
            if (exists) {
              await admin.from("agents").update({ status: "active" }).eq("id", exists.id);
              seeded.push(exists.id);
              continue;
            }
            const { data: created } = await admin
              .from("agents")
              .insert({
                user_id: user.id,
                name: templ.name,
                description: templ.description,
                instructions: templ.system_prompt || templ.instructions,
                objective: templ.description,
                tier: templ.tier || "basic",
                monthly_price: 0,
                status: "active",
                channels: templ.default_channels,
                integrations: templ.default_integrations,
                actions: templ.default_actions,
              })
              .select("id")
              .single();
            if (created?.id) seeded.push(created.id);
          }

          if (seeded.length > 0) {
            await admin
              .from("contracted_departments")
              .update({ agent_ids: seeded, agent_count: seeded.length })
              .eq("id", contracted_department_id);
          }
          await markDone({ agent_ids: seeded });
          return json(200, { success: true, provisioned: seeded.length });
        }

        case "deploy": {
          // Force department active + ensure user has some credits.
          await admin
            .from("contracted_departments")
            .update({ status: "active" })
            .eq("id", contracted_department_id);

          const { data: credits } = await admin
            .from("user_credits")
            .select("total_credits")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!credits) {
            await admin.from("user_credits").insert({
              user_id: user.id,
              total_credits: 100000,
              used_credits: 0,
              plan_type: "paid",
            });
          } else if ((credits.total_credits ?? 0) === 0) {
            await admin
              .from("user_credits")
              .update({ total_credits: 100000, plan_type: "paid" })
              .eq("user_id", user.id);
          }

          await markDone({});
          return json(200, { success: true });
        }

        case "first_execution": {
          // Not retryable — user must trigger it via the Library.
          await markFailed("Peça a um agente para rodar sua primeira tarefa.");
          return json(200, {
            success: false,
            action: "open_library",
          });
        }
      }
    } catch (e) {
      await markFailed((e as Error).message ?? "Falha inesperada");
      return json(500, { error: (e as Error).message ?? "unexpected" });
    }
  } catch (e) {
    return json(500, { error: (e as Error).message ?? "unexpected" });
  }
});
