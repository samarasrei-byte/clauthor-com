import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ShieldCheck, ShieldAlert, Eye, Lock, Wifi, Server,
  Send, Loader2, RotateCcw, AlertTriangle, Activity, Users,
  Fingerprint, Globe, Cpu, Database, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string; agent?: string };

const AGENTS = [
  { id: "soc", name: "SOC Analyst", icon: Eye, color: "text-cyan-400", status: "online", desc: "Monitoramento 24/7" },
  { id: "threat", name: "Threat Intel", icon: ShieldAlert, color: "text-red-400", status: "online", desc: "Inteligência de ameaças" },
  { id: "firewall", name: "Firewall Manager", icon: Lock, color: "text-amber-400", status: "online", desc: "Controle de acessos" },
  { id: "network", name: "Network Guard", icon: Wifi, color: "text-emerald-400", status: "online", desc: "Segurança de rede" },
  { id: "infra", name: "Infra Security", icon: Server, color: "text-purple-400", status: "online", desc: "Proteção de servidores" },
  { id: "identity", name: "Identity Manager", icon: Fingerprint, color: "text-pink-400", status: "online", desc: "Gestão de identidades" },
];

const QUICK_COMMANDS = [
  "Status geral de segurança",
  "Relatório de ameaças",
  "Atividades suspeitas nas últimas 24h",
  "Auditoria de acessos e permissões",
  "Vulnerabilidades detectadas",
  "Métricas do SOC",
];

const CyberSecurityGroup = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada.");
        setIsLoading(false);
        return;
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cyber-security-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(errData.error || `Erro ${resp.status}`);
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar, agent: "CISO" } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar, agent: "CISO" }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error("cyber-security-group error:", err);
      toast.error("Erro ao comunicar com o grupo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Left: Team Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto"
          >
            {/* Department Header */}
            <div className="glass-card rounded-2xl p-4 border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-primary/20 flex items-center justify-center relative">
                  <Shield className="h-6 w-6 text-primary" />
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm">Dept. Cyber Security</h3>
                  <p className="text-[10px] text-muted-foreground">Grupo Presidencial</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {AGENTS.slice(0, 4).map((a) => (
                    <div key={a.id} className="w-6 h-6 rounded-full bg-accent/60 border-2 border-background flex items-center justify-center">
                      <a.icon className={`h-3 w-3 ${a.color}`} />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">{AGENTS.length} agentes online</span>
                <div className="ml-auto flex items-center gap-1">
                  <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-medium">LIVE</span>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="glass-card rounded-2xl p-3 border border-white/[0.06] flex-1">
              <h4 className="text-xs font-medium text-muted-foreground px-2 mb-2">EQUIPE DO DEPARTAMENTO</h4>
              <div className="space-y-1">
                {AGENTS.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.08] transition-colors relative">
                      <agent.icon className={`h-4 w-4 ${agent.color}`} />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground">{agent.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Threat Level */}
            <div className="glass-card rounded-2xl p-4 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-medium">Nível de Ameaça</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-accent/30 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "25%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  />
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px] border-0">BAIXO</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-sm font-bold text-foreground">0</p>
                  <p className="text-[9px] text-muted-foreground">Críticos</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-sm font-bold text-foreground">2</p>
                  <p className="text-[9px] text-muted-foreground">Alertas</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-sm font-bold text-foreground">99.8%</p>
                  <p className="text-[9px] text-muted-foreground">Uptime</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right: Group Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden"
              onClick={() => setShowPanel(!showPanel)}
            >
              <Users className="h-4 w-4" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-red-500/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base">Grupo Cyber Security</h2>
                <Badge className="bg-primary/10 text-primary text-[9px] border-0">DEPARTAMENTO</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {AGENTS.length} agentes ativos — Comunicação direta com o Presidente
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="gap-1.5 text-xs text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Limpar
            </Button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3 glass-card rounded-2xl p-4 border border-white/[0.06]">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-red-500/10 flex items-center justify-center">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                </div>
              </div>
              <h3 className="font-display text-xl font-bold mb-1">Departamento de Cyber Security</h3>
              <p className="text-xs text-muted-foreground mb-1">Canal direto do Presidente com a equipe de segurança</p>
              <p className="text-[10px] text-muted-foreground mb-6 max-w-sm">
                Todos os agentes estão monitorando a plataforma em tempo real. Faça uma pergunta e o time completo irá analisar e responder.
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                {QUICK_COMMANDS.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => sendMessage(cmd)}
                    className="px-3 py-2.5 rounded-xl bg-accent/30 hover:bg-accent/50 text-[11px] text-muted-foreground hover:text-foreground transition-all text-left border border-white/[0.04] hover:border-white/[0.08]"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent/30 border border-white/[0.06]"
                }`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-medium text-primary">CISO & Equipe</span>
                      <span className="text-[9px] text-muted-foreground">agora</span>
                    </div>
                  )}
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-accent/30 border border-white/[0.06] rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Equipe analisando dados de segurança...</span>
                </div>
                <div className="flex gap-1 mt-2">
                  {AGENTS.slice(0, 4).map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-5 h-5 rounded-full bg-accent/60 flex items-center justify-center"
                    >
                      <a.icon className={`h-2.5 w-2.5 ${a.color}`} />
                    </motion.div>
                  ))}
                  <span className="text-[9px] text-muted-foreground ml-1 self-center">trabalhando...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envie uma ordem ou pergunta para o departamento..."
            className="min-h-[48px] max-h-32 resize-none bg-accent/20 border-white/[0.08] rounded-xl"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-12 w-12 rounded-xl shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Canal seguro — Somente o Presidente tem acesso a este grupo
        </p>
      </div>
    </div>
  );
};

export default CyberSecurityGroup;
