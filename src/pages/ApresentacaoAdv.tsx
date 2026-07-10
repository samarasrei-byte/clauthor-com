import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Brain, ShieldCheck, GitBranch, Clock4, PenLine, Target, Wallet, MessageCircle, ArrowRight, CheckCircle2, Send, Loader2, X, Workflow, Lock, Gauge, ScrollText, Briefcase, HeartHandshake, Search, RefreshCcw, FileSignature, ShieldAlert, BadgeCheck, Zap, TrendingUp, Coins, Timer, AlertTriangle, Flame, Users, XCircle, Trophy, Calculator } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ClauthorLogo from "@/components/ClauthorLogo";
import ThemeToggle from "@/components/ThemeToggle";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

// ------------------------------------------------------------
// 15 agentes — vitrine completa com ícones lucide (sem emoji)
// ------------------------------------------------------------
type AgentCard = {
  icon: any;
  name: string;
  layer: "MCP" | "Comercial" | "Operacional";
  tagline: string;
  bullets: string[];
  highlight?: boolean;
};

const AGENTS: AgentCard[] = [
  // MCP
  {
    icon: Brain,
    name: "Orquestrador MCP",
    layer: "MCP",
    tagline: "Master Control Program: interpreta, valida e roteia",
    highlight: true,
    bullets: [
      "Classifica intenção do usuário em < 800ms",
      "Aciona somente os subagentes necessários",
      "Consolida resposta única, auditável e rastreável",
      "Falha-fechado: bloqueia em risco crítico",
    ],
  },
  {
    icon: ShieldCheck,
    name: "Segurança & LGPD",
    layer: "MCP",
    tagline: "Validação obrigatória antes de qualquer ação",
    bullets: [
      "Classifica dados sensíveis (saúde, financeiros, raça)",
      "Verifica sigilo profissional OAB e Provimento 188",
      "Bloqueia execução em risco CRÍTICO",
      "Trilha de auditoria por execução",
    ],
  },
  {
    icon: GitBranch,
    name: "Processual",
    layer: "MCP",
    tagline: "Classificação documental e fase do processo",
    bullets: [
      "Identifica rito, fase e próximo ato esperado",
      "Monta linha do tempo automaticamente",
      "Tipifica documentos (petição, despacho, decisão)",
      "Sugere próximos passos por instância",
    ],
  },
  {
    icon: Clock4,
    name: "Prazos",
    layer: "MCP",
    tagline: "CPC art. 219 + feriados forenses + suspensões",
    bullets: [
      "Calcula prazos em dias úteis e corridos",
      "Considera recessos do tribunal específico",
      "Classifica risco (crítico, alto, médio)",
      "Notifica até 5 dias antes do vencimento",
    ],
  },
  {
    icon: PenLine,
    name: "Redator Jurídico",
    layer: "MCP",
    tagline: "Peças, contratos e pareceres com identidade do escritório",
    bullets: [
      "Minutas a partir de templates aprovados",
      "Padroniza linguagem técnica e tom",
      "Citação automática de jurisprudência (validação humana)",
      "Versão final sempre com revisão obrigatória",
    ],
  },
  {
    icon: Target,
    name: "Estratégico",
    layer: "MCP",
    tagline: "Tese aplicável + probabilidade de êxito",
    bullets: [
      "Mapeia teses cabíveis e contra-teses",
      "Estima êxito com base em jurisprudência recente",
      "Identifica riscos da estratégia adotada",
      "Sugere alternativas táticas",
    ],
  },
  {
    icon: Wallet,
    name: "Financeiro Jurídico",
    layer: "MCP",
    tagline: "Honorários, custas e relatórios de cliente",
    bullets: [
      "Acompanha contratado vs. recebido por caso",
      "Gera relatórios mensais para cliente e sócios",
      "Controle de custas e despesas reembolsáveis",
      "Comunicação clara de status de pagamento",
    ],
  },
  // Comerciais
  {
    icon: MessageCircle,
    name: "Captação Jurídica",
    layer: "Comercial",
    tagline: "WhatsApp + site + landing pages 24/7",
    bullets: [
      "Atende e qualifica em até 30 segundos",
      "Identifica área do direito e urgência",
      "Agenda direto na agenda do advogado",
      "Compatível com OAB Provimento 205/2021",
    ],
  },
  {
    icon: Search,
    name: "Diagnóstico Jurídico",
    layer: "Comercial",
    tagline: "Pré-atendimento estruturado",
    bullets: [
      "Triagem inicial guiada por roteiro",
      "Coleta fatos, prazos e documentos",
      "Educa cliente sem orientação definitiva",
      "Resumo pronto para o advogado validar",
    ],
  },
  {
    icon: HeartHandshake,
    name: "Fechamento Jurídico",
    layer: "Comercial",
    tagline: "Conduz à contratação com proposta personalizada",
    bullets: [
      "Gera honorários (fixo, êxito, híbrido)",
      "Trabalha objeções com argumentação técnica",
      "Encaminha contrato e link de pagamento",
      "Aumento médio de 40% em conversão",
    ],
  },
  {
    icon: RefreshCcw,
    name: "Recuperação de Leads",
    layer: "Comercial",
    tagline: "Reativa oportunidades frias (máx. 3 toques)",
    bullets: [
      "Cadência humanizada e respeitosa",
      "Reagenda no-shows automaticamente",
      "Reativa leads dormentes com novos gatilhos",
      "Recupera em média 18% do funil perdido",
    ],
  },
  {
    icon: ShieldAlert,
    name: "Risco Contratual",
    layer: "Operacional",
    tagline: "Lê contratos em segundos",
    bullets: [
      "Identifica cláusulas críticas e ambíguas",
      "Classifica risco (baixo, médio, alto)",
      "Relatório executivo para revisão humana",
      "Suporte a contratos em PT, EN e ES",
    ],
  },
  {
    icon: ScrollText,
    name: "Produção Jurídica",
    layer: "Operacional",
    tagline: "Apoio operacional ao escritório",
    bullets: [
      "Minutas e rascunhos de peças",
      "Pesquisa de jurisprudência (validação obrigatória)",
      "Organização e indexação de documentos",
      "Integração com Drive, Notion, Astrea",
    ],
  },
  {
    icon: Briefcase,
    name: "Assistente Operacional",
    layer: "Operacional",
    tagline: "Mão direita do advogado responsável",
    bullets: [
      "Análise de contratos + relatório de risco",
      "Propostas comerciais (fixo/êxito/híbrido)",
      "Apoio ao fechamento e pré-KYC",
      "Sempre com selo: revisão humana obrigatória",
    ],
  },
  {
    icon: BadgeCheck,
    name: "Compliance Empresarial & Anti-PLD",
    layer: "Operacional",
    tagline: "KYC reforçado + monitoramento PEP/COAF",
    bullets: [
      "KYC PF/PJ + beneficiário final (OAB 188)",
      "Listas PEP, OFAC, ONU e COAF",
      "Relatórios RIPD (LGPD art. 38) e PLD",
      "Diligência reforçada com decisão humana",
    ],
  },
];

