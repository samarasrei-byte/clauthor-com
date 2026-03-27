import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PayPalInlineButtonsProps {
  planId: string;
  onApprove: (subscriptionId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

const PayPalInlineButtons = ({ planId, onApprove, onError, onCancel, disabled }: PayPalInlineButtonsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const renderedRef = useRef(false);
  const { t } = useTranslation();

  // Load PayPal JS SDK
  useEffect(() => {
    if (window.paypal) {
      setSdkReady(true);
      setLoading(false);
      return;
    }

    const loadSdk = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("paypal-checkout", {
          body: { action: "get_client_id" },
        });
        if (error || !data?.client_id) {
          onError("Failed to load payment system");
          return;
        }

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${data.client_id}&vault=true&intent=subscription`;
        script.setAttribute("data-sdk-integration-source", "button-factory");
        script.onload = () => {
          setSdkReady(true);
          setLoading(false);
        };
        script.onerror = () => {
          onError("Failed to load PayPal SDK");
          setLoading(false);
        };
        document.body.appendChild(script);
      } catch {
        onError("Failed to initialize payment");
        setLoading(false);
      }
    };

    loadSdk();
  }, []);

  // Render PayPal buttons
  useEffect(() => {
    if (!sdkReady || !window.paypal || !containerRef.current || renderedRef.current || !planId || disabled) return;
    renderedRef.current = true;

    window.paypal.Buttons({
      style: {
        shape: "rect",
        color: "gold",
        layout: "vertical",
        label: "subscribe",
        height: 45,
      },
      createSubscription: (_data: any, actions: any) => {
        return actions.subscription.create({ plan_id: planId });
      },
      onApprove: (data: any) => {
        if (data.subscriptionID) {
          onApprove(data.subscriptionID);
        }
      },
      onCancel: () => {
        onCancel();
      },
      onError: (err: any) => {
        console.error("PayPal button error:", err);
        onError(typeof err === "string" ? err : "Payment error");
      },
    }).render(containerRef.current);
  }, [sdkReady, planId, disabled]);

  return (
    <div className="space-y-3">
      {loading && (
        <div className="flex items-center justify-center py-6 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            {t("checkout.loading_paypal", { defaultValue: "Loading payment..." })}
          </span>
        </div>
      )}
      <div ref={containerRef} className={loading ? "hidden" : ""} />
      {!loading && (
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/50">
          <ShieldCheck className="h-3 w-3" />
          <span>{t("checkout.trust_footer", { defaultValue: "Secure payment via PayPal • Data protected" })}</span>
        </div>
      )}
    </div>
  );
};

export default PayPalInlineButtons;
