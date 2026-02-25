import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCredits } from "@/hooks/useCredits";
import {
  Coins, Zap, Crown, Rocket, ArrowRight, CheckCircle,
  QrCode, Bitcoin, Copy, ExternalLink, Sparkles, Package,
  CreditCard, Globe, Smartphone
} from "lucide-react";
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
    price: "R$ 3.997",
    priceNum: 3997,
    replaces: "Substitui 3 CLT",
    icon: Zap,
    color: "text-cyan-400",
    features: [
      "5 milhões de tokens/mês",
      "Até 5 agentes ativos",
      "Suporte prioritário",
      "Analytics avançado",
    ],
  },
  {
    id: "pro",
    name: "Profissional",
    tokens: "25M",
    tokensNum: 25000000,
    price: "R$ 9.997",
    priceNum: 9997,
    replaces: "Substitui 10 CLT",
    popular: true,
    icon: Crown,
    color: "text-primary",
    features: [
      "25 milhões de tokens/mês",
      "Agentes ilimitados",
      "Suporte dedicado 24/7",
      "API de integração",
      "Relatórios customizados",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tokens: "100M+",
    tokensNum: 100000000,
    price: "Sob consulta",
    priceNum: 0,
    replaces: "Substitui 30+ CLT",
    icon: Rocket,
    color: "text-emerald-400",
    features: [
      "100M+ tokens/mês",
      "Infraestrutura dedicada",
      "SLA garantido 99.99%",
      "Onboarding personalizado",
      "Treinamento da equipe",
      "Consultoria de processos",
    ],
  },
];

const tokenPacks: TokenPack[] = [
  { id: "pack-5m", tokens: "5M", tokensNum: 5000000, price: "R$ 1.497", priceNum: 1497 },
  { id: "pack-10m", tokens: "10M", tokensNum: 10000000, price: "R$ 2.497", priceNum: 2497, savings: "17% off" },
  { id: "pack-25m", tokens: "25M", tokensNum: 25000000, price: "R$ 4.997", priceNum: 4997, savings: "33% off" },
  { id: "pack-50m", tokens: "50M", tokensNum: 50000000, price: "R$ 8.997", priceNum: 8997, savings: "40% off" },
  { id: "pack-100m", tokens: "100M", tokensNum: 100000000, price: "R$ 14.997", priceNum: 14997, savings: "50% off" },
];

type PaymentMethod = "pix" | "crypto" | "stripe" | "paypal" | "mercadopago";

interface TokenUpgradeDialogProps {
  trigger?: React.ReactNode;
}

