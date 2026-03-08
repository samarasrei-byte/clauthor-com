import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Bot, Sparkles, Play, Pause, RotateCcw, 
  MessageSquare, Lightbulb, Target, ListChecks,
  Loader2, Zap, ArrowRight, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MeetingAgent {
  id: string;
  name: string;
  tier: string;
  role: "facilitator" | "analyst" | "executor" | "strategist";
  position: { x: number; y: number };
  isSpeaking: boolean;
  lastMessage?: string;
}

interface MeetingMessage {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  type: "analysis" | "suggestion" | "decision" | "question";
  timestamp: Date;
}

const AGENT_ROLES = {
  facilitator: { label: "Facilitador", color: "primary", icon: Sparkles },
  analyst: { label: "Analista", color: "cyan", icon: Target },
  executor: { label: "Executor", color: "emerald", icon: Zap },
  strategist: { label: "Estrategista", color: "violet", icon: Lightbulb },
};

const MEETING_TOPICS = [
  "Aumentar conversão de leads em 30%",
  "Otimizar atendimento ao cliente",
  "Estratégia de prospecção outbound",
  "Reduzir churn de clientes",
  "Lançamento de novo produto",
];

const HolographicMeetingRoom = () => {
  const { user } = useAuth();
  const [meetingActive, setMeetingActive] = useState(false);
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [speakingAgent, setSpeakingAgent] = useState<string | null>(null);
  const [phase, setPhase] = useState<"setup" | "discussion" | "conclusion">("setup");
  const [actionItems, setActionItems] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["meeting-agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Position agents around the table
  const getAgentPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radiusX = 140;
    const radiusY = 80;
    return {
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle) * radiusY,
    };
  };

  const assignRole = (index: number): MeetingAgent["role"] => {
    const roles: MeetingAgent["role"][] = ["facilitator", "analyst", "executor", "strategist"];
    return roles[index % roles.length];
  };

  const meetingAgents: MeetingAgent[] = agents.map((agent, idx) => ({
    ...agent,
    role: assignRole(idx),
    position: getAgentPosition(idx, agents.length),
    isSpeaking: speakingAgent === agent.id,
  }));

  // Simulate meeting discussion
  const simulateDiscussion = async () => {
    if (!topic || agents.length === 0) return;
    setPhase("discussion");
    
    const discussionPoints = [
      { agentIdx: 0, type: "analysis" as const, content: `Analisando a situação atual: ${topic}. Precisamos considerar os principais indicadores de performance.` },
      { agentIdx: 1, type: "question" as const, content: "Quais são as métricas prioritárias que devemos acompanhar neste objetivo?" },
      { agentIdx: 2, type: "suggestion" as const, content: "Sugiro implementarmos um sistema de automação para agilizar o processo e reduzir erros humanos." },
      { agentIdx: 0, type: "decision" as const, content: "Baseado nos dados, recomendo focarmos em três frentes principais com KPIs específicos." },
      { agentIdx: 3 % agents.length, type: "analysis" as const, content: "Os dados históricos mostram que essa abordagem teve 78% de sucesso em casos similares." },
      { agentIdx: 1, type: "suggestion" as const, content: "Podemos automatizar relatórios semanais para acompanhar o progresso." },
    ];

    for (let i = 0; i < discussionPoints.length; i++) {
      const point = discussionPoints[i];
      const agent = agents[point.agentIdx % agents.length];
      
      setSpeakingAgent(agent.id);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.name,
        content: point.content,
        type: point.type,
        timestamp: new Date(),
      }]);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSpeakingAgent(null);
      await new Promise(resolve => setTimeout(resolve, 500));
        type: point.type,
        timestamp: new Date(),
      }]);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSpeakingAgent(null);
      await new Promise(resolve => setTimeout(resolve: 500));
    }

    // Conclusion
    setPhase("conclusion");
    setActionItems([
      "Implementar sistema de automação de leads",
      "Criar dashboard de métricas em tempo real",
      "Configurar alertas para desvios de KPIs",
      "Agendar revisão semanal de progresso",
    ]);
  };

  const startMeeting = () => {
    if (!topic) return;
    setMeetingActive(true);
    setMessages([]);
    setActionItems([]);
    simulateDiscussion();
  };

  const resetMeeting = () => {
    setMeetingActive(false);
    setPhase("setup");
    setMessages([]);
    setActionItems([]);
    setSpeakingAgent(null);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMessageTypeStyles = (type: MeetingMessage["type"]) => {
    switch (type) {
      case "analysis": return "border-l-cyan-500 bg-cyan-500/5";
      case "suggestion": return "border-l-emerald-500 bg-emerald-500/5";
      case "decision": return "border-l-primary bg-primary/5";
      case "question": return "border-l-amber-500 bg-amber-500/5";
    }
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">War Room</span>
        </div>
        <h1 className="font-display text-3xl font-bold gradient-text mb-2">Mesa de Reunião Holográfica</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Seus agentes de IA discutindo objetivos e estratégias em tempo real
        </p>
      </motion.div>

      {/* Meeting Setup */}
      {!meetingActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto space-y-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Objetivo da Reunião</label>
            <Input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ex: Aumentar conversão de leads em 30%"
              className="bg-accent/20 border-border/30"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {MEETING_TOPICS.map(t => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted/20 border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                {t}
              </button>
            ))}
          </div>

          <Button 
            onClick={startMeeting}
            disabled={!topic || agents.length < 2}
            className="w-full gap-2"
          >
            <Play className="h-4 w-4" />
            Iniciar Reunião ({agents.length} agentes)
          </Button>

          {agents.length < 2 && (
            <p className="text-xs text-center text-muted-foreground">
              Mínimo de 2 agentes ativos necessários para reunião
            </p>
          )}
        </motion.div>
      )}

      {/* Holographic Table */}
      {meetingActive && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-[400px] flex items-center justify-center"
          >
            {/* Table Surface */}
            <div className="absolute w-72 h-40 rounded-[100%] bg-gradient-to-b from-primary/5 to-transparent border border-primary/10">
              {/* Holographic Grid Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 288 160">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--primary) / 0.1)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <ellipse cx="144" cy="80" rx="140" ry="78" fill="url(#grid)" />
              </svg>

              {/* Center Topic Display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-center px-8"
                >
                  <p className="text-[10px] text-primary/60 mb-1">OBJETIVO</p>
                  <p className="text-xs font-medium text-primary line-clamp-2">{topic}</p>
                </motion.div>
              </div>
            </div>

            {/* Agents Around Table */}
            {meetingAgents.map((agent, idx) => {
              const roleInfo = AGENT_ROLES[agent.role];
              const RoleIcon = roleInfo.icon;
              
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: agent.position.x,
                    y: agent.position.y - 40,
                  }}
                  transition={{ delay: idx * 0.1, type: "spring" }}
                  className="absolute"
                >
                  {/* Speaking Indicator */}
                  <AnimatePresence>
                    {agent.isSpeaking && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="absolute -inset-2 rounded-2xl bg-primary/20 blur-md"
                      />
                    )}
                  </AnimatePresence>

                  {/* Agent Avatar */}
                  <motion.div
                    animate={agent.isSpeaking ? { 
                      boxShadow: "0 0 30px hsl(var(--primary) / 0.4)"
                    } : {}}
                    className={cn(
                      "relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300",
                      "border-2 bg-card",
                      agent.isSpeaking ? "border-primary" : "border-border/30"
                    )}
                  >
                    <Bot className={cn(
                      "h-6 w-6 transition-colors",
                      agent.isSpeaking ? "text-primary" : "text-muted-foreground"
                    )} />
                    
                    {/* Role Badge */}
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                      `bg-${roleInfo.color}-500/20 border border-${roleInfo.color}-500/30`
                    )}>
                      <RoleIcon className={cn("h-2.5 w-2.5", `text-${roleInfo.color}-500`)} />
                    </div>
                  </motion.div>

                  {/* Name */}
                  <p className={cn(
                    "absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] transition-colors",
                    agent.isSpeaking ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {agent.name}
                  </p>

                  {/* Energy Lines When Speaking */}
                  {agent.isSpeaking && (
                    <motion.svg
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none"
                    >
                      <motion.circle
                        cx="64" cy="64" r="40"
                        fill="none"
                        stroke="hsl(var(--primary) / 0.3)"
                        strokeWidth="1"
                        strokeDasharray="10,5"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        style={{ transformOrigin: "center" }}
                      />
                    </motion.svg>
                  )}
                </motion.div>
              );
            })}

            {/* Phase Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {["setup", "discussion", "conclusion"].map((p, idx) => (
                <div key={p} className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    phase === p ? "bg-primary" : "bg-muted"
                  )} />
                  {idx < 2 && <div className="w-8 h-px bg-border/30" />}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Discussion Log */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-[400px] rounded-2xl border border-border/20 bg-card/50 overflow-hidden"
          >
            {/* Log Header */}
            <div className="p-4 border-b border-border/20 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-sm">Discussão</h3>
                <p className="text-[10px] text-muted-foreground">{messages.length} mensagens</p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetMeeting} className="h-8 gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Nova Reunião
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-3 rounded-lg border-l-2",
                      getMessageTypeStyles(msg.type)
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{msg.agentName}</span>
                      <Badge variant="secondary" className="text-[8px] px-1.5 py-0">{msg.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{msg.content}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Action Items */}
            {phase === "conclusion" && actionItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-t border-border/20 bg-emerald-500/5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks className="h-4 w-4 text-emerald-500" />
                  <h4 className="text-xs font-semibold text-emerald-500">Plano de Ação Gerado</h4>
                </div>
                <div className="space-y-2">
                  {actionItems.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-2 text-xs"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HolographicMeetingRoom;
