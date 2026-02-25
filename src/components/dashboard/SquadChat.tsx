import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Trash2, Users, Zap, UserPlus, Wifi, WifiOff, Eye, Shield, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import VoiceInput from "./VoiceInput";

interface Agent {
  id: string;
  name: string;
  tier: string;
  status: string;
}

interface ChatMsg {
  id: string;
  role: "user" | "squad" | "system";
  content: string;
  agentName?: string;
  agentTier?: string;
  userName?: string;
  userId?: string;
  timestamp: Date;
  suggestedAgents?: Agent[];
}

interface PresenceUser {
  user_id: string;
  name: string;
  role: string;
  online_at: string;
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

const roleIcons: Record<string, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  member: Users,
  viewer: Eye,
};

const SquadChat = ({ agents, onRequestAgent }: SquadChatProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [includedAgentIds, setIncludedAgentIds] = useState<Set<string>>(new Set());
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const activeAgents = agents.filter((a) => a.status === "active");
  const inactiveAgents = agents.filter((a) => a.status !== "active");

  // Get tenant info & member role
  const { data: tenantId } = useQuery({
    queryKey: ["my-tenant", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_user_tenant_id", { _user_id: user!.id });
      return data as string;
    },
    enabled: !!user,
  });

  const { data: myMember } = useQuery({
    queryKey: ["my-member-role", tenantId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tenant_members")
        .select("role")
        .eq("tenant_id", tenantId!)
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!tenantId && !!user,
  });

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const myRole = myMember?.role || "member";
  const isViewer = myRole === "viewer";
  const canSend = !isViewer;

  // === 1. LOAD CHAT HISTORY ===
  useEffect(() => {
    if (!tenantId) return;
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("tenant_id", tenantId)
        .is("squad_id", null)
        .is("agent_id", null)
        .order("created_at", { ascending: true })
        .limit(200);

      if (!error && data) {
        const history: ChatMsg[] = data.map((m: any) => ({
          id: m.id,
          role: m.role as "user" | "squad" | "system",
          content: m.content,
          agentName: m.agent_name,
          agentTier: m.agent_tier,
          userName: m.metadata?.user_name,
          userId: m.user_id,
          timestamp: new Date(m.created_at),
        }));
        setMessages(history);
      }
      setHistoryLoaded(true);
    };
    loadHistory();
  }, [tenantId]);

  // === 2. REALTIME SUBSCRIPTION ===
  useEffect(() => {
    if (!tenantId || !historyLoaded) return;

    const channel = supabase
      .channel(`squad-chat-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const m = payload.new as any;
          // Avoid duplicates from own inserts
          if (m.user_id === user?.id && m.role === "user") return;
          const newMsg: ChatMsg = {
            id: m.id,
            role: m.role,
            content: m.content,
            agentName: m.agent_name,
            agentTier: m.agent_tier,
            userName: m.metadata?.user_name,
            userId: m.user_id,
            timestamp: new Date(m.created_at),
          };
          setMessages((prev) => {
            if (prev.some((p) => p.id === m.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, historyLoaded, user?.id]);

  // === 3. PRESENCE ===
  useEffect(() => {
    if (!tenantId || !user || !myProfile) return;

    const presenceChannel = supabase.channel(`presence-squad-${tenantId}`, {
      config: { presence: { key: user.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const users: PresenceUser[] = [];
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((p) => {
            users.push({
              user_id: p.user_id,
              name: p.name,
              role: p.role,
              online_at: p.online_at,
            });
          });
        });
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: user.id,
            name: myProfile?.full_name || user.email?.split("@")[0] || "Anônimo",
            role: myRole,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [tenantId, user, myProfile, myRole]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detect suggested agents
  const detectSuggestedAgents = (content: string): Agent[] => {
    const suggested: Agent[] = [];
    const lowerContent = content.toLowerCase();
    for (const agent of inactiveAgents) {
      if (lowerContent.includes(agent.name.toLowerCase())) {
        suggested.push(agent);
      }
    }
    return [...new Map(suggested.map((a) => [a.id, a])).values()];
  };

  const includeAgent = async (agent: Agent) => {
    const { error } = await supabase.from("agents").update({ status: "active" as any }).eq("id", agent.id);
    if (error) { toast.error("Erro ao ativar agente."); return; }
    setIncludedAgentIds((prev) => new Set([...prev, agent.id]));
    toast.success(`${agent.name} incluído na reunião!`);

    const systemMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "system",
      content: `🔄 **${agent.name}** foi ativado e incluído na reunião.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, systemMsg]);

    // Persist system message
    if (tenantId && user) {
      await supabase.from("chat_messages").insert({
        tenant_id: tenantId,
        user_id: user.id,
        role: "system",
        content: systemMsg.content,
        metadata: { user_name: myProfile?.full_name },
      } as any);
    }
  };

  // === SEND MESSAGE ===
  const handleSend = async () => {
    if (!input.trim() || isLoading || activeAgents.length === 0 || !canSend) return;

    const userName = myProfile?.full_name || user?.email?.split("@")[0] || "Usuário";

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      userName,
      userId: user?.id,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Persist user message
    if (tenantId && user) {
      await supabase.from("chat_messages").insert({
        tenant_id: tenantId,
        user_id: user.id,
        role: "user",
        content: userMsg.content,
        metadata: { user_name: userName },
      } as any);
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error("Faça login."); setIsLoading(false); return; }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/squad-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: userMsg.content, agentIds: activeAgents.map((a) => a.id) }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 402) toast.error("Créditos esgotados!");
        else toast.error(data.error || "Erro na reunião.");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const agentResponses: ChatMsg[] = (data.responses || []).map((r: any) => {
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
      });

      if (agentResponses.length < activeAgents.length) {
        toast.info(`🎯 Roteamento: ${agentResponses.length}/${activeAgents.length} agentes responderam`, { duration: 3000 });
      }

      setMessages((prev) => [...prev, ...agentResponses]);

      // Persist agent responses
      if (tenantId && user) {
        for (const r of agentResponses) {
          await supabase.from("chat_messages").insert({
            tenant_id: tenantId,
            user_id: user.id,
            role: "squad",
            content: r.content,
            agent_name: r.agentName,
            agent_tier: r.agentTier,
            metadata: {},
          } as any);
        }
      }
    } catch (err) {
      console.error("Squad chat error:", err);
      toast.error("Erro de conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = async () => {
    setMessages([]);
    if (tenantId) {
      await supabase
        .from("chat_messages")
        .delete()
        .eq("tenant_id", tenantId)
        .is("squad_id", null)
        .is("agent_id", null);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-14rem)]">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-violet/15 flex items-center justify-center">
            <Users className="h-5 w-5 text-accent-violet" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">Reunião Colaborativa</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
              <span className="text-xs text-muted-foreground">
                {activeAgents.length} agentes • {onlineUsers.length} membro{onlineUsers.length !== 1 ? "s" : ""} online
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isViewer && (
            <Badge variant="secondary" className="text-[10px] gap-1 bg-muted">
              <Eye className="h-3 w-3" /> Somente leitura
            </Badge>
          )}
          {messages.length > 0 && myRole !== "viewer" && (
            <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Presence + Agents strip */}
      <div className="px-4 py-2 border-b border-border space-y-2">
        {/* Online members */}
        {onlineUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <Wifi className="h-3 w-3 text-accent-emerald" />
            <div className="flex gap-1.5 overflow-x-auto">
              <TooltipProvider>
                {onlineUsers.map((u) => {
                  const RoleIcon = roleIcons[u.role] || Users;
                  return (
                    <Tooltip key={u.user_id}>
                      <TooltipTrigger asChild>
                        <div className="w-7 h-7 rounded-lg bg-accent-emerald/15 flex items-center justify-center shrink-0 relative">
                          <span className="text-[10px] font-bold text-accent-emerald">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-emerald border border-background" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <RoleIcon className="h-3 w-3" />
                          {u.name} • {u.role}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>
        )}

        {/* Active agents */}
        <div className="flex gap-1.5 overflow-x-auto">
          {activeAgents.map((agent) => (
            <Badge key={agent.id} variant="secondary" className={`text-[10px] shrink-0 ${tierColors[agent.tier] || ""}`}>
              <Bot className="h-2.5 w-2.5 mr-1" />
              {agent.name.length > 16 ? agent.name.slice(0, 16) + "…" : agent.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!historyLoaded ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-violet/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-accent-violet" />
            </div>
            <h3 className="font-display font-semibold mb-2">Sala de Reunião Colaborativa</h3>
            <p className="text-sm text-muted-foreground mb-1 max-w-md">
              Todos os membros do workspace veem as mensagens em tempo real.
              Converse com seus agentes em equipe.
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              {activeAgents.length} agentes • Histórico persistente • Presença ao vivo
            </p>
          </div>
        ) : null}

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
                    {/* Author name */}
                    <div className="flex items-center gap-2 mb-1">
                      {msg.role === "user" && msg.userName && (
                        <span className="text-xs font-semibold text-primary">
                          {msg.userName}
                          {msg.userId === user?.id && " (você)"}
                        </span>
                      )}
                      {msg.role === "squad" && msg.agentName && (
                        <>
                          <span className="text-xs font-semibold text-accent-violet">{msg.agentName}</span>
                          {msg.agentTier && (
                            <Badge variant="secondary" className={`text-[9px] px-1 py-0 ${tierColors[msg.agentTier] || ""}`}>
                              {msg.agentTier}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? msg.userId === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent-blue/15 text-foreground"
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
                    {/* Suggested agents */}
                    {msg.suggestedAgents && msg.suggestedAgents.length > 0 && (
                      <div className="mt-2 p-2 rounded-xl bg-accent-violet/5 border border-accent-violet/15 space-y-2">
                        <p className="text-[10px] text-accent-violet font-medium flex items-center gap-1">
                          <UserPlus className="h-3 w-3" /> Agentes sugeridos:
                        </p>
                        {msg.suggestedAgents.map((a) => (
                          <div key={a.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Bot className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{a.name}</span>
                              <Badge variant="secondary" className={`text-[8px] ${tierColors[a.tier] || ""}`}>{a.tier}</Badge>
                            </div>
                            {canSend && (
                              <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 border-accent-violet/30 text-accent-violet hover:bg-accent-violet/10" onClick={() => includeAgent(a)}>
                                <UserPlus className="h-3 w-3" /> Incluir
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="text-[9px] text-muted-foreground/50 mt-1 block">
                      {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
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
                <span className="text-sm text-muted-foreground">{activeAgents.length} agentes analisando...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        {isViewer ? (
          <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-xs">Você está como visualizador. Peça ao admin para alterar sua permissão.</span>
          </div>
        ) : activeAgents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Nenhum agente ativo. Contrate agentes no Marketplace.
          </p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mensagem para o time..."
              disabled={isLoading}
              className="flex-1 bg-card border-border"
            />
            <VoiceInput
              onTranscript={(text) => { setInput(text); setTimeout(() => handleSend(), 300); }}
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