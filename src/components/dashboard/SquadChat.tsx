import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, Loader2, Users, Search,
  ArrowLeft, MessageSquare, CheckCheck, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface Agent {
  id: string;
  name: string;
  tier: string;
  status: string;
  description?: string | null;
  objective?: string | null;
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  agent_id?: string | null;
  agent_name?: string | null;
}

interface SquadChatProps {
  agents: Agent[];
  onRequestAgent?: (agentName: string) => void;
}

const tierDot: Record<string, string> = {
  basic: "bg-muted-foreground",
  intermediate: "bg-primary/60",
  advanced: "bg-primary",
  enterprise: "bg-primary",
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"individual" | "grupo">("individual");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Show all agents (active + paused) so users can always chat with their contracted agents
  const activeAgents = agents;

  // Fetch tenant_id
  const { data: tenantId } = useQuery({
    queryKey: ["user-tenant", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_user_tenant_id", { _user_id: user!.id });
      return data as string | null;
    },
    enabled: !!user,
    staleTime: Infinity,
  });

  // Fetch messages for current context
  const chatKey = mode === "grupo" 
    ? ["squad-chat-grupo", user?.id, tenantId] 
    : ["squad-chat-individual", user?.id, selectedAgent?.id];

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: chatKey,
    queryFn: async () => {
      if (!tenantId || !user) return [];

      let query = supabase
        .from("chat_messages")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (mode === "individual" && selectedAgent) {
        query = query.eq("agent_id", selectedAgent.id);
      } else if (mode === "grupo") {
        // Group mode: messages that either have no agent_id OR have squad_id
        query = query.is("agent_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.created_at),
        agent_id: m.agent_id,
        agent_name: m.agent_name,
      }));
    },
    enabled: !!user && !!tenantId && (mode === "grupo" || !!selectedAgent),
    refetchInterval: 10000, // Poll every 10s for new messages
  });

  // Get last message per agent for the contact list
  const { data: lastMessages = {} } = useQuery({
    queryKey: ["squad-chat-last-messages", user?.id, tenantId],
    queryFn: async () => {
      if (!tenantId || !user) return {};
      
      const { data } = await supabase
        .from("chat_messages")
        .select("agent_id, content, created_at")
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .not("agent_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);

      const result: Record<string, { content: string; timestamp: Date }> = {};
      for (const msg of data || []) {
        if (msg.agent_id && !result[msg.agent_id]) {
          result[msg.agent_id] = {
            content: msg.content,
            timestamp: new Date(msg.created_at),
          };
        }
      }
      return result;
    },
    enabled: !!user && !!tenantId,
    staleTime: 30000,
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedAgent, mode]);

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return activeAgents;
    const q = searchQuery.toLowerCase();
    return activeAgents.filter(a => 
      a.name.toLowerCase().includes(q) || 
      (a.description?.toLowerCase().includes(q)) ||
      (a.objective?.toLowerCase().includes(q))
    );
  }, [activeAgents, searchQuery]);

  const getLastMessage = (agentId: string): string => {
    const msg = lastMessages[agentId];
    if (!msg) return t("squad.tap_to_chat");
    return msg.content.slice(0, 50) + (msg.content.length > 50 ? "…" : "");
  };

  const getLastTime = (agentId: string): string => {
    const msg = lastMessages[agentId];
    if (!msg) return "";
    return msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const selectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowMobileChat(true);
    setMode("individual");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const saveMessage = async (msg: ChatMsg, agentId?: string | null, agentName?: string | null) => {
    if (!tenantId || !user) return;
    
    await supabase.from("chat_messages").insert({
      tenant_id: tenantId,
      user_id: user.id,
      agent_id: agentId || null,
      agent_name: agentName || null,
      role: msg.role,
      content: msg.content,
    });
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !tenantId) return;
    if (mode === "individual" && !selectedAgent) return;

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    // Save user message
    await saveMessage(userMsg, mode === "individual" ? selectedAgent?.id : null, null);
    setInput("");
    setIsLoading(true);
    refetchMessages();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error(t("squad.login_required")); setIsLoading(false); return; }

      // Build conversation history from persisted messages
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const endpoint = mode === "grupo" 
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/squad-chat`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

      const body = mode === "grupo"
        ? { message: userMsg.content, conversationHistory: history }
        : { message: userMsg.content, agentId: selectedAgent?.id, conversationHistory: history };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 402) toast.error(t("squad.credits_exhausted"));
        else toast.error(data.error || t("squad.send_error"));
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const assistantMsg: ChatMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || data.content || "...",
        timestamp: new Date(),
        agent_name: mode === "grupo" ? data.agent_name : selectedAgent?.name,
      };

      // Save assistant message
      await saveMessage(
        assistantMsg, 
        mode === "individual" ? selectedAgent?.id : null,
        assistantMsg.agent_name
      );
      
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["squad-chat-last-messages"] });
    } catch (err) {
      console.error("Chat error:", err);
      toast.error(t("squad.connection_error"));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedAgent, messages, mode, tenantId, refetchMessages, queryClient]);

  // ═══════════ CONTACT LIST ═══════════
  const ContactList = () => (
    <div className={cn(
      "flex flex-col h-full border-r border-border/20 bg-card/30",
      showMobileChat ? "hidden lg:flex" : "flex",
      "w-full lg:w-[340px] shrink-0"
    )}>
      {/* Header with Tabs */}
      <div className="px-4 py-4 border-b border-border/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg">{t("squad.title")}</h2>
          <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
            {t("squad.agents_count", { count: activeAgents.length })}
          </Badge>
        </div>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as "individual" | "grupo")} className="mb-3">
          <TabsList className="w-full h-9 p-1 bg-muted/30">
            <TabsTrigger value="individual" className="flex-1 text-xs gap-1.5 data-[state=active]:bg-background">
              <User className="h-3.5 w-3.5" />
              {t("squad.chat_individual")}
            </TabsTrigger>
            <TabsTrigger value="grupo" className="flex-1 text-xs gap-1.5 data-[state=active]:bg-background">
              <Users className="h-3.5 w-3.5" />
              {t("squad.chat_group")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "individual" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("squad.search_agent")}
              className="w-full bg-background/50 border border-border/30 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
        )}
      </div>

      {/* Contact List for Individual Mode */}
      {mode === "individual" && (
        <div className="flex-1 overflow-y-auto">
          {filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Bot className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {activeAgents.length === 0 ? t("squad.no_active_agents") : t("squad.no_results")}
              </p>
              {activeAgents.length === 0 && (
                <Button 
                  variant="link" 
                  className="text-primary text-xs mt-2"
                  onClick={() => onRequestAgent?.("")}
                >
                  {t("squad.hire_agents")}
                </Button>
              )}
            </div>
          ) : (
            filteredAgents.map((agent) => {
              const isSelected = selectedAgent?.id === agent.id;
              const lastMsg = getLastMessage(agent.id);
              const lastTime = getLastTime(agent.id);

              return (
                <motion.button
                  key={agent.id}
                  onClick={() => selectAgent(agent)}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-border/10",
                    isSelected 
                      ? "bg-primary/8 border-l-2 border-l-primary" 
                      : "hover:bg-card/60 border-l-2 border-l-transparent"
                  )}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${agentColor(agent.name)} flex items-center justify-center shadow-md`}>
                      <span className="text-xs font-bold text-white">{agentInitials(agent.name)}</span>
                    </div>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                      agent.status === "active" ? "bg-primary" : "bg-muted-foreground/50"
                    )} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground truncate">{agent.name}</span>
                      {lastTime && (
                        <span className="text-[10px] shrink-0 ml-2 text-muted-foreground">{lastTime}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate pr-2 mt-0.5">{lastMsg}</p>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      )}

      {/* Group Mode Info */}
      {mode === "grupo" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg mb-4">
            <Users className="h-7 w-7 text-white" />
          </div>
          <h3 className="font-display font-bold text-base mb-2">{t("squad.group_chat")}</h3>
          <p className="text-xs text-muted-foreground max-w-xs mb-4">
            {t("squad.group_desc")}
          </p>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => { setShowMobileChat(true); inputRef.current?.focus(); }}
          >
            {t("squad.open_chat")}
          </Button>
        </div>
      )}
    </div>
  );

  // ═══════════ CHAT AREA ═══════════
  const ChatArea = () => {
    const showChat = mode === "grupo" || selectedAgent;
    const chatTitle = mode === "grupo" ? t("squad.group_team") : selectedAgent?.name || "";
    const chatSubtitle = mode === "grupo" 
      ? t("squad.agents_collaborating", { count: activeAgents.length })
      : (selectedAgent?.description || selectedAgent?.objective || t("squad.ai_agent"));

    return (
      <div className={cn(
        "flex-1 flex flex-col h-full bg-background/50",
        !showMobileChat ? "hidden lg:flex" : "flex"
      )}>
        {!showChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-primary/40" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-2">{t("squad.select_agent")}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("squad.select_agent_desc")}
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/20 bg-card/30 backdrop-blur-sm shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setShowMobileChat(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              {mode === "grupo" ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
                  <Users className="h-4 w-4 text-white" />
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${agentColor(chatTitle)} flex items-center justify-center shadow-md`}>
                  <span className="text-[10px] font-bold text-white">{agentInitials(chatTitle)}</span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{chatTitle}</span>
                  {mode === "individual" && selectedAgent && (
                    <span className={`w-2 h-2 rounded-full ${tierDot[selectedAgent.tier] || tierDot.basic}`} />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{chatSubtitle}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4" style={{
              backgroundImage: "radial-gradient(circle at 50% 50%, hsl(var(--primary)/0.02) 0%, transparent 70%)",
            }}>
              <div className="max-w-2xl mx-auto space-y-3">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    {mode === "grupo" ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg mb-4">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-display font-bold text-base mb-1">{t("squad.group_empty_title")}</h3>
                        <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                          {t("squad.group_empty_desc")}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${agentColor(selectedAgent?.name || "")} flex items-center justify-center shadow-lg mb-4`}>
                          <span className="text-lg font-bold text-white">{agentInitials(selectedAgent?.name || "")}</span>
                        </div>
                        <h3 className="font-display font-bold text-base mb-1">{selectedAgent?.name}</h3>
                        <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                          {selectedAgent?.description || selectedAgent?.objective || t("squad.agent_ready")}
                        </p>
                      </>
                    )}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[t("squad.quick_help"), t("squad.quick_objective"), t("squad.quick_report")].map((q) => (
                        <button
                          key={q}
                          onClick={() => { setInput(q); inputRef.current?.focus(); }}
                          className="text-xs px-3 py-2 rounded-xl bg-card border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <AnimatePresence mode="popLayout">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card border border-border/40 rounded-bl-md"
                      )}>
                        {/* Agent name label in group mode */}
                        {msg.role === "assistant" && mode === "grupo" && msg.agent_name && (
                          <div className="text-[10px] font-semibold text-primary mb-1">{msg.agent_name}</div>
                        )}
                        <div className="text-[14px] leading-relaxed prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}>
                          <span className={cn(
                            "text-[9px]",
                            msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}>
                            {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.role === "user" && (
                            <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-card border border-border/40 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <motion.span className="w-2 h-2 rounded-full bg-primary/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} />
                          <motion.span className="w-2 h-2 rounded-full bg-primary/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} />
                          <motion.span className="w-2 h-2 rounded-full bg-primary/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{t("squad.typing")}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-border/20 bg-card/20 backdrop-blur-sm px-4 py-3">
              <div className="max-w-2xl mx-auto flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={mode === "grupo" ? t("squad.msg_group_placeholder") : t("squad.msg_agent_placeholder", { name: selectedAgent?.name || "" })}
                    rows={1}
                    className="w-full resize-none bg-background/60 border border-border/30 rounded-2xl px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all max-h-32"
                    style={{ minHeight: "44px" }}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-11 w-11 rounded-full shrink-0 shadow-md"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-border/20 bg-background">
      <ContactList />
      <ChatArea />
    </div>
  );
};

export default SquadChat;
