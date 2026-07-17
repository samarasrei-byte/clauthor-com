import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEPARTMENT_PACKAGES, formatBRL } from "@/data/departmentPackages";
import CheckoutSummaryDialog, { type CheckoutSummaryData } from "@/components/dashboard/CheckoutSummaryDialog";
import { createPayPalPlan, handleInlineApproval } from "@/lib/paypal-helpers";

interface Props {
  open: boolean;
  onClose: () => void;
}

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
 * Tela 5 · Ativação em modal full-screen.
 * Uma linha, um botão. Reusa PayPal via CheckoutSummaryDialog.
 */
export default function ActivateModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutSummaryData | null>(null);

  useEffect(() => {
    if (!open || !user) return;
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
      if (!cancelled && data) setPending(data as PendingRow);
    })();
    return () => { cancelled = true; };
  }, [open, user]);

  if (!open) return null;
  if (!pending) return null;

  const pkg = DEPARTMENT_PACKAGES.find((p) => p.id === pending.department_id);
  const priceReais = pending.monthly_price_cents / 100;

  const openCheckout = async () => {
    setLoading(true);
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
        title: "Não conseguimos iniciar sua ativação",
        description: "Tente novamente em instantes ou fale com o suporte no WhatsApp.",
      };
      toast.error(f.title, { description: f.description, duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  const label = pending.department_name.replace(/^Departamento\s+(de\s+)?/i, "");

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9997] bg-background flex flex-col items-center justify-center p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activate-title"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-6 right-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
          aria-hidden
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 flex items-center justify-center">
            <span className="font-display text-xl font-bold text-primary">T</span>
          </div>
        </motion.div>

        <h1 id="activate-title" className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-center max-w-3xl leading-[1.1] mb-4">
          Ativar seu time de <span className="text-primary">{label}</span>
        </h1>

        <p className="text-xl sm:text-2xl text-muted-foreground text-center mb-2">
          {formatBRL(priceReais)}<span className="text-base"> /mês</span>
        </p>
        <p className="text-sm text-muted-foreground mb-12">Cancela quando quiser · sem multa.</p>

        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={openCheckout}
            disabled={loading}
            className="inline-flex items-center gap-2 h-16 px-10 rounded-full bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Ativar agora
          </button>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Falar com humano antes
          </a>
        </div>
      </motion.div>

      <CheckoutSummaryDialog
        data={checkout}
        onApprove={(subId) => {
          if (checkout) {
            handleInlineApproval(subId, checkout, { pending_department_row_id: pending.id });
          }
        }}
        onCancel={() => setCheckout(null)}
      />
    </>
  );
}
