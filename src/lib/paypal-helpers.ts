import { supabase } from "@/integrations/supabase/client";
import type { CheckoutSummaryData } from "@/components/dashboard/CheckoutSummaryDialog";

/**
 * Creates a PayPal plan server-side and returns the planId.
 * Used to enable inline PayPal buttons (transparent checkout).
 */
export async function createPayPalPlan(
  agentSlug: string,
  agentName: string,
  amount: number,
  currency: string
): Promise<string | undefined> {
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

/**
 * Handles inline PayPal approval: stores subscription data
 * and triggers the same flow as redirect return.
 */
export function handleInlineApproval(
  subscriptionId: string,
  checkoutData: CheckoutSummaryData,
  extraMeta?: Record<string, any>
) {
  const { slugs, isDepartment, departmentId, price, currency, label } = checkoutData;
  const agentSlug = isDepartment ? `dept-${departmentId}` : slugs[0];

  sessionStorage.setItem("paypal_subscription", JSON.stringify({
    subscription_id: subscriptionId,
    agent_slug: agentSlug,
    agent_name: label,
    price,
    currency,
    tier: isDepartment ? "advanced" : "basic",
    ...(isDepartment ? { is_department: true, department_id: departmentId, department_slugs: slugs } : {}),
    ...extraMeta,
  }));

  // Trigger the same capture flow
  const url = new URL(window.location.href);
  url.searchParams.set("subscription", "success");
  window.location.href = url.toString();
}
