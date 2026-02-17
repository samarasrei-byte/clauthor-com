import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAgentChat } from "@/hooks/useAgentChat";
import ReactMarkdown from "react-markdown";

interface AgentChatProps {
  agentId?: string;
  agentName?: string;
}

const AgentChat = ({ agentId, agentName = "Assistente IA" }: AgentChatProps) => {
  const { messages, isLoading, sendMessage, clearMessages } = useAgentChat(agentId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset chat when agent changes
  useEffect(() => {
    clearMessages();
  }, [agentId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">{agentName}</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            IA Ativa
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {agentId
                ? `Converse com o ${agentName}. Ele está pronto para ajudar!`
                : "Selecione um agente ativo para iniciar uma conversa."}
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  message.role === "user" ? "bg-primary/20" : "bg-white/5"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4 text-primary" />
                ) : (
                  <Bot className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/5 text-foreground"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="text-sm prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Bot className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="bg-white/5 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* AI Disclaimer */}
      <div className="px-4 pt-2">
        <p className="text-[10px] text-muted-foreground/60 text-center">
          🤖 Assistente com IA — respostas podem conter imprecisões. Não substitui aconselhamento profissional.
        </p>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-1 border-t border-white/5">
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
            placeholder={agentId ? "Digite sua mensagem..." : "Selecione um agente primeiro"}
            className="flex-1 bg-white/5 border-white/10 focus:border-primary/50"
            disabled={isLoading || !agentId}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || !agentId}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AgentChat;
