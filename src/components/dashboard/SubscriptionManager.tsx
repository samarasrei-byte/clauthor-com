import { motion } from "framer-motion";
import { CreditCard, Calendar, Receipt, ArrowUpRight, Wallet, Globe, QrCode, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCredits } from "@/hooks/useCredits";

interface Subscription {
  id: string;
  agent_name: string;
  monthly_price: number;
  status: string;
  current_period_end: string | null;
}

interface SubscriptionManagerProps {
  subscriptions: Subscription[];
}

const SubscriptionManager = ({ subscriptions }: SubscriptionManagerProps) => {
  const { credits, usagePercentage } = useCredits();

  const totalMonthly = subscriptions.reduce((acc, sub) => acc + sub.monthly_price, 0);
  const nextBilling = subscriptions[0]?.current_period_end
    ? new Date(subscriptions[0].current_period_end)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold">Assinatura & Créditos</h2>
            <p className="text-xs text-muted-foreground">Gerencie seu plano</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Credit Usage */}
        <div className="bg-white/[0.02] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Uso de Créditos</span>
            <span className="text-xs text-muted-foreground">
              {credits?.used_credits?.toLocaleString("pt-BR") || 0} / {credits?.total_credits?.toLocaleString("pt-BR") || 0}
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {100 - usagePercentage}% restante este mês
          </p>
        </div>

        {/* Billing Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.02] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Mensal</span>
            </div>
            <p className="font-display text-xl font-bold">
              R$ {(totalMonthly / 100).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Próxima Cobrança</span>
            </div>
            <p className="font-display text-xl font-bold">
              {nextBilling
                ? nextBilling.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                : "—"}
            </p>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div>
          <h3 className="text-sm font-medium mb-3">Assinaturas Ativas</h3>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma assinatura ativa
            </p>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium">{sub.agent_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      R$ {(sub.monthly_price / 100).toLocaleString("pt-BR")}/mês
                    </span>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 text-[10px]">
                      Ativo
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="pt-4 border-t border-white/5">
          <h3 className="text-sm font-medium mb-3">Formas de Pagamento Aceitas</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="justify-start gap-2 h-auto py-2.5 px-3 border-white/10">
              <QrCode className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <div className="text-left">
                <p className="text-[11px] font-medium">PIX</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-2.5 px-3 border-white/10">
              <CreditCard className="h-3.5 w-3.5 text-violet-500 shrink-0" />
              <div className="text-left">
                <p className="text-[11px] font-medium">Stripe</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-2.5 px-3 border-white/10">
              <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <div className="text-left">
                <p className="text-[11px] font-medium">PayPal</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-2.5 px-3 border-white/10 col-span-3">
              <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
              <div className="text-left">
                <p className="text-[11px] font-medium">Mais métodos em breve</p>
              </div>
            </Button>
          </div>
        </div>

        {/* Upgrade Button */}
        <Button className="w-full glow group">
          Upgrade de Plano
          <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Button>
      </div>
    </motion.div>
  );
};

export default SubscriptionManager;
