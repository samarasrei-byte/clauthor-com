import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Users, CheckCircle2, Zap, AlertTriangle, ShieldCheck } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { formatPrice } from "@/lib/pricing";
import { useState } from "react";
import { motion } from "framer-motion";
import FlowProgressBar from "./FlowProgressBar";
import { useTranslation } from "react-i18next";
import PayPalInlineButtons from "./PayPalInlineButtons";

export interface CheckoutSummaryData {
  label: string;
  slugs: string[];
  isDepartment: boolean;
  departmentId?: string;
  price: number;
  currency: string;
  lang: string;
  planId?: string; // PayPal plan ID for inline checkout
  setupFee?: number; // One-time setup fee in WHOLE units (reais), charged at first billing
}

interface Props {
  data: CheckoutSummaryData | null;
  onApprove: (subscriptionId: string) => void;
  onCancel: () => void;
}

const CheckoutSummaryDialog = ({ data, onApprove, onCancel }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  if (!data) return null;

  const formattedPrice = formatPrice(data.price, data.lang);
  const hasSetup = typeof data.setupFee === "number" && data.setupFee > 0;
  const formattedSetup = hasSetup ? formatPrice(data.setupFee!, data.lang) : null;
  const formattedTotalToday = hasSetup ? formatPrice(data.price + data.setupFee!, data.lang) : formattedPrice;

  return (
    <Dialog open={!!data} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg bg-background border-border/20 p-0 overflow-hidden">
        <VisuallyHidden><DialogTitle>Resumo do checkout</DialogTitle><DialogDescription>Confirme os detalhes antes de contratar.</DialogDescription></VisuallyHidden>
        {/* Hero header */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-b from-primary/8 to-transparent">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-primary/10 blur-[100px] rounded-full" />
          </div>
          
          <div className="relative z-10 text-center space-y-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 flex items-center justify-center mx-auto"
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </motion.div>
            <div>
              <h2 className="font-display text-xl font-bold">{t("checkout.summary_title", { defaultValue: "Checkout" })}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("checkout.summary_subtitle", { defaultValue: "Complete your payment without leaving the page" })}</p>
            </div>
            <FlowProgressBar currentStep="payment" className="mt-4" />
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Squad/Agent card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border/10 bg-card/40 p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                {data.isDepartment ? (
                  <Badge variant="secondary" className="bg-primary/10 text-primary gap-1 text-[10px]">
                    <Users className="h-3 w-3" /> {t("checkout.department", { defaultValue: "Department" })}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-accent/50 gap-1 text-[10px]">
                    <Bot className="h-3 w-3" /> {t("checkout.individual_agent", { defaultValue: "Individual Agent" })}
                  </Badge>
                )}
                <p className="font-display font-bold text-lg leading-tight">{data.label}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-2xl font-bold text-primary">{formattedPrice}</p>
                <p className="text-[10px] text-muted-foreground">/{t("checkout.month", { defaultValue: "mo" })}</p>
              </div>
            </div>

            {hasSetup && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Setup único (hoje)</span>
                  <span className="font-semibold">{formattedSetup}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Mensalidade (recorrente)</span>
                  <span className="font-semibold">{formattedPrice}/mês</span>
                </div>
                <div className="border-t border-primary/15 pt-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold">Cobrado hoje</span>
                  <span className="font-display font-bold text-primary">{formattedTotalToday}</span>
                </div>
              </div>
            )}

            {data.slugs.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {data.slugs.length} {t("checkout.agents_included_label", { defaultValue: "agent(s) included" })}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.slugs.slice(0, 8).map((s) => (
                    <div key={s} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/60 border border-border/20">
                      <Bot className="h-3 w-3 text-primary/60" />
                      <span className="text-[11px] font-medium capitalize">{s.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                  {data.slugs.length > 8 && (
                    <div className="flex items-center px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                      <span className="text-[11px] text-primary font-medium">+{data.slugs.length - 8} {t("checkout.more", { defaultValue: "more" })}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-3 gap-2"
          >
            {[
              { icon: Zap, text: t("checkout.benefit_activation", { defaultValue: "Instant activation" }) },
              { icon: ShieldCheck, text: t("checkout.benefit_cancel", { defaultValue: "Cancel anytime" }) },
              { icon: CheckCircle2, text: t("checkout.benefit_support", { defaultValue: "Priority support" }) },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card/30 border border-border/5">
                <Icon className="h-4 w-4 text-primary/70" />
                <span className="text-[10px] text-center text-muted-foreground leading-tight">{text}</span>
              </div>
            ))}
          </motion.div>

          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20"
            >
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive flex-1">{error}</p>
            </motion.div>
          )}

          {/* PayPal Inline Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {data.planId ? (
              <PayPalInlineButtons
                planId={data.planId}
                onApprove={(subscriptionId) => onApprove(subscriptionId)}
                onError={(err) => setError(err)}
                onCancel={onCancel}
              />
            ) : (
              <div className="flex items-center justify-center py-6">
                <span className="text-sm text-muted-foreground animate-pulse">
                  {t("checkout.preparing", { defaultValue: "Preparing checkout..." })}
                </span>
              </div>
            )}
          </motion.div>

          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {t("checkout.go_back", { defaultValue: "Go back and explore more options" })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutSummaryDialog;
