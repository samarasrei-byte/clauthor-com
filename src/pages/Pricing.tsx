import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Zap, Shield, Clock, Bot, ArrowRight, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Para começar a automatizar",
    price: "R$ 1.499",
    popular: false,
    features: [
      "1 Agente ativo",
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
    popular: true,
    features: [
      "5 Agentes ativos",
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
    popular: false,
    features: [
      "Agentes ilimitados",
      "Ações ilimitadas",
      "Suporte dedicado 24/7",
      "Dashboard personalizado",
      "Integrações ilimitadas",
      "SLA garantido",
      "Treinamento da equipe",
    ],
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary px-4 py-2">
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
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
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
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
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
