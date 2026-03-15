import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play, X, ChevronRight, AlertTriangle, TrendingUp, Bot, Zap, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";

interface BriefingData {
  activeAgents: number;
  totalExecutions: number;
  recentLogs: Array<{ action: string; status: string; agent_name: string; created_at: string }>;
  remainingCredits: number;
  usagePercentage: number;
}

interface ThorDailyBriefingProps {
  data: BriefingData;
  onGoToThor: () => void;
  onDismiss: () => void;
}

const ThorDailyBriefing = ({ data, onGoToThor, onDismiss }: ThorDailyBriefingProps) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { speak, stop: stopSpeaking, isSpeaking } = useElevenLabsTTS({
    onEnd: () => setIsPlaying(false),
  });

  // Check if briefing was already shown today
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastBriefing = localStorage.getItem("clauthor_last_briefing");
    if (lastBriefing !== today) {
      setVisible(true);
    }
  }, []);

  const briefingLines = useMemo(() => {
    const lines: Array<{ icon: React.ElementType; text: string; type: "info" | "success" | "warning" }> = [];
    
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    
    // Agent status
    if (data.activeAgents > 0) {
      lines.push({
        icon: Bot,
        text: `${greeting}! Seus ${data.activeAgents} agentes estão operacionais e prontos.`,
        type: "success"
      });
    } else {
      lines.push({
        icon: Bot,
        text: `${greeting}! Você ainda não tem agentes ativos. Que tal contratar o primeiro?`,
        type: "info"
      });
    }

    // Executions last 24h
    const last24h = data.recentLogs.filter(l => {
      const logDate = new Date(l.created_at);
      return Date.now() - logDate.getTime() < 24 * 60 * 60 * 1000;
    });
    const successCount = last24h.filter(l => l.status === "success").length;
    const failCount = last24h.filter(l => l.status === "error" || l.status === "failed").length;

    if (last24h.length > 0) {
      lines.push({
        icon: Zap,
        text: `Nas últimas 24h: ${last24h.length} execuções, ${successCount} com sucesso${failCount > 0 ? `, ${failCount} com erro` : ""}.`,
        type: failCount > 0 ? "warning" : "success"
      });
    }

    // Credits warning
    if (data.usagePercentage > 80) {
      lines.push({
        icon: AlertTriangle,
        text: `Atenção: ${data.usagePercentage}% dos seus créditos já foram usados. Considere upgrade.`,
        type: "warning"
      });
    } else if (data.remainingCredits > 0) {
      lines.push({
        icon: TrendingUp,
        text: `Você tem ${data.remainingCredits.toLocaleString()} créditos restantes. Tudo sob controle.`,
        type: "info"
      });
    }

    // Top performing agent
    if (last24h.length > 0) {
      const agentCounts: Record<string, number> = {};
      last24h.forEach(l => { agentCounts[l.agent_name] = (agentCounts[l.agent_name] || 0) + 1; });
      const topAgent = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0];
      if (topAgent && topAgent[1] > 1) {
        lines.push({
          icon: Sparkles,
          text: `Agente destaque: ${topAgent[0]} com ${topAgent[1]} execuções. Excelente performance!`,
          type: "success"
        });
      }
    }

    return lines;
  }, [data]);

  // Animate lines appearing one by one
  useEffect(() => {
    if (!visible) return;
    if (currentLine < briefingLines.length) {
      const timer = setTimeout(() => setCurrentLine(prev => prev + 1), 800);
      return () => clearTimeout(timer);
    }
  }, [visible, currentLine, briefingLines.length]);

  const handleDismiss = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("clauthor_last_briefing", today);
    if (isSpeaking) stopSpeaking();
    setVisible(false);
    onDismiss();
  };

  const handlePlayBriefing = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    const fullText = briefingLines.map(l => l.text).join(". ");
    speak(fullText);
  };

  if (!visible || briefingLines.length === 0) return null;

  const typeColors = {
    info: "text-primary/70",
    success: "text-accent-emerald",
    warning: "text-amber-400",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-transparent backdrop-blur-sm p-5 sm:p-6 relative overflow-hidden"
      >
        {/* Decorative line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold">Daily Briefing</h3>
              <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">THOR · {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground/40 hover:text-primary"
              onClick={handlePlayBriefing}
              title={isSpeaking ? "Parar" : "Ouvir briefing"}
            >
              {isSpeaking ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Volume2 className="h-3.5 w-3.5 text-primary" />
                </motion.div>
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground/30 hover:text-muted-foreground"
              onClick={handleDismiss}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Briefing Lines */}
        <div className="space-y-2.5">
          {briefingLines.slice(0, currentLine).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-2.5"
            >
              <line.icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${typeColors[line.type]}`} />
              <p className="text-xs text-muted-foreground leading-relaxed">{line.text}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        {currentLine >= briefingLines.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mt-4 pt-3 border-t border-border/10"
          >
            <button
              onClick={handleDismiss}
              className="text-[10px] font-mono text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-wider"
            >
              {t("dashboard.briefing_dismiss", { defaultValue: "Entendido" })}
            </button>
            <button
              onClick={() => { handleDismiss(); onGoToThor(); }}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium group"
            >
              {t("dashboard.briefing_talk_thor", { defaultValue: "Falar com Thor" })}
              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ThorDailyBriefing;
