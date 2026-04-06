import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Phone, Mail, Search, Filter,
  Clock, Bot, User, ChevronRight, Inbox as InboxIcon,
  ArrowUpRight, Circle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

type ChannelType = "all" | "dashboard" | "whatsapp" | "email";

interface ConversationThread {
  id: string;
  agentName: string;
  channel: ChannelType;
  lastMessage: string;
  lastMessageAt: string;
  role: string;
  unread: boolean;
  agentId: string | null;
}

const CHANNEL_CONFIG: Record<string, { icon: typeof MessageSquare; label: string; color: string; dot: string }> = {
  dashboard: { icon: MessageSquare, label: "Chat", color: "text-primary", dot: "bg-primary" },
  whatsapp: { icon: Phone, label: "WhatsApp", color: "text-emerald-400", dot: "bg-emerald-400" },
  email: { icon: Mail, label: "E-mail", color: "text-accent-blue", dot: "bg-accent-blue" },
};

const UnifiedInbox = ({ onOpenChat }: { onOpenChat?: (agent: { id: string; name: string }) => void }) => {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState<ChannelType>("all");
  const [search, setSearch] = useState("");
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch chat messages grouped by agent
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["unified-inbox", user?.id],
    queryFn: async () => {
      const tenantId = await supabase.rpc("get_user_tenant_id", { _user_id: user!.id });
      if (!tenantId.data) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, content, role, agent_name, agent_id, created_at, metadata")
        .eq("tenant_id", tenantId.data)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15_000,
  });

  // Fetch notifications as "system channel"
  const { data: notifications = [] } = useQuery({
    queryKey: ["inbox-notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  // Build conversation threads
  const threads: ConversationThread[] = useMemo(() => {
    const threadMap = new Map<string, ConversationThread>();

    for (const msg of messages) {
      const key = msg.agent_id || msg.agent_name || "general";
      const channel: ChannelType = (msg.metadata as any)?.channel === "whatsapp"
        ? "whatsapp"
        : (msg.metadata as any)?.channel === "email"
        ? "email"
        : "dashboard";

      if (!threadMap.has(key)) {
        threadMap.set(key, {
          id: key,
          agentName: msg.agent_name || "Assistente",
          channel,
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          role: msg.role,
          unread: msg.role === "assistant",
          agentId: msg.agent_id,
        });
      }
    }

    return Array.from(threadMap.values());
  }, [messages]);

  const filteredThreads = useMemo(() => {
    let result = threads;
    if (activeChannel !== "all") {
      result = result.filter(t => t.channel === activeChannel);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.agentName.toLowerCase().includes(q) ||
        t.lastMessage.toLowerCase().includes(q)
      );
    }
    return result;
  }, [threads, activeChannel, search]);

  // Selected thread messages
  const threadMessages = useMemo(() => {
    if (!selectedThread) return [];
    return messages
      .filter(m => (m.agent_id || m.agent_name || "general") === selectedThread)
      .reverse();
  }, [messages, selectedThread]);

  const selectedThreadInfo = threads.find(t => t.id === selectedThread);

  const channelTabs: { id: ChannelType; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: threads.length },
    { id: "dashboard", label: "Chat", count: threads.filter(t => t.channel === "dashboard").length },
    { id: "whatsapp", label: "WhatsApp", count: threads.filter(t => t.channel === "whatsapp").length },
    { id: "email", label: "E-mail", count: threads.filter(t => t.channel === "email").length },
  ];

  return (
    <div className="h-full flex flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <InboxIcon className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Inbox Unificada</h2>
            <p className="text-[10px] text-muted-foreground">
              {threads.length} conversas · {notifications.length} alertas pendentes
            </p>
          </div>
        </div>
      </div>

      {/* Channel Tabs */}
      <div className="flex items-center gap-1 p-0.5 bg-muted/30 rounded-lg w-fit">
        {channelTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveChannel(tab.id); setSelectedThread(null); }}
            className={cn(
              "px-3 py-1.5 rounded-md text-[10.5px] font-medium transition-all",
              activeChannel === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-[9px] opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-3 min-h-0 rounded-xl border border-border/10 bg-card/30 overflow-hidden">
        {/* Thread List */}
        <div className={cn(
          "flex flex-col border-r border-border/10",
          selectedThread ? "w-80 hidden sm:flex" : "flex-1"
        )}>
          {/* Search */}
          <div className="p-3 border-b border-border/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar conversas..."
                className="pl-8 h-8 text-[11px] bg-muted/20 border-border/10"
              />
            </div>
          </div>

          {/* Notifications Banner */}
          {notifications.length > 0 && (
            <div className="mx-3 mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Circle className="h-2 w-2 text-primary fill-primary animate-pulse" />
                </div>
                <span className="text-[10px] text-primary font-medium">
                  {notifications.length} alertas proativos dos agentes
                </span>
              </div>
              <p className="text-[9.5px] text-muted-foreground mt-1 truncate">
                {notifications[0]?.title}
              </p>
            </div>
          )}

          {/* Thread List */}
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <InboxIcon className="h-8 w-8 text-muted-foreground/20 mb-3" />
                  <p className="text-[11px] text-muted-foreground/60">Nenhuma conversa encontrada</p>
                  <p className="text-[10px] text-muted-foreground/40 mt-1">
                    Inicie um chat com um agente para começar
                  </p>
                </div>
              ) : (
                filteredThreads.map((thread, i) => {
                  const channelCfg = CHANNEL_CONFIG[thread.channel] || CHANNEL_CONFIG.dashboard;
                  const ChannelIcon = channelCfg.icon;
                  const isSelected = selectedThread === thread.id;

                  return (
                    <motion.button
                      key={thread.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelectedThread(thread.id)}
                      className={cn(
                        "w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-all",
                        isSelected
                          ? "bg-primary/8 border border-primary/15"
                          : "hover:bg-muted/10 border border-transparent"
                      )}
                    >
                      {/* Agent Avatar */}
                      <div className="relative shrink-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          isSelected ? "bg-primary/15" : "bg-muted/20"
                        )}>
                          <Bot className={cn("h-3.5 w-3.5", isSelected ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
                        </div>
                        {/* Channel indicator dot */}
                        <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card flex items-center justify-center", channelCfg.dot)}>
                          <ChannelIcon className="h-1.5 w-1.5 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn(
                            "text-[11px] font-medium truncate",
                            isSelected ? "text-primary" : "text-foreground"
                          )}>
                            {thread.agentName}
                          </span>
                          <span className="text-[9px] text-muted-foreground/50 whitespace-nowrap">
                            {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: false, locale: pt })}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5 leading-relaxed">
                          {thread.role === "user" && <span className="text-foreground/60">Você: </span>}
                          {thread.lastMessage.slice(0, 80)}
                        </p>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Message Detail */}
        <AnimatePresence mode="wait">
          {selectedThread ? (
            <motion.div
              key={selectedThread}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex-1 flex flex-col min-w-0"
            >
              {/* Thread Header */}
              <div className="flex items-center justify-between p-3 border-b border-border/10">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setSelectedThread(null)}
                    className="sm:hidden p-1 hover:bg-muted/10 rounded"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180 text-muted-foreground" />
                  </button>
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[11.5px] font-semibold text-foreground">{selectedThreadInfo?.agentName}</p>
                    <div className="flex items-center gap-1.5">
                      {selectedThreadInfo && (
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-border/20">
                          {CHANNEL_CONFIG[selectedThreadInfo.channel]?.label || "Chat"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {selectedThreadInfo?.agentId && onOpenChat && (
                  <button
                    onClick={() => onOpenChat({ id: selectedThreadInfo.agentId!, name: selectedThreadInfo.agentName })}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/15 transition-colors"
                  >
                    Abrir Chat <ArrowUpRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2.5 max-w-2xl">
                  {threadMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role !== "user" && (
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="h-3 w-3 text-primary" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[75%] px-3 py-2 rounded-xl text-[11px] leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted/30 text-foreground border border-border/10 rounded-bl-sm"
                      )}>
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-6 h-6 rounded-md bg-muted/20 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hidden sm:flex flex-1 items-center justify-center"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-muted/10 flex items-center justify-center mx-auto mb-3">
                  <InboxIcon className="h-5 w-5 text-muted-foreground/30" />
                </div>
                <p className="text-[11px] text-muted-foreground/50">Selecione uma conversa</p>
                <p className="text-[9.5px] text-muted-foreground/30 mt-1">
                  WhatsApp · Chat · E-mail — tudo aqui
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UnifiedInbox;
