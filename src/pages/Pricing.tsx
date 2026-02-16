import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Zap, Shield, Clock, Bot, ArrowRight, Sparkles, Coins, TrendingUp } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    description: "Para começar a automatizar",
    price: "R$ 1.499",
    tokens: "50.000",
    popular: false,
    features: [
      "1 Agente ativo",
      "50.000 tokens/mês inclusos",
      "5.000 ações/mês",
      "Suporte por email",
      "Relatórios básicos",
      "1 integração",
    ],
  },
  {
    name: "Professional",
    description: "Para empresas em crescimento",
    price: "R$ 2.999",
    tokens: "250.000",
    popular: true,
    features: [
      "5 Agentes ativos",
      "250.000 tokens/mês inclusos",
      "25.000 ações/mês",
      "Suporte prioritário",
      "Analytics avançado",
      "10 integrações",
      "API access",
    ],
  },
  {
    name: "Enterprise",
    description: "Para operações de grande escala",
    price: "Sob consulta",
    tokens: "Ilimitados",
    popular: false,
    features: [
      "Agentes ilimitados",
      "Tokens ilimitados",
      "Ações ilimitadas",
      "Suporte dedicado 24/7",
      "Dashboard personalizado",
      "Integrações ilimitadas",
      "SLA garantido",
      "Treinamento da equipe",
    ],
  },
];

const tokenPacks = [
  { amount: "50.000", price: "R$ 99", discount: null },
  { amount: "150.000", price: "R$ 249", discount: "17% off" },
  { amount: "500.000", price: "R$ 699", discount: "30% off" },
  { amount: "1.000.000", price: "R$ 1.199", discount: "40% off" },
];

const Pricing = () => {
  const [showTokens, setShowTokens] = useState(false);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            Planos e Preços
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Escolha o plano <span className="gradient-text">ideal para você</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comece gratuitamente e escale conforme sua operação cresce. 
            Sem taxas ocultas, sem surpresas.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card rounded-2xl p-8 relative ${
                plan.popular ? "gradient-border" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4">
                    Mais Popular
                  </Badge>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="font-display font-bold text-2xl mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl font-bold gradient-text">
                    {plan.price}
                  </span>
                  {plan.price !== "Sob consulta" && (
                    <span className="text-muted-foreground">/mês</span>
                  )}
                </div>
                
                {/* Token badge */}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                  <Coins className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-xs font-medium text-primary/80">{plan.tokens} tokens/mês</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary/70 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/auth">
                <Button
                  className={`w-full rounded-xl ${
                    plan.popular ? "glow" : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.price === "Sob consulta" ? "Falar com vendas" : "Começar agora"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Token Upgrade Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-8 md:p-12 mb-16"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary/70" />
                Upgrade de Tokens
              </h2>
              <p className="text-muted-foreground text-sm">
                Precisa de mais tokens? Compre pacotes adicionais com desconto progressivo.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowTokens(!showTokens)}
              className="rounded-xl border-border hover:border-primary/20"
            >
              <Coins className="h-4 w-4 mr-2" />
              {showTokens ? "Ocultar pacotes" : "Ver pacotes"}
            </Button>
          </div>

          {showTokens && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {tokenPacks.map((pack, i) => (
                <motion.div
                  key={pack.amount}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-6 text-center glass-hover relative"
                >
                  {pack.discount && (
                    <div className="absolute -top-2 right-3">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {pack.discount}
                      </span>
                    </div>
                  )}
                  <Coins className="h-6 w-6 text-primary/60 mx-auto mb-3" />
                  <p className="font-display font-bold text-lg mb-1">{pack.amount}</p>
                  <p className="text-xs text-muted-foreground mb-3">tokens</p>
                  <p className="font-display font-bold text-xl gradient-text">{pack.price}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-8 md:p-12"
        >
          <h2 className="font-display text-2xl font-bold text-center mb-8">
            Todos os planos incluem
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bot, title: "Agentes de IA", desc: "Configuração e treinamento" },
              { icon: Shield, title: "Segurança", desc: "Criptografia end-to-end" },
              { icon: Zap, title: "Execução 24/7", desc: "Sem interrupções" },
              { icon: Clock, title: "Uptime 99.9%", desc: "SLA garantido" },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-primary/70" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;
