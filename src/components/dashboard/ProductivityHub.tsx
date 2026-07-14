import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Inbox,
  Newspaper,
  Sparkles,
  Plug,
  RefreshCw,
  Settings,
  Clock,
  MapPin,
  ChevronDown,
  ChevronRight,
  Mail,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// ─── Mock data ────────────────────────────────────────────────────────────
const MOCK_EVENTS = [
  { id: "e1", time: "09:00", title: "Daily · Squad Comercial", duration: "30 min", location: "Google Meet", category: "Reunião", color: "hsl(var(--primary))" },
  { id: "e2", time: "10:30", title: "Revisão de proposta — Acme", duration: "1h", location: "Sala Virtual", category: "Cliente", color: "hsl(220 90% 60%)" },
  { id: "e3", time: "14:00", title: "Sprint Planning", duration: "1h30", location: "Zoom", category: "Interno", color: "hsl(280 80% 65%)" },
  { id: "e4", time: "16:00", title: "1:1 com o Thor", duration: "20 min", location: undefined, category: "IA", color: "hsl(160 70% 45%)" },
];

const MOCK_INBOX = {
  action: [
    { id: "a1", from: "Marina Souza", subject: "Contrato Ironberg — precisa da sua assinatura", priority: "Alta" as const },
    { id: "a2", from: "Financeiro Clauthor", subject: "Fatura pendente #23491", priority: "Média" as const },
    { id: "a3", from: "Rafael (Squad Legal)", subject: "Revisar cláusula 4.2 antes das 18h", priority: "Alta" as const },
  ],
  info: [
    { id: "i1", from: "Thor", subject: "Resumo semanal da operação está pronto" },
    { id: "i2", from: "Product Updates", subject: "Novo painel de aprovações lançado" },
  ],
  low: [
    { id: "l1", from: "Newsletter TechCrunch", subject: "As 5 startups de IA para observar em 2026" },
    { id: "l2", from: "Promoções AWS", subject: "Créditos em Bedrock — até 30/11" },
    { id: "l3", from: "LinkedIn", subject: "Você tem 12 novas visualizações" },
  ],
};

const NEWS_TOPICS = ["Inteligência Artificial", "Tecnologia", "Negócios", "Marketing", "Programação", "Economia", "Startups"];

