import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Loader2, Trash2, Users, Zap, UserPlus, Wifi,
  Eye, Shield, Crown, Lock, AtSign, ChevronDown, Mic, Volume2,
  Radio, Sparkles, RotateCcw, MessageSquare
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
import MeetingTable from "./MeetingTable";

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

  const extractMention = (text: string): string | null => {
    const match = text.match(/@([^\s]+(?:\s[^\s@]+)?)/);
    if (!match) return null;
    const mentioned = match[1].trim();
    const agent = activeAgents.find(a =>
      a.name.toLowerCase().startsWith(mentioned.toLowerCase())
    );
    return agent?.name || null;
  };

  // Prepare table agents for MeetingTable
  const tableAgents = useMemo(() => activeAgents.map(a => ({
    id: a.id,
    name: a.name,
    tier: a.tier,
    initials: agentInitials(a.name),
    colorClass: agentColor(a.name),
    isSpeaking: speakingAgent === a.name,
    isSilent: silentAgents.some(s => s.id === a.id),
  })), [activeAgents, speakingAgent, silentAgents]);

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
      if (data.silentAgents) setSilentAgents(data.silentAgents);

      const agentResponses: ChatMsg[] = (data.responses || []).map((r: any) => ({
        id: crypto.randomUUID(),
        role: "squad" as const,
        content: r.content,
        agentName: r.agentName,
        agentTier: r.tier,
        agentArea: r.area,
        timestamp: new Date(),
      }));

      for (let i = 0; i < agentResponses.length; i++) {
        const resp = agentResponses[i];
        setSpeakingAgent(resp.agentName || null);
        if (i > 0) await new Promise(r => setTimeout(r, 800));
        setMessages((prev) => [...prev, resp]);

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

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-border/30 bg-background relative">
      {/* === TOP BAR — Command Center Header === */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 bg-card/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent-emerald border-2 border-background"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-sm tracking-tight">Sala de Reunião</h2>
              <Badge className="bg-accent-emerald/10 text-accent-emerald text-[8px] border-0 gap-1 px-1.5">
                <Radio className="h-2 w-2" /> LIVE
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {activeAgents.length} agentes na mesa • Turno por turno
              {onlineUsers.length > 0 && ` • ${onlineUsers.length} membro${onlineUsers.length > 1 ? 's' : ''} online`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online humans avatars */}
          {onlineUsers.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 mr-2">
              <div className="flex -space-x-2">
                {onlineUsers.slice(0, 4).map((u) => (
                  <div key={u.user_id} className="w-6 h-6 rounded-full bg-accent-emerald/10 border-2 border-background flex items-center justify-center">
                    <span className="text-[8px] font-bold text-accent-emerald">{u.name.charAt(0).toUpperCase()}</span>
                  </div>
                ))}
              </div>
              {onlineUsers.length > 4 && (
                <span className="text-[9px] text-muted-foreground">+{onlineUsers.length - 4}</span>
              )}
            </div>
          )}

          {isViewer && (
            <Badge variant="secondary" className="text-[9px] gap-1 bg-muted">
              <Eye className="h-2.5 w-2.5" /> Leitura
            </Badge>
          )}
          {hasMessages && canSend && (
            <Button variant="ghost" size="sm" onClick={clearMessages} className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-destructive">
              <RotateCcw className="h-3 w-3" /> Nova sessão
            </Button>
          )}
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {!historyLoaded ? (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-xs text-muted-foreground">Preparando a sala...</p>
              </div>
            </div>
          ) : !hasMessages ? (
            /* === EMPTY STATE — Compact with visible input hint === */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-6"
            >
              {/* The Round Table — smaller to leave room for input */}
              <div className="max-w-[320px] w-full">
                <MeetingTable
                  agents={tableAgents}
                  onMention={(name) => {
                    setInput(prev => prev + `@${name} `);
                    inputRef.current?.focus();
                  }}
                  canSend={canSend}
                />
              </div>

              {/* Info text below table */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center mt-3 max-w-sm"
              >
                <h3 className="font-display font-bold text-base mb-1">Mesa de Reunião</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Clique num avatar ou digite{" "}
                  <span className="font-mono text-primary bg-primary/5 px-1 py-0.5 rounded">@nome</span>{" "}
                  abaixo para começar.
                </p>

                {/* Quick prompts */}
                <div className="grid grid-cols-2 gap-1.5 mt-3">
                  {[
                    { label: "Briefing geral", icon: Sparkles },
                    { label: "Status do time", icon: Users },
                    { label: "Próximos passos", icon: Zap },
                    { label: "Análise de riscos", icon: Shield },
                  ].map((cmd) => (
                    <button
                      key={cmd.label}
                      onClick={() => {
                        setInput(cmd.label);
                        inputRef.current?.focus();
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card/50 hover:bg-card border border-border/30 hover:border-border/60 text-[11px] text-muted-foreground hover:text-foreground transition-all text-left"
                    >
                      <cmd.icon className="h-3 w-3 text-primary/60 shrink-0" />
                      {cmd.label}
                    </button>
                  ))}
                </div>

                {/* Arrow pointing down to input */}
                <motion.div
                  className="mt-4 flex flex-col items-center"
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ChevronDown className="h-5 w-5 text-primary/40" />
                  <span className="text-[10px] text-primary/50 font-medium">Digite aqui embaixo</span>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : null}

          {/* === MESSAGES === */}
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mb-5"
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
                    <div className="relative shrink-0 mt-0.5">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${agentColor(msg.agentName || '')} flex items-center justify-center shadow-lg`}>
                        <span className="text-[10px] font-bold text-white">{agentInitials(msg.agentName || 'AI')}</span>
                      </div>
                      {/* Connection line to table feel */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-3 bg-border/20" />
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
                      <div className="bg-card border border-border/40 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
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
              className="flex gap-3 mb-5"
            >
              <div className={`w-9 h-9 rounded-full ${speakingAgent ? `bg-gradient-to-br ${agentColor(speakingAgent)}` : 'bg-primary/15'} flex items-center justify-center shrink-0 shadow-lg relative`}>
                {speakingAgent ? (
                  <span className="text-[10px] font-bold text-white">{agentInitials(speakingAgent)}</span>
                ) : (
                  <Users className="h-4 w-4 text-primary" />
                )}
                <motion.div
                  className="absolute -inset-1 rounded-full border border-primary/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>
              <div className="bg-card border border-border/40 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1">
                    <motion.span className="w-2 h-2 rounded-full bg-primary/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} />
                    <motion.span className="w-2 h-2 rounded-full bg-primary/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} />
                    <motion.span className="w-2 h-2 rounded-full bg-primary/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {speakingAgent ? `${speakingAgent} está respondendo...` : "Moderador selecionando quem responde..."}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Silent agents notice */}
          {!isLoading && silentAgents.length > 0 && hasMessages && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center mb-4"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/20 border border-border/20">
                <div className="flex -space-x-1.5">
                  {silentAgents.slice(0, 3).map(a => (
                    <div key={a.id} className={`w-4 h-4 rounded-full bg-gradient-to-br ${agentColor(a.name)} border border-background flex items-center justify-center`}>
                      <span className="text-[6px] font-bold text-white">{agentInitials(a.name).charAt(0)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {silentAgents.map(a => a.name.split(" ")[0]).join(", ")} {silentAgents.length === 1 ? "ouvindo" : "ouvindo"} em silêncio
                </p>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* === INPUT AREA === */}
      <div className="border-t border-border/30 bg-card/20 backdrop-blur-sm">
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
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${agentColor(agent.name)} flex items-center justify-center`}>
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
                {/* Agent presence strip */}
                <div className="hidden md:flex items-center gap-0.5 shrink-0 mr-1">
                  {activeAgents.slice(0, 5).map(a => (
                    <TooltipProvider key={a.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => {
                              setInput(prev => prev + `@${a.name} `);
                              inputRef.current?.focus();
                            }}
                            className={`w-7 h-7 rounded-full bg-gradient-to-br ${agentColor(a.name)} flex items-center justify-center border-2 transition-all ${
                              speakingAgent === a.name
                                ? "border-primary scale-110"
                                : "border-background hover:border-primary/40 hover:scale-105"
                            }`}
                          >
                            <span className="text-[8px] font-bold text-white">{agentInitials(a.name)}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">
                          @{a.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>

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
                    placeholder="Fale com o time... (@ para mencionar)"
                    disabled={isLoading}
                    rows={1}
                    className="w-full resize-none bg-background border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/50 min-h-[44px] max-h-[120px]"
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

              <p className="text-[9px] text-muted-foreground/40 text-center mt-1.5">
                Moderador IA seleciona automaticamente quem responde • @nome para chamar diretamente
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SquadChat;