// ------------------------------------------------------------
// Planos resumidos para a apresentação (link para /advocacia)
// ------------------------------------------------------------
type Plan = {
  name: string;
  monthly: string;
  setup: string;
  desc: string;
  ideal: string;
  agents: string[];
  features: string[];
  benefits: string[];
  roi: string;
  highlight?: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    name: "Start",
    monthly: "R$ 497",
    setup: "R$ 1.497",
    desc: "Captação previsível para o advogado autônomo que quer parar de perder lead.",
    ideal: "Advogado solo ou recém-aberto",
    agents: [
      "Captação Jurídica (WhatsApp 24/7)",
      "Diagnóstico Jurídico (triagem guiada)",
    ],
    features: [
      "WhatsApp Business oficial integrado",
      "Até 200 atendimentos qualificados/mês",
      "Agenda sincronizada (Google Calendar)",
      "Roteiro de triagem por área do direito",
      "Resumo do caso pronto para o advogado",
      "Conformidade OAB Provimento 205/2021",
    ],
    benefits: [
      "Resposta em até 30 segundos a qualquer hora",
      "Aumento médio de 40% na conversão",
      "Você só fala com lead já qualificado",
    ],
    roi: "1 contrato recuperado de R$ 3.000 paga 6 meses do plano",
  },
  {
    name: "Growth",
    monthly: "R$ 1.497",
    setup: "R$ 3.497",
    highlight: true,
    badge: "Mais escolhido",
    desc: "Squad jurídica completa para escritórios em crescimento que querem previsibilidade.",
    ideal: "Escritórios com 2 a 8 advogados",
    agents: [
      "Captação + Diagnóstico + Fechamento",
      "Recuperação de Leads",
      "Redator Jurídico",
      "Financeiro Jurídico",
    ],
    features: [
      "6 agentes operando em conjunto",
      "WhatsApp + CRM + Clicksign integrados",
      "Até 800 atendimentos/mês",
      "Propostas com honorários (fixo, êxito, híbrido)",
      "Reativação automática de leads frios",
      "Minutas a partir de templates do escritório",
      "Relatórios mensais para sócios e clientes",
    ],
    benefits: [
      "Funil de captação ao fechamento totalmente automatizado",
      "Recupera em média 18% do funil que esfriaria",
      "Padronização total de propostas e peças",
    ],
    roi: "Substitui 2 a 3 contratações CLT (economia mensal acima de R$ 6.000)",
  },
  {
    name: "Compliance",
    monthly: "R$ 2.497",
    setup: "R$ 5.997",
    desc: "Growth somado ao núcleo operacional, LGPD e Anti-PLD para escritórios regulados.",
    ideal: "Escritórios que atendem PJ, alto patrimônio ou setor regulado",
    agents: [
      "Toda a squad Growth",
      "Risco Contratual",
      "Compliance Empresarial & Anti-PLD",
    ],
    features: [
      "8 agentes orquestrados",
      "KYC reforçado PF e PJ + beneficiário final",
      "Listas PEP, OFAC, ONU e COAF integradas",
      "Análise contratual (PT, EN, ES) com classificação de risco",
      "Relatórios RIPD (LGPD art. 38) prontos",
      "Relatórios PLD em conformidade com a Lei 9.613/98",
      "Trilha de auditoria por execução",
    ],
    benefits: [
      "Bloqueia operações de risco antes de assinar",
      "Reduz exposição a multas de até R$ 20mi (PLD)",
      "Documentação pronta para fiscalização da OAB",
    ],
    roi: "Evita uma única falha de KYC e o plano se paga por mais de 8 anos",
  },
  {
    name: "MCP Enterprise",
    monthly: "R$ 4.997",
    setup: "R$ 9.997",
    badge: "Squad completa",
    desc: "Sistema operacional jurídico completo, com os 15 agentes orquestrados pelo MCP.",
    ideal: "Bancas estruturadas, departamentos jurídicos, escritórios de médio e grande porte",
    agents: [
      "Orquestrador MCP + Segurança & LGPD",
      "Processual + Prazos + Redator",
      "Estratégico + Financeiro Jurídico",
      "Captação + Diagnóstico + Fechamento + Recuperação",
      "Risco Contratual + Produção + Operacional + Compliance",
    ],
    features: [
      "Todos os 15 agentes ativos e orquestrados",
      "Arquitetura MCP com Segurança obrigatória em toda execução",
      "Atendimentos ilimitados",
      "SLA dedicado e gerente de sucesso",
      "Cálculo de prazos (CPC art. 219) com bloqueio automático",
      "Estratégia + tese + jurisprudência por caso",
      "Aprovação humana obrigatória em risco crítico",
      "Auditoria completa: quem pediu, qual agente rodou, qual humano validou",
    ],
    benefits: [
      "Equivale a 4 a 6 contratações CLT (economia acima de R$ 30k/mês)",
      "Zero prazos perdidos, zero leads esquecidos",
      "Você passa de operador a gestor estratégico",
    ],
    roi: "ROI mínimo médio de 22 vezes sobre o investimento mensal",
  },
];

