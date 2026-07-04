import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, ArrowRight } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CONSULTANT_PROMPT = `Consultor de Squad CLAUTHOR - prompt delegado ao edge function.`;

export default function SquadConsultant() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setStarted(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Use user's session token if available, fallback to anon key
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/squad-consultant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || "Desculpe, não consegui processar sua mensagem.",
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error("Consultant error:", error);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente em alguns instantes.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const quickStarters = [
    "Tenho uma empresa e não sei por onde começar com IA",
    "Preciso automatizar atendimento e vendas do meu negócio",
    "Quero entender o que cada agente faz antes de contratar",
  ];

  return (
    <div className="space-y-4">
      {!started ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl mb-2">
              {t("squads.consultant_title", { defaultValue: "Consultor de Squad IA" })}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t("squads.consultant_desc", {
                defaultValue: "Conte sobre sua empresa e nosso consultor de IA vai montar o squad perfeito para você.",
              })}
            </p>
          </div>

          <div className="flex flex-col gap-2 max-w-md mx-auto">
            {quickStarters.map((starter, i) => (
              <Button
                key={i}
                variant="outline"
                className="text-left justify-start h-auto py-3 px-4 text-sm rounded-xl border-border hover:border-primary/30 hover:bg-primary/5"
                onClick={() => sendMessage(starter)}
              >
                <ArrowRight className="h-3.5 w-3.5 mr-2 shrink-0 text-primary" />
                <span className="line-clamp-1">{starter}</span>
              </Button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("squads.consultant_placeholder", {
                defaultValue: "Descreva sua empresa ou desafio...",
              })}
              className="rounded-xl bg-card/50 border-border"
            />
            <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col"
        >
          {/* Chat messages */}
          <div
            ref={scrollRef}
            className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-4 scrollbar-thin"
          >
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card/60 border border-border rounded-bl-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_li]:mb-0.5">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-card/60 border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("squads.consultant_placeholder", {
                defaultValue: "Descreva sua empresa ou desafio...",
              })}
              className="rounded-xl bg-card/50 border-border"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-xl shrink-0"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {messages.length >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-3 space-y-2"
            >
              <p className="text-[11px] text-muted-foreground">
                Gostou da recomendação? Crie sua conta para ativar o squad.
              </p>
              <Link to="/auth" state={{ signup: true }}>
                <Button size="sm" className="gap-1.5 rounded-xl glow text-xs h-9 px-5">
                  <Sparkles className="h-3 w-3" />
                  {t("squads.consultant_cta", { defaultValue: "Criar conta e contratar" })}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