export default function TokenUpgradeDialog({ trigger }: TokenUpgradeDialogProps) {
  const { credits } = useCredits();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);

  const currentPlan = credits?.plan_type || "free";

  const handleSelectPlan = (planId: string) => {
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
    : `Pacote ${tokenPacks.find((p) => p.id === selectedPack)?.tokens}`;

  const handlePayment = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === "pix") {
      toast.success("PIX gerado! Copie o código abaixo.");
    } else if (method === "paypal") {
      // PayPal is handled by its own button
    } else {
      toast.info(`Pagamento via ${method} para ${selectedItemName} — em breve!`);
    }
  };

  const handlePaypalCheckout = useCallback(async () => {
    const priceNum = selectedPlan
      ? plans.find((p) => p.id === selectedPlan)?.priceNum
      : tokenPacks.find((p) => p.id === selectedPack)?.priceNum;

    if (!priceNum || priceNum === 0) {
      toast.error("Preço inválido para este item.");
      return;
    }

    setPaypalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paypal-checkout", {
        body: {
          action: "create_order",
          amount: priceNum,
          currency: "BRL",
          description: selectedItemName || "Clauthor Upgrade",
          metadata: {
            type: selectedPlan ? "plan" : "token_pack",
            item_id: selectedPlan || selectedPack,
          },
        },
      });

      if (error) throw error;
      if (!data?.success || !data?.approve_url) {
        throw new Error(data?.error || "Falha ao criar ordem PayPal");
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
      toast.error(err.message || "Erro ao iniciar pagamento PayPal");
    } finally {
      setPaypalLoading(false);
    }
  }, [selectedPlan, selectedPack, selectedItemName]);

  const copyPixCode = () => {
    navigator.clipboard.writeText("00020126580014BR.GOV.BCB.PIX0136clauthor-tokens@pix.com5204000053039865802BR5925CLAUTHOR TOKENS LTDA6009SAO PAULO62070503***6304ABCD");
    toast.success("Código PIX copiado!");
  };

  return (
    <Dialog onOpenChange={() => { setShowPayment(false); setPaymentMethod(null); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="glow gap-2">
            <Coins className="h-4 w-4" /> Upgrade de Tokens
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {showPayment ? "Finalizar Pagamento" : "Upgrade de Tokens"}
          </DialogTitle>
        </DialogHeader>

        {!showPayment ? (
          <Tabs defaultValue="plans" className="mt-2">
            <TabsList className="grid w-full grid-cols-2 bg-white/5">
              <TabsTrigger value="plans" className="gap-2 data-[state=active]:bg-primary/20">
                <Crown className="h-3.5 w-3.5" /> Planos Mensais
              </TabsTrigger>
              <TabsTrigger value="packs" className="gap-2 data-[state=active]:bg-primary/20">
                <Package className="h-3.5 w-3.5" /> Pacotes Avulsos
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
                          Mais Popular
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
                      <p className="text-xs text-cyan-400 mb-4">{plan.replaces}</p>
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
                        {isCurrentPlan ? "Plano Atual" : plan.priceNum === 0 ? "Falar com Vendas" : "Selecionar"}
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
                Compre tokens extras sem mudar de plano. Os tokens adicionais não expiram.
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
                      Comprar <ArrowRight className="h-3.5 w-3.5" />
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
                    <p className="text-sm text-muted-foreground">Selecionado</p>
                    <p className="font-display font-bold text-lg">{selectedItemName}</p>
                  </div>
                  <p className="font-display text-2xl font-bold gradient-text">{selectedItemPrice}</p>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <p className="text-sm font-medium mb-3">Escolha o método de pagamento:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* PIX */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      paymentMethod === "pix" ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-white/[0.02] hover:border-emerald-500/30"
                    }`}
                    onClick={() => handlePayment("pix")}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <QrCode className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm">PIX</p>
                        <p className="text-[9px] text-muted-foreground">Instantâneo • 0% taxa</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Stripe (Cartão) */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      paymentMethod === "stripe" ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/[0.02] hover:border-violet-500/30"
                    }`}
                    onClick={() => handlePayment("stripe")}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-violet-500" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm">Cartão</p>
                        <p className="text-[9px] text-muted-foreground">Visa, Master, Amex</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* PayPal */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      paymentMethod === "paypal" ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/[0.02] hover:border-blue-500/30"
                    }`}
                    onClick={() => handlePayment("paypal")}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm">PayPal</p>
                        <p className="text-[9px] text-muted-foreground">Internacional</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Mercado Pago */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      paymentMethod === "mercadopago" ? "border-cyan-500 bg-cyan-500/10" : "border-white/10 bg-white/[0.02] hover:border-cyan-500/30"
                    }`}
                    onClick={() => handlePayment("mercadopago")}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-cyan-500" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm">Mercado Pago</p>
                        <p className="text-[9px] text-muted-foreground">PIX, Boleto, Cartão</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Crypto */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      paymentMethod === "crypto" ? "border-amber-500 bg-amber-500/10" : "border-white/10 bg-white/[0.02] hover:border-amber-500/30"
                    }`}
                    onClick={() => handlePayment("crypto")}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Bitcoin className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm">Cripto</p>
                        <p className="text-[9px] text-muted-foreground">BTC, ETH, USDC</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Payment Details */}
              {paymentMethod === "pix" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-emerald-500" />
                    <p className="font-display font-bold">Pagamento via PIX</p>
                  </div>
                  <div className="bg-background/60 rounded-lg p-4 text-center">
                    <div className="w-40 h-40 mx-auto bg-white rounded-lg flex items-center justify-center mb-3">
                      <QrCode className="h-24 w-24 text-background" />
                    </div>
                    <p className="text-xs text-muted-foreground">Escaneie o QR Code ou copie o código</p>
                  </div>
                  <Button variant="outline" className="w-full gap-2 border-emerald-500/20" onClick={copyPixCode}>
                    <Copy className="h-4 w-4" /> Copiar Código PIX
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Seus tokens serão creditados automaticamente após a confirmação (1-5 min).
                  </p>
                </motion.div>
              )}

              {paymentMethod === "stripe" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-violet-500" />
                    <p className="font-display font-bold">Pagamento via Cartão (Stripe)</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Checkout seguro via Stripe. Aceita Visa, Mastercard, Amex, Elo e cartões internacionais.
                  </p>
                  <div className="flex gap-2">
                    {["Visa", "Master", "Amex", "Elo"].map((card) => (
                      <div key={card} className="flex-1 rounded-lg bg-background/60 p-2.5 text-center">
                        <p className="font-bold text-xs">{card}</p>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                    <ExternalLink className="h-4 w-4" /> Pagar com Stripe
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Parcelamento em até 12x. Tokens creditados instantaneamente.
                  </p>
                </motion.div>
              )}

              {paymentMethod === "paypal" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <p className="font-display font-bold">Pagamento via PayPal</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pagamentos internacionais com proteção ao comprador. Multi-moeda com conversão automática.
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
                        Processando...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4" /> Pagar com PayPal — {selectedItemPrice}
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Proteção ao comprador inclusa. Tokens creditados após confirmação.
                  </p>
                </motion.div>
              )}

              {paymentMethod === "mercadopago" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-cyan-500" />
                    <p className="font-display font-bold">Pagamento via Mercado Pago</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    PIX, boleto bancário ou cartão de crédito pelo Mercado Pago. Parcelamento facilitado.
                  </p>
                  <div className="flex gap-2">
                    {["PIX", "Boleto", "Cartão", "Saldo MP"].map((m) => (
                      <div key={m} className="flex-1 rounded-lg bg-background/60 p-2.5 text-center">
                        <p className="font-bold text-xs">{m}</p>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                    <ExternalLink className="h-4 w-4" /> Pagar com Mercado Pago
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Parcelamento em até 12x sem juros. Tokens creditados em até 5 minutos.
                  </p>
                </motion.div>
              )}

              {paymentMethod === "crypto" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Bitcoin className="h-5 w-5 text-amber-500" />
                    <p className="font-display font-bold">Pagamento via Criptomoedas</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pague com Bitcoin, Ethereum ou USDC via Coinbase Commerce.
                  </p>
                  <div className="flex gap-3">
                    {[{ name: "BTC", label: "Bitcoin" }, { name: "ETH", label: "Ethereum" }, { name: "USDC", label: "USD Coin" }].map((c) => (
                      <div key={c.name} className="flex-1 rounded-lg bg-background/60 p-3 text-center">
                        <p className="font-bold text-sm">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.label}</p>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                    <ExternalLink className="h-4 w-4" /> Pagar com Coinbase Commerce
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Tokens creditados em até 30 minutos após confirmação na blockchain.
                  </p>
                </motion.div>
              )}

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
