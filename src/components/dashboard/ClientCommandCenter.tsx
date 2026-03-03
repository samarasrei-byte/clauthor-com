import { motion } from "framer-motion";
import { Sparkles, Plus, ArrowRight, Bot, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GettingStartedGuide from "./GettingStartedGuide";
import AgentSummaryCards from "./AgentSummaryCards";
import ConsolidatedMetrics from "./ConsolidatedMetrics";
import SmartActivityFeed from "./SmartActivityFeed";

interface ClientCommandCenterProps {
  activeAgents: number;
  totalExecutions: number;
  totalTokensUsed: number;
  usagePercentage: number;
  estimatedSavings: number;
  credits: any;
  remainingCredits: number;
  agents: any[];
  subscriptions: any[];
  recentLogs: any[];
  tokenUsage: any[];
  onNavigate?: (section: string) => void;
}

/** Empty state hero — shows when user has 0 agents */
const EmptyStateHero = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl p-8 sm:p-12 border border-primary/10 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent text-center relative overflow-hidden"
    >
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="relative"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>

        <h2 className="text-xl sm:text-2xl font-display font-bold mb-2">
          {t("dashboard.empty_hero_title", { defaultValue: "Seu primeiro agente de IA está a um clique" })}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          {t("dashboard.empty_hero_desc", { defaultValue: "Escolha um agente especializado na biblioteca, configure em minutos e veja resultados reais. Sem código, sem complicação." })}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/library">
            <Button className="glow gap-2 px-6">
              <Bot className="h-4 w-4" />
              {t("dashboard.explore_library", { defaultValue: "Explorar Biblioteca" })}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/create-agent">
            <Button variant="outline" className="gap-2 border-border/40">
              <Plus className="h-4 w-4" />
              {t("dashboard.create_custom", { defaultValue: "Criar agente personalizado" })}
            </Button>
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-border/20">
          {[
            { icon: Bot, label: t("dashboard.proof_agents", { defaultValue: "50+ agentes prontos" }) },
            { icon: Zap, label: t("dashboard.proof_executions", { defaultValue: "Setup em 3 min" }) },
            { icon: Target, label: t("dashboard.proof_roi", { defaultValue: "ROI desde o dia 1" }) },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <item.icon className="h-3 w-3 text-primary/60" />
              {item.label}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

const ClientCommandCenter = ({
  activeAgents,
  totalExecutions,
  totalTokensUsed,
  usagePercentage,
  estimatedSavings,
  credits,
  remainingCredits,
  agents,
  subscriptions,
  recentLogs,
  tokenUsage,
  onNavigate,
}: ClientCommandCenterProps) => {
  const successLogs = recentLogs.filter((l: any) => l.status === "success").length;
  const successRate = recentLogs.length > 0 ? Math.round((successLogs / recentLogs.length) * 100) : 100;

  const hasAgents = activeAgents > 0;
  const isNewUser = !hasAgents && recentLogs.length === 0;

  return (
    <div className="space-y-5">
      {/* Getting Started — only for users with partial setup */}
      {!isNewUser && (
        <GettingStartedGuide
          hasAgents={hasAgents}
          hasSentMessage={recentLogs.length > 0}
          hasConfiguredAgent={agents.some((a: any) =>
            (Array.isArray(a.integrations) ? a.integrations.length > 0 : !!a.integrations) ||
            (Array.isArray(a.channels) ? a.channels.length > 0 : !!a.channels)
          )}
          onNavigate={onNavigate}
        />
      )}

      {/* CONTEXTUAL: New user gets epic empty state */}
      {isNewUser && <EmptyStateHero />}

      {/* CONTEXTUAL: Active users get consolidated metrics */}
      {hasAgents && (
        <>
          <ConsolidatedMetrics
            activeAgents={activeAgents}
            totalExecutions={totalExecutions}
            totalTokensUsed={totalTokensUsed}
            usagePercentage={usagePercentage}
            estimatedSavings={estimatedSavings}
            credits={credits}
            remainingCredits={remainingCredits}
            recentLogs={recentLogs}
            successRate={successRate}
          />

          <AgentSummaryCards
            agents={agents}
            onChatWith={(agentId) => {
              if (onNavigate) onNavigate(`agent-chat-${agentId}`);
            }}
          />

          <SmartActivityFeed
            logs={recentLogs}
            agents={agents.map((a) => ({ id: a.id, name: a.name }))}
          />
        </>
      )}

      {/* Users with NO agents but some logs (edge case) */}
      {!hasAgents && !isNewUser && (
        <EmptyStateHero />
      )}
    </div>
  );
};

export default ClientCommandCenter;
