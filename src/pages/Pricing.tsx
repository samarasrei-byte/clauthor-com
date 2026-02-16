import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Zap, Shield, Clock, Bot, ArrowRight, Sparkles, Coins, TrendingUp, Users, XCircle, CheckCircle2, DollarSign } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    description: "Para começar a automatizar",
    price: "R$ 3.997",
    tokens: "5.000.000",
    popular: false,
    equivalent: "3 funcionários CLT",
    cltCost: "R$ 22.680+",
    savings: "82%",
    features: [
      "1 Agente ativo",
      "5.000.000 tokens/mês inclusos",
      "10.000 ações/mês",
      "Suporte por email",
      "Relatórios básicos",
      "3 integrações",
    ],
  },
  {
    name: "Professional",
    description: "Para empresas em crescimento",
    price: "R$ 9.997",
    tokens: "25.000.000",
    popular: true,
    equivalent: "10 funcionários CLT",
    cltCost: "R$ 75.600+",
    savings: "87%",
    features: [
      "5 Agentes ativos",
      "25.000.000 tokens/mês inclusos",
      "50.000 ações/mês",
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
    tokens: "100.000.000+",
    popular: false,
    equivalent: "Equipe inteira CLT",
    cltCost: "R$ 200.000+",
    savings: "95%+",
    features: [
      "Agentes ilimitados",
      "100M+ tokens/mês",
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
  { amount: "5.000.000", price: "R$ 1.497", discount: null },
  { amount: "15.000.000", price: "R$ 3.997", discount: "11% off" },
  { amount: "50.000.000", price: "R$ 11.997", discount: "20% off" },
  { amount: "100.000.000", price: "R$ 19.997", discount: "33% off" },
];

const cltComparison = [
  { label: "Salário CLT médio", clt: "R$ 4.500/mês", apex: "A partir de R$ 3.997/mês", winner: "apex" },
  { label: "Encargos trabalhistas (FGTS, INSS, 13º, férias)", clt: "+68% sobre salário", apex: "Zero encargos", winner: "apex" },
  { label: "Horas trabalhadas", clt: "8h/dia, 22 dias/mês", apex: "24h/dia, 365 dias/ano", winner: "apex" },
  { label: "Faltas e licenças", clt: "Média 15 dias/ano", apex: "Zero faltas", winner: "apex" },
  { label: "Treinamento", clt: "Semanas a meses", apex: "Configurado em minutos", winner: "apex" },
  { label: "Escala da operação", clt: "Contratar mais pessoas", apex: "Adicionar mais agentes", winner: "apex" },
  { label: "Erros humanos", clt: "Inevitáveis", apex: "Taxa de erro < 0.3%", winner: "apex" },
  { label: "Custo real por 3 funcionários/ano", clt: "R$ 272.160+", apex: "R$ 47.964/ano", winner: "apex" },
];

const Pricing = () => {
  const [showTokens, setShowTokens] = useState(false);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(0 65% 48%) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-primary/[0.03] to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
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
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-4">
            Comece gratuitamente e escale conforme sua operação cresce. 
            Sem taxas ocultas, sem surpresas.
          </p>
          <p className="text-sm text-foreground/70 font-medium">
            💡 Cada agente substitui até <span className="text-primary font-bold">3 funcionários CLT</span> — com economia de até 87%.
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
              className={`glass-card rounded-2xl p-8 relative overflow-hidden ${
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

              {/* Hover glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[80px] opacity-0 hover:opacity-100 transition-opacity" />

              <div className="text-center mb-6">
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
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                  <Coins className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-xs font-medium text-primary/80">{plan.tokens} tokens/mês</span>
                </div>
              </div>

              {/* CLT comparison callout */}
              <div className="mb-6 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-400">Substitui {plan.equivalent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Custo CLT equivalente:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through">{plan.cltCost}</span>
                    <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">-{plan.savings}</span>
                  </div>
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
                  className={`w-full rounded-xl h-12 font-semibold ${
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

        {/* CLT vs ApexBot Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 md:p-12 mb-16 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
          
          <div className="relative z-10">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-4 border-primary/15 text-primary/80 px-4 py-2">
                <DollarSign className="h-4 w-4 mr-2" />
                Comparativo Real
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
                Funcionário CLT <span className="text-muted-foreground">vs</span> <span className="gradient-text">Agente ApexBot</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Veja por que empresas estão trocando equipes inteiras por agentes autônomos — 
                com economia de até <span className="text-primary font-bold">80%</span>.
              </p>
            </div>

            <div className="space-y-0">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border mb-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground"></div>
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                    <XCircle className="h-3 w-3" />
                    CLT Tradicional
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    ApexBot
                  </span>
                </div>
              </div>

              {cltComparison.map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-3 gap-4 py-3 border-b border-border/50 hover:bg-white/[0.01] transition-colors"
                >
                  <div className="text-sm font-medium text-foreground/80">{row.label}</div>
                  <div className="text-center text-sm text-muted-foreground">{row.clt}</div>
                  <div className="text-center text-sm font-semibold text-cyan-400">{row.apex}</div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
                Um funcionário CLT custa em média <span className="text-foreground font-bold">R$ 7.560/mês</span> (salário + encargos de 68%).
                <br />
                 Um agente ApexBot substitui 3 deles por <span className="text-cyan-400 font-bold">R$ 3.997/mês</span>.
              </p>
              <Link to="/auth">
                <Button className="glow rounded-xl px-8 h-12 font-semibold">
                  <Zap className="h-4 w-4 mr-2" />
                  Economizar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Token Upgrade Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 md:p-12"
        >
          <h2 className="font-display text-2xl font-bold text-center mb-8">
            Todos os planos incluem
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bot, title: "Agentes de IA", desc: "Cada um faz o trabalho de 20 pessoas" },
              { icon: Shield, title: "Segurança", desc: "Criptografia end-to-end + LGPD" },
              { icon: Zap, title: "Execução 24/7", desc: "Zero faltas, zero férias, zero erros" },
              { icon: Clock, title: "Uptime 99.9%", desc: "SLA garantido com monitoramento" },
            ].map((item) => (
              <div key={item.title} className="text-center group">
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
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