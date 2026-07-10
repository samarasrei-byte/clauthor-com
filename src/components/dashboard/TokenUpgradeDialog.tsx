import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";
import { Coins, Zap, Crown, Rocket, ArrowRight, CheckCircle, ExternalLink, Package, Globe, FlaskConical } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  name: string;
  tokens: string;
  tokensNum: number;
  price: string;
  priceNum: number;
  replaces: string;
  features: string[];
  popular?: boolean;
  icon: typeof Coins;
  color: string;
}

interface TokenPack {
  id: string;
  tokens: string;
  tokensNum: number;
  price: string;
  priceNum: number;
  savings?: string;
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tokens: "5M",
    tokensNum: 5000000,
    price: "$799",
    priceNum: 799,
    replaces: "Replaces 3 employees",
    icon: Zap,
    color: "text-cyan-400",
    features: [
      "5 million tokens/month",
      "Up to 5 active agents",
      "Priority support",
      "Advanced analytics",
    ],
  },
  {
    id: "pro",
    name: "Professional",
    tokens: "25M",
    tokensNum: 25000000,
    price: "$1,999",
    priceNum: 1999,
    replaces: "Replaces 10 employees",
    popular: true,
    icon: Crown,
    color: "text-primary",
    features: [
      "25 million tokens/month",
      "Unlimited agents",
      "Dedicated 24/7 support",
      "Integration API",
      "Custom reports",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tokens: "100M+",
    tokensNum: 100000000,
    price: "Custom",
    priceNum: 0,
    replaces: "Replaces 30+ employees",
    icon: Rocket,
    color: "text-emerald-400",
    features: [
      "100M+ tokens/month",
      "Dedicated infrastructure",
      "99.99% SLA guaranteed",
      "Personalized onboarding",
      "Team training",
      "Process consulting",
    ],
  },
];

const tokenPacks: TokenPack[] = [
  { id: "pack-5m", tokens: "5M", tokensNum: 5000000, price: "$299", priceNum: 299 },
  { id: "pack-10m", tokens: "10M", tokensNum: 10000000, price: "$499", priceNum: 499, savings: "17% off" },
  { id: "pack-25m", tokens: "25M", tokensNum: 25000000, price: "$999", priceNum: 999, savings: "33% off" },
  { id: "pack-50m", tokens: "50M", tokensNum: 50000000, price: "$1,799", priceNum: 1799, savings: "40% off" },
  { id: "pack-100m", tokens: "100M", tokensNum: 100000000, price: "$2,999", priceNum: 2999, savings: "50% off" },
];

type PaymentMethod = "paypal";

interface TokenUpgradeDialogProps {
  trigger?: React.ReactNode;
}

