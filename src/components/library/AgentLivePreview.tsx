import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles, Loader2, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";

interface AgentLivePreviewProps {
  agentName: string;
  agentDesc: string;
  isOpen: boolean;
  onClose: () => void;
}

const TRIAL_SECONDS = 60;

const AgentLivePreview = ({ agentName, agentDesc, isOpen, onClose }: AgentLivePreviewProps) => {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, clearMessages } = useAgentChat();
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(TRIAL_SECONDS);
  const [trialEnded, setTrialEnded] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || trialEnded) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTrialEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, trialEnded]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      clearMessages();
      setTimeLeft(TRIAL_SECONDS);
      setTrialEnded(false);
      setInput("");
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || trialEnded) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  }, [input, isLoading, trialEnded, sendMessage]);

  if (!isOpen) return null;

  const progressPercent = (timeLeft / TRIAL_SECONDS) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg holo-card rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Timer Bar */}
          <div className="h-1 bg-white/5 relative">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-glow"
              style={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm">{agentName}</h3>
                <p className="text-[10px] text-muted-foreground">Demonstração ao vivo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  timeLeft <= 10 
                    ? "border-destructive/30 text-destructive animate-pulse" 
                    : "border-primary/20 text-primary"
                }`}
              >
                <Zap className="h-3 w-3 mr-1" />
                {timeLeft}s
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {/* Intro message */}
            {messages.length === 0 && !trialEnded && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-glow/10 flex items-center justify-center mb-4 animate-pulse-glow">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">Teste o {agentName}</p>
                <p className="text-xs text-muted-foreground max-w-xs">{agentDesc}</p>
                {!user && (
                  <p className="text-xs text-primary mt-4">
                    ⚡ Faça login para testar o agente ao vivo
                  </p>
                )}
              </div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-primary/20" : "bg-white/5"
                }`}>
                  {msg.role === "user" ? <User className="h-3.5 w-3.5 text-primary" /> : <Bot className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-white/5"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="text-xs prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="bg-white/5 rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {trialEnded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <p className="text-sm font-semibold mb-1 gradient-text">Tempo esgotado!</p>
                <p className="text-xs text-muted-foreground mb-4">Gostou? Contrate este agente para uso ilimitado.</p>
                <Button className="neon-glow" onClick={onClose}>
                  Contratar Agente
                </Button>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={trialEnded ? "Tempo esgotado" : user ? "Teste uma pergunta..." : "Faça login para testar"}
                className="flex-1 bg-white/5 border-white/10 focus:border-primary/50 text-sm h-9"
                disabled={isLoading || trialEnded || !user}
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!input.trim() || isLoading || trialEnded || !user}>
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AgentLivePreview;
