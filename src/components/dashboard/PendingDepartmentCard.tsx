import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Zap, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEPARTMENT_PACKAGES, formatBRL } from "@/data/departmentPackages";
import CheckoutSummaryDialog, { type CheckoutSummaryData } from "./CheckoutSummaryDialog";
import { createPayPalPlan, handleInlineApproval } from "@/lib/paypal-helpers";

interface PendingRow {
  id: string;
  department_id: string;
  department_name: string;
  monthly_price_cents: number;
  currency: string;
  agent_count: number;
  pain_point: string | null;
}

/**
 * Card destacado na Overview: mostra departamento sugerido no onboarding
 * (status='pending_payment') e abre o CheckoutSummaryDialog para ativação.
 */
export default function PendingDepartmentCard() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingRow | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutSummaryData | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("contracted_departments")
        .select("id, department_id, department_name, monthly_price_cents, currency, agent_count, pain_point")
        .eq("user_id", user.id)
        .eq("status", "pending_payment")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data) setPending(data as PendingRow);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user || !pending || dismissed) return null;

  const pkg = DEPARTMENT_PACKAGES.find((p) => p.id === pending.department_id);
  const priceReais = pending.monthly_price_cents / 100;

  const openCheckout = async () => {
    const data: CheckoutSummaryData = {
      label: pending.department_name,
      slugs: (pkg?.agentSlugs ?? []).map((s) => String(s)),
      isDepartment: true,
      departmentId: pending.department_id,
      price: priceReais,
      currency: pending.currency || "BRL",
      lang: "pt",
    };
    try {
      const planId = await createPayPalPlan(
        `dept-${pending.department_id}`,
        pending.department_name,
        priceReais,
        pending.currency || "BRL",
      );
      setCheckout({ ...data, planId });
    } catch (err: any) {
      const f = err?.friendly ?? {
        title: "Não conseguimos abrir o checkout",
        description: "Tente novamente em instantes.",
      };
      toast.error(f.title, { description: f.description, duration: 8000 });
    }
  };

  const onApproveInline = (subscriptionId: string) => {
    if (!checkout) return;
    handleInlineApproval(subscriptionId, checkout, {
      pending_department_row_id: pending.id,
    });
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        data-tour="pending-department"
        className="relative rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-primary/[0.02] to-transparent p-5 md:p-6 overflow-hidden"
        aria-label="Departamento pendente de ativação"
      >
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <p className="type-eyebrow text-primary">Ative seu departamento</p>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 flex-1">
              <h2 className="font-display text-2xl font-bold leading-tight">
                {pending.department_name}
              </h2>
              {pending.pain_point && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Foi montado para: <span className="text-foreground/80">{pending.pain_point}</span>
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> {pending.agent_count} agentes
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" /> Entrega no D+1
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-primary">
                {formatBRL(priceReais)}
                <span className="text-xs text-muted-foreground font-normal">/mês</span>
              </p>
              <p className="text-[10px] text-muted-foreground">cancela quando quiser</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={openCheckout}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Ativar agora <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="inline-flex items-center justify-center h-11 px-4 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Depois
            </button>
          </div>
        </div>
      </motion.section>

      <CheckoutSummaryDialog
        data={checkout}
        onApprove={onApproveInline}
        onCancel={() => setCheckout(null)}
      />
    </>
  );
}
