import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import {
  Mail, Search, FileText, CalendarPlus, BarChart3, Users,
  Bot, CheckCircle, XCircle, Clock, Loader2, Zap, ArrowRight,
  Globe, Phone, MessageSquare, Shield, Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimelineEntry {
  id: string;
  agent_name: string;
  action: string;
  status: string;
  execution_time_ms: number | null;
  created_at: string;
  details?: Record<string, any> | null;
}

// All colors now use semantic tokens or CSS variables
const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; labelKey: string; illustration: string }> = {
  send_email:       { icon: Mail,         color: "text-primary",               labelKey: "timeline.sending_email",       illustration: "📧" },
  create_task:      { icon: CalendarPlus, color: "text-accent-foreground",     labelKey: "timeline.creating_task",       illustration: "📋" },
  generate_report:  { icon: FileText,     color: "text-primary",               labelKey: "timeline.generating_report",   illustration: "📊" },
  search_leads:     { icon: Search,       color: "text-primary/80",            labelKey: "timeline.searching_leads",     illustration: "🔍" },
  schedule_meeting: { icon: CalendarPlus, color: "text-accent-foreground",     labelKey: "timeline.scheduling_meeting",  illustration: "📅" },
  analyze_data:     { icon: BarChart3,    color: "text-accent-foreground",     labelKey: "timeline.analyzing_data",      illustration: "📈" },
  delegate_to_agent:{ icon: Users,        color: "text-primary",               labelKey: "timeline.delegating",          illustration: "🤝" },
  chat:             { icon: MessageSquare,color: "text-primary",               labelKey: "timeline.chatting",            illustration: "💬" },
  whatsapp:         { icon: Phone,        color: "text-primary",               labelKey: "timeline.sending_whatsapp",    illustration: "📱" },
  web_search:       { icon: Globe,        color: "text-primary/80",            labelKey: "timeline.web_searching",       illustration: "🌐" },
  security_scan:    { icon: Shield,       color: "text-destructive",           labelKey: "timeline.security_scanning",   illustration: "🛡️" },
  monitoring:       { icon: Eye,          color: "text-accent-foreground",     labelKey: "timeline.monitoring",          illustration: "👁️" },
};

const FALLBACK_LABELS: Record<string, string> = {
  "timeline.sending_email": "Enviando e-mail",
  "timeline.creating_task": "Criando tarefa",
  "timeline.generating_report": "Gerando relatório",
  "timeline.searching_leads": "Buscando leads",
  "timeline.scheduling_meeting": "Agendando reunião",
  "timeline.analyzing_data": "Analisando dados",
  "timeline.delegating": "Delegando para agente",
  "timeline.chatting": "Conversando",
  "timeline.sending_whatsapp": "Enviando WhatsApp",
  "timeline.web_searching": "Pesquisando na web",
  "timeline.security_scanning": "Escaneando segurança",
  "timeline.monitoring": "Monitorando",
};

const StatusDot = ({ status }: { status: string }) => {
  if (status === "success") return <CheckCircle className="h-3.5 w-3.5 text-primary" />;
  if (status === "error") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
};

const AgentLiveTimeline = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<"all" | "running" | "success" | "error">("all");

  const getActionConfig = (action: string) => {
    const key = Object.keys(ACTION_CONFIG).find(k => action.toLowerCase().includes(k));
    if (!key) return { icon: Zap, color: "text-muted-foreground", label: action, illustration: "⚡" };
    const cfg = ACTION_CONFIG[key];
    return { ...cfg, label: t(cfg.labelKey, { defaultValue: FALLBACK_LABELS[cfg.labelKey] || action }) };
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return t("timeline.now", { defaultValue: "agora" });
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min ${t("timeline.ago", { defaultValue: "atrás" })}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ${t("timeline.ago", { defaultValue: "atrás" })}`;
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ["agent-live-timeline", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("execution_logs")
        .select("*, agent:agents(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data.map((log: any) => ({
        id: log.id,
        agent_name: log.agent?.name || t("timeline.default_agent", { defaultValue: "Agente IA" }),
        action: log.action,
        status: log.status,
        execution_time_ms: log.execution_time_ms,
        created_at: log.created_at,
        details: log.details,
      })) as TimelineEntry[];
    },
    enabled: !!user,
    refetchInterval: 8000,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("timeline-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "execution_logs" }, () => {})
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filtered = filter === "all" ? entries : entries.filter(e => e.status === filter);

  const statusFilters = [
    { key: "all" as const, label: t("timeline.all", { defaultValue: "Todos" }), count: entries.length },
    { key: "success" as const, label: t("timeline.success", { defaultValue: "Sucesso" }), count: entries.filter(e => e.status === "success").length },
    { key: "error" as const, label: t("timeline.error", { defaultValue: "Erro" }), count: entries.filter(e => e.status === "error").length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            {t("timeline.title", { defaultValue: "Agent Live Timeline" })}
          </h2>
          <p className="text-sm text-muted-foreground">{t("timeline.subtitle", { defaultValue: "Acompanhe em tempo real o que seus agentes estão fazendo" })}</p>
        </div>
        <div className="flex items-center gap-1 bg-card/50 rounded-xl p-1 border border-border/20">
          {statusFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label} <span className="ml-1 opacity-60">({f.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        {t("timeline.updating_realtime", { defaultValue: "Atualizando em tempo real" })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Bot className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold mb-2">{t("timeline.no_activity", { defaultValue: "Nenhuma atividade ainda" })}</h3>
          <p className="text-muted-foreground text-sm">{t("timeline.no_activity_desc", { defaultValue: "Quando seus agentes começarem a trabalhar, você verá tudo aqui em tempo real." })}</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border/30" />

            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {filtered.map((entry, i) => {
                  const config = getActionConfig(entry.action);
                  const Icon = config.icon;
                  const isLatest = i === 0;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: i * 0.02 }}
                      className={cn(
                        "relative flex items-start gap-4 pl-3 pr-4 py-3 rounded-xl transition-colors group",
                        isLatest && "bg-primary/[0.04] border border-primary/10",
                        !isLatest && "hover:bg-card/50"
                      )}
                    >
                      {/* Node on the line */}
                      <div className={cn(
                        "relative z-10 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-lg",
                        isLatest ? "bg-primary/15 ring-2 ring-primary/20" : "bg-card border border-border/30"
                      )}>
                        <span className="text-sm">{config.illustration}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm truncate">{entry.agent_name}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                          <span className={cn("text-sm font-medium flex items-center gap-1", config.color)}>
                            <Icon className="h-3.5 w-3.5" />
                            {config.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <StatusDot status={entry.status} />
                            {entry.status === "success" ? t("timeline.completed", { defaultValue: "Concluído" }) : entry.status === "error" ? t("timeline.error", { defaultValue: "Erro" }) : t("timeline.processing", { defaultValue: "Processando" })}
                          </span>
                          {entry.execution_time_ms && (
                            <span>{entry.execution_time_ms}ms</span>
                          )}
                          <span>{formatTime(entry.created_at)}</span>
                        </div>
                      </div>

                      {isLatest && (
                        <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary text-[9px] animate-pulse">
                          {t("timeline.latest", { defaultValue: "MAIS RECENTE" })}
                        </Badge>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default AgentLiveTimeline;
