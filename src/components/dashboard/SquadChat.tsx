import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Trash2, Users, Zap, UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import VoiceInput from "./VoiceInput";

interface Agent {
  id: string;
  name: string;
  tier: string;
  status: string;
}

interface SquadMessage {
  id: string;
  role: "user" | "squad" | "system";
  content: string;
  agentName?: string;
  agentTier?: string;
  timestamp: Date;
  suggestedAgents?: Agent[];
}

interface SquadChatProps {
  agents: Agent[];
  onRequestAgent?: (agentName: string) => void;
}

const tierColors: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  intermediate: "bg-accent-blue/15 text-accent-blue",
  advanced: "bg-accent-emerald/15 text-accent-emerald",
  enterprise: "bg-primary/15 text-primary",
};

const SquadChat = ({ agents, onRequestAgent }: SquadChatProps) => {
  const [messages, setMessages] = useState<SquadMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [includedAgentIds, setIncludedAgentIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeAgents = agents.filter((a) => a.status === "active");
  const inactiveAgents = agents.filter((a) => a.status !== "active");

  // Detect if a response suggests another agent and show upgrade option
  const detectSuggestedAgents = (content: string): Agent[] => {
    const suggested: Agent[] = [];
    const lowerContent = content.toLowerCase();
    for (const agent of agents) {
      if (!includedAgentIds.has(agent.id) && !activeAgents.some(a => a.id === agent.id)) {
        if (lowerContent.includes(agent.name.toLowerCase())) {
          suggested.push(agent);
        }
      }
    }
    // Also check for inactive agents mentioned by active agents
    for (const agent of inactiveAgents) {
      if (lowerContent.includes(agent.name.toLowerCase())) {
        suggested.push(agent);
      }
    }
    return [...new Map(suggested.map(a => [a.id, a])).values()];
  };

  const includeAgent = async (agent: Agent) => {
    // Activate the agent
    const { error } = await supabase.from("agents").update({ status: "active" as any }).eq("id", agent.id);
    if (error) {
      toast.error("Erro ao ativar agente.");
      return;
    }
    setIncludedAgentIds(prev => new Set([...prev, agent.id]));
    toast.success(`${agent.name} incluído na reunião!`);
    // Add system message
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: "system",
      content: `🔄 **${agent.name}** foi ativado e incluído na reunião. Envie uma nova mensagem para que ele participe.`,
      timestamp: new Date(),
    }]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || activeAgents.length === 0) return;

    const userMsg: SquadMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.error("Faça login para usar a reunião.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/squad-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: userMsg.content,
            agentIds: activeAgents.map((a) => a.id),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 402) {
          toast.error("Créditos esgotados! Faça upgrade do seu plano.");
        } else {
          toast.error(data.error || "Erro na reunião.");
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const agentResponses: SquadMessage[] = (data.responses || []).map(
        (r: any) => {
          const suggested = detectSuggestedAgents(r.content);
          return {
            id: crypto.randomUUID(),
            role: "squad" as const,
            content: r.content,
            agentName: r.agentName,
            agentTier: r.tier,
            timestamp: new Date(),
            suggestedAgents: suggested.length > 0 ? suggested : undefined,
          };
        }
      );

      // Show how many agents responded vs total
      if (agentResponses.length < activeAgents.length) {
        toast.info(`🎯 Roteamento inteligente: ${agentResponses.length} de ${activeAgents.length} agentes responderam (economia de créditos!)`, { duration: 4000 });
      }

      setMessages((prev) => [...prev, ...agentResponses]);
    } catch (err) {
      console.error("Squad chat error:", err);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-14rem)]">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-violet/15 flex items-center justify-center">
            <Users className="h-5 w-5 text-accent-violet" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">Reunião de Departamento</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
              <span className="text-xs text-muted-foreground">
                {activeAgents.length} agentes na sala
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Participants strip */}
      <div className="px-4 py-2 border-b border-border flex gap-2 overflow-x-auto">
        {activeAgents.map((agent) => (
          <Badge
            key={agent.id}
            variant="secondary"
            className={`text-[10px] shrink-0 ${tierColors[agent.tier] || ""}`}
          >
            <Bot className="h-2.5 w-2.5 mr-1" />
            {agent.name.length > 16 ? agent.name.slice(0, 16) + "…" : agent.name}
          </Badge>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-violet/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-accent-violet" />
            </div>
            <h3 className="font-display font-semibold mb-2">Sala de Reunião</h3>
            <p className="text-sm text-muted-foreground mb-1 max-w-md">
              Envie uma mensagem e todos os seus agentes ativos responderão simultaneamente,
              como em uma reunião de diretoria.
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              {activeAgents.length} agentes prontos para participar
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "system" ? (
                <div className="w-full text-center">
                  <div className="inline-block bg-accent-violet/10 border border-accent-violet/20 rounded-xl px-4 py-2">
                    <div className="text-xs prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === "user" ? "bg-primary/20" : "bg-accent-violet/15"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4 text-primary" />
                    ) : (
                      <Bot className="h-4 w-4 text-accent-violet" />
                    )}
                  </div>
                  <div className="max-w-[85%] min-w-0">
                    {msg.role === "squad" && msg.agentName && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-accent-violet">{msg.agentName}</span>
                        {msg.agentTier && (
                          <Badge variant="secondary" className={`text-[9px] px-1 py-0 ${tierColors[msg.agentTier] || ""}`}>
                            {msg.agentTier}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border"
                      }`}
                    >
                      {msg.role === "squad" ? (
                        <div className="text-sm prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                    {/* Suggested agent upgrade */}
                    {msg.suggestedAgents && msg.suggestedAgents.length > 0 && (
                      <div className="mt-2 p-2 rounded-xl bg-accent-violet/5 border border-accent-violet/15 space-y-2">
                        <p className="text-[10px] text-accent-violet font-medium flex items-center gap-1">
                          <UserPlus className="h-3 w-3" /> Agentes sugeridos para esta conversa:
                        </p>
                        {msg.suggestedAgents.map(a => (
                          <div key={a.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Bot className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{a.name}</span>
                              <Badge variant="secondary" className={`text-[8px] ${tierColors[a.tier] || ""}`}>{a.tier}</Badge>
                            </div>
                            <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 border-accent-violet/30 text-accent-violet hover:bg-accent-violet/10" onClick={() => includeAgent(a)}>
                              <UserPlus className="h-3 w-3" /> Incluir
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-violet/15 flex items-center justify-center">
              <Users className="h-4 w-4 text-accent-violet animate-pulse" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-accent-violet" />
                <span className="text-sm text-muted-foreground">
                  {activeAgents.length} agentes analisando...
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        {activeAgents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Nenhum agente ativo. Contrate agentes no Marketplace para usar a reunião.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Envie uma mensagem para todo o time..."
              disabled={isLoading}
              className="flex-1 bg-card border-border"
            />
            <VoiceInput
              onTranscript={(text) => {
                setInput(text);
                setTimeout(() => handleSend(), 300);
              }}
              disabled={isLoading}
            />
            <Button type="submit" disabled={!input.trim() || isLoading} className="shrink-0 neon-glow">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SquadChat;
