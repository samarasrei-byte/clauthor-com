import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { TrendingUp, MessageCircle, Sparkles, BarChart3, ArrowRight, Rocket } from "lucide-react";
import { setSimpleMode } from "@/lib/glossarySimple";
import { cn } from "@/lib/utils";

interface Card {
  emoji: string;
  icon: typeof TrendingUp;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  gradient: string;
}

const CARDS: Card[] = [
  {
    emoji: "💰",
    icon: TrendingUp,
    title: "Vender mais",
    subtitle: "Coloco alguém pra buscar clientes novos pra você",
    cta: "Começar a vender",
    href: "/departamentos/comercial",
    gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
  },
  {
    emoji: "💬",
    icon: MessageCircle,
    title: "Atender meus clientes",
    subtitle: "Um funcionário de IA responde WhatsApp, Instagram e e-mail 24h",
    cta: "Ativar atendimento",
    href: "/departamentos/atendimento",
    gradient: "from-sky-500/20 via-sky-500/10 to-transparent",
  },
  {
    emoji: "✨",
    icon: Sparkles,
    title: "Postar nas redes",
    subtitle: "Crio textos, imagens e vídeos e posto pra você",
    cta: "Criar conteúdo",
    href: "/departamentos/marketing",
    gradient: "from-fuchsia-500/20 via-fuchsia-500/10 to-transparent",
  },
  {
    emoji: "📊",
    icon: BarChart3,
    title: "Ver quanto ganhei",
    subtitle: "Painel simples com quanto vendeu, gastou e o que fazer agora",
    cta: "Ver meus números",
    href: "/dashboard",
    gradient: "from-amber-500/20 via-amber-500/10 to-transparent",
  },
];

/**
 * Modo Simples · home vovô-friendly.
 * 4 cards gigantes, fonte grande, sem jargão, sem sidebar cheia.
 */
export default function SimpleMode() {
  const navigate = useNavigate();

  useEffect(() => {
    setSimpleMode(true);
    return () => { /* mantém preferência ao sair */ };
  }, []);

  return (
    <div className="simple-mode min-h-dvh bg-background">
      <Helmet>
        <title>Modo Simples · Clauthor</title>
        <meta name="description" content="Comece pelo básico: vender, atender, postar ou ver resultados." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Top bar minimalista */}
      <div className="border-b border-border/20 bg-card/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
              <Rocket className="h-5 w-5 text-primary-foreground" strokeWidth={2} />
            </div>
            <div>
              <p className="text-base font-bold text-foreground leading-tight">Clauthor</p>
              <p className="text-xs text-muted-foreground">Modo Simples</p>
            </div>
          </div>
          <button
            onClick={() => { setSimpleMode(false); navigate("/dashboard"); }}
            className="text-sm text-muted-foreground hover:text-foreground min-h-11 px-4 rounded-lg hover:bg-muted/40"
          >
            Modo Avançado →
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10 sm:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-14"
        >
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
            O que você quer fazer hoje?
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Escolha um dos 4 caminhos abaixo. Sem enrolação — em 2 minutos você já tem um funcionário de IA trabalhando pra você.
          </p>
        </motion.div>

        {/* 4 cards gigantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.button
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(c.href)}
                className={cn(
                  "group relative text-left rounded-3xl border-2 border-border/25 bg-card overflow-hidden",
                  "p-7 sm:p-8 min-h-[220px]",
                  "hover:border-primary/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 transition-all",
                )}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", c.gradient)} />
                <div className="relative flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-background/80 backdrop-blur flex items-center justify-center shadow-md">
                      <span className="text-3xl leading-none">{c.emoji}</span>
                    </div>
                    <Icon className="h-6 w-6 text-muted-foreground/40 group-hover:text-primary transition-colors" strokeWidth={1.75} />
                  </div>

                  <h2 className="text-2xl sm:text-[26px] font-bold text-foreground mb-2 tracking-tight">
                    {c.title}
                  </h2>
                  <p className="text-base text-muted-foreground leading-relaxed mb-6 flex-1">
                    {c.subtitle}
                  </p>

                  <div className="inline-flex items-center gap-2 text-base font-semibold text-primary">
                    {c.cta}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Rodapé de ajuda */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-base text-muted-foreground">
            Ficou em dúvida?{" "}
            <button
              onClick={() => navigate("/dashboard?thor=1")}
              className="text-primary font-semibold hover:underline min-h-11"
            >
              Falar com o Thor
            </button>
            {" "}· ele te ajuda em 30 segundos.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