const layerColor = (l: AgentCard["layer"]) =>
  l === "MCP"
    ? "from-primary/20 to-primary/5 border-primary/30 text-primary"
    : l === "Comercial"
    ? "from-emerald-500/15 to-emerald-500/5 border-emerald-500/25 text-emerald-500"
    : "from-amber-500/15 to-amber-500/5 border-amber-500/25 text-amber-500";

// ============================================================
// Floating chat com a "Advogada IA"
// ============================================================
function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Sou a **Advogada IA da Clauthor**. Posso explicar como a arquitetura MCP funciona, justificar o investimento e indicar o melhor plano para o seu escritório. Por onde quer começar?",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apresentacao-adv-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error("Limite atingido. Tente em alguns segundos.");
        if (resp.status === 402) throw new Error("Créditos da IA esgotados.");
        throw new Error("Falha ao iniciar a conversa.");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantSoFar = "";
      let started = false;

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          if (!started) {
            started = true;
            return [...prev, { role: "assistant", content: assistantSoFar }];
          }
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
          );
        });
      };

      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsert(delta);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages((p) => [
        ...p,
        { role: "assistant", content: `_${e.message || "Erro desconhecido."}_` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Por que vale R$ 4.997/mês?",
    "Como o agente de Segurança funciona?",
    "Quero o plano para escritório com 5 advogados",
  ];

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[60] h-14 px-5 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 flex items-center gap-2 hover:scale-105 transition-transform"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        aria-label="Abrir Advogada IA"
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">Falar com a Advogada IA</span>
        <span className="absolute -top-1 -right-1 h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
        </span>
      </motion.button>

      {/* Centered modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="relative w-[min(96vw,640px)] h-[min(85vh,720px)] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 via-card to-card flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">Advogada IA · Clauthor</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online · responde em segundos
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-strong:text-foreground">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "120ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "240ms" }} />
                    </div>
                  </div>
                )}

                {messages.length === 1 && !loading && (
                  <div className="pt-2 grid sm:grid-cols-2 gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setInput(s);
                          setTimeout(() => send(), 50);
                        }}
                        className="text-left text-xs px-3 py-2 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Pergunte sobre a squad, planos, segurança, ROI..."
                    className="h-11 text-sm"
                    disabled={loading}
                  />
                  <Button
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    onClick={send}
                    disabled={loading || !input.trim()}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  IA consultiva. Não substitui aconselhamento jurídico.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// Página principal
// ============================================================
export default function ApresentacaoAdv() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Apresentação · Squad Jurídica MCP — Clauthor";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Apresentação executiva da Squad Jurídica MCP da Clauthor: 15 agentes orquestrados, segurança LGPD/OAB obrigatória e ROI mensurável para escritórios de advocacia.",
      );
    }
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ClauthorLogo size="md" />
            <span className="hidden sm:inline-block text-xs text-muted-foreground border-l border-border/60 pl-2 ml-1">
              Apresentação Executiva
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" onClick={() => navigate("/advocacia#planos")}>
              Ver planos
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/5">
            <Sparkles className="w-3 h-3 mr-1.5" />
            Squad Jurídica MCP · 15 agentes orquestrados
          </Badge>
          <h1 className="text-4xl md:text-6xl font-display font-semibold tracking-tight max-w-4xl mx-auto leading-[1.05]">
            O sistema operacional jurídico que <span className="text-primary">opera enquanto você dorme</span>.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Arquitetura MCP (Master Control Program) com 1 Orquestrador + 6 especialistas + 8 agentes comerciais. 
            Segurança obrigatória, validação humana garantida, ROI mensurável.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="h-12 px-7 glow" onClick={() => navigate("/advocacia#planos")}>
              Ver planos e preços
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-7" onClick={() => document.getElementById("agentes")?.scrollIntoView({ behavior: "smooth" })}>
              Conhecer os 15 agentes
            </Button>
          </div>

          {/* KPIs */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { v: "+47%", l: "conversão de leads" },
              { v: "−68%", l: "tempo em tarefas operacionais" },
              { v: "0", l: "prazos perdidos" },
              { v: "100%", l: "validação humana" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur">
                <div className="text-2xl md:text-3xl font-display font-semibold text-primary">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ARQUITETURA MCP */}
      <section className="py-20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-3 border-primary/30 text-primary bg-primary/5">
              <Workflow className="w-3 h-3 mr-1.5" />
              Arquitetura MCP
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
              Como uma intenção vira execução auditável
            </h2>
            <p className="mt-3 text-muted-foreground">
              Toda solicitação passa por 4 camadas. O Agente de Segurança é obrigatório: risco crítico bloqueia e exige aprovação humana.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Brain, title: "1. Orquestrador", desc: "Classifica intenção, define quais subagentes acionar." },
              { icon: ShieldCheck, title: "2. Segurança", desc: "Valida LGPD, sigilo OAB e classifica risco. Pode bloquear." },
              { icon: GitBranch, title: "3. Especialistas", desc: "Processual, Prazos, Redator, Estratégico, Financeiro em paralelo." },
              { icon: Gauge, title: "4. Consolidação", desc: "Resposta única, formato padronizado, auditável e rastreável." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="p-5 h-full bg-card/60 border-border/40 hover:border-primary/30 transition-colors relative">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-sm">{s.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENTES — 15 cards */}
      <section id="agentes" className="py-20 bg-card/30 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-primary/30 text-primary bg-primary/5">
              15 agentes · zero duplicidade
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
              Toda a squad, um por um
            </h2>
            <p className="mt-3 text-muted-foreground">
              7 agentes MCP (núcleo inteligente) + 4 comerciais + 4 operacionais. Cada um com escopo único.
            </p>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 text-primary bg-primary/5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> MCP · 7 agentes
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/25 text-emerald-500 bg-emerald-500/5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Comercial · 4 agentes
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/25 text-amber-500 bg-amber-500/5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Operacional · 4 agentes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENTS.map((a, i) => (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: (i % 6) * 0.05 }}
              >
                <Card
                  className={`relative p-5 h-full bg-card/60 border-border/40 hover:shadow-lg hover:shadow-primary/5 transition-all flex flex-col ${
                    a.highlight ? "border-primary/40 ring-1 ring-primary/20" : ""
                  }`}
                >
                  {a.highlight && (
                    <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px]">
                      Núcleo
                    </Badge>
                  )}
                  <div
                    className={`w-11 h-11 rounded-xl border bg-gradient-to-br ${layerColor(a.layer)} flex items-center justify-center mb-3`}
                  >
                    <a.icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold leading-tight">{a.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{a.tagline}</p>
                  <ul className="space-y-1.5 mt-auto">
                    {a.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-foreground/85">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/70" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Selo ético */}
          <Card className="mt-10 p-6 border-2 border-primary/20 bg-card/60 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold">Compromisso ético · OAB & LGPD</h4>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Nenhum agente fornece aconselhamento jurídico definitivo. Toda peça, parecer ou orientação técnica passa por
                validação obrigatória do advogado responsável. Operamos dentro do Código de Ética e Disciplina da OAB e da Lei Geral de Proteção de Dados.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* JUSTIFICATIVA DE INVESTIMENTO */}
      <section className="py-20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
              Por que vale o investimento
            </h2>
            <p className="mt-3 text-muted-foreground">
              Compare com o custo real de uma equipe equivalente, e veja o que você ganha em previsibilidade.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Briefcase,
                title: "Equivale a 4-6 contratações",
                desc: "Captador, atendente de triagem, paralegal, analista de contratos, compliance officer e gestor de prazos. Custo CLT: R$ 35k+/mês. Squad MCP: a partir de R$ 4.997.",
              },
              {
                icon: Zap,
                title: "Disponibilidade 24/7/365",
                desc: "Sem férias, sem licenças, sem turnover. Atende lead às 23h de domingo, calcula prazo no feriado, gera proposta no sábado de manhã.",
              },
              {
                icon: ShieldCheck,
                title: "Risco operacional reduzido",
                desc: "Prazos perdidos custam R$ 15k+ por caso em média. Falhas de KYC/PLD podem multar em R$ 20mi. O agente de Segurança bloqueia antes do erro acontecer.",
              },
              {
                icon: Gauge,
                title: "Conversão mensurável",
                desc: "+47% em conversão de leads (média dos clientes). Cada R$ 1.497/mês do Growth retorna entre R$ 8k e R$ 22k em honorários adicionais.",
              },
              {
                icon: FileSignature,
                title: "Padronização total",
                desc: "Toda peça, toda proposta, todo atendimento sai no mesmo padrão. Identidade do escritório preservada, sem depender de quem está de plantão.",
              },
              {
                icon: BadgeCheck,
                title: "Auditoria por execução",
                desc: "Trilha completa: quem pediu, qual agente rodou, qual decisão tomada, qual humano validou. Pronto para fiscalização da OAB e relatórios LGPD.",
              },
            ].map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-6 h-full bg-card/60 border-border/40 hover:border-primary/30 transition-colors">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <b.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">{b.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{b.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARATIVO COMPETITIVO */}
      <section className="py-20 border-b border-border/40 bg-card/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-primary/30 text-primary bg-primary/5">
              <Trophy className="w-3 h-3 mr-1.5" />
              Onde a Clauthor se posiciona
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
              Software de gestão <span className="text-muted-foreground">vs.</span> Squad jurídica viva
            </h2>
            <p className="mt-3 text-muted-foreground">
              Astrea, Jusfy, ADVBox e CPJ-3C são <strong className="text-foreground">cadernos digitais</strong>. Você ainda
              faz tudo. A Clauthor é uma <strong className="text-foreground">equipe de IA orquestrada</strong> que executa por você.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Critério</th>
                  <th className="text-center p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Astrea / Jusfy
                    <div className="text-[10px] font-normal normal-case mt-0.5 text-muted-foreground/70">R$ 150 – R$ 300/mês</div>
                  </th>
                  <th className="text-center p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Estagiário CLT
                    <div className="text-[10px] font-normal normal-case mt-0.5 text-muted-foreground/70">R$ 2.500+/mês</div>
                  </th>
                  <th className="text-center p-4 font-semibold text-xs uppercase tracking-wider text-primary bg-primary/5">
                    Clauthor MCP
                    <div className="text-[10px] font-normal normal-case mt-0.5 text-primary/70">R$ 497 – R$ 4.997/mês</div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/90">
                {([
                  ["Atendimento 24/7 sem férias", false, false, true],
                  ["Captação automática de leads", false, "Parcial", true],
                  ["Cálculo de prazos com bloqueio", "Manual", "Risco humano", true],
                  ["Redação de peças padronizada", false, "Demora", true],
                  ["Análise de risco contratual", false, false, true],
                  ["KYC + PEP/COAF integrado", false, false, true],
                  ["Recuperação de leads frios", false, "Esquece", true],
                  ["Auditoria por execução (LGPD)", "Limitada", false, true],
                  ["Estratégia + tese + jurisprudência", false, "Júnior", true],
                  ["Validação humana obrigatória", "N/A", "N/A", true],
                  ["Encargos / 13º / FGTS / férias", "Não", "+68% sobre salário", "Não"],
                ] as [string, any, any, any][]).map(([label, astrea, clt, clauthor], i) => {
                  const cell = (v: any) =>
                    v === true ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> :
                    v === false ? <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" /> :
                    <span className="text-xs">{v}</span>;
                  return (
                    <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="p-3.5 font-medium">{label}</td>
                      <td className="p-3.5 text-center text-muted-foreground">{cell(astrea)}</td>
                      <td className="p-3.5 text-center text-muted-foreground">{cell(clt)}</td>
                      <td className="p-3.5 text-center bg-primary/[0.03]">
                        {clauthor === true ? <CheckCircle2 className="w-4 h-4 text-primary mx-auto" /> : <span className="text-xs font-semibold text-primary">{clauthor}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <Flame className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/85 leading-relaxed">
              <strong className="text-primary">Diferença essencial:</strong> softwares de gestão organizam o trabalho que você
              <em> ainda vai fazer</em>. A Clauthor <strong>executa o trabalho</strong>: atende, qualifica, redige, calcula,
              fecha e relata. Você vira o <strong>gestor estratégico</strong>, não o operador.
            </p>
          </div>
        </div>
      </section>

      {/* CALCULADORA DE ROI — 3 CENÁRIOS */}
      <section className="py-20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-primary/30 text-primary bg-primary/5">
              <Calculator className="w-3 h-3 mr-1.5" />
              ROI mensurável
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
              Quanto a Clauthor te <span className="text-primary">devolve por mês</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Três cenários reais. Calcule você mesmo, depois fale com a Advogada IA para refinar com seus números.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: HeartHandshake,
                title: "Recuperação de 1 contrato",
                value: "R$ 3.000",
                period: "= 6 meses pagos",
                bullets: ["Lead que ia esfriar por demora no atendimento", "Agente comercial responde em 30s e qualifica", "1 contrato fechado paga 6 meses do plano Start"],
                color: "from-emerald-500/10 to-transparent border-emerald-500/30",
                highlight: false,
              },
              {
                icon: Timer,
                title: "10 horas devolvidas/semana",
                value: "R$ 8.000",
                period: "/mês em hora técnica",
                bullets: ["Sua hora técnica vale R$ 200 (mínimo)", "10h × 4 semanas × R$ 200 = R$ 8.000/mês", "Você passa de operador a estrategista"],
                color: "from-primary/10 to-transparent border-primary/30",
                highlight: true,
              },
              {
                icon: Users,
                title: "Substitui 4 contratações",
                value: "−R$ 30.000",
                period: "/mês em folha CLT",
                bullets: ["Captador + atendente + paralegal + compliance", "Custo CLT real (com encargos +68%): R$ 35k+/mês", "MCP Enterprise: R$ 4.997/mês, economia de 86%"],
                color: "from-amber-500/10 to-transparent border-amber-500/30",
                highlight: false,
              },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={`p-6 h-full bg-gradient-to-br ${c.color} flex flex-col relative overflow-hidden ${c.highlight ? "ring-1 ring-primary/30 shadow-xl shadow-primary/10" : ""}`}>
                  {c.highlight && <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px]">Mais comum</Badge>}
                  <div className="w-11 h-11 rounded-lg bg-background/60 backdrop-blur flex items-center justify-center mb-4">
                    <c.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{c.title}</h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl md:text-4xl font-display font-bold text-foreground">{c.value}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.period}</p>
                  <ul className="mt-5 space-y-2 flex-1">
                    {c.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-foreground/85">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/70" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="mt-8 p-6 md:p-8 bg-gradient-to-r from-primary/10 via-card to-card border-primary/30">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm text-muted-foreground">Combinando os três cenários (cliente médio):</p>
                <p className="mt-1 text-2xl md:text-3xl font-display font-semibold">
                  Retorno mensal entre <span className="text-primary">R$ 11.000 e R$ 41.000</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Para investimento a partir de R$ 497/mês. ROI mínimo: <strong className="text-primary">22×</strong>.
                </p>
              </div>
              <Button size="lg" className="glow shrink-0" onClick={() => navigate("/advocacia#planos")}>
                Quero esse retorno <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* GATILHOS — CUSTO DE NÃO DECIDIR + AUTORIDADE */}
      <section className="py-20 border-b border-border/40 bg-card/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-3 border-destructive/30 text-destructive bg-destructive/5">
              <AlertTriangle className="w-3 h-3 mr-1.5" />
              Custo de não decidir hoje
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
              Cada mês adiando custa mais que <span className="text-primary">12 meses de Clauthor</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-10">
            {[
              { icon: XCircle, title: "Lead perdido por demora", cost: "R$ 3.000 – R$ 15.000", desc: "73% dos leads contratam o primeiro escritório que responde. Demorou >2h? Perdeu." },
              { icon: Clock4, title: "Prazo perdido", cost: "R$ 15.000+ por caso", desc: "Indenização + dano reputacional + risco disciplinar OAB. Um único prazo paga 3 anos de Clauthor." },
              { icon: ShieldAlert, title: "Falha de KYC / PLD", cost: "Multa até R$ 20 milhões", desc: "Provimento OAB 188 e Lei 9.613/98. Risco real para escritórios que atendem PJ ou alto patrimônio." },
              { icon: Coins, title: "Sócio em tarefa operacional", cost: "R$ 8.000+/mês", desc: "Cada hora sua em tarefa repetitiva é hora não vendida. 10h/semana = R$ 8k em receita perdida." },
            ].map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -12 : 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5 bg-card/60 border-border/40 hover:border-destructive/40 transition-colors flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                    <g.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <h3 className="font-semibold">{g.title}</h3>
                      <span className="text-sm font-display font-semibold text-destructive">{g.cost}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{g.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, title: "OAB Provimento 205/2021", desc: "Compatível com publicidade ética e captação." },
              { icon: Lock, title: "LGPD por design", desc: "Criptografia AES-256-GCM, RIPD pronto, multi-tenant RLS." },
              { icon: BadgeCheck, title: "Validação humana 100%", desc: "Nenhuma decisão jurídica sai sem o advogado responsável aprovar." },
            ].map((a) => (
              <div key={a.title} className="flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-card/40">
                <a.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS — resumo */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
              Quatro planos · um para cada estágio
            </h2>
            <p className="mt-3 text-muted-foreground">
              Setup único + mensalidade. Sem fidelidade. Pagamento via PayPal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {PLANS.map((p) => (
              <Card
                key={p.name}
                className={`p-6 flex flex-col bg-card/60 transition-all ${
                  p.highlight
                    ? "border-2 border-primary shadow-xl shadow-primary/10 xl:scale-[1.02] relative"
                    : "border border-border/40"
                }`}
              >
                {p.badge && (
                  <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${p.highlight ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`}>
                    {p.badge}
                  </Badge>
                )}
                <h3 className="text-lg font-display font-semibold">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 min-h-[48px] leading-relaxed">{p.desc}</p>

                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary/80 bg-primary/5 border border-primary/20 rounded-full px-2 py-1 w-fit">
                  <Target className="w-3 h-3" /> {p.ideal}
                </div>

                <div className="mt-5 pb-5 border-b border-border/40">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Setup</div>
                  <div className="text-base font-semibold">{p.setup}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-3">Mensal</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-display font-semibold">{p.monthly}</span>
                    <span className="text-xs text-muted-foreground">/mês</span>
                  </div>
                </div>

                {/* Agentes inclusos */}
                <div className="mt-5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1.5">
                    <Brain className="w-3 h-3" /> Agentes inclusos
                  </div>
                  <ul className="space-y-1.5">
                    {p.agents.map((a) => (
                      <li key={a} className="flex items-start gap-2 text-xs text-foreground/90">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recursos */}
                <div className="mt-5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1.5">
                    <Workflow className="w-3 h-3" /> O que está incluso
                  </div>
                  <ul className="space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-foreground/85">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefícios */}
                <div className="mt-5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Benefícios
                  </div>
                  <ul className="space-y-1.5">
                    {p.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-foreground/85">
                        <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ROI */}
                <div className="mt-5 mb-5 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-foreground/90 leading-relaxed">
                    <strong className="text-primary">ROI:</strong> {p.roi}
                  </p>
                </div>

                <div className="flex-1" />

                <Button
                  className={`mt-6 w-full ${p.highlight ? "glow" : ""}`}
                  variant={p.highlight ? "default" : "outline"}
                  onClick={() => navigate("/advocacia#planos")}
                >
                  Escolher {p.name}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 border-t border-border/40 bg-card/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
            Pronto para operar com arquitetura MCP?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            15 agentes orquestrados, segurança obrigatória, ROI auditável. 
            Setup em até 7 dias.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="h-12 px-7 glow" onClick={() => navigate("/advocacia#planos")}>
              Ativar minha squad
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-7"
              onClick={() => (window.location.href = "mailto:contato@clauthor.com?subject=Demo%20MCP%20Advocacia")}
            >
              Falar com especialista
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Ou converse com a <strong className="text-foreground">Advogada IA</strong> no canto inferior direito desta tela.
          </p>
        </div>
      </section>

      <ChatWidget />
    </div>
  );
}
