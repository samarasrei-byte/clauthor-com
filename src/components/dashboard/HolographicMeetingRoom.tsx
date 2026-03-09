import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Bot, Sparkles, Play, Pause, RotateCcw, Mic, MicOff,
  MessageSquare, Lightbulb, Target, ListChecks,
  Loader2, Zap, ArrowRight, Check, Volume2, Brain,
  Users, Workflow, BarChart3, Palette, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HolographicAgent {
  id: string;
  name: string;
  specialty: string;
  tier: string;
  role: "ceo" | "sales" | "marketing" | "analytics" | "design" | "automation";
  position: { x: number; y: number; angle: number };
  state: "idle" | "listening" | "processing" | "speaking";
  color: string;
}

interface MeetingMessage {
  id: string;
  agentId: string;
  agentName: string;
  agentRole: string;
  content: string;
  type: "analysis" | "strategy" | "creative" | "action" | "question";
  timestamp: Date;
}

interface ActionItem {
  id: string;
  task: string;
  assignedTo: string;
  priority: "high" | "medium" | "low";
}

const AGENT_ROLES = {
  ceo: { label: "CEO AI", color: "hsl(var(--primary))", icon: Brain, specialty: "Estratégia Geral" },
  sales: { label: "Sales AI", color: "hsl(142, 76%, 36%)", icon: Target, specialty: "Vendas & Prospecção" },
  marketing: { label: "Marketing AI", color: "hsl(280, 70%, 50%)", icon: Sparkles, specialty: "Campanhas & Branding" },
  analytics: { label: "Data Analyst AI", color: "hsl(200, 80%, 50%)", icon: BarChart3, specialty: "Análise de Dados" },
  design: { label: "Design AI", color: "hsl(330, 70%, 50%)", icon: Palette, specialty: "Criação Visual" },
  automation: { label: "Automation AI", color: "hsl(45, 90%, 50%)", icon: Workflow, specialty: "Automação & Processos" },
};

// Floating particle component
const FloatingParticle = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-primary/30"
    initial={{ 
      x: Math.random() * 100 - 50, 
      y: 100,
      opacity: 0 
    }}
    animate={{ 
      y: -100,
      opacity: [0, 0.6, 0],
      x: Math.random() * 100 - 50 
    }}
    transition={{ 
      duration: 4 + Math.random() * 2,
      delay,
      repeat: Infinity,
      ease: "linear"
    }}
  />
);

