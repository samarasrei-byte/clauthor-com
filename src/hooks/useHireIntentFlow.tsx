import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SLUG_TO_DEPT } from "@/data/departmentMap";
import { getRegion, getPrice } from "@/lib/pricing";
import type { HireIntent } from "@/pages/Auth";
import type { CheckoutSummaryData } from "@/components/dashboard/CheckoutSummaryDialog";

export function useHireIntentFlow(user: any) {
  const { i18n } = useTranslation();
  const hireProcessed = useRef(false);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummaryData | null>(null);

  useEffect(() => {
    if (!user || hireProcessed.current) return;
    const raw = localStorage.getItem("hireIntent");
    if (!raw) return;
    hireProcessed.current = true;
    localStorage.removeItem("hireIntent");
    const intent: HireIntent = JSON.parse(raw);
    if (!intent.slugs || intent.slugs.length === 0) return;

    const uniqueSlugs = [...new Set(intent.slugs)];
    const lang = i18n.language || "pt";
    const region = getRegion(lang);
    const isDepartment = intent.type === "department" || uniqueSlugs.length > 1;

    let price: number;
    let deptId: string | undefined;

    if (isDepartment) {
      deptId = (intent as any).departmentId || SLUG_TO_DEPT[uniqueSlugs[0]] || "comercial";
      price = (region.departments as Record<string, number>)[deptId] || region.departments.comercial;
    } else {
      const slug = uniqueSlugs[0];
      const agentPriceTierMap: Record<string, string> = {
        sdr_outbound: "entry", sales: "mid", voice_ai: "high", crm_manager: "entry",
        support_channel: "entry", omnichannel: "mid", voice_support: "high", rag: "mid",
        content: "entry", seo_growth: "mid", marketing_automation: "mid", media_buyer: "high",
        revenue: "mid", ai_cfo: "high", data_analytics: "mid",
        orchestrator: "high", project_management: "mid", scheduler: "entry",
        hr: "entry", training: "entry", people_analytics: "mid",
        coding: "premium", computer: "premium", data_engineer: "high",
        creative_design: "mid", video_production: "high", branding: "mid",
        legal: "high", contract_analyst: "mid", compliance_officer: "mid",
        ecommerce: "mid", paid_traffic: "high", affiliate_manager: "entry",
      };
      const priceTier = (agentPriceTierMap[slug] || "starter") as any;
      price = getPrice(lang, priceTier);
    }

    if (!price || price <= 0) { toast.error("Preço inválido para este agente."); return; }

    // Create PayPal plan server-side, then show checkout with planId
    const agentSlug = isDepartment ? `dept-${deptId}` : uniqueSlugs[0];
    createPayPalPlan(agentSlug, intent.label, price, region.currency).then((planId) => {
      setCheckoutSummary({
        label: intent.label, slugs: uniqueSlugs, isDepartment, departmentId: deptId,
        price, currency: region.currency, lang, planId,
      });
    });
  }, [user, i18n.language]);

  const handleApprove = useCallback(async (subscriptionId: string) => {
    if (!checkoutSummary) return;
    const { slugs, isDepartment, departmentId, price, currency, label } = checkoutSummary;
    const agentSlug = isDepartment ? `dept-${departmentId}` : slugs[0];

    // Store subscription data for usePaypalCapture to process
    sessionStorage.setItem("paypal_subscription", JSON.stringify({
      subscription_id: subscriptionId,
      agent_slug: agentSlug,
      agent_name: label,
      price,
      currency,
      tier: isDepartment ? "advanced" : "basic",
      ...(isDepartment ? { is_department: true, department_id: departmentId, department_slugs: slugs } : {}),
    }));

    setCheckoutSummary(null);

    // Trigger the same flow as redirect return
    const url = new URL(window.location.href);
    url.searchParams.set("subscription", "success");
    window.location.href = url.toString();
  }, [checkoutSummary]);

  const cancelCheckout = useCallback(() => {
    setCheckoutSummary(null);
  }, []);

  return { checkoutSummary, handleApprove, cancelCheckout };
}

async function createPayPalPlan(agentSlug: string, agentName: string, amount: number, currency: string): Promise<string | undefined> {
  try {
    const { data, error } = await supabase.functions.invoke("paypal-checkout", {
      body: {
        action: "create_subscription",
        agent_slug: agentSlug,
        agent_name: agentName,
        amount,
        currency,
        return_url: `${window.location.origin}/dashboard?subscription=success`,
        cancel_url: `${window.location.origin}/dashboard?subscription=cancelled`,
      },
    });
    if (error || !data?.success) return undefined;
    return data.plan_id;
  } catch {
    return undefined;
  }
}
