import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Bot, Sparkles, Play, RotateCcw, Mic, MicOff,
  Send, Lightbulb, Target, ListChecks,
  Loader2, Zap, Brain, Users, Workflow, BarChart3,
  Palette, ChevronRight, Volume2, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface HolographicAgent {
  id: string;
  name: string;
  specialty: string;
  role: "ceo" | "sales" | "marketing" | "analytics" | "design" | "automation";
  state: "idle" | "listening" | "processing" | "speaking";
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

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */

const AGENT_ROLES: Record<
  HolographicAgent["role"],
  { label: string; color: string; icon: typeof Brain; specialty: string }
> = {
  ceo: { label: "CEO AI", color: "hsl(var(--primary))", icon: Brain, specialty: "Estratégia Geral" },
  sales: { label: "Sales AI", color: "hsl(142 76% 36%)", icon: Target, specialty: "Vendas & Prospecção" },
  marketing: { label: "Marketing AI", color: "hsl(280 70% 50%)", icon: Sparkles, specialty: "Campanhas & Branding" },
  analytics: { label: "Data Analyst AI", color: "hsl(200 80% 50%)", icon: BarChart3, specialty: "Análise de Dados" },
  design: { label: "Design AI", color: "hsl(330 70% 50%)", icon: Palette, specialty: "Criação Visual" },
  automation: { label: "Automation AI", color: "hsl(45 90% 50%)", icon: Workflow, specialty: "Automação" },
};

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════ */

/** Floating particle for ambient effect */
const AmbientParticle = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-primary/30"
    style={{ left: `${Math.random() * 100}%`, bottom: 0 }}
    animate={{ y: [0, -600], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
    transition={{ duration: 8 + Math.random() * 4, delay, repeat: Infinity, ease: "linear" }}
  />
);

/** Holographic agent silhouette sitting at the table */
const AgentHologram = ({
  agent,
  position,
  isActive,
  isSpeaking,
}: {
  agent: HolographicAgent;
  position: { x: number; y: number; scale: number };
  isActive: boolean;
  isSpeaking: boolean;
}) => {
  const roleInfo = AGENT_ROLES[agent.role];
  const Icon = roleInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ 
        opacity: isActive ? 1 : 0.3, 
        scale: 1, 
        y: 0,
        x: position.x,
      }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="absolute flex flex-col items-center"
      style={{ 
        bottom: `${position.y}%`,
        left: "50%",
        transform: `translateX(-50%) scale(${position.scale})`,
        zIndex: isSpeaking ? 50 : Math.round(position.scale * 30),
      }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute -inset-8 rounded-full blur-2xl pointer-events-none"
        style={{ backgroundColor: roleInfo.color }}
        animate={{
          opacity: isSpeaking ? [0.3, 0.6, 0.3] : isActive ? [0.1, 0.2, 0.1] : 0.05,
          scale: isSpeaking ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: isSpeaking ? 1 : 2, repeat: Infinity }}
      />

      {/* Speaking pulse rings */}
      {isSpeaking && (
        <>
          {[0, 0.3, 0.6].map((d) => (
            <motion.div
              key={d}
              className="absolute -inset-4 rounded-full border-2 pointer-events-none"
              style={{ borderColor: roleInfo.color }}
              animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: d }}
            />
          ))}
        </>
      )}

      {/* Head orb */}
      <motion.div
        className="relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${roleInfo.color}, ${roleInfo.color}60 50%, transparent 80%)`,
          boxShadow: isSpeaking
            ? `0 0 60px ${roleInfo.color}, 0 0 120px ${roleInfo.color}50`
            : `0 0 30px ${roleInfo.color}40`,
        }}
        animate={{
          scale: isSpeaking ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.6, repeat: isSpeaking ? Infinity : 0 }}
      >
        <Icon className="w-7 h-7 md:w-9 md:h-9 text-white/90" strokeWidth={1.5} />

        {/* Speaking particles */}
        {isSpeaking && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-white/80"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${10 + Math.random() * 80}%`,
                }}
                animate={{ opacity: [0, 1, 0], scale: [0.3, 1.5, 0.3] }}
                transition={{ duration: 0.5 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </>
        )}
      </motion.div>

      {/* Body silhouette */}
      <motion.div
        className="w-14 h-12 md:w-18 md:h-14 -mt-2"
        style={{
          background: `linear-gradient(180deg, ${roleInfo.color}50 0%, ${roleInfo.color}10 50%, transparent 100%)`,
          clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)",
        }}
      />

      {/* Name badge */}
      <motion.div
        className="mt-3 text-center"
        animate={{ y: isSpeaking ? [0, -4, 0] : 0 }}
        transition={{ duration: 0.8, repeat: isSpeaking ? Infinity : 0 }}
      >
        <span
          className="inline-block px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold tracking-wide backdrop-blur-xl border"
          style={{
            backgroundColor: `${roleInfo.color}20`,
            borderColor: `${roleInfo.color}40`,
            color: roleInfo.color,
            boxShadow: isSpeaking ? `0 0 20px ${roleInfo.color}30` : "none",
          }}
        >
          {roleInfo.label}
        </span>
      </motion.div>

      {/* Speaking waveform */}
      {isSpeaking && (
        <div className="flex justify-center gap-[3px] mt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full"
              style={{ backgroundColor: roleInfo.color }}
              animate={{ height: [4, 16, 4] }}
              transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

/** Energy connection line between collaborating agents */
const CollaborationLine = ({
  from,
  to,
  active,
  color,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  active: boolean;
  color: string;
}) => {
  const midY = (from.y + to.y) / 2 + 15;

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 5 }}>
      <motion.path
        d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${midY * 0.8} ${to.x} ${to.y}`}
        fill="none"
        stroke={active ? color : "hsl(var(--border))"}
        strokeWidth={active ? 2 : 0.5}
        strokeDasharray={active ? "0" : "6 8"}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, opacity: active ? 0.8 : 0.15 }}
        transition={{ duration: 0.6 }}
      />
      {active && (
        <motion.circle
          r="4"
          fill={color}
          filter={`drop-shadow(0 0 6px ${color})`}
          animate={{ offsetDistance: ["0%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ offsetPath: `path('M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${midY * 0.8} ${to.x} ${to.y}')` } as any}
        />
      )}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

const HolographicMeetingRoom = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [meetingActive, setMeetingActive] = useState(false);
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [speakingAgentId, setSpeakingAgentId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"setup" | "discussion" | "planning" | "conclusion">("setup");
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const { data: dbAgents = [], isLoading } = useQuery({
    queryKey: ["holographic-meeting-agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user!.id)
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const assignRole = (name: string, idx: number): HolographicAgent["role"] => {
    const n = name.toLowerCase();
    if (n.includes("ceo") || n.includes("chief")) return "ceo";
    if (n.includes("sales") || n.includes("vend")) return "sales";
    if (n.includes("market")) return "marketing";
    if (n.includes("data") || n.includes("analy")) return "analytics";
    if (n.includes("design") || n.includes("creat")) return "design";
    if (n.includes("auto") || n.includes("process")) return "automation";
    const roles: HolographicAgent["role"][] = ["ceo", "sales", "marketing", "analytics", "design", "automation"];
    return roles[idx % roles.length];
  };

  const agents: HolographicAgent[] = dbAgents.map((a, i) => {
    const role = assignRole(a.name, i);
    return {
      id: a.id,
      name: a.name,
      specialty: AGENT_ROLES[role].specialty,
      role,
      state: speakingAgentId === a.id ? "speaking" : selectedAgents.includes(a.id) ? "processing" : "idle",
    };
  });

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SR = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = i18n.language === "pt" ? "pt-BR" : i18n.language;
      recognitionRef.current.onresult = (e: any) => {
        const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
        if (meetingActive) setInputValue(t);
        else setTopic(t);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [meetingActive]);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Select relevant agents based on topic
  const selectRelevantAgents = (text: string) => {
    const t = text.toLowerCase();
    const relevant: string[] = [];
    agents.forEach((a) => {
      if ((t.includes("campanha") || t.includes("marketing")) && ["marketing", "design", "automation"].includes(a.role)) relevant.push(a.id);
      if ((t.includes("venda") || t.includes("lead") || t.includes("conversão")) && ["sales", "analytics", "automation"].includes(a.role)) relevant.push(a.id);
      if ((t.includes("dados") || t.includes("análise")) && ["analytics", "ceo"].includes(a.role)) relevant.push(a.id);
      if ((t.includes("design") || t.includes("visual")) && ["design", "marketing"].includes(a.role)) relevant.push(a.id);
      if ((t.includes("automação") || t.includes("processo")) && ["automation", "analytics"].includes(a.role)) relevant.push(a.id);
    });
    const ceo = agents.find((a) => a.role === "ceo");
    if (ceo && !relevant.includes(ceo.id)) relevant.unshift(ceo.id);
    if (relevant.length < 3) agents.forEach((a) => { if (!relevant.includes(a.id) && relevant.length < 3) relevant.push(a.id); });
    return [...new Set(relevant)].slice(0, 5);
  };

  // Run meeting with REAL AI responses
  const runMeeting = async () => {
    if (!topic || agents.length === 0) return;
    const ids = selectRelevantAgents(topic);
    setSelectedAgents(ids);
    setPhase("discussion");
    await delay(800);

    const active = agents.filter((a) => ids.includes(a.id));
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;

    // Each agent contributes one real AI response
    const conversationHistory: { role: string; content: string }[] = [];

    for (const agent of active) {
      setSpeakingAgentId(agent.id);
      await delay(400);

      try {
        const roleInfo = AGENT_ROLES[agent.role];
        const contextPrompt = `Você é ${agent.name} (${roleInfo.label} - ${roleInfo.specialty}). 
Estamos em uma reunião estratégica sobre: "${topic}".
${conversationHistory.length > 0 ? "Contexto da discussão até agora:\n" + conversationHistory.map(m => m.content).join("\n") : ""}
Dê sua contribuição profissional em 2-3 frases, focando na sua especialidade. Seja direto e estratégico.`;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              message: contextPrompt,
              agentId: agent.id,
              conversationHistory: [],
            }),
          }
        );

        let content = `Analisando "${topic}" pela perspectiva de ${roleInfo.specialty}...`;
        if (response.ok) {
          const data = await response.json();
          content = data.response || data.content || content;
        }

        const msgType: MeetingMessage["type"] = 
          agent.role === "analytics" ? "analysis" :
          agent.role === "ceo" ? "strategy" :
          agent.role === "design" ? "creative" : "action";

        const msg: MeetingMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          agentId: agent.id,
          agentName: agent.name,
          agentRole: roleInfo.label,
          content,
          type: msgType,
          timestamp: new Date(),
        };

        conversationHistory.push({ role: "assistant", content: `[${agent.name}]: ${content}` });
        setMessages((prev) => [...prev, msg]);
        await delay(1500);
      } catch (err) {
        console.error("Meeting agent error:", err);
      }

      setSpeakingAgentId(null);
      await delay(300);
    }

    setPhase("planning");
    await delay(800);

    // Generate action items from the last agent (CEO or first)
    const ceoAgent = active.find(a => a.role === "ceo") || active[0];
    if (ceoAgent) {
      try {
        const planResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              message: `Com base na reunião sobre "${topic}", liste exatamente 5 ações prioritárias no formato:
1. [ALTA] Ação - Responsável
2. [MÉDIA] Ação - Responsável
Apenas o texto, sem introduções.`,
              agentId: ceoAgent.id,
              conversationHistory: conversationHistory.slice(-3),
            }),
          }
        );
        if (planResponse.ok) {
          const planData = await planResponse.json();
          const text = planData.response || planData.content || "";
          const lines = text.split("\n").filter((l: string) => l.trim());
          const parsed: ActionItem[] = lines.slice(0, 5).map((line: string, i: number) => {
            const priority = line.includes("[ALTA]") ? "high" : line.includes("[MÉDIA]") ? "medium" : "low";
            const clean = line.replace(/^\d+\.\s*/, "").replace(/\[(ALTA|MÉDIA|BAIXA)\]\s*/i, "");
            const parts = clean.split(" - ");
            return {
              id: String(i + 1),
              task: parts[0]?.trim() || clean,
              assignedTo: parts[1]?.trim() || active[i % active.length]?.name || "Equipe",
              priority,
            };
          });
          if (parsed.length > 0) setActionItems(parsed);
        }
      } catch {}
    }

    // Fallback action items if none generated
    setActionItems(prev => prev.length > 0 ? prev : [
      { id: "1", task: t("meeting.fallback_task1"), assignedTo: active[0]?.name || t("team.title"), priority: "high" },
      { id: "2", task: t("meeting.fallback_task2"), assignedTo: active[1]?.name || t("team.title"), priority: "medium" },
    ]);

    setPhase("conclusion");
  };

  const startMeeting = () => {
    if (!topic) return;
    setMeetingActive(true);
    setMessages([]);
    setActionItems([]);
    runMeeting();
  };

  const resetMeeting = () => {
    setMeetingActive(false);
    setPhase("setup");
    setMessages([]);
    setActionItems([]);
    setSpeakingAgentId(null);
    setSelectedAgents([]);
    setTopic("");
    setInputValue("");
  };

  const handleSendInput = async () => {
    if (!inputValue.trim()) return;
    const userContent = inputValue.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        agentId: "user",
        agentName: t("meeting.you"),
        agentRole: t("meeting.leader"),
        content: userContent,
        type: "question",
        timestamp: new Date(),
      },
    ]);
    setInputValue("");

    // Pick a relevant agent to respond
    const active = agents.filter((a) => selectedAgents.includes(a.id));
    const responder = active[Math.floor(Math.random() * active.length)] || agents[0];
    if (!responder) return;

    setSpeakingAgentId(responder.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            message: userContent,
            agentId: responder.id,
            conversationHistory: messages.slice(-5).map(m => ({ role: m.agentId === "user" ? "user" : "assistant", content: m.content })),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const roleInfo = AGENT_ROLES[responder.role];
        setMessages((prev) => [
          ...prev,
          {
            id: `resp-${Date.now()}`,
            agentId: responder.id,
            agentName: responder.name,
            agentRole: roleInfo.label,
            content: data.response || data.content || "Entendi, vou analisar.",
            type: "analysis",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      console.error("Meeting response error:", err);
    }
    setSpeakingAgentId(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Calculate agent positions around the table (semi-circular arrangement)
  const getAgentPosition = (idx: number, total: number) => {
    const spread = 0.7; // How spread out the agents are (0-1)
    const startAngle = Math.PI * (0.5 - spread / 2);
    const endAngle = Math.PI * (0.5 + spread / 2);
    const angle = startAngle + (endAngle - startAngle) * (idx / Math.max(total - 1, 1));
    
    const radiusX = 280; // Horizontal spread
    const x = Math.cos(angle) * radiusX;
    const y = 15 + (1 - Math.sin(angle)) * 35; // Base Y + depth
    const scale = 0.7 + Math.sin(angle) * 0.3; // Closer = larger
    
    return { x, y, scale };
  };

  const msgTypeStyle = (t: MeetingMessage["type"]) => {
    switch (t) {
      case "analysis": return "border-l-[hsl(200,80%,50%)] bg-[hsl(200,80%,50%)]/5";
      case "strategy": return "border-l-[hsl(280,70%,50%)] bg-[hsl(280,70%,50%)]/5";
      case "creative": return "border-l-[hsl(330,70%,50%)] bg-[hsl(330,70%,50%)]/5";
      case "action": return "border-l-[hsl(142,76%,36%)] bg-[hsl(142,76%,36%)]/5";
      case "question": return "border-l-primary bg-primary/5";
    }
  };

  const priorityStyle = (p: string) => {
    switch (p) {
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium": return "bg-primary/10 text-primary border-primary/20";
      default: return "bg-muted/10 text-muted-foreground border-border/20";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="relative flex flex-col h-[calc(100vh-6rem)] min-h-[600px] bg-gradient-to-b from-background via-background/98 to-background overflow-hidden rounded-2xl border border-border/20">
      
      {/* ═══ AMBIENT LAYER ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating particles */}
        {[...Array(25)].map((_, i) => (
          <AmbientParticle key={i} delay={i * 0.3} />
        ))}
        
        {/* Central dramatic glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, hsl(var(--primary)/0.08) 0%, transparent 70%)" }}
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        {/* Floor grid */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2/3 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary)/0.6) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)/0.6) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            perspective: "500px",
            transform: "rotateX(60deg)",
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!meetingActive ? (
          /* ═══════════════════════════════════════════
             SETUP SCREEN
             ═══════════════════════════════════════════ */
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 px-4 py-8"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20"
              >
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary tracking-widest uppercase">{t("meeting.room_label")}</span>
              </motion.div>
              
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-display text-4xl md:text-5xl lg:text-6xl font-bold"
              >
                <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  {t("meeting.room_title")}
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto"
              >
                {t("meeting.room_desc")}
              </motion.p>
            </div>

            {/* Agent preview */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4 flex-wrap justify-center"
            >
              {agents.slice(0, 6).map((a, i) => {
                const Icon = AGENT_ROLES[a.role].icon;
                return (
                  <motion.div
                    key={a.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                    whileHover={{ scale: 1.15, y: -8 }}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <div
                      className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all group-hover:shadow-lg"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${AGENT_ROLES[a.role].color}80, ${AGENT_ROLES[a.role].color}30 70%)`,
                        borderColor: `${AGENT_ROLES[a.role].color}50`,
                        boxShadow: `0 0 30px ${AGENT_ROLES[a.role].color}20`,
                      }}
                    >
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-white/90" strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground font-medium">
                      {AGENT_ROLES[a.role].label}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Input area */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="w-full max-w-2xl space-y-5"
            >
              <div className="relative">
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t("meeting.topic_placeholder")}
                  rows={3}
                  className="w-full resize-none rounded-2xl bg-card/50 backdrop-blur-xl border border-border/40 px-6 py-5 pr-16 text-sm md:text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all shadow-xl"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); startMeeting(); } }}
                />
                <button
                  onClick={toggleVoice}
                  className={cn(
                    "absolute right-4 top-4 w-12 h-12 rounded-xl flex items-center justify-center transition-all border",
                    isListening
                      ? "bg-primary/20 text-primary border-primary/30 animate-pulse"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/80 border-transparent hover:border-border/30"
                  )}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {[t("meeting.suggestion_launch"), t("meeting.suggestion_conversion"), t("meeting.suggestion_black_friday"), t("meeting.suggestion_churn"), t("meeting.suggestion_funnel")].map((s) => (
                  <button
                    key={s}
                    onClick={() => setTopic(s)}
                    className="text-xs md:text-sm px-4 py-2.5 rounded-full bg-card/60 border border-border/30 hover:border-primary/50 hover:bg-primary/5 transition-all hover:shadow-md"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Start button */}
              <div className="text-center pt-2">
                <Button
                  onClick={startMeeting}
                  disabled={!topic || agents.length < 2}
                  size="lg"
                  className="gap-3 px-12 py-7 text-base md:text-lg rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105"
                >
                  <Play className="h-5 w-5" />
                  {t("meeting.start_meeting", { count: agents.length })}
                </Button>
                {agents.length < 2 && (
                  <p className="text-xs text-muted-foreground mt-4">{t("meeting.min_agents")}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* ═══════════════════════════════════════════
             ACTIVE MEETING
             ═══════════════════════════════════════════ */
          <motion.div
            key="meeting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex-1 flex flex-col overflow-hidden"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 shrink-0 backdrop-blur-xl bg-background/50">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  phase === "conclusion" ? "bg-primary" : "bg-primary animate-pulse"
                )} />
                <span className="text-sm md:text-base font-display font-semibold">
                  {phase === "discussion" ? t("meeting.discussion") : 
                   phase === "planning" ? t("meeting.generating_plan") : 
                   phase === "conclusion" ? t("meeting.plan_ready") : t("meeting.preparing")}
                </span>
                <Badge variant="secondary" className="text-xs">{t("meeting.agents_active", { count: selectedAgents.length })}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={resetMeeting} className="gap-2 text-xs text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-4 w-4" /> {t("meeting.new_meeting")}
              </Button>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
              
              {/* ═══ HOLOGRAPHIC TABLE AREA ═══ */}
              <div className="flex-1 relative flex items-end justify-center pb-8 min-h-[300px] lg:min-h-0">
                
                {/* Table surface */}
                <motion.div
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[700px] h-24 md:h-32"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  {/* Table glow */}
                  <motion.div
                    className="absolute inset-0 rounded-[50%] bg-primary/[0.03] border border-primary/10"
                    animate={{ 
                      boxShadow: [
                        "0 0 60px hsl(var(--primary)/0.05), inset 0 0 30px hsl(var(--primary)/0.02)",
                        "0 0 100px hsl(var(--primary)/0.12), inset 0 0 50px hsl(var(--primary)/0.04)",
                        "0 0 60px hsl(var(--primary)/0.05), inset 0 0 30px hsl(var(--primary)/0.02)",
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  
                  {/* Table glass surface */}
                  <div className="absolute inset-4 rounded-[50%] bg-gradient-to-b from-primary/[0.03] via-transparent to-primary/[0.02] border border-primary/[0.06]" />
                  
                  {/* Center hologram content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-center px-8"
                    >
                      {phase === "conclusion" ? (
                        <div className="space-y-2">
                          <ListChecks className="h-8 w-8 text-primary mx-auto" />
                          <p className="text-sm font-bold text-primary">{t("meeting.plan_generated")}</p>
                          <p className="text-xs text-muted-foreground">{t("meeting.tasks_created", { count: actionItems.length })}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Lightbulb className="h-6 w-6 text-primary/70 mx-auto" />
                          <p className="text-[10px] text-primary/60 uppercase tracking-widest">{t("meeting.objective")}</p>
                          <p className="text-xs md:text-sm font-medium text-primary/90 leading-relaxed line-clamp-2 max-w-xs">{topic}</p>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Agents around the table */}
                {agents.map((agent, idx) => {
                  const pos = getAgentPosition(idx, agents.length);
                  const isActive = selectedAgents.includes(agent.id);
                  const isSpeaking = speakingAgentId === agent.id;
                  
                  return (
                    <AgentHologram
                      key={agent.id}
                      agent={agent}
                      position={pos}
                      isActive={isActive}
                      isSpeaking={isSpeaking}
                    />
                  );
                })}

                {/* Phase progress indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3">
                  {(["setup", "discussion", "planning", "conclusion"] as const).map((p, i) => {
                    const phaseIdx = ["setup", "discussion", "planning", "conclusion"].indexOf(phase);
                    return (
                      <div key={p} className="flex items-center gap-3">
                        <motion.div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all",
                            i <= phaseIdx ? "bg-primary" : "bg-muted/30"
                          )}
                          animate={i <= phaseIdx ? { scale: [1, 1.3, 1], boxShadow: "0 0 12px hsl(var(--primary)/0.5)" } : {}}
                          transition={{ duration: 1, repeat: i === phaseIdx ? Infinity : 0 }}
                        />
                        {i < 3 && (
                          <div className={cn("w-8 h-px", i < phaseIdx ? "bg-primary/60" : "bg-border/20")} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ═══ CHAT PANEL ═══ */}
              <div className="w-full lg:w-[420px] lg:border-l border-border/10 flex flex-col bg-card/30 backdrop-blur-sm">
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                  <AnimatePresence mode="popLayout">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn(
                          "p-4 rounded-xl border-l-4",
                          msg.agentId === "user" ? "border-l-primary bg-primary/5 ml-8" : msgTypeStyle(msg.type)
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold">{msg.agentRole}</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/30">
                            {msg.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{msg.content}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  {speakingAgentId && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-primary/60"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {agents.find((a) => a.id === speakingAgentId)?.name || "Agent"} {t("meeting.analyzing")}
                      </span>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Action Items */}
                <AnimatePresence>
                  {phase === "conclusion" && actionItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="border-t border-border/10 bg-primary/[0.03] p-4 space-y-3 max-h-56 overflow-y-auto"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <ListChecks className="h-5 w-5 text-primary" />
                        <span className="text-sm font-bold text-primary">{t("meeting.action_plan")}</span>
                      </div>
                      {actionItems.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center gap-3 text-sm"
                        >
                          <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                          <span className="flex-1 text-foreground/80">{item.task}</span>
                          <Badge variant="outline" className={cn("text-[9px] shrink-0", priorityStyle(item.priority))}>
                            {item.priority}
                          </Badge>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input */}
                <div className="p-4 border-t border-border/10 shrink-0">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t("meeting.ask_team")}
                        className="w-full h-12 rounded-xl bg-card/60 border border-border/30 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                        onKeyDown={(e) => { if (e.key === "Enter") handleSendInput(); }}
                      />
                    </div>
                    <button
                      onClick={toggleVoice}
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                        isListening
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "border-border/30 text-muted-foreground hover:bg-card/80 hover:text-foreground"
                      )}
                    >
                      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                    <Button onClick={handleSendInput} disabled={!inputValue.trim()} size="icon" className="w-12 h-12 rounded-xl">
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default HolographicMeetingRoom;
