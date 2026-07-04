import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bot, Zap, MessageSquare, Activity, Eye, Settings2, Play, Pause, MoreHorizontal, TrendingUp, Clock, Users2, Loader2 } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  tier: string;
  status: string;
  total_executions: number;
  objective?: string;
  description?: string;
}

const AUTONOMY_LEVELS = {
  observer: { label: "Observador", color: "muted", desc: "Apenas monitora" },
  assistant: { label: "Assistente", color: "cyan", desc: "Sugere ações" },
  executor: { label: "Executor", color: "emerald", desc: "Executa com aprovação" },
  autonomous: { label: "Autônomo", color: "primary", desc: "Decisões independentes" },
};

const AgentRoom = () => {
  const { user } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "room">("room");

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["agent-room-agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const tierColors: Record<string, string> = {
    basic: "from-muted to-muted",
    intermediate: "from-cyan-500 to-cyan-600",
    advanced: "from-emerald-500 to-emerald-600",
    enterprise: "from-primary to-primary-glow",
  };

  const getRandomAutonomy = () => {
    const levels = Object.keys(AUTONOMY_LEVELS);
    return levels[Math.floor(Math.random() * levels.length)] as keyof typeof AUTONOMY_LEVELS;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Users2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Sua Equipe de IA</span>
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text mb-2">Sala Digital de Agentes</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {agents.length} membros ativos na sua equipe autônoma
          </p>
        </motion.div>
      </div>

      {/* Room View - Circular Agent Layout */}
      <div className="relative min-h-[500px] flex items-center justify-center">
        {/* Central Orb */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
        >
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 20px hsl(var(--primary) / 0.2)",
                "0 0 40px hsl(var(--primary) / 0.4)",
                "0 0 20px hsl(var(--primary) / 0.2)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center"
          >
            <Sparkles className="h-8 w-8 text-white" />
          </motion.div>
          
          {/* Pulse Rings */}
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border border-primary/30"
          />
          <motion.div
            animate={{ scale: [1, 1.8], opacity: [0.2, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute inset-0 rounded-full border border-primary/20"
          />
        </motion.div>

        {/* Agents in Circle */}
        {agents.map((agent, idx) => {
          const totalAgents = agents.length;
          const angle = (idx / totalAgents) * 2 * Math.PI - Math.PI / 2;
          const radius = Math.min(180, 100 + totalAgents * 15);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isSelected = selectedAgent === agent.id;
          const autonomy = getRandomAutonomy();
          const autonomyInfo = AUTONOMY_LEVELS[autonomy];

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x,
                y,
              }}
              transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
              onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
              className="absolute cursor-pointer group"
            >
              {/* Connection Line to Center */}
              {agent.status === "active" && (
                <svg className="absolute pointer-events-none" style={{ 
                  width: Math.abs(x) + 60, 
                  height: Math.abs(y) + 60,
                  left: x > 0 ? -30 : x - 30,
                  top: y > 0 ? -30 : y - 30,
                }}>
                  <motion.line
                    x1={x > 0 ? 30 : Math.abs(x) + 30}
                    y1={y > 0 ? 30 : Math.abs(y) + 30}
                    x2={x > 0 ? Math.abs(x) + 30 : 30}
                    y2={y > 0 ? Math.abs(y) + 30 : 30}
                    stroke="hsl(var(--primary) / 0.2)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                </svg>
              )}

              {/* Agent Avatar */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={cn(
                  "relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                  "border-2",
                  isSelected ? "border-primary shadow-[0_0_30px_hsl(var(--primary)/0.3)]" : "border-border/30",
                  agent.status === "active" 
                    ? `bg-gradient-to-br ${tierColors[agent.tier] || tierColors.basic}` 
                    : "bg-muted/30"
                )}
              >
                <Bot className={cn(
                  "h-7 w-7",
                  agent.status === "active" ? "text-white" : "text-muted-foreground"
                )} />
                
                {/* Activity Indicator */}
                {agent.status === "active" && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center"
                  >
                    <Activity className="h-2 w-2 text-white" />
                  </motion.div>
                )}
              </motion.div>

              {/* Agent Name */}
              <div className={cn(
                "absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-300",
                isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-100"
              )}>
                <p className="text-xs font-medium text-center">{agent.name}</p>
                <p className="text-[10px] text-muted-foreground text-center capitalize">{agent.tier}</p>
              </div>

              {/* Expanded Info Panel */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute top-full mt-12 left-1/2 -translate-x-1/2 w-64 p-4 rounded-xl bg-card/95 backdrop-blur-xl border border-border/30 shadow-2xl z-50"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        `bg-gradient-to-br ${tierColors[agent.tier] || tierColors.basic}`
                      )}>
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{agent.name}</p>
                        <Badge variant="secondary" className="text-[9px] mt-0.5">{agent.tier}</Badge>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-muted/20">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                          <Zap className="h-3 w-3" />
                          <span className="text-[9px]">Execuções</span>
                        </div>
                        <p className="text-sm font-semibold">{agent.total_executions}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/20">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-[9px]">Autonomia</span>
                        </div>
                        <p className={cn("text-sm font-semibold", `text-${autonomyInfo.color}-500`)}>
                          {autonomyInfo.label}
                        </p>
                      </div>
                    </div>

                    {/* Objective */}
                    {agent.objective && (
                      <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">
                        {agent.objective}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 h-8 text-xs gap-1.5">
                        <MessageSquare className="h-3 w-3" />
                        Conversar
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Empty State */}
        {agents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
              <Bot className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">Sala Vazia</h3>
            <p className="text-muted-foreground text-sm mb-4">Crie seu primeiro agente para começar</p>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Criar Agente
            </Button>
          </motion.div>
        )}
      </div>

      {/* Active Agents Status Bar */}
      {agents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: "Agentes Ativos", value: agents.filter(a => a.status === "active").length, icon: Activity, color: "emerald" },
            { label: "Total Execuções", value: agents.reduce((acc, a) => acc + a.total_executions, 0), icon: Zap, color: "primary" },
            { label: "Em Modo Autônomo", value: Math.floor(agents.length * 0.6), icon: Bot, color: "cyan" },
            { label: "Conversas Hoje", value: Math.floor(Math.random() * 50) + 10, icon: MessageSquare, color: "violet" },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              className="p-4 rounded-xl bg-card/50 border border-border/20"
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <stat.icon className={cn("h-4 w-4", `text-${stat.color}-500`)} />
                <span className="text-[11px]">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold font-display">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AgentRoom;
