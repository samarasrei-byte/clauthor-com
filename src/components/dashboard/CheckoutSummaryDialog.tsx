import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Users, ShieldCheck, CreditCard, Loader2, Sparkles, CheckCircle2, ArrowRight, Zap, AlertTriangle, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/pricing";
import { useState } from "react";
import { motion } from "framer-motion";
import FlowProgressBar from "./FlowProgressBar";
import { useTranslation } from "react-i18next";

export interface CheckoutSummaryData {
  label: string;
  slugs: string[];
  isDepartment: boolean;
  departmentId?: string;
  price: number;
  currency: string;
  lang: string;
}

interface Props {
  data: CheckoutSummaryData | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const CheckoutSummaryDialog = ({ data, onConfirm, onCancel }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  if (!data) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err?.message || t("checkout.error_generic", { defaultValue: "Erro ao processar pagamento. Tente novamente." }));
      setLoading(false);
    }
  };

  const formattedPrice = formatPrice(data.price, data.lang);

  return (
    <Dialog open={!!data} onOpenChange={(open) => !open && !loading && onCancel()}>
      <DialogContent className="sm:max-w-lg bg-background border-border/20 p-0 overflow-hidden">
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
              <h2 className="font-display text-xl font-bold">{t("checkout.summary_title", { defaultValue: "Resumo do seu time" })}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("checkout.summary_subtitle", { defaultValue: "Confira antes de prosseguir" })}</p>
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
                    <Users className="h-3 w-3" /> {t("checkout.department", { defaultValue: "Departamento" })}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-accent/50 gap-1 text-[10px]">
                    <Bot className="h-3 w-3" /> {t("checkout.individual_agent", { defaultValue: "Agente Individual" })}
                  </Badge>
                )}
                <p className="font-display font-bold text-lg leading-tight">{data.label}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-2xl font-bold text-primary">{formattedPrice}</p>
                <p className="text-[10px] text-muted-foreground">/{t("checkout.month", { defaultValue: "mês" })}</p>
              </div>
            </div>

            {data.slugs.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {t("checkout.agents_included", { count: data.slugs.length, defaultValue: `${data.slugs.length} agente${data.slugs.length > 1 ? "s" : ""} incluído${data.slugs.length > 1 ? "s" : ""}` })}
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
                      <span className="text-[11px] text-primary font-medium">+{data.slugs.length - 8} {t("checkout.more", { defaultValue: "mais" })}</span>
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
              { icon: Zap, text: t("checkout.benefit_activation", { defaultValue: "Ativação imediata" }) },
              { icon: ShieldCheck, text: t("checkout.benefit_cancel", { defaultValue: "Cancele quando quiser" }) },
              { icon: CheckCircle2, text: t("checkout.benefit_support", { defaultValue: "Suporte prioritário" }) },
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

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-3 pt-1"
          >
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full h-13 glow rounded-xl gap-2 text-sm font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("checkout.redirecting", { defaultValue: "Redirecionando ao PayPal..." })}
                </>
              ) : error ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {t("checkout.retry", { defaultValue: "Tentar novamente" })}
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  {t("checkout.confirm_pay", { defaultValue: "Confirmar e pagar" })} {formattedPrice}/{t("checkout.month", { defaultValue: "mês" })}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              {t("checkout.go_back", { defaultValue: "Voltar e explorar mais opções" })}
            </Button>
          </motion.div>

          {/* Trust footer */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/50 pt-1">
            <ShieldCheck className="h-3 w-3" />
            <span>{t("checkout.trust_footer", { defaultValue: "Pagamento seguro via PayPal • Dados protegidos" })}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutSummaryDialog;
