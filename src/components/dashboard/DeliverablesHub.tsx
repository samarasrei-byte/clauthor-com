import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText, CheckCircle2, Clock, AlertCircle, Bot, BarChart3,
  Filter, Download, Eye, ChevronRight, Sparkles, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import HelpTooltip from "@/components/HelpTooltip";

interface DeliverablesHubProps {
  onNavigate?: (section: string) => void;
}

const DeliverablesHub = ({ onNavigate }: DeliverablesHubProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Fetch execution logs (deliverables)
  const { data: execLogs = [] } = useQuery({
    queryKey: ["deliverables-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("execution_logs")
        .select("*, agent:agents(name, tier)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["deliverables-tasks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_tasks")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch reports
  const { data: reports = [] } = useQuery({
    queryKey: ["deliverables-reports", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_reports")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  // Unique agents
  const agentNames = useMemo(() => {
    const names = new Set<string>();
    execLogs.forEach((l: any) => { if (l.agent?.name) names.add(l.agent.name); });
    return Array.from(names).sort();
  }, [execLogs]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = execLogs.filter((l: any) => l.created_at?.startsWith(today));
    const completedTasks = tasks.filter((t: any) => t.status === "completed" || t.status === "done");
    const pendingTasks = tasks.filter((t: any) => t.status === "open" || t.status === "in_progress");
    return {
      todayDeliveries: todayLogs.length,
      totalDeliveries: execLogs.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      totalReports: reports.length,
      successRate: execLogs.length > 0
        ? Math.round((execLogs.filter((l: any) => l.status === "success").length / execLogs.length) * 100)
        : 0,
    };
  }, [execLogs, tasks, reports]);

  // Filtered items
  const filteredLogs = useMemo(() => {
    let items = execLogs;
    if (selectedAgent) items = items.filter((l: any) => l.agent?.name === selectedAgent);
    return items;
  }, [execLogs, selectedAgent]);

  const statusIcon = (status: string) => {
    if (status === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === "error" || status === "failed") return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    return <Clock className="h-3.5 w-3.5 text-amber-500" />;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return "agora";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m atrás`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h atrás`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {t("deliverables.title", { defaultValue: "Central de Entregas" })}
          <HelpTooltip id="deliverables-intro" text="Visualize todos os entregáveis dos seus agentes em um único lugar: execuções, tarefas concluídas e relatórios." size={14} />
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("deliverables.subtitle", { defaultValue: "Tudo que seus agentes produziram, consolidado." })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Entregas Hoje", value: stats.todayDeliveries, icon: Sparkles, color: "text-primary" },
          { label: "Total Execuções", value: stats.totalDeliveries, icon: Activity, color: "text-accent-foreground" },
          { label: "Tasks Concluídas", value: stats.completedTasks, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Taxa de Sucesso", value: `${stats.successRate}%`, icon: BarChart3, color: "text-primary" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 glass-card border-border/10">
              <div className="flex items-center gap-2 mb-1">
                <card.icon className={`h-4 w-4 ${card.color}`} />
                <span className="text-[11px] text-muted-foreground font-medium">{card.label}</span>
              </div>
              <span className="text-2xl font-display font-bold">{card.value}</span>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Agent Filter */}
      {agentNames.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Button
            variant={selectedAgent === null ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelectedAgent(null)}
          >
            Todos
          </Button>
          {agentNames.slice(0, 8).map((name) => (
            <Button
              key={name}
              variant={selectedAgent === name ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedAgent(name)}
            >
              <Bot className="h-3 w-3 mr-1" />
              {name}
            </Button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30 p-1 gap-1">
          <TabsTrigger value="all" className="text-xs gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Execuções ({filteredLogs.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Relatórios ({reports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              <AnimatePresence>
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Nenhuma execução registrada ainda. Comece conversando com seus agentes!
                  </div>
                ) : filteredLogs.map((log: any, i: number) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/10 hover:bg-card/80 transition-colors group"
                  >
                    {statusIcon(log.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{log.action}</span>
                        {log.agent?.name && (
                          <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
                            {log.agent.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{formatDate(log.created_at)}</span>
                        {log.execution_time_ms && <span>• {log.execution_time_ms}ms</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tasks">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Nenhuma tarefa registrada ainda.
                </div>
              ) : tasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/10">
                  {task.status === "completed" || task.status === "done"
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    : task.status === "in_progress"
                    ? <Clock className="h-3.5 w-3.5 text-amber-500" />
                    : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  }
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{task.title}</span>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Badge variant="outline" className="text-[9px] h-4">{task.priority}</Badge>
                      <span>{formatDate(task.created_at)}</span>
                      {task.category && <span>• {task.category}</span>}
                    </div>
                  </div>
                  <Badge variant={task.status === "completed" || task.status === "done" ? "default" : "secondary"} className="text-[10px] h-5">
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="reports">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {reports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Nenhum relatório gerado ainda. Peça ao Thor para gerar um relatório.
                </div>
              ) : reports.map((report: any) => (
                <div key={report.id} className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/10 group hover:bg-card/80 transition-colors">
                  <FileText className="h-4 w-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{report.title}</span>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Badge variant="outline" className="text-[9px] h-4">{report.report_type}</Badge>
                      <span>{formatDate(report.created_at)}</span>
                      {report.period && <span>• {report.period}</span>}
                    </div>
                  </div>
                  <Eye className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliverablesHub;
