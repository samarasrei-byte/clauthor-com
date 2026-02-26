import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function usePaypalCapture() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const captured = useRef(false);

  useEffect(() => {
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
          body: {
            action: "capture_order",
            order_id: order.order_id,
          },
        });

        if (error) throw error;
        if (!data?.success || data?.status !== "COMPLETED") {
          throw new Error("Pagamento não foi confirmado pelo PayPal");
        }

        // Payment confirmed — update credits
        const tokensToAdd = getTokensForItem(order.type, order.item_id);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (tokensToAdd > 0 && currentUser) {
          const { data: currentCredits } = await supabase
            .from("user_credits")
            .select("total_credits")
            .eq("user_id", currentUser.id)
            .single();

          if (currentCredits) {
            const updatePayload: Record<string, any> = {
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

        // Log to payment_history
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
  }, [searchParams, setSearchParams, queryClient]);
}

function getTokensForItem(type: string, itemId: string): number {
  if (type === "plan") {
    const planTokens: Record<string, number> = {
      starter: 5000000,
      pro: 25000000,
      enterprise: 100000000,
    };
    return planTokens[itemId] || 0;
  }
  
  const packTokens: Record<string, number> = {
    "pack-5m": 5000000,
    "pack-10m": 10000000,
    "pack-25m": 25000000,
    "pack-50m": 50000000,
    "pack-100m": 100000000,
  };
  return packTokens[itemId] || 0;
}
