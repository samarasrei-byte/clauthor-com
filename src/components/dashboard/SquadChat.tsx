import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Loader2, Trash2, Users, Zap, UserPlus, Wifi,
  Eye, Shield, Crown, Lock, AtSign, ChevronDown, Mic, Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
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
  agentArea?: string;
  userName?: string;
  userId?: string;
  timestamp: Date;
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
  basic: "border-muted-foreground/30 text-muted-foreground",
  intermediate: "border-accent-blue/40 text-accent-blue",
  advanced: "border-accent-emerald/40 text-accent-emerald",
  enterprise: "border-primary/40 text-primary",
};

const tierBg: Record<string, string> = {
  basic: "bg-muted/30",
  intermediate: "bg-accent-blue/8",
  advanced: "bg-accent-emerald/8",
  enterprise: "bg-primary/8",
};

const tierDot: Record<string, string> = {
  basic: "bg-muted-foreground",
  intermediate: "bg-accent-blue",
  advanced: "bg-accent-emerald",
  enterprise: "bg-primary",
};

const roleIcons: Record<string, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  member: Users,
  viewer: Eye,
};

// Generate a stable color for each agent based on name hash
function agentColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-indigo-500 to-blue-600",
    "from-lime-500 to-green-600",
    "from-fuchsia-500 to-purple-600",
  ];
  return colors[Math.abs(hash) % colors.length];
}

function agentInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const SquadChat = ({ agents, onRequestAgent }: SquadChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [speakingAgent, setSpeakingAgent] = useState<string | null>(null);
  const [silentAgents, setSilentAgents] = useState<Array<{ id: string; name: string; tier: string }>>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeAgents = agents.filter((a) => a.status === "active");

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

  // Load chat history
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

  // Realtime subscription
  useEffect(() => {
    if (!tenantId || !historyLoaded) return;
    const channel = supabase
      .channel(`squad-chat-${tenantId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `tenant_id=eq.${tenantId}`,
      }, (payload) => {
        const m = payload.new as any;
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
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenantId, historyLoaded, user?.id]);

  // Presence
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
            users.push({ user_id: p.user_id, name: p.name, role: p.role, online_at: p.online_at });
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

    return () => { supabase.removeChannel(presenceChannel); };
  }, [tenantId, user, myProfile, myRole]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle @mention autocomplete
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const lastAtIndex = val.lastIndexOf("@");
    if (lastAtIndex !== -1 && lastAtIndex === val.length - 1 - (val.length - 1 - lastAtIndex)) {
      const afterAt = val.slice(lastAtIndex + 1);
      if (!afterAt.includes(" ")) {
        setMentionFilter(afterAt.toLowerCase());
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  }, []);

  const insertMention = useCallback((agentName: string) => {
    const lastAtIndex = input.lastIndexOf("@");
    const newInput = input.slice(0, lastAtIndex) + `@${agentName} `;
    setInput(newInput);
    setShowMentions(false);
    inputRef.current?.focus();
  }, [input]);

  const filteredMentionAgents = useMemo(() =>
    activeAgents.filter(a => a.name.toLowerCase().includes(mentionFilter)),
  [activeAgents, mentionFilter]);

  // Extract @mentioned agent from message
  const extractMention = (text: string): string | null => {
    const match = text.match(/@([^\s]+(?:\s[^\s@]+)?)/);
    if (!match) return null;
    const mentioned = match[1].trim();
    const agent = activeAgents.find(a => 
      a.name.toLowerCase().startsWith(mentioned.toLowerCase())
    );
    return agent?.name || null;
  };

  // Send message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || activeAgents.length === 0 || !canSend) return;

    const userName = myProfile?.full_name || user?.email?.split("@")[0] || "Usuário";
    const mentionedAgent = extractMention(input.trim());

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
    setSpeakingAgent(null);
    setSilentAgents([]);

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

      // Build conversation history for context
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
        agentName: m.agentName,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/squad-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            message: userMsg.content,
            agentIds: activeAgents.map((a) => a.id),
            mentionedAgent,
            conversationHistory,
          }),
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

      // Set silent agents info
      if (data.silentAgents) setSilentAgents(data.silentAgents);

      // Deliver responses with staggered timing for natural feel
      const agentResponses: ChatMsg[] = (data.responses || []).map((r: any) => ({
        id: crypto.randomUUID(),
        role: "squad" as const,
        content: r.content,
        agentName: r.agentName,
        agentTier: r.tier,
        agentArea: r.area,
        timestamp: new Date(),
      }));

      // Stagger agent responses for natural turn-taking
      for (let i = 0; i < agentResponses.length; i++) {
        const resp = agentResponses[i];
        setSpeakingAgent(resp.agentName || null);
        
        // Brief delay between agents for natural rhythm
        if (i > 0) await new Promise(r => setTimeout(r, 800));
        
        setMessages((prev) => [...prev, resp]);

        // Persist
        if (tenantId && user) {
          void supabase.from("chat_messages").insert({
            tenant_id: tenantId,
            user_id: user.id,
            role: "squad",
            content: resp.content,
            agent_name: resp.agentName,
            agent_tier: resp.agentTier,
            metadata: { area: resp.agentArea },
          } as any);
        }
      }

      setSpeakingAgent(null);

    } catch (err) {
      console.error("Squad chat error:", err);
      toast.error("Erro de conexão.");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activeAgents, canSend, myProfile, user, tenantId, messages]);

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
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-border/50 bg-background">
      {/* === LEFT: Agent Round Table === */}
      <div className="hidden md:flex flex-col w-64 border-r border-border/50 bg-card/30">
        {/* Meeting header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
            <h3 className="font-display font-bold text-sm tracking-tight">Sala de Reunião</h3>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {activeAgents.length} agentes na mesa • Turno por turno
          </p>
        </div>

        {/* Agent seats */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-bold px-2 mb-2">
            Na Mesa
          </p>
          {activeAgents.map((agent) => {
            const isSpeaking = speakingAgent === agent.name;
            const isSilent = silentAgents.some(s => s.id === agent.id);
            return (
              <motion.div
                key={agent.id}
                layout
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all cursor-pointer group ${
                  isSpeaking
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : isSilent
                      ? "opacity-40"
                      : "hover:bg-muted/50"
                }`}
                onClick={() => {
                  if (canSend) {
                    setInput(prev => prev + `@${agent.name} `);
                    inputRef.current?.focus();
                  }
                }}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agentColor(agent.name)} flex items-center justify-center shrink-0 relative`}>
                  <span className="text-[10px] font-bold text-white">{agentInitials(agent.name)}</span>
                  {isSpeaking && (
                    <motion.div
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Volume2 className="h-1.5 w-1.5 text-primary-foreground" />
                    </motion.div>
                  )}
                  {!isSpeaking && !isSilent && (
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${tierDot[agent.tier] || tierDot.basic} border border-background`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{agent.name}</p>
                  <p className={`text-[9px] ${isSpeaking ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    {isSpeaking ? "Falando..." : isSilent ? "Em silêncio" : agent.tier}
                  </p>
                </div>
                {!isSpeaking && !isSilent && (
                  <AtSign className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                )}
              </motion.div>
            );
          })}

          {/* Online humans */}
          {onlineUsers.length > 0 && (
            <>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-bold px-2 mt-4 mb-2">
                Membros Online
              </p>
              {onlineUsers.map((u) => {
                const RoleIcon = roleIcons[u.role] || Users;
                return (
                  <div key={u.user_id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-accent-emerald/10 flex items-center justify-center shrink-0 relative">
                      <span className="text-[10px] font-bold text-accent-emerald">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-emerald border border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{u.name}</p>
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <RoleIcon className="h-2.5 w-2.5" /> {u.role}
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Meeting info */}
        <div className="p-3 border-t border-border/30">
          <p className="text-[9px] text-muted-foreground/60 text-center">
            Use @nome para chamar um agente específico
          </p>
        </div>
      </div>

      {/* === RIGHT: Chat Area === */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with agent count */}
        <div className="md:hidden p-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
            <span className="text-xs font-bold">Reunião</span>
            <Badge variant="secondary" className="text-[9px] h-4">{activeAgents.length} agentes</Badge>
          </div>
          <div className="flex items-center gap-1">
            {isViewer && (
              <Badge variant="secondary" className="text-[9px] gap-1 bg-muted">
                <Eye className="h-2.5 w-2.5" /> Leitura
              </Badge>
            )}
            {messages.length > 0 && canSend && (
              <Button variant="ghost" size="icon" onClick={clearMessages} className="h-7 w-7">
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile agent strip */}
        <div className="md:hidden px-3 py-2 border-b border-border/30 flex gap-1.5 overflow-x-auto">
          {activeAgents.map((agent) => {
            const isSpeaking = speakingAgent === agent.name;
            return (
              <button
                key={agent.id}
                onClick={() => {
                  if (canSend) {
                    setInput(prev => prev + `@${agent.name} `);
                    inputRef.current?.focus();
                  }
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg shrink-0 transition-all ${
                  isSpeaking ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"
                }`}
              >
                <div className={`w-5 h-5 rounded bg-gradient-to-br ${agentColor(agent.name)} flex items-center justify-center`}>
                  <span className="text-[8px] font-bold text-white">{agentInitials(agent.name)}</span>
                </div>
                <span className="text-[10px] font-medium max-w-[80px] truncate">{agent.name}</span>
                {isSpeaking && <Volume2 className="h-2.5 w-2.5 text-primary animate-pulse" />}
              </button>
            );
          })}
        </div>

        {/* Desktop clear button */}
        <div className="hidden md:flex p-3 border-b border-border/30 items-center justify-between">
          <div className="flex items-center gap-2">
            {isViewer && (
              <Badge variant="secondary" className="text-[9px] gap-1 bg-muted">
                <Eye className="h-2.5 w-2.5" /> Somente leitura
              </Badge>
            )}
          </div>
          {messages.length > 0 && canSend && (
            <Button variant="ghost" size="sm" onClick={clearMessages} className="h-7 text-[10px] gap-1 text-muted-foreground">
              <Trash2 className="h-3 w-3" /> Limpar
            </Button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {!historyLoaded ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-violet/20 flex items-center justify-center mb-5 relative">
                  <Users className="h-9 w-9 text-primary/80" />
                  <motion.div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-emerald flex items-center justify-center"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Wifi className="h-2.5 w-2.5 text-white" />
                  </motion.div>
                </div>
                <h3 className="font-display font-bold text-lg mb-2">Sala de Reunião</h3>
                <p className="text-sm text-muted-foreground mb-1 max-w-md">
                  Converse com seu time de agentes. Use <span className="font-mono text-primary">@nome</span> para chamar alguém específico — senão, o moderador escolhe quem responde.
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-2">
                  {activeAgents.length} agentes • Turnos naturais • Contexto persistente
                </p>
              </div>
            ) : null}

            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {msg.role === "system" ? (
                    <div className="flex justify-center py-2">
                      <div className="bg-muted/50 border border-border/30 rounded-full px-4 py-1.5">
                        <p className="text-[11px] text-muted-foreground">
                          <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
                            {msg.content}
                          </ReactMarkdown>
                        </p>
                      </div>
                    </div>
                  ) : msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[80%]">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <span className="text-[10px] text-muted-foreground">
                            {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            {msg.userName}{msg.userId === user?.id ? " (você)" : ""}
                          </span>
                        </div>
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3">
                          <p className="text-[15px] leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${agentColor(msg.agentName || '')} flex items-center justify-center shrink-0 mt-0.5`}>
                        <span className="text-[10px] font-bold text-white">{agentInitials(msg.agentName || 'AI')}</span>
                      </div>
                      <div className="flex-1 min-w-0 max-w-[85%]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-foreground">{msg.agentName}</span>
                          {msg.agentTier && (
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md border ${tierColors[msg.agentTier] || ""} ${tierBg[msg.agentTier] || ""}`}>
                              {msg.agentTier}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="bg-card border border-border/50 rounded-2xl rounded-tl-md px-4 py-3">
                          <div className="text-[15px] leading-relaxed prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className={`w-9 h-9 rounded-xl ${speakingAgent ? `bg-gradient-to-br ${agentColor(speakingAgent)}` : 'bg-primary/15'} flex items-center justify-center shrink-0`}>
                  {speakingAgent ? (
                    <span className="text-[10px] font-bold text-white">{agentInitials(speakingAgent)}</span>
                  ) : (
                    <Users className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="bg-card border border-border/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <motion.span className="w-2 h-2 rounded-full bg-primary/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} />
                      <motion.span className="w-2 h-2 rounded-full bg-primary/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} />
                      <motion.span className="w-2 h-2 rounded-full bg-primary/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {speakingAgent ? `${speakingAgent} está digitando...` : "Escolhendo quem responde..."}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Silent agents notice */}
            {!isLoading && silentAgents.length > 0 && messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <p className="text-[10px] text-muted-foreground/50 px-3 py-1 rounded-full bg-muted/30">
                  {silentAgents.map(a => a.name).join(", ")} {silentAgents.length === 1 ? "está" : "estão"} ouvindo em silêncio
                </p>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-border/50 bg-card/30">
          <div className="max-w-3xl mx-auto px-4 py-3">
            {isViewer ? (
              <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="text-xs">Modo visualizador — peça ao admin para alterar sua permissão.</span>
              </div>
            ) : activeAgents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                Nenhum agente ativo. Contrate agentes no Marketplace.
              </p>
            ) : (
              <div className="relative">
                {/* Mention autocomplete */}
                <AnimatePresence>
                  {showMentions && filteredMentionAgents.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute bottom-full mb-2 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-10"
                    >
                      {filteredMentionAgents.slice(0, 5).map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => insertMention(agent.name)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className={`w-6 h-6 rounded bg-gradient-to-br ${agentColor(agent.name)} flex items-center justify-center`}>
                            <span className="text-[8px] font-bold text-white">{agentInitials(agent.name)}</span>
                          </div>
                          <span className="text-xs font-medium">{agent.name}</span>
                          <Badge variant="secondary" className={`text-[8px] ml-auto ${tierColors[agent.tier] || ""}`}>{agent.tier}</Badge>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Mensagem para o time... (@ para mencionar)"
                      disabled={isLoading}
                      rows={1}
                      className="w-full resize-none bg-background border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/50 min-h-[44px] max-h-[120px]"
                      style={{ height: "44px" }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "44px";
                        target.style.height = Math.min(target.scrollHeight, 120) + "px";
                      }}
                    />
                  </div>
                  <VoiceInput
                    onTranscript={(text) => { setInput(text); }}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="h-11 w-11 rounded-xl shrink-0"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquadChat;
