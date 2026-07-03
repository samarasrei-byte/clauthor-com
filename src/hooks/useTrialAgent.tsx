import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const TRIAL_DURATION_DAYS = 7;
const TRIAL_PREFIX = "TRIAL-";

interface TrialResult {
  agentId: string;
  agentName: string;
  slug: string;
  expiresAt: string;
}

/**
 * Provisions a single trial agent for a new user, at no cost, for 7 days.
 * Rules:
 *  - One trial per user, ever (checked via subscriptions.stripe_subscription_id LIKE 'TRIAL-%')
 *  - Uses agent_templates row for the given slug (must have is_active=true)
 *  - Inserts into `agents` with monthly_price=0 and status='active'
 *  - Inserts into `subscriptions` with status='trialing' and stripe_subscription_id='TRIAL-<slug>'
 */
export function useTrialAgent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkEligibility = useCallback(async (): Promise<{ eligible: boolean; reason?: string }> => {
    if (!user) return { eligible: false, reason: "not_authenticated" };
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .like("stripe_subscription_id", `${TRIAL_PREFIX}%`)
      .limit(1)
      .maybeSingle();
    if (error) return { eligible: false, reason: "check_failed" };
    return data ? { eligible: false, reason: "trial_already_used" } : { eligible: true };
  }, [user]);

  const startTrial = useCallback(
    async (slug: string, agentName: string): Promise<TrialResult | null> => {
      if (!user) {
        toast.error("Faça login para iniciar o teste gratuito.");
        return null;
      }
      setLoading(true);
      try {
        // 1) Eligibility gate
        const gate = await checkEligibility();
        if (!gate.eligible) {
          if (gate.reason === "trial_already_used") {
            toast.error("Você já utilizou seu teste gratuito. Escolha um plano para continuar.");
          } else {
            toast.error("Não foi possível iniciar o teste. Tente novamente.");
          }
          return null;
        }

        // 2) Load template
        const { data: template, error: tplError } = await supabase
          .from("agent_templates")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .maybeSingle();

        if (tplError || !template) {
          toast.error("Este agente não está disponível para teste no momento.");
          return null;
        }

        // 3) Reuse if already provisioned; else insert
        const { data: existing } = await supabase
          .from("agents")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("name", template.name)
          .limit(1)
          .maybeSingle();

        let agentId: string;
        if (existing) {
          agentId = existing.id;
          if (existing.status !== "active") {
            await supabase.from("agents").update({ status: "active" }).eq("id", agentId);
          }
        } else {
          const tier = (template.tier || "basic") as "basic" | "intermediate" | "advanced" | "enterprise";
          const { data: agent, error: agentError } = await supabase
            .from("agents")
            .insert({
              user_id: user.id,
              name: template.name,
              description: template.description,
              instructions: template.system_prompt || template.instructions,
              objective: template.description,
              tier,
              monthly_price: 0,
              status: "active",
              channels: template.default_channels,
              integrations: template.default_integrations,
              actions: template.default_actions,
            })
            .select("id")
            .single();
          if (agentError || !agent) {
            console.error("Trial provisioning failed:", agentError);
            toast.error("Não foi possível provisionar o agente. Tente novamente.");
            return null;
          }
          agentId = agent.id;
        }

        // 4) Create trial subscription row
        const now = new Date();
        const expiresAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
        await supabase.from("subscriptions").insert({
          user_id: user.id,
          agent_id: agentId,
          monthly_price: 0,
          status: "trialing",
          stripe_subscription_id: `${TRIAL_PREFIX}${slug}`,
          current_period_start: now.toISOString(),
          current_period_end: expiresAt.toISOString(),
        });

        // 5) Audit log
        await supabase.from("execution_logs").insert({
          user_id: user.id,
          agent_id: agentId,
          action: "trial_started",
          status: "success",
          details: { slug, agent_name: agentName, duration_days: TRIAL_DURATION_DAYS },
        });

        toast.success(`🎉 Teste gratuito de ${agentName} ativado por ${TRIAL_DURATION_DAYS} dias!`);
        return { agentId, agentName, slug, expiresAt: expiresAt.toISOString() };
      } catch (err) {
        console.error("startTrial error:", err);
        toast.error("Erro inesperado ao iniciar o teste.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, checkEligibility],
  );

  return { startTrial, checkEligibility, loading };
}