// Holographic silhouette component
const HolographicSilhouette = ({ 
  agent, 
  isActive,
  onClick 
}: { 
  agent: HolographicAgent; 
  isActive: boolean;
  onClick: () => void;
}) => {
  const roleInfo = AGENT_ROLES[agent.role];
  const Icon = roleInfo.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: agent.position.x,
        y: agent.position.y,
      }}
      transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
      onClick={onClick}
      className="absolute cursor-pointer group"
      style={{ transformOrigin: "center" }}
    >
      {/* Holographic glow base */}
      <motion.div
        className="absolute inset-0 -m-4 rounded-full blur-xl"
        style={{ backgroundColor: `${roleInfo.color}` }}
        animate={{
          opacity: agent.state === "speaking" ? [0.3, 0.5, 0.3] : 
                   agent.state === "processing" ? [0.1, 0.3, 0.1] : 0.1,
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Energy pulse rings */}
      {agent.state === "speaking" && (
        <>
          <motion.div
            className="absolute inset-0 -m-8 rounded-full border"
            style={{ borderColor: roleInfo.color }}
            animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 -m-6 rounded-full border"
            style={{ borderColor: roleInfo.color }}
            animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}

      {/* Processing energy lines */}
      {agent.state === "processing" && (
        <svg className="absolute -inset-6 w-24 h-24 pointer-events-none">
          <motion.circle
            cx="48" cy="48" r="36"
            fill="none"
            stroke={roleInfo.color}
            strokeWidth="1"
            strokeDasharray="8,6"
            opacity={0.5}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "center" }}
          />
          <motion.circle
            cx="48" cy="48" r="28"
            fill="none"
            stroke={roleInfo.color}
            strokeWidth="0.5"
            strokeDasharray="4,4"
            opacity={0.3}
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "center" }}
          />
        </svg>
      )}

      {/* Main silhouette body */}
      <motion.div
        className={cn(
          "relative w-16 h-20 flex flex-col items-center justify-center",
          "transition-all duration-500"
        )}
        animate={{
          filter: agent.state === "speaking" 
            ? "drop-shadow(0 0 20px currentColor)" 
            : "none"
        }}
      >
        {/* Head - glowing orb */}
        <motion.div
          className="relative w-8 h-8 rounded-full flex items-center justify-center"
          style={{ 
            background: `radial-gradient(circle at 30% 30%, ${roleInfo.color}, transparent 70%)`,
            boxShadow: agent.state === "speaking" 
              ? `0 0 30px ${roleInfo.color}, inset 0 0 20px rgba(255,255,255,0.2)` 
              : `0 0 15px ${roleInfo.color}50`
          }}
          animate={{
            scale: agent.state === "speaking" ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.8, repeat: agent.state === "speaking" ? Infinity : 0 }}
        >
          <Icon className="w-4 h-4 text-white/90" />
        </motion.div>

        {/* Body - particle light form */}
        <motion.div
          className="relative w-10 h-10 mt-1"
          style={{
            background: `linear-gradient(180deg, ${roleInfo.color}40 0%, transparent 100%)`,
            clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)",
          }}
        >
          {/* Inner energy particles */}
          {agent.state === "speaking" && (
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 h-0.5 rounded-full bg-white"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${10 + Math.random() * 80}%`,
                  }}
                  animate={{
                    y: [-2, 2, -2],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8 + Math.random() * 0.4,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Floating name tag */}
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
          animate={{
            y: [0, -2, 0],
            opacity: agent.state === "speaking" ? 1 : 0.7
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div 
            className="px-2 py-0.5 rounded text-[9px] font-medium backdrop-blur-sm border"
            style={{ 
              backgroundColor: `${roleInfo.color}15`,
              borderColor: `${roleInfo.color}30`,
              color: roleInfo.color
            }}
          >
            {roleInfo.label}
          </div>
        </motion.div>
      </motion.div>

      {/* Speaking indicator waves */}
      {agent.state === "speaking" && (
        <motion.div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-0.5 rounded-full"
              style={{ backgroundColor: roleInfo.color }}
              animate={{ height: [4, 12, 4] }}
              transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

// Connection line between agents
const ConnectionLine = ({ 
  from, 
  to, 
  active 
}: { 
  from: { x: number; y: number }; 
  to: { x: number; y: number };
  active: boolean;
}) => {
  const centerX = 0;
  const centerY = -20;
  
  return (
    <svg 
      className="absolute pointer-events-none" 
      style={{ 
        left: '50%', 
        top: '50%',
        width: 400,
        height: 300,
        marginLeft: -200,
        marginTop: -150,
        overflow: 'visible'
      }}
    >
      <defs>
        <linearGradient id={`lineGrad-${from.x}-${to.x}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={active ? 0.6 : 0.1} />
          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={active ? 0.8 : 0.2} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={active ? 0.6 : 0.1} />
        </linearGradient>
      </defs>
      <motion.path
        d={`M ${200 + from.x} ${150 + from.y} Q ${200 + centerX} ${150 + centerY} ${200 + to.x} ${150 + to.y}`}
        fill="none"
        stroke={`url(#lineGrad-${from.x}-${to.x})`}
        strokeWidth={active ? 2 : 1}
        strokeDasharray={active ? "none" : "4,4"}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      {active && (
        <motion.circle
          r="3"
          fill="hsl(var(--primary))"
          filter="url(#glow)"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
            offsetDistance: ["0%", "100%"],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ offsetPath: `path('M ${200 + from.x} ${150 + from.y} Q ${200 + centerX} ${150 + centerY} ${200 + to.x} ${150 + to.y}')` }}
        />
      )}
    </svg>
  );
};

const HolographicMeetingRoom = () => {
  const { user } = useAuth();
  const [meetingActive, setMeetingActive] = useState(false);
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [speakingAgentId, setSpeakingAgentId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"setup" | "discussion" | "planning" | "conclusion">("setup");
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const { data: dbAgents = [], isLoading } = useQuery({
    queryKey: ["holographic-meeting-agents", user?.id],
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

  // Map database agents to holographic agents with positions
  const getAgentPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radiusX = 160;
    const radiusY = 100;
    return {
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle) * radiusY,
      angle: (angle * 180) / Math.PI,
    };
  };

  const assignRole = (name: string, index: number): HolographicAgent["role"] => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("ceo") || nameLower.includes("chief")) return "ceo";
    if (nameLower.includes("sales") || nameLower.includes("vend")) return "sales";
    if (nameLower.includes("market")) return "marketing";
    if (nameLower.includes("data") || nameLower.includes("analy")) return "analytics";
    if (nameLower.includes("design") || nameLower.includes("creat")) return "design";
    if (nameLower.includes("auto") || nameLower.includes("process")) return "automation";
    
    const roles: HolographicAgent["role"][] = ["ceo", "sales", "marketing", "analytics", "design", "automation"];
    return roles[index % roles.length];
  };

  const holographicAgents: HolographicAgent[] = dbAgents.map((agent, idx) => {
    const role = assignRole(agent.name, idx);
    return {
      id: agent.id,
      name: agent.name,
      specialty: AGENT_ROLES[role].specialty,
      tier: agent.tier,
      role,
      position: getAgentPosition(idx, dbAgents.length),
      state: speakingAgentId === agent.id ? "speaking" : 
             selectedAgents.includes(agent.id) ? "processing" : "idle",
      color: AGENT_ROLES[role].color,
    };
  });

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setTopic(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Select relevant agents based on topic
  const selectRelevantAgents = (topic: string) => {
    const topicLower = topic.toLowerCase();
    const relevant: string[] = [];
    
    holographicAgents.forEach(agent => {
      if (topicLower.includes("campanha") || topicLower.includes("marketing")) {
        if (["marketing", "design", "automation"].includes(agent.role)) relevant.push(agent.id);
      }
      if (topicLower.includes("venda") || topicLower.includes("lead") || topicLower.includes("conversão")) {
        if (["sales", "analytics", "automation"].includes(agent.role)) relevant.push(agent.id);
      }
      if (topicLower.includes("dados") || topicLower.includes("análise") || topicLower.includes("métrica")) {
        if (["analytics", "ceo"].includes(agent.role)) relevant.push(agent.id);
      }
      if (topicLower.includes("design") || topicLower.includes("visual") || topicLower.includes("criativo")) {
        if (["design", "marketing"].includes(agent.role)) relevant.push(agent.id);
      }
      if (topicLower.includes("automação") || topicLower.includes("processo") || topicLower.includes("workflow")) {
        if (["automation", "analytics"].includes(agent.role)) relevant.push(agent.id);
      }
    });

    // Always include CEO if no specific matches or for strategy
    const ceoAgent = holographicAgents.find(a => a.role === "ceo");
    if (ceoAgent && !relevant.includes(ceoAgent.id)) {
      relevant.unshift(ceoAgent.id);
    }

    // Ensure at least 3 agents if available
    if (relevant.length < 3) {
      holographicAgents.forEach(agent => {
        if (!relevant.includes(agent.id) && relevant.length < 3) {
          relevant.push(agent.id);
        }
      });
    }

    return [...new Set(relevant)].slice(0, 4);
  };

  // Simulate the meeting discussion
  const runMeetingSimulation = async () => {
    if (!topic || holographicAgents.length === 0) return;
    
    const relevantIds = selectRelevantAgents(topic);
    setSelectedAgents(relevantIds);
    setPhase("discussion");
    
    await new Promise(r => setTimeout(r, 1500));

    const relevantAgents = holographicAgents.filter(a => relevantIds.includes(a.id));
    
    const discussionScript: Array<{
      agentRole: HolographicAgent["role"];
      type: MeetingMessage["type"];
      content: string;
    }> = [
      { 
        agentRole: "ceo", 
        type: "analysis", 
        content: `Analisando o objetivo: "${topic}". Vamos estruturar uma abordagem coordenada para maximizar resultados.` 
      },
      { 
        agentRole: "analytics", 
        type: "analysis", 
        content: "Com base nos dados históricos, identifico padrões que indicam oportunidades de otimização significativas." 
      },
      { 
        agentRole: "marketing", 
        type: "strategy", 
        content: "Sugiro uma estratégia multicanal focada em engajamento. Podemos criar uma narrativa que ressoe com nosso público-alvo." 
      },
      { 
        agentRole: "sales", 
        type: "strategy", 
        content: "Do ponto de vista comercial, recomendo integrar pontos de conversão em cada etapa do funil." 
      },
      { 
        agentRole: "design", 
        type: "creative", 
        content: "Vou desenvolver conceitos visuais que comuniquem a proposta de valor de forma clara e impactante." 
      },
      { 
        agentRole: "automation", 
        type: "action", 
        content: "Posso configurar automações para escalar a execução e garantir consistência em todos os pontos de contato." 
      },
      { 
        agentRole: "ceo", 
        type: "action", 
        content: "Excelente colaboração. Vou consolidar as estratégias em um plano de ação executável com métricas claras de sucesso." 
      },
    ];

    for (const script of discussionScript) {
      const agent = relevantAgents.find(a => a.role === script.agentRole) || relevantAgents[0];
      if (!agent) continue;

      setSpeakingAgentId(agent.id);
      await new Promise(r => setTimeout(r, 600));

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-${Math.random()}`,
        agentId: agent.id,
        agentName: agent.name,
        agentRole: AGENT_ROLES[agent.role].label,
        content: script.content,
        type: script.type,
        timestamp: new Date(),
      }]);

      await new Promise(r => setTimeout(r, 2000));
      setSpeakingAgentId(null);
      await new Promise(r => setTimeout(r, 400));
    }

    // Planning phase
    setPhase("planning");
    await new Promise(r => setTimeout(r, 1000));

    // Generate action items
    setPhase("conclusion");
    setActionItems([
      { id: "1", task: "Criar estratégia de campanha multicanal", assignedTo: "Marketing AI", priority: "high" },
      { id: "2", task: "Desenvolver assets visuais e criativos", assignedTo: "Design AI", priority: "high" },
      { id: "3", task: "Configurar funil de conversão automatizado", assignedTo: "Automation AI", priority: "medium" },
      { id: "4", task: "Implementar dashboard de métricas em tempo real", assignedTo: "Data Analyst AI", priority: "medium" },
      { id: "5", task: "Estruturar sequência de follow-up para leads", assignedTo: "Sales AI", priority: "high" },
    ]);
  };

  const startMeeting = () => {
    if (!topic) return;
    setMeetingActive(true);
    setMessages([]);
    setActionItems([]);
    runMeetingSimulation();
  };

  const resetMeeting = () => {
    setMeetingActive(false);
    setPhase("setup");
    setMessages([]);
    setActionItems([]);
    setSpeakingAgentId(null);
    setSelectedAgents([]);
    setTopic("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMessageStyles = (type: MeetingMessage["type"]) => {
    switch (type) {
      case "analysis": return "border-l-blue-500 bg-blue-500/5";
      case "strategy": return "border-l-violet-500 bg-violet-500/5";
      case "creative": return "border-l-pink-500 bg-pink-500/5";
      case "action": return "border-l-emerald-500 bg-emerald-500/5";
      case "question": return "border-l-amber-500 bg-amber-500/5";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "medium": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "low": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-muted text-muted-foreground";
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
    <div className="relative min-h-[85vh] bg-gradient-to-b from-background via-background to-black/50 overflow-hidden">
      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.3} />
        ))}
      </div>

      {/* Top gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Sala de Estratégia IA</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-2">
            Mesa de Reunião Holográfica
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Convoque seu time executivo de inteligência artificial para reuniões estratégicas
          </p>
        </motion.div>

        {/* Meeting Setup */}
        <AnimatePresence mode="wait">
          {!meetingActive ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              {/* Voice/Text Input */}
              <div className="relative">
                <Textarea
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Descreva seu objetivo... Ex: 'Quero criar uma campanha para a Copa do Mundo'"
                  className="min-h-[100px] bg-card/30 backdrop-blur-sm border-border/30 focus:border-primary/50 resize-none pr-14"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoiceInput}
                  className={cn(
                    "absolute right-2 top-2 h-10 w-10 rounded-full",
                    isListening && "bg-primary/20 text-primary animate-pulse"
                  )}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Lançar novo produto",
                  "Aumentar conversão de leads",
                  "Campanha Black Friday",
                  "Reduzir churn de clientes"
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setTopic(suggestion)}
                    className="text-xs px-4 py-2 rounded-full bg-card/50 border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Start button */}
              <div className="text-center">
                <Button
                  onClick={startMeeting}
                  disabled={!topic || holographicAgents.length < 2}
                  size="lg"
                  className="gap-3 px-8 py-6 text-base rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                >
                  <Play className="h-5 w-5" />
                  Iniciar Reunião com {holographicAgents.length} Agentes
                </Button>
                {holographicAgents.length < 2 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Mínimo de 2 agentes ativos necessários
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="meeting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-6"
            >
              {/* Holographic Table - Main Area */}
              <div className="lg:col-span-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative h-[500px] flex items-center justify-center rounded-3xl border border-border/20 bg-gradient-to-b from-card/20 to-transparent backdrop-blur-sm overflow-hidden"
                >
                  {/* Grid floor effect */}
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: '50px 50px',
                      perspective: '500px',
                      transform: 'rotateX(60deg) translateY(100px)',
                    }}
                  />

                  {/* Central holographic table */}
                  <div className="absolute w-80 h-48 rounded-[100%] bg-gradient-to-b from-primary/10 to-transparent border border-primary/20">
                    {/* Glass surface effect */}
                    <div className="absolute inset-0 rounded-[100%] bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
                    
                    {/* Center topic display */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="text-center px-12"
                      >
                        <p className="text-[10px] text-primary/60 uppercase tracking-wider mb-2">Objetivo da Reunião</p>
                        <p className="text-sm font-medium text-primary line-clamp-3">{topic}</p>
                      </motion.div>
                    </div>

                    {/* Phase progress indicator */}
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      {[
                        { key: "setup", label: "Início" },
                        { key: "discussion", label: "Discussão" },
                        { key: "planning", label: "Planejamento" },
                        { key: "conclusion", label: "Conclusão" },
                      ].map((p, idx) => (
                        <div key={p.key} className="flex items-center gap-2">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all duration-500",
                            phase === p.key || 
                            (phase === "conclusion" && idx <= 3) ||
                            (phase === "planning" && idx <= 2) ||
                            (phase === "discussion" && idx <= 1)
                              ? "bg-primary shadow-lg shadow-primary/50" 
                              : "bg-muted/50"
                          )} />
                          {idx < 3 && (
                            <div className={cn(
                              "w-8 h-0.5 transition-colors duration-500",
                              phase === "conclusion" || 
                              (phase === "planning" && idx < 2) ||
                              (phase === "discussion" && idx < 1)
                                ? "bg-primary/50" 
                                : "bg-border/30"
                            )} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connection lines between selected agents */}
                  {selectedAgents.length > 1 && holographicAgents
                    .filter(a => selectedAgents.includes(a.id))
                    .slice(0, -1)
                    .map((agent, idx) => {
                      const nextAgent = holographicAgents.filter(a => selectedAgents.includes(a.id))[idx + 1];
                      if (!nextAgent) return null;
                      return (
                        <ConnectionLine
                          key={`${agent.id}-${nextAgent.id}`}
                          from={agent.position}
                          to={nextAgent.position}
                          active={speakingAgentId === agent.id || speakingAgentId === nextAgent.id}
                        />
                      );
                    })}

                  {/* Holographic agents around table */}
                  {holographicAgents.map(agent => (
                    <HolographicSilhouette
                      key={agent.id}
                      agent={{
                        ...agent,
                        state: speakingAgentId === agent.id ? "speaking" : 
                               selectedAgents.includes(agent.id) ? "processing" : "idle"
                      }}
                      isActive={selectedAgents.includes(agent.id)}
                      onClick={() => {}}
                    />
                  ))}

                  {/* Reset button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetMeeting}
                    className="absolute top-4 right-4 gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Nova Reunião
                  </Button>
                </motion.div>
              </div>

              {/* Discussion Panel */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="h-[500px] flex flex-col rounded-2xl border border-border/20 bg-card/30 backdrop-blur-sm overflow-hidden"
                >
                  {/* Panel header */}
                  <div className="p-4 border-b border-border/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        phase === "discussion" ? "bg-emerald-400 animate-pulse" : "bg-muted"
                      )} />
                      <div>
                        <h3 className="font-display font-semibold text-sm">Discussão em Tempo Real</h3>
                        <p className="text-[10px] text-muted-foreground">{messages.length} contribuições</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[9px]">
                      {selectedAgents.length} agentes
                    </Badge>
                  </div>

                  {/* Messages stream */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <AnimatePresence mode="popLayout">
                      {messages.map(msg => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={cn(
                            "p-3 rounded-xl border-l-2",
                            getMessageStyles(msg.type)
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-semibold">{msg.agentRole}</span>
                            <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-border/30">
                              {msg.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{msg.content}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Action Items Panel */}
                  <AnimatePresence>
                    {phase === "conclusion" && actionItems.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border-t border-border/20 bg-emerald-500/5 max-h-[200px] overflow-y-auto"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <ListChecks className="h-4 w-4 text-emerald-500" />
                          <h4 className="text-xs font-semibold text-emerald-500">Plano de Ação Gerado</h4>
                        </div>
                        <div className="space-y-2">
                          {actionItems.map((item, idx) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-start gap-2 p-2 rounded-lg bg-background/50"
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-foreground">{item.task}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-muted-foreground">{item.assignedTo}</span>
                                  <Badge className={cn("text-[8px] px-1.5 py-0 h-4", getPriorityColor(item.priority))}>
                                    {item.priority}
                                  </Badge>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HolographicMeetingRoom;
