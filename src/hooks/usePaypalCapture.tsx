import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function usePaypalCapture() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const captured = useRef(false);

  useEffect(() => {
    // ── Handle subscription cancellation ──
    const subStatus = searchParams.get("subscription");
    if (subStatus === "cancelled") {
      toast.error("Assinatura cancelada.");
      sessionStorage.removeItem("paypal_subscription");
      searchParams.delete("subscription");
      setSearchParams(searchParams, { replace: true });
      return;
    }

    // ── Handle subscription success ──
    if (subStatus === "success") {
      if (captured.current) return;
      const raw = sessionStorage.getItem("paypal_subscription");
      if (!raw) {
        searchParams.delete("subscription");
        setSearchParams(searchParams, { replace: true });
        return;
      }

      captured.current = true;
      const subIntent = JSON.parse(raw);
      sessionStorage.removeItem("paypal_subscription");

      const activateSubscription = async () => {
        const loadingToast = toast.loading("Verificando assinatura...");
        try {
          // 1. Verify subscription status with PayPal
          const { data, error } = await supabase.functions.invoke("paypal-checkout", {
            body: {
              action: "verify_subscription",
              subscription_id: subIntent.subscription_id,
            },
          });

          if (error) throw error;
          if (!data?.success) throw new Error("Falha ao verificar assinatura");

          const status = data.status;
          if (status !== "ACTIVE" && status !== "APPROVED") {
            throw new Error(`Assinatura não ativa. Status: ${status}`);
          }

          // 2. Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Usuário não autenticado");

          // 3. Provision agent(s) based on type
          const slugsToProvision = subIntent.is_department 
            ? (subIntent.department_slugs || []) 
            : [subIntent.agent_slug];

          const provisionedAgents: string[] = [];

          for (const slug of slugsToProvision) {
            const { data: template } = await supabase
              .from("agent_templates")
              .select("*")
              .eq("slug", slug)
              .eq("is_active", true)
              .single();

            if (!template) {
              console.warn(`Template not found for slug: ${slug}`);
              continue;
            }

            // Check if agent with same name already exists for this user
            const { data: existing } = await supabase
              .from("agents")
              .select("id")
              .eq("user_id", user.id)
              .eq("name", template.name)
              .limit(1)
              .maybeSingle();

            if (existing) {
              // Agent already exists - reuse it instead of creating a duplicate
              provisionedAgents.push(existing.id);
              // Ensure it's active
              await supabase.from("agents").update({ status: "active" }).eq("id", existing.id);
              continue;
            }

            const tier = (template.tier || "basic") as "basic" | "intermediate" | "advanced" | "enterprise";
            const priceInCents = subIntent.is_department ? 0 : (subIntent.price || 0) * 100;

            const { data: agent, error: agentError } = await supabase
              .from("agents")
              .insert({
                user_id: user.id,
                name: template.name,
                description: template.description,
                instructions: template.system_prompt || template.instructions,
                objective: template.description,
                tier,
                monthly_price: priceInCents,
                status: "active",
                channels: template.default_channels,
                integrations: template.default_integrations,
                actions: template.default_actions,
              })
              .select()
              .single();

            if (agentError) {
              console.error(`Error provisioning ${slug}:`, agentError);
              continue;
            }
            provisionedAgents.push(agent.id);
          }

          if (provisionedAgents.length === 0) {
            throw new Error("Nenhum agente pôde ser provisionado");
          }

          // 4. Create subscription record (linked to first agent for individual, null for dept)
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          const priceInCents = (subIntent.price || 0) * 100;

          await supabase.from("subscriptions").insert({
            user_id: user.id,
            agent_id: subIntent.is_department ? null : provisionedAgents[0],
            monthly_price: priceInCents,
            status: "active",
            stripe_subscription_id: subIntent.subscription_id,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          });

          // 4b. Persist contracted department (snapshot user context so agents/dashboard can use)
          if (subIntent.is_department) {
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, email, company_name, onboarding_answers")
                .eq("user_id", user.id)
                .maybeSingle();

              const answers = ((profile as any)?.onboarding_answers as any) || {};
              await supabase.from("contracted_departments").insert({
                user_id: user.id,
                department_id: subIntent.department_id || "comercial",
                department_name: subIntent.agent_name,
                monthly_price_cents: priceInCents,
                currency: subIntent.currency || "BRL",
                agent_count: provisionedAgents.length,
                agent_ids: provisionedAgents,
                subscription_id: subIntent.subscription_id,
                pain_point: answers.pain || answers.detected_pain || null,
                company_snapshot: {
                  name: (profile as any)?.company_name || null,
                  contact_name: (profile as any)?.full_name || null,
                  email: (profile as any)?.email || null,
                },
                onboarding_snapshot: answers,
                status: "active",
              });
            } catch (e) {
              console.warn("[contracted_departments] insert failed", e);
            }
          }

          // 5. Log to payment_history
          await supabase.from("payment_history").insert({
            user_id: user.id,
            type: "paypal_subscription",
            item_id: subIntent.is_department ? `dept-${subIntent.department_id}` : subIntent.agent_slug,
            item_name: subIntent.is_department 
              ? `Assinatura: Dept. ${subIntent.agent_name}` 
              : `Assinatura: ${subIntent.agent_name}`,
            tokens_amount: 0,
            amount_cents: priceInCents,
            currency: subIntent.currency || "BRL",
            status: "completed",
            paypal_order_id: subIntent.subscription_id,
          });


          // 6. Register agents with OpenClaw (non-blocking)
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            for (const agentId of provisionedAgents) {
              fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openclaw-register`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionData?.session?.access_token}`,
                  },
                  body: JSON.stringify({ agentId }),
                }
              ).catch(console.warn);
            }
          } catch (e) {
            console.warn("OpenClaw registration deferred:", e);
          }

          toast.dismiss(loadingToast);
          const successMsg = subIntent.is_department
            ? `Departamento ${subIntent.agent_name} ativado! ${provisionedAgents.length} agentes provisionados.`
            : `${subIntent.agent_name} contratado com sucesso! Assinatura mensal ativa.`;
          toast.success(successMsg, { duration: 6000 });
          
          // Signal dashboard to open THOR for guided onboarding
          sessionStorage.setItem("clauthor_post_payment_onboarding", JSON.stringify({
            agentName: subIntent.agent_name,
            isDepartment: !!subIntent.is_department,
            agentCount: provisionedAgents.length,
            departmentId: subIntent.department_id || null,
          }));

          // Send post-payment notification (non-blocking)
          supabase.functions.invoke("post-payment-notify", {
            body: {
              agent_name: subIntent.agent_name,
              is_department: !!subIntent.is_department,
              agent_count: provisionedAgents.length,
              price: subIntent.price,
              currency: subIntent.currency || "BRL",
              subscription_id: subIntent.subscription_id,
            },
          }).catch(console.warn);

          queryClient.invalidateQueries({ queryKey: ["user-agents"] });
          queryClient.invalidateQueries({ queryKey: ["payment-history"] });
          queryClient.invalidateQueries({ queryKey: ["subscriptions"] });

          // ── Vertical-specific post-checkout redirect (Advocacia) ──
          // UX: leva direto ao painel isolado pra evitar overload do dashboard genérico.
          if (localStorage.getItem("advocacia_post_checkout") === "1") {
            localStorage.removeItem("advocacia_post_checkout");
            setTimeout(() => navigate("/advocacia/painel", { replace: true }), 600);
          }

        } catch (err: any) {
          toast.dismiss(loadingToast);
          toast.error(err.message || "Erro ao ativar assinatura");
          console.error("Subscription activation error:", err);
        } finally {
          searchParams.delete("subscription");
          searchParams.delete("subscription_id");
          searchParams.delete("ba_token");
          searchParams.delete("token");
          setSearchParams(searchParams, { replace: true });
        }
      };

      activateSubscription();
      return;
    }

    // ── Legacy: Handle one-time payment (token packs) ──
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "cancelled") {
      toast.error("Pagamento cancelado.");
      searchParams.delete("payment");
      setSearchParams(searchParams, { replace: true });
      return;
    }

    if (paymentStatus !== "success") return;
    if (captured.current) return;

    const raw = sessionStorage.getItem("paypal_order");
    if (!raw) {
      searchParams.delete("payment");
      setSearchParams(searchParams, { replace: true });
      return;
    }

    captured.current = true;
    const order = JSON.parse(raw);
    sessionStorage.removeItem("paypal_order");

    const captureOrder = async () => {
      const loadingToast = toast.loading("Confirmando pagamento...");
      try {
        const { data, error } = await supabase.functions.invoke("paypal-checkout", {
          body: { action: "capture_order", order_id: order.order_id },
        });

        if (error) throw error;
        if (!data?.success || data?.status !== "COMPLETED") {
          throw new Error("Pagamento não foi confirmado pelo PayPal");
        }

        const tokensToAdd = getTokensForItem(order.type, order.item_id);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (tokensToAdd > 0 && currentUser) {
          const { data: currentCredits } = await supabase
            .from("user_credits")
            .select("total_credits")
            .eq("user_id", currentUser.id)
            .single();

          if (currentCredits) {
            const updatePayload: { total_credits: number; plan_type?: string } = {
              total_credits: currentCredits.total_credits + tokensToAdd,
            };
            if (order.type === "plan") {
              updatePayload.plan_type = order.item_id;
            }
            await supabase
              .from("user_credits")
              .update(updatePayload)
              .eq("user_id", currentUser.id);
          }
        }

        const { data: { user: captureUser } } = await supabase.auth.getUser();
        if (captureUser) {
          await supabase.from("payment_history").insert({
            user_id: captureUser.id,
            type: "paypal",
            item_id: order.item_id || order.type,
            item_name: order.type === "plan"
              ? `Plano ${order.item_id?.charAt(0).toUpperCase()}${order.item_id?.slice(1)}`
              : `Pacote ${order.item_id}`,
            tokens_amount: tokensToAdd,
            amount_cents: order.amount || 0,
            currency: "BRL",
            status: "completed",
            paypal_order_id: order.order_id,
          });
        }

        toast.dismiss(loadingToast);
        toast.success("🎉 Pagamento confirmado! Tokens creditados.", { duration: 5000 });
        queryClient.invalidateQueries({ queryKey: ["user-credits"] });
        queryClient.invalidateQueries({ queryKey: ["payment-history"] });
      } catch (err: any) {
        toast.dismiss(loadingToast);
        toast.error(err.message || "Erro ao confirmar pagamento");
        console.error("PayPal capture error:", err);
      } finally {
        searchParams.delete("payment");
        setSearchParams(searchParams, { replace: true });
      }
    };

    captureOrder();
  }, [searchParams, setSearchParams, queryClient, navigate]);
}

function getTokensForItem(type: string, itemId: string): number {
  if (type === "plan") {
    const planTokens: Record<string, number> = {
      starter: 5000000, pro: 25000000, enterprise: 100000000,
    };
    return planTokens[itemId] || 0;
  }
  const packTokens: Record<string, number> = {
    "pack-5m": 5000000, "pack-10m": 10000000, "pack-25m": 25000000,
    "pack-50m": 50000000, "pack-100m": 100000000,
  };
  return packTokens[itemId] || 0;
}
