import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string; illustration: string }> = {
  send_email:       { icon: Mail,         color: "text-blue-400",    label: "Enviando e-mail",         illustration: "📧" },
  create_task:      { icon: CalendarPlus, color: "text-amber-400",   label: "Criando tarefa",          illustration: "📋" },
  generate_report:  { icon: FileText,     color: "text-emerald-400", label: "Gerando relatório",       illustration: "📊" },
  search_leads:     { icon: Search,       color: "text-cyan-400",    label: "Buscando leads",          illustration: "🔍" },
  schedule_meeting: { icon: CalendarPlus, color: "text-violet-400",  label: "Agendando reunião",       illustration: "📅" },
  analyze_data:     { icon: BarChart3,    color: "text-orange-400",  label: "Analisando dados",        illustration: "📈" },
  delegate_to_agent:{ icon: Users,        color: "text-pink-400",    label: "Delegando para agente",   illustration: "🤝" },
  chat:             { icon: MessageSquare,color: "text-primary",     label: "Conversando",             illustration: "💬" },
  whatsapp:         { icon: Phone,        color: "text-green-400",   label: "Enviando WhatsApp",       illustration: "📱" },
  web_search:       { icon: Globe,        color: "text-sky-400",     label: "Pesquisando na web",      illustration: "🌐" },
  security_scan:    { icon: Shield,       color: "text-red-400",     label: "Escaneando segurança",    illustration: "🛡️" },
  monitoring:       { icon: Eye,          color: "text-yellow-400",  label: "Monitorando",             illustration: "👁️" },
};

const getActionConfig = (action: string) => {
  const key = Object.keys(ACTION_CONFIG).find(k => action.toLowerCase().includes(k));
  return key ? ACTION_CONFIG[key] : { icon: Zap, color: "text-muted-foreground", label: action, illustration: "⚡" };
};

const StatusDot = ({ status }: { status: string }) => {
  if (status === "success") return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "error") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
  return <Clock className="h-3.5 w-3.5 text-amber-400" />;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "agora";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

const AgentLiveTimeline = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "running" | "success" | "error">("all");

  const { data: entries = [], isLoading } = useQuery({
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
        agent_name: log.agent?.name || "Agente IA",
        action: log.action,
        status: log.status,
        execution_time_ms: log.execution_time_ms,
        created_at: log.created_at,
        details: log.details,
      })) as TimelineEntry[];
    },
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5s for live feel
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("timeline-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "execution_logs" }, () => {
        // React Query will refetch on interval, but we can force it
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filtered = filter === "all" ? entries : entries.filter(e => e.status === filter);

  const statusFilters = [
    { key: "all" as const, label: "Todos", count: entries.length },
    { key: "success" as const, label: "Sucesso", count: entries.filter(e => e.status === "success").length },
    { key: "error" as const, label: "Erro", count: entries.filter(e => e.status === "error").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Agent Live Timeline
          </h2>
          <p className="text-sm text-muted-foreground">Acompanhe em tempo real o que seus agentes estão fazendo</p>
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
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Atualizando em tempo real
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Bot className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold mb-2">Nenhuma atividade ainda</h3>
          <p className="text-muted-foreground text-sm">Quando seus agentes começarem a trabalhar, você verá tudo aqui em tempo real.</p>
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
                            {entry.status === "success" ? "Concluído" : entry.status === "error" ? "Erro" : "Processando"}
                          </span>
                          {entry.execution_time_ms && (
                            <span>{entry.execution_time_ms}ms</span>
                          )}
                          <span>{formatTime(entry.created_at)}</span>
                        </div>
                      </div>

                      {/* Pulse for latest */}
                      {isLatest && (
                        <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary text-[9px] animate-pulse">
                          MAIS RECENTE
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