export default function TokenUpgradeDialog({ trigger }: TokenUpgradeDialogProps) {
  const { t, i18n } = useTranslation();
  const { credits } = useCredits();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);

  // Test emails that bypass PayPal and get tokens directly
  const TEST_EMAILS = ["admin@clauthor.com", "teste3@clauthor.com"];
  const isTestUser = user?.email ? TEST_EMAILS.includes(user.email) : false;

  const currentPlan = credits?.plan_type || "free";

  const handleSelectPlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan && plan.priceNum === 0) {
      toast.info(t("token_upgrade.contact_enterprise", { defaultValue: "Entre em contato com vendas para o plano Enterprise." }));
      return;
    }
    setSelectedPlan(planId);
    setSelectedPack(null);
    setShowPayment(true);
  };

  const handleSelectPack = (packId: string) => {
    setSelectedPack(packId);
    setSelectedPlan(null);
    setShowPayment(true);
  };

  const selectedItemPrice = selectedPlan
    ? plans.find((p) => p.id === selectedPlan)?.price
    : tokenPacks.find((p) => p.id === selectedPack)?.price;

  const selectedItemName = selectedPlan
    ? plans.find((p) => p.id === selectedPlan)?.name
    : `Pack ${tokenPacks.find((p) => p.id === selectedPack)?.tokens}`;

  const handlePayment = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const handlePaypalCheckout = useCallback(async () => {
    const priceNum = selectedPlan
      ? plans.find((p) => p.id === selectedPlan)?.priceNum
      : tokenPacks.find((p) => p.id === selectedPack)?.priceNum;

    if (!priceNum || priceNum === 0) {
      toast.error(t("token_upgrade.invalid_price", { defaultValue: "Preço inválido para este item." }));
      return;
    }

    setPaypalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paypal-checkout", {
        body: {
          action: "create_order",
          amount: priceNum,
          currency: "USD",
          description: selectedItemName || "Clauthor Upgrade",
          metadata: {
            type: selectedPlan ? "plan" : "token_pack",
            item_id: selectedPlan || selectedPack,
          },
        },
      });

      if (error) throw error;
      if (!data?.success || !data?.approve_url) {
        throw new Error(data?.error || "Failed to create PayPal order");
      }

      sessionStorage.setItem("paypal_order", JSON.stringify({
        order_id: data.order_id,
        item_id: selectedPlan || selectedPack,
        type: selectedPlan ? "plan" : "token_pack",
        amount: priceNum,
      }));

      window.location.href = data.approve_url;
    } catch (err: any) {
      console.error("PayPal checkout error:", err);
      toast.error(err.message || t("token_upgrade.paypal_error", { defaultValue: "Erro ao iniciar pagamento PayPal" }));
    } finally {
      setPaypalLoading(false);
    }
  }, [selectedPlan, selectedPack, selectedItemName]);

  const handleTestBypass = useCallback(async () => {
    const itemId = selectedPlan || selectedPack;
    const type = selectedPlan ? "plan" : "token_pack";
    if (!itemId) return;

    const tokensMap: Record<string, number> = {
      starter: 5000000, pro: 25000000,
      "pack-5m": 5000000, "pack-10m": 10000000, "pack-25m": 25000000,
      "pack-50m": 50000000, "pack-100m": 100000000,
    };
    const tokensToAdd = tokensMap[itemId] || 0;
    if (tokensToAdd === 0) return;

    setPaypalLoading(true);
    try {
      const { data: currentCredits } = await supabase
        .from("user_credits")
        .select("total_credits")
        .eq("user_id", user!.id)
        .single();

      if (currentCredits) {
        const updatePayload: { total_credits: number; plan_type?: string } = {
          total_credits: currentCredits.total_credits + tokensToAdd,
        };
        if (type === "plan") {
          updatePayload.plan_type = itemId;
        }
        await supabase
          .from("user_credits")
          .update(updatePayload)
          .eq("user_id", user!.id);
      }

      // Log transaction
      await supabase.from("payment_history").insert({
        user_id: user!.id,
        type: "test_bypass",
        item_id: itemId,
        item_name: selectedItemName || itemId,
        tokens_amount: tokensToAdd,
        amount_cents: 0,
        currency: "USD",
        status: "completed",
      });

      toast.success(t("token_upgrade.test_credited", { amount: (tokensToAdd / 1000000).toFixed(0), defaultValue: "Modo teste: tokens creditados!" }), { duration: 5000 });
    } catch (err: any) {
      toast.error(err.message || t("token_upgrade.test_error", { defaultValue: "Erro no bypass de teste" }));
    } finally {
      setPaypalLoading(false);
    }
  }, [selectedPlan, selectedPack, user, selectedItemName]);


  return (
    <Dialog onOpenChange={() => { setShowPayment(false); setPaymentMethod(null); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="glow gap-2">
            <Coins className="h-4 w-4" /> {t("token_upgrade.title", { defaultValue: "Upgrade de Tokens" })}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {showPayment ? t("token_upgrade.finalize_payment", { defaultValue: "Finalizar Pagamento" }) : t("token_upgrade.title", { defaultValue: "Upgrade de Tokens" })}
          </DialogTitle>
        </DialogHeader>

        {!showPayment ? (
          <Tabs defaultValue="plans" className="mt-2">
            <TabsList className="grid w-full grid-cols-2 bg-white/5">
              <TabsTrigger value="plans" className="gap-2 data-[state=active]:bg-primary/20">
                <Crown className="h-3.5 w-3.5" /> {t("token_upgrade.monthly_plans", { defaultValue: "Planos Mensais" })}
              </TabsTrigger>
              <TabsTrigger value="packs" className="gap-2 data-[state=active]:bg-primary/20">
                <Package className="h-3.5 w-3.5" /> {t("token_upgrade.token_packs", { defaultValue: "Pacotes Avulsos" })}
              </TabsTrigger>
            </TabsList>

            {/* PLANS */}
            <TabsContent value="plans" className="mt-4">
              <div className="grid md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const isCurrentPlan = currentPlan === plan.id;
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative rounded-2xl border p-5 transition-all cursor-pointer hover:border-primary/40 ${
                        plan.popular ? "border-primary/30 bg-primary/5" : "border-white/10 bg-white/[0.02]"
                      } ${isCurrentPlan ? "opacity-60 pointer-events-none" : ""}`}
                      onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px]">
                          {t("token_upgrade.most_popular", { defaultValue: "Mais Popular" })}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <plan.icon className={`h-5 w-5 ${plan.color}`} />
                        <h3 className="font-display font-bold">{plan.name}</h3>
                      </div>
                      <div className="mb-3">
                        <span className="font-display text-2xl font-bold">{plan.price}</span>
                        {plan.priceNum > 0 && <span className="text-xs text-muted-foreground">/mês</span>}
                      </div>
                      <p className="text-xs text-cyan-400 mb-4">{plan.replaces.replace("Substitui", t("token_upgrade.replaces", { defaultValue: "Substitui" }))}</p>
                      <div className="space-y-2">
                        {plan.features.map((f) => (
                          <div key={f} className="flex items-start gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-xs text-muted-foreground">{f}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        className={`w-full mt-4 gap-1.5 ${plan.popular ? "glow" : ""}`}
                        variant={plan.popular ? "default" : "outline"}
                        size="sm"
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? t("token_upgrade.current_plan", { defaultValue: "Plano Atual" }) : plan.priceNum === 0 ? t("token_upgrade.talk_sales", { defaultValue: "Falar com Vendas" }) : t("token_upgrade.select", { defaultValue: "Selecionar" })}
                        {!isCurrentPlan && <ArrowRight className="h-3.5 w-3.5" />}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            {/* TOKEN PACKS */}
            <TabsContent value="packs" className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                {t("token_upgrade.buy_extra", { defaultValue: "Compre tokens extras sem mudar de plano. Os tokens adicionais não expiram." })}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tokenPacks.map((pack) => (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-xl border border-white/10 bg-white/[0.02] p-4 cursor-pointer hover:border-primary/40 transition-all"
                    onClick={() => handleSelectPack(pack.id)}
                  >
                    {pack.savings && (
                      <Badge className="absolute -top-2 right-3 bg-emerald-500/20 text-emerald-400 text-[10px] border-0">
                        {pack.savings}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-display font-bold text-lg">{pack.tokens}</span>
                      <span className="text-xs text-muted-foreground">tokens</span>
                    </div>
                    <p className="font-display text-xl font-bold mb-3">{pack.price}</p>
                    <Button variant="outline" size="sm" className="w-full gap-1.5 border-white/10">
                      {t("token_upgrade.buy", { defaultValue: "Comprar" })} <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* PAYMENT SCREEN */
          <AnimatePresence mode="wait">
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 mt-2"
            >
              {/* Summary */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("token_upgrade.selected", { defaultValue: "Selecionado" })}</p>
                    <p className="font-display font-bold text-lg">{selectedItemName}</p>
                  </div>
                  <p className="font-display text-2xl font-bold gradient-text">{selectedItemPrice}</p>
                </div>
              </div>

              {/* Payment Method - PayPal only */}
              <div>
                <p className="text-sm font-medium mb-3">{t("token_upgrade.payment_method", { defaultValue: "Método de pagamento:" })}</p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="rounded-xl border border-blue-500 bg-blue-500/10 p-4 cursor-pointer transition-all"
                  onClick={() => handlePayment("paypal")}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-sm">PayPal</p>
                      <p className="text-[9px] text-muted-foreground">{t("token_upgrade.international", { defaultValue: "Internacional • Multi-moeda" })}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* PayPal Details - always shown */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <p className="font-display font-bold">{t("token_upgrade.pay_with_paypal", { defaultValue: "Pagamento via PayPal" })}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("token_upgrade.paypal_desc", { defaultValue: "Pagamentos internacionais com proteção ao comprador. Multi-moeda com conversão automática." })}
                </p>
                <div className="flex gap-2">
                  {["USD", "EUR", "GBP", "BRL"].map((cur) => (
                    <div key={cur} className="flex-1 rounded-lg bg-background/60 p-2.5 text-center">
                      <p className="font-bold text-xs">{cur}</p>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handlePaypalCheckout}
                  disabled={paypalLoading}
                >
                  {paypalLoading ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                      {t("token_upgrade.processing", { defaultValue: "Processando..." })}
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" /> {t("token_upgrade.pay_with_paypal", { defaultValue: "Pagar com PayPal" })} - {selectedItemPrice}
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  {t("token_upgrade.buyer_protection", { defaultValue: "Proteção ao comprador inclusa. Tokens creditados após confirmação." })}
                </p>
                {isTestUser && (
                  <Button 
                    variant="outline"
                    className="w-full gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 mt-2"
                    onClick={handleTestBypass}
                    disabled={paypalLoading}
                  >
                    <FlaskConical className="h-4 w-4" /> {t("token_upgrade.test_bypass", { defaultValue: "Modo Teste - Creditar sem pagar" })}
                  </Button>
                )}
              </motion.div>

              <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setShowPayment(false); setPaymentMethod(null); }}>
                ← Voltar para planos
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </DialogContent>
    </Dialog>
  );
}
