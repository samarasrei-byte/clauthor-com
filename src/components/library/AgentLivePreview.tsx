import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles, Loader2, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

interface AgentLivePreviewProps {
  agentName: string;
  agentDesc: string;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FREE_MESSAGES = 3;

const AgentLivePreview = ({ agentName, agentDesc, isOpen, onClose }: AgentLivePreviewProps) => {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, clearMessages } = useAgentChat();
  const [input, setInput] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const { t } = useTranslation();
  const trialEnded = messageCount >= MAX_FREE_MESSAGES;

  useEffect(() => {
    if (isOpen) { clearMessages(); setMessageCount(0); setInput(""); }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || trialEnded) return;
    const msg = input; setInput("");
    setMessageCount(prev => prev + 1);
    await sendMessage(msg);
  }, [input, isLoading, trialEnded, sendMessage]);

  if (!isOpen) return null;
  const progressPercent = ((MAX_FREE_MESSAGES - messageCount) / MAX_FREE_MESSAGES) * 100;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg holo-card rounded-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
          <div className="h-1 bg-white/5 relative">
            <motion.div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${progressPercent}%` }} transition={{ duration: 0.5 }} />
          </div>
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm">{agentName}</h3>
                <p className="text-[10px] text-muted-foreground">{t("preview.live_demo")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${messageCount >= MAX_FREE_MESSAGES - 1 ? "border-destructive/30 text-destructive animate-pulse" : "border-primary/20 text-primary"}`}>
                <Zap className="h-3 w-3 mr-1" />{MAX_FREE_MESSAGES - messageCount} msgs
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {messages.length === 0 && !trialEnded && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-glow/10 flex items-center justify-center mb-4 animate-pulse-glow">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">{t("preview.test_agent")} {agentName}</p>
                <p className="text-xs text-muted-foreground max-w-xs">{agentDesc}</p>
                {!user && <p className="text-xs text-primary mt-4">{t("preview.login_required")}</p>}
              </div>
            )}
            {messages.map((msg, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary/20" : "bg-white/5"}`}>
                  {msg.role === "user" ? <User className="h-3.5 w-3.5 text-primary" /> : <Bot className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-white/5"}`}>
                  {msg.role === "assistant" ? <div className="text-xs prose prose-sm prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div> : <p className="text-xs">{msg.content}</p>}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center"><Bot className="h-3.5 w-3.5 text-muted-foreground" /></div>
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
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <p className="text-sm font-semibold mb-1 gradient-text">{t("preview.time_up")}</p>
                <p className="text-xs text-muted-foreground mb-4">{t("preview.time_up_desc")}</p>
                <Button className="neon-glow" onClick={onClose}>{t("preview.hire_agent")}</Button>
              </motion.div>
            )}
          </div>
          <div className="p-3 border-t border-white/5">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={trialEnded ? t("preview.placeholder_expired") : user ? t("preview.placeholder_logged") : t("preview.placeholder_login")} className="flex-1 bg-white/5 border-white/10 focus:border-primary/50 text-sm h-9" disabled={isLoading || trialEnded || !user} />
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
