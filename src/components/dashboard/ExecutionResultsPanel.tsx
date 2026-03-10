import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { 
  FileText, Users, Mail, BarChart3, CheckCircle2, 
  Clock, Bot, ChevronRight, Eye 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ExecutionResultsPanelProps {
  onNavigate?: (section: string) => void;
}

const resultTypeConfig: Record<string, { icon: typeof FileText; labelKey: string }> = {
  report: { icon: FileText, labelKey: "results.report_type" },
  leads: { icon: Users, labelKey: "results.leads_type" },
  content: { icon: Mail, labelKey: "results.content_type" },
  analysis: { icon: BarChart3, labelKey: "results.analysis_type" },
  custom: { icon: FileText, labelKey: "results.result_type" },
};

const ExecutionResultsPanel = ({ onNavigate }: ExecutionResultsPanelProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: reports = [] } = useQuery({
    queryKey: ["agent-reports", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_reports")
        .select("*, agent:agents(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: executions = [] } = useQuery({
    queryKey: ["recent-executions-results", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("execution_logs")
        .select("*, agent:agents(name)")
        .eq("user_id", user!.id)
        .eq("status", "success")
        .not("details", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["agent-created-tasks", user?.id],
    queryFn: async () => {
      const { data: tenantData } = await supabase.rpc("get_user_tenant_id", { _user_id: user!.id });
      if (!tenantData) return [];
      const { data, error } = await supabase
        .from("agent_tasks")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const hasResults = reports.length > 0 || executions.length > 0 || tasks.length > 0;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return t("results.ago_min", { count: diffMin });
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return t("results.ago_hours", { count: diffHrs });
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  };

  if (!hasResults) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border/20 flex items-center justify-center mx-auto">
          <FileText className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <h3 className="font-display text-lg font-semibold">{t("results.empty_title")}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t("results.empty_desc")}
        </p>
        <Button variant="outline" size="sm" onClick={() => onNavigate?.("overview")}>
          {t("results.go_command_center")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">{t("results.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("results.subtitle")}</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {reports.length + executions.length} {t("results.results_count")}
        </Badge>
      </div>

      {/* Reports */}
      {reports.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold">
            📄 {t("results.reports_section")}
          </h3>
          <div className="grid gap-3">
            {reports.map((report: any) => {
              const isExpanded = expandedId === report.id;
              const sections = Array.isArray(report.sections) ? report.sections : [];
              return (
                <motion.div
                  key={report.id}
                  layout
                  className="bg-card/50 border border-border/30 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{report.title}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <Bot className="h-3 w-3" />
                        <span>{report.agent?.name || t("quality.agent")}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(report.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                  </button>
                  <AnimatePresence>
                    {isExpanded && sections.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/20"
                      >
                        <div className="p-4 space-y-3">
                          {sections.map((section: any, i: number) => (
                            <div key={i} className="bg-muted/20 rounded-lg p-3">
                              <div className="text-xs font-semibold text-foreground mb-1">{section.title || t("results.section_label", { num: i + 1 })}</div>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{section.content || JSON.stringify(section)}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Execution Results */}
      {executions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold">
            ⚡ {t("results.executions_section")}
          </h3>
          <div className="grid gap-2">
            {executions.slice(0, 8).map((exec: any) => {
              const details = exec.details || {};
              
              return (
                <div
                  key={exec.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card/30 border border-border/20 hover:bg-muted/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{exec.action}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      <Bot className="h-3 w-3" />
                      <span>{exec.agent?.name || t("quality.agent")}</span>
                      {exec.execution_time_ms && (
                        <>
                          <span>•</span>
                          <span>{exec.execution_time_ms}ms</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatTime(exec.created_at)}</span>
                    </div>
                  </div>
                  {details.output_preview && (
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      <Eye className="h-3 w-3 mr-1" />
                      {t("results.view")}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tasks created by agents */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold">
            📋 {t("results.tasks_section")}
          </h3>
          <div className="grid gap-2">
            {tasks.slice(0, 5).map((task: any) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card/30 border border-border/20"
              >
                <div className={cn(
                  "w-2 h-8 rounded-full shrink-0",
                  task.priority === "high" ? "bg-destructive" :
                  task.priority === "medium" ? "bg-muted-foreground/50" : "bg-muted-foreground/30"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{task.title}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {task.status === "completed" ? `✅ ${t("results.completed")}` : task.status === "in_progress" ? `🔄 ${t("results.in_progress")}` : `📌 ${t("results.pending")}`}
                    {task.due_date && ` • ${t("results.due_label", { date: new Date(task.due_date).toLocaleDateString() })}`}
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] capitalize">{task.category || t("quality.general")}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionResultsPanel;
