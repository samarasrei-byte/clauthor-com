import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, GitBranch, CheckCircle2, Clock, Zap, ArrowRight,
  Sparkles, Users, Brain, Target, AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CollaborationEvent {
  id: string;
  type: "analyzing" | "delegating" | "executing" | "completed" | "error";
  agentName: string;
  targetAgent?: string;
  task?: string;
  result?: string;
  timestamp: number;
}

interface AgentCollaborationPanelProps {
  events: CollaborationEvent[];
  isActive: boolean;
  primaryAgent?: string;
}

const EVENT_CONFIG: Record<CollaborationEvent["type"], {
  icon: any;
  label: string;
  color: string;
  bgColor: string;
  pulse?: boolean;
}> = {
  analyzing: {
    icon: Brain,
    label: "Analisando",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    pulse: true,
  },
  delegating: {
    icon: GitBranch,
    label: "Convocando especialista",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10 border-indigo-500/20",
    pulse: true,
  },
  executing: {
    icon: Zap,
    label: "Executando",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    pulse: true,
  },
  completed: {
    icon: CheckCircle2,
    label: "Concluído",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
  },
  error: {
    icon: AlertCircle,
    label: "Erro",
    color: "text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
  },
};

function CollaborationNode({ agent, isActive, isPrimary }: {
  agent: string;
  isActive: boolean;
  isPrimary?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn(
        "relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
        isPrimary
          ? "border-primary bg-primary/10"
          : "border-border/40 bg-card/50",
        isActive && "shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
      )}>
        <Bot className={cn("h-4 w-4", isPrimary ? "text-primary" : "text-muted-foreground")} />
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        {isPrimary && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary flex items-center justify-center">
            <Users className="h-1.5 w-1.5 text-primary-foreground" />
          </div>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground text-center max-w-[60px] leading-tight truncate">
        {agent}
      </span>
    </div>
  );
}

export default function AgentCollaborationPanel({
  events,
  isActive,
  primaryAgent = "Agente Principal"
}: AgentCollaborationPanelProps) {
  const [visibleEvents, setVisibleEvents] = useState<CollaborationEvent[]>([]);

  useEffect(() => {
    setVisibleEvents(events.slice(-6));
  }, [events]);

  // Agents involved (unique)
  const involvedAgents = Array.from(new Set([
    primaryAgent,
    ...events.filter(e => e.targetAgent).map(e => e.targetAgent!)
  ]));

  const activeAgents = events
    .filter(e => e.type === "delegating" || e.type === "executing")
    .map(e => e.targetAgent)
    .filter(Boolean) as string[];

  if (!isActive && events.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/10">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isActive ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/30"
          )} />
          <span className="text-xs font-semibold">Colaboração entre Agentes</span>
        </div>
        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 ml-auto">
          {involvedAgents.length} agentes
        </Badge>
      </div>

      <div className="p-4 space-y-4">
        {/* Agent network visualization */}
        {involvedAgents.length > 1 && (
          <div className="relative">
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {involvedAgents.slice(1).map((_, i) => {
                const total = involvedAgents.length;
                const centerX = 50;
                const agentX = ((i + 1) / total) * 100;
                return (
                  <motion.line
                    key={i}
                    x1={`${centerX}%`} y1="25px"
                    x2={`${agentX}%`} y2="25px"
                    stroke="hsl(var(--primary) / 0.3)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  />
                );
              })}
            </svg>

            <div className="flex items-end justify-around relative z-10 py-2">
              <CollaborationNode
                agent={primaryAgent}
                isActive={isActive}
                isPrimary
              />
              {involvedAgents.slice(1).map((agent) => (
                <CollaborationNode
                  key={agent}
                  agent={agent}
                  isActive={activeAgents.includes(agent)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Event log */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          <AnimatePresence initial={false}>
            {visibleEvents.map((event) => {
              const config = EVENT_CONFIG[event.type];
              const Icon = config.icon;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-start gap-2.5 p-2 rounded-lg border text-xs",
                    config.bgColor
                  )}
                >
                  <div className={cn("mt-0.5 shrink-0", config.color)}>
                    {config.pulse && event.type !== "completed" ? (
                      <motion.div
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </motion.div>
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn("font-semibold", config.color)}>{event.agentName}</span>
                      {event.targetAgent && (
                        <>
                          <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40" />
                          <span className="font-medium text-foreground/80">{event.targetAgent}</span>
                        </>
                      )}
                      <span className="text-muted-foreground/50 ml-auto text-[9px]">
                        {new Date(event.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                    {event.task && (
                      <p className="text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{event.task}</p>
                    )}
                    {event.result && event.type === "completed" && (
                      <p className="text-emerald-400/80 mt-0.5 leading-relaxed line-clamp-2">{event.result}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {isActive && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex gap-0.5"
            >
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1 h-1 rounded-full bg-primary/60" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </motion.div>
            <span>Agentes trabalhando...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Hook to parse agent-chat tool results into collaboration events
 */
export function useCollaborationEvents() {
  const [events, setEvents] = useState<CollaborationEvent[]>([]);
  const [isActive, setIsActive] = useState(false);

  const addEvent = (event: Omit<CollaborationEvent, "id" | "timestamp">) => {
    const newEvent: CollaborationEvent = {
      ...event,
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    };
    setEvents(prev => [...prev.slice(-20), newEvent]);
    if (event.type !== "completed" && event.type !== "error") {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  };

  const reset = () => {
    setEvents([]);
    setIsActive(false);
  };

  return { events, isActive, addEvent, reset };
}