const MOCK_NEWS = [
  { id: "n1", topic: "Inteligência Artificial", title: "Anthropic lança Claude Opus 4.8 com raciocínio multi-passo", summary: "Nova geração melhora análise técnica e reduz alucinações em 40%.", source: "The Verge", time: "há 12 min", image: "https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=400&h=240&fit=crop", url: "https://www.theverge.com/ai-artificial-intelligence" },
  { id: "n2", topic: "Startups", title: "Fintechs brasileiras captam R$ 2,3 bi no trimestre", summary: "Setor lidera aportes no país mesmo em cenário global mais seco.", source: "Brazil Journal", time: "há 1h", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=240&fit=crop", url: "https://braziljournal.com/" },
  { id: "n3", topic: "Tecnologia", title: "Apple aposta em chips M5 com foco em IA local", summary: "Nova arquitetura promete rodar modelos de 70B parâmetros no MacBook.", source: "Bloomberg", time: "há 2h", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=240&fit=crop", url: "https://www.bloomberg.com/technology" },
];

const INTEGRATIONS = [
  { id: "gcal", name: "Google Calendar", status: "connected" as const },
  { id: "gmail", name: "Gmail", status: "connected" as const },
  { id: "outlook", name: "Outlook", status: "disconnected" as const },
  { id: "rss", name: "RSS", status: "syncing" as const },
  { id: "notion", name: "Notion", status: "error" as const },
];

// ─── Sub-components ───────────────────────────────────────────────────────
const SectionCard = ({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    className={cn(
      "rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-5 sm:p-6 shadow-[0_1px_0_0_hsl(var(--border)/0.4)] hover:border-border/60 transition-colors",
      className
    )}
  >
    <header className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-sm tracking-tight">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
    {children}
  </motion.section>
);

const AgendaCard = () => {
  const openCalendar = () => window.open("https://calendar.google.com", "_blank", "noopener,noreferrer");
  return (
    <SectionCard
      icon={CalendarDays}
      title="Agenda"
      description="Seus próximos compromissos do dia"
      action={
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={openCalendar}>
          Abrir calendário
          <ArrowRight className="h-3 w-3" />
        </Button>
      }
    >
      <ul className="space-y-2">
        {MOCK_EVENTS.map((e) => (
          <li
            key={e.id}
            onClick={() =>
              toast({
                title: e.title,
                description: `${e.time} · ${e.duration}${e.location ? ` · ${e.location}` : ""}`,
              })
            }
            className="group flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-background/40 hover:bg-background/70 hover:border-border/60 transition-all cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center w-14 shrink-0">
              <span className="text-sm font-semibold tabular-nums">{e.time}</span>
              <span className="text-[10px] text-muted-foreground">{e.duration}</span>
            </div>
            <div className="w-px self-stretch bg-border/40" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: e.color }} />
                <p className="text-sm font-medium truncate">{e.title}</p>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-medium border-border/40">{e.category}</Badge>
                </span>
                {e.location && (
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3" strokeWidth={1.5} />
                    <span className="truncate">{e.location}</span>
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors" />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
};

const priorityStyle = (p: "Alta" | "Média" | "Baixa") =>
  p === "Alta"
    ? "bg-destructive/10 text-destructive border-destructive/20"
    : p === "Média"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      : "bg-muted/40 text-muted-foreground border-border/40";

const InboxCard = () => {
  const [lowOpen, setLowOpen] = useState(false);
  const [actionItems, setActionItems] = useState(MOCK_INBOX.action);
  const [infoItems, setInfoItems] = useState(MOCK_INBOX.info);
  const [lowItems, setLowItems] = useState(MOCK_INBOX.low);

  const handleReply = (id: string, subject: string) => {
    setActionItems((prev) => prev.filter((m) => m.id !== id));
    toast({ title: "Resposta enviada", description: `"${subject}" marcado como respondido.` });
  };

  const handleClear = () => {
    const total = actionItems.length + infoItems.length + lowItems.length;
    if (total === 0) {
      toast({ title: "Caixa já está vazia" });
      return;
    }
    setActionItems([]);
    setInfoItems([]);
    setLowItems([]);
    toast({ title: "Caixa limpa", description: `${total} e-mails arquivados.` });
  };

  return (
    <SectionCard
      icon={Inbox}
      title="Caixa de Entrada Inteligente"
      description="Organizada automaticamente pela IA"
      action={
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs h-8 text-muted-foreground"
          onClick={handleClear}
        >
          Limpar caixa
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Ação necessária */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-destructive/80">Ação necessária</span>
            <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-destructive/30 text-destructive">{actionItems.length}</Badge>
          </div>
          {actionItems.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-3 text-center">Nenhum e-mail pendente 🎉</p>
          ) : (
            <ul className="space-y-1.5">
              {actionItems.map((m) => (
                <li key={m.id} className="group flex items-center gap-3 p-2.5 rounded-lg border border-border/30 bg-background/40 hover:border-destructive/30 transition-colors">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{m.subject}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{m.from}</p>
                  </div>
                  <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded border", priorityStyle(m.priority))}>{m.priority}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] px-2"
                    onClick={() => handleReply(m.id, m.subject)}
                  >
                    Responder
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Informações */}
        {infoItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">Informações</span>
              <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-border/40">{infoItems.length}</Badge>
            </div>
            <ul className="space-y-1.5">
              {infoItems.map((m) => (
                <li
                  key={m.id}
                  onClick={() => toast({ title: m.subject, description: `De: ${m.from}` })}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border/20 bg-background/30 hover:bg-background/50 transition-colors cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{m.subject}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{m.from}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Baixa prioridade — colapsado */}
        {lowItems.length > 0 && (
          <div>
            <button
              onClick={() => setLowOpen((v) => !v)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/20 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", !lowOpen && "-rotate-90")} />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">Baixa prioridade</span>
                <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-border/40">{lowItems.length}</Badge>
              </div>
            </button>
            {lowOpen && (
              <ul className="mt-1.5 space-y-1.5">
                {lowItems.map((m) => (
                  <li
                    key={m.id}
                    onClick={() => toast({ title: m.subject, description: `De: ${m.from}` })}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border/15 bg-background/20 opacity-80 hover:opacity-100 cursor-pointer transition-opacity"
                  >
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{m.subject}</p>
                      <p className="text-[10px] text-muted-foreground/70 truncate">{m.from}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
};

const NewsCard = ({ onNavigate }: { onNavigate?: (id: string) => void }) => {
  const [activeTopic, setActiveTopic] = useState<string>("Todos");
  const items = useMemo(
    () => (activeTopic === "Todos" ? MOCK_NEWS : MOCK_NEWS.filter((n) => n.topic === activeTopic)),
    [activeTopic]
  );
  const openInterests = () => {
    if (onNavigate) {
      onNavigate("settings");
    } else {
      toast({
        title: "Personalize seus interesses",
        description: "Selecione tópicos usando os filtros acima para refinar suas notícias.",
      });
    }
  };
  const openNews = (n: (typeof MOCK_NEWS)[number]) =>
    window.open(n.url, "_blank", "noopener,noreferrer");
  return (
    <SectionCard
      icon={Newspaper}
      title="Notícias"
      description="Selecionadas com base nos seus interesses"
      action={
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={openInterests}>
          <Settings className="h-3 w-3" />
          Interesses
        </Button>
      }
    >
      <div className="flex flex-wrap gap-1.5 mb-4">
        {["Todos", ...NEWS_TOPICS].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTopic(t)}
            className={cn(
              "text-[10px] px-2.5 py-1 rounded-full border transition-all",
              activeTopic === t
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-background/40 text-muted-foreground border-border/30 hover:border-border/60"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.length === 0 && (
          <p className="col-span-full text-xs text-muted-foreground text-center py-6">
            Nenhuma notícia recente para "{activeTopic}".
          </p>
        )}
        {items.map((n) => (
          <article
            key={n.id}
            onClick={() => openNews(n)}
            className="group rounded-xl border border-border/30 bg-background/40 overflow-hidden hover:border-border/60 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <div className="aspect-[16/9] overflow-hidden bg-muted/30">
              <img
                src={n.image}
                alt={n.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-border/40">{n.topic}</Badge>
                <span className="text-[10px] text-muted-foreground">{n.time}</span>
              </div>
              <h4 className="text-xs font-semibold leading-snug line-clamp-2 mb-1">{n.title}</h4>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{n.summary}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/80">{n.source}</span>
                <span className="text-[10px] font-medium text-primary inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                  Ler notícia <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
};

const DailySummaryCard = ({ onRefresh, refreshing }: { onRefresh?: () => void; refreshing?: boolean }) => {
  const priorities = [
    "Assinar contrato Ironberg antes das 12h",
    "Revisar proposta Acme com Marina",
    "Preparar Sprint Planning das 14h",
  ];
  return (
    <SectionCard
      icon={Sparkles}
      title="Resumo do Dia"
      description="Gerado automaticamente pela IA"
      className="border-primary/25 bg-gradient-to-br from-primary/[0.06] to-transparent"
      action={
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/10"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-border/30 bg-background/50 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">Agenda</span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            <span className="font-semibold">{MOCK_EVENTS.length} compromissos</span> — destaque para revisão de proposta com <span className="font-medium">Acme</span> às 10:30 e 1:1 com o Thor às 16h.
          </p>
        </div>

        <div className="rounded-xl border border-border/30 bg-background/50 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Inbox className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">Caixa de entrada</span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            <span className="font-semibold">{MOCK_INBOX.action.length + MOCK_INBOX.info.length + MOCK_INBOX.low.length} e-mails</span> — {MOCK_INBOX.action.length} exigem resposta, {MOCK_INBOX.info.length} informativos, {MOCK_INBOX.low.length} baixa prioridade.
          </p>
        </div>

        <div className="rounded-xl border border-border/30 bg-background/50 p-3 md:col-span-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Newspaper className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">Notícias</span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            Anthropic lançou o Claude Opus 4.8 (raciocínio multi-passo), fintechs brasileiras captaram <span className="font-medium">R$ 2,3 bi</span> no trimestre, e a Apple aposta em chips M5 focados em IA local.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-3">
        <div className="flex items-center gap-2 mb-2">
          <ListChecks className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary/80">Suas 3 prioridades hoje</span>
        </div>
        <ol className="space-y-1.5">
          {priorities.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs">
              <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-foreground/90">{p}</span>
            </li>
          ))}
        </ol>
      </div>
    </SectionCard>
  );
};

const statusMeta = {
  connected: { icon: CheckCircle2, label: "Conectado", cls: "text-emerald-500" },
  disconnected: { icon: XCircle, label: "Não conectado", cls: "text-muted-foreground/60" },
  syncing: { icon: Loader2, label: "Sincronizando", cls: "text-primary animate-spin" },
  error: { icon: AlertCircle, label: "Erro de sincronização", cls: "text-destructive" },
} as const;

const IntegrationsCard = ({ onNavigate }: { onNavigate?: (id: string) => void }) => (
  <SectionCard
    icon={Plug}
    title="Integrações"
    description="Fontes conectadas à sua Central"
    action={
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs h-8"
        onClick={() => onNavigate?.("integrations")}
      >
        Gerenciar
        <ArrowRight className="h-3 w-3" />
      </Button>
    }
  >
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {INTEGRATIONS.map((it) => {
        const meta = statusMeta[it.status];
        const Icon = meta.icon;
        return (
          <li
            key={it.id}
            onClick={() => onNavigate?.("integrations")}
            className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-background/40 hover:border-border/60 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
              <Plug className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{it.name}</p>
              <p className="text-[10px] text-muted-foreground">{meta.label}</p>
            </div>
            <Icon className={cn("h-4 w-4 shrink-0", meta.cls)} strokeWidth={1.75} />
          </li>
        );
      })}
    </ul>
  </SectionCard>
);

// ─── Main hub ─────────────────────────────────────────────────────────────
interface ProductivityHubProps {
  onNavigate?: (id: string) => void;
}

const ProductivityHub = ({ onNavigate }: ProductivityHubProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(() => new Date());

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setLastSync(new Date());
      setRefreshing(false);
    }, 900);
  };

  const timeAgo = useMemo(() => {
    return lastSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }, [lastSync]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <CalendarDays className="h-3 w-3 text-primary" strokeWidth={1.75} />
            <span className="text-[10px] font-medium tracking-wide text-primary uppercase">Central de Produtividade</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            Central de Produtividade
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
            Organize sua rotina, acompanhe seus compromissos, gerencie seus e-mails e receba um resumo inteligente do seu dia.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground px-2.5 py-1 rounded-full border border-border/30 bg-background/40">
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            Sincronizado às <span className="tabular-nums font-medium text-foreground/80">{timeAgo}</span>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Atualizar
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Configurações">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.header>

      {/* Loading state */}
      {refreshing ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Daily summary — hero */}
          <DailySummaryCard />

          {/* Grid: Agenda + Inbox */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AgendaCard />
            <InboxCard />
          </div>

          {/* News full width */}
          <NewsCard />

          {/* Integrations */}
          <IntegrationsCard onNavigate={onNavigate} />
        </>
      )}
    </div>
  );
};

export default ProductivityHub;
