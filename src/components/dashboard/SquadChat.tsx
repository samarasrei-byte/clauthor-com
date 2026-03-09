import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Loader2, Users, Search,
  Phone, Video, MoreVertical, Check, CheckCheck,
  ArrowLeft, Sparkles, MessageSquare, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
}

interface SquadChatProps {
  agents: Agent[];
  onRequestAgent?: (agentName: string) => void;
}

const tierDot: Record<string, string> = {
  basic: "bg-muted-foreground",
  intermediate: "bg-blue-400",
  advanced: "bg-emerald-400",
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
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Record<string, ChatMsg[]>>({});
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeAgents = agents.filter((a) => a.status === "active");

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return activeAgents;
    const q = searchQuery.toLowerCase();
    return activeAgents.filter(a => 
      a.name.toLowerCase().includes(q) || 
      (a.description?.toLowerCase().includes(q)) ||
      (a.objective?.toLowerCase().includes(q))
    );
  }, [activeAgents, searchQuery]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, selectedAgent]);

  const currentMessages = selectedAgent ? (conversations[selectedAgent.id] || []) : [];

  const getLastMessage = (agentId: string): string => {
    const msgs = conversations[agentId];
    if (!msgs || msgs.length === 0) return "Toque para conversar";
    return msgs[msgs.length - 1].content.slice(0, 60) + (msgs[msgs.length - 1].content.length > 60 ? "…" : "");
  };

  const getLastTime = (agentId: string): string => {
    const msgs = conversations[agentId];
    if (!msgs || msgs.length === 0) return "";
    return msgs[msgs.length - 1].timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const getUnread = (agentId: string): number => {
    const msgs = conversations[agentId];
    if (!msgs) return 0;
    // Count consecutive assistant messages from the end
    let count = 0;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "assistant") count++;
      else break;
    }
    return selectedAgent?.id === agentId ? 0 : count;
  };

  const selectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowMobileChat(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !selectedAgent) return;

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setConversations(prev => ({
      ...prev,
      [selectedAgent.id]: [...(prev[selectedAgent.id] || []), userMsg],
    }));
    setInput("");
    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error("Faça login."); setIsLoading(false); return; }

      const history = (conversations[selectedAgent.id] || []).slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            message: userMsg.content,
            agentId: selectedAgent.id,
            conversationHistory: history,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 402) toast.error("Créditos esgotados!");
        else toast.error(data.error || "Erro ao enviar.");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const assistantMsg: ChatMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || data.content || "...",
        timestamp: new Date(),
      };

      setConversations(prev => ({
        ...prev,
        [selectedAgent.id]: [...(prev[selectedAgent.id] || []), userMsg, assistantMsg].filter(
          (msg, idx, arr) => arr.findIndex(m => m.id === msg.id) === idx
        ),
      }));
    } catch (err) {
      console.error("Chat error:", err);
      toast.error("Erro de conexão.");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedAgent, conversations]);

  // ═══════════ CONTACT LIST ═══════════
  const ContactList = () => (
    <div className={cn(
      "flex flex-col h-full border-r border-border/20 bg-card/30",
      showMobileChat ? "hidden lg:flex" : "flex",
      "w-full lg:w-[340px] shrink-0"
    )}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg">Equipe</h2>
          <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
            {activeAgents.length} agentes
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar agente..."
            className="w-full bg-background/50 border border-border/30 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="flex-1 overflow-y-auto">
        {filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Bot className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {activeAgents.length === 0 ? "Nenhum agente ativo" : "Nenhum resultado"}
            </p>
            {activeAgents.length === 0 && (
              <Button 
                variant="link" 
                className="text-primary text-xs mt-2"
                onClick={() => onRequestAgent?.("")}
              >
                Contratar agentes →
              </Button>
            )}
          </div>
        ) : (
          filteredAgents.map((agent) => {
            const isSelected = selectedAgent?.id === agent.id;
            const unread = getUnread(agent.id);
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
                  {/* Online indicator */}
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                    agent.status === "active" ? "bg-emerald-400" : "bg-muted-foreground/50"
                  )} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground truncate">{agent.name}</span>
                    {lastTime && (
                      <span className={cn(
                        "text-[10px] shrink-0 ml-2",
                        unread > 0 ? "text-primary font-semibold" : "text-muted-foreground"
                      )}>{lastTime}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate pr-2">{lastMsg}</p>
                    {unread > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary-foreground">{unread}</span>
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );

  // ═══════════ CHAT AREA ═══════════
  const ChatArea = () => (
    <div className={cn(
      "flex-1 flex flex-col h-full bg-background/50",
      !showMobileChat ? "hidden lg:flex" : "flex"
    )}>
      {!selectedAgent ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="w-20 h-20 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-primary/40" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-2">Selecione um agente</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Escolha um agente da sua equipe para iniciar uma conversa individual.
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
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${agentColor(selectedAgent.name)} flex items-center justify-center shadow-md`}>
              <span className="text-[10px] font-bold text-white">{agentInitials(selectedAgent.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{selectedAgent.name}</span>
                <span className={`w-2 h-2 rounded-full ${tierDot[selectedAgent.tier] || tierDot.basic}`} />
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {selectedAgent.status === "active" ? "Online • " : ""}
                {selectedAgent.description || selectedAgent.objective || "Agente IA"}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{
            backgroundImage: "radial-gradient(circle at 50% 50%, hsl(var(--primary)/0.02) 0%, transparent 70%)",
          }}>
            <div className="max-w-2xl mx-auto space-y-3">
              {currentMessages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${agentColor(selectedAgent.name)} flex items-center justify-center shadow-lg mb-4`}>
                    <span className="text-lg font-bold text-white">{agentInitials(selectedAgent.name)}</span>
                  </div>
                  <h3 className="font-display font-bold text-base mb-1">{selectedAgent.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                    {selectedAgent.description || selectedAgent.objective || "Agente de IA pronto para ajudar"}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["Como você pode me ajudar?", "Qual seu objetivo?", "Me dê um relatório"].map((q) => (
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
                {currentMessages.map((msg) => (
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
                      <div className="text-[14px] leading-relaxed prose prose-sm prose-invert max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0">
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
                      <span className="text-[10px] text-muted-foreground">digitando...</span>
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
                  placeholder={`Mensagem para ${selectedAgent.name}...`}
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

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-border/20 bg-background">
      <ContactList />
      <ChatArea />
    </div>
  );
};

export default SquadChat;
