import { useAgentActivity, type ActivityLog } from "@/hooks/useAgentActivity";
import { Clock, Zap, FileText, Mail, Search, BarChart3, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const ACTION_ICONS: Record<string, any> = {
  chat: Zap,
  email: Mail,
  report: BarChart3,
  search: Search,
  task: FileText,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export function AgentActivityFeed({ agentId }: { agentId: string }) {
  const { data: metrics, isLoading } = useAgentActivity(agentId);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!metrics || metrics.recentActions.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Este agente ainda não trabalhou"
        description="Assim que ele receber a primeira tarefa, você vê cada ação — chamada de LLM, envio de e-mail, busca — em tempo real."
        action={{
          label: "Dar uma tarefa agora",
          href: "/dashboard?tab=agents",
        }}
        hint="Toda ação vira um trace replayable — bom para auditar e treinar melhor."
        size="sm"
      />
    );
  }

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        {t("agents.recent_activity", { defaultValue: "Atividade Recente" })}
      </h3>
      {metrics.recentActions.map((action: ActivityLog) => {
        const Icon = ACTION_ICONS[action.action_type] || Zap;
        return (
          <div
            key={action.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground leading-snug">{action.action_description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground">{timeAgo(action.created_at)}</span>
                {action.model_used !== "unknown" && (
                  <span className="text-[10px] text-muted-foreground/60">· {action.model_used}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
