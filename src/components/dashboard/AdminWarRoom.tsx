import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ShieldCheck, DollarSign, Rocket, Sparkles, Crown,
  Send, Loader2, RotateCcw, Radio, Users, Eye, Lock, Wifi,
  Server, Fingerprint, TrendingUp, BarChart3, Target, Cpu,
  Bot, Zap, Globe, AlertTriangle, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

const DEPARTMENTS = [
  {
    id: "orchestrator",
    name: "Orquestrador Master",
    role: "CEO Digital",
    icon: Crown,
    color: "text-amber-400",
    bgColor: "from-amber-500/20 to-primary/20",
    status: "commander",
    desc: "Coordena todos os departamentos",
  },
  {
    id: "ciso",
    name: "CISO",
    role: "Cyber Security",
    icon: ShieldCheck,
    color: "text-red-400",
    bgColor: "from-red-500/20 to-primary/20",
    status: "online",
    desc: "Proteção e monitoramento",
  },
  {
    id: "cfo",
    name: "CFO",
    role: "Financeiro",
    icon: DollarSign,
    color: "text-emerald-400",
    bgColor: "from-emerald-500/20 to-primary/20",
    status: "online",
    desc: "Receita, custos e projeções",
  },
  {
    id: "cgo",
    name: "CGO",
    role: "Growth",
    icon: Rocket,
    color: "text-cyan-400",
    bgColor: "from-cyan-500/20 to-primary/20",
    status: "online",
    desc: "Crescimento e conversão",
  },
  {
    id: "coo",
    name: "COO",
    role: "Operações",
    icon: Cpu,
    color: "text-purple-400",
    bgColor: "from-purple-500/20 to-primary/20",
    status: "online",
    desc: "Performance e uptime",
  },
];

const SECURITY_TEAM = [
  { id: "soc", name: "SOC Analyst", icon: Eye, color: "text-cyan-400" },
  { id: "threat", name: "Threat Intel", icon: AlertTriangle, color: "text-red-400" },
  { id: "firewall", name: "Firewall Mgr", icon: Lock, color: "text-amber-400" },
  { id: "network", name: "Network Guard", icon: Wifi, color: "text-emerald-400" },
  { id: "infra", name: "Infra Security", icon: Server, color: "text-purple-400" },
  { id: "identity", name: "Identity Mgr", icon: Fingerprint, color: "text-pink-400" },
];

const QUICK_COMMANDS = [
  { label: "Briefing executivo completo", icon: Crown },
  { label: "Status de segurança da plataforma", icon: ShieldCheck },
  { label: "DRE e projeção financeira", icon: DollarSign },
  { label: "Funil de crescimento AARRR", icon: Rocket },
  { label: "Auditoria completa de todos os departamentos", icon: Target },
  { label: "Alertas e riscos em todos os setores", icon: AlertTriangle },
];

const AdminWarRoom = () => {
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
      if (!session) { toast.error("Sessão expirada."); setIsLoading(false); return; }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages: allMessages }),
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
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
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
      console.error("war-room error:", err);
      toast.error("Erro ao comunicar com a sala de comando.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Left Panel - C-Suite */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto"
          >
            {/* War Room Header */}
            <div className="glass-card rounded-2xl p-4 border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-primary/20 flex items-center justify-center relative">
                  <Crown className="h-6 w-6 text-amber-400" />
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm">War Room</h3>
                  <p className="text-[10px] text-muted-foreground">Sala de Comando Presidencial</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {DEPARTMENTS.slice(0, 5).map((d) => (
                    <div key={d.id} className="w-6 h-6 rounded-full bg-accent/60 border-2 border-background flex items-center justify-center">
                      <d.icon className={`h-3 w-3 ${d.color}`} />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">{DEPARTMENTS.length} C-Levels</span>
                <div className="ml-auto flex items-center gap-1">
                  <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-medium">LIVE</span>
                </div>
              </div>
            </div>

            {/* C-Suite Members */}
            <div className="glass-card rounded-2xl p-3 border border-white/[0.06]">
              <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">Diretoria Executiva</h4>
              <div className="space-y-0.5">
                {DEPARTMENTS.map((dept) => (
                  <div key={dept.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${dept.bgColor} flex items-center justify-center relative`}>
                      <dept.icon className={`h-4 w-4 ${dept.color}`} />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium truncate">{dept.name}</p>
                        {dept.id === "orchestrator" && (
                          <Badge className="bg-amber-500/15 text-amber-400 text-[8px] border-0 px-1 py-0">MASTER</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{dept.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Team */}
            <div className="glass-card rounded-2xl p-3 border border-white/[0.06]">
              <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">Equipe Cyber Security</h4>
              <div className="grid grid-cols-2 gap-1">
                {SECURITY_TEAM.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                    <div className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center relative">
                      <agent.icon className={`h-3 w-3 ${agent.color}`} />
                      <div className="absolute -bottom-px -right-px w-2 h-2 rounded-full bg-emerald-400 border border-background" />
                    </div>
                    <p className="text-[10px] font-medium truncate">{agent.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="glass-card rounded-2xl p-3 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-medium">Status dos Sistemas</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "AI Gateway", status: "operational", color: "bg-emerald-400" },
                  { label: "Database", status: "operational", color: "bg-emerald-400" },
                  { label: "Auth System", status: "operational", color: "bg-emerald-400" },
                  { label: "Edge Functions", status: "operational", color: "bg-emerald-400" },
                ].map((sys) => (
                  <div key={sys.label} className="flex items-center justify-between px-2">
                    <span className="text-[10px] text-muted-foreground">{sys.label}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${sys.color}`} />
                      <span className="text-[9px] text-emerald-400">OK</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right - Unified Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setShowPanel(!showPanel)}>
              <Users className="h-4 w-4" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 flex items-center justify-center relative">
              <Crown className="h-5 w-5 text-amber-400" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base">War Room - Sala de Comando</h2>
                <Badge className="bg-amber-500/10 text-amber-400 text-[9px] border-0">PRESIDENCIAL</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {DEPARTMENTS.length} C-Levels + {SECURITY_TEAM.length} agentes de segurança - Todos os departamentos unificados
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="gap-1.5 text-xs text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Nova sessão
            </Button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3 glass-card rounded-2xl p-4 border border-white/[0.06]">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-primary/10 flex items-center justify-center">
                  <Crown className="h-10 w-10 text-amber-400" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <div className="flex -space-x-1">
                    {DEPARTMENTS.slice(1).map((d) => (
                      <div key={d.id} className="w-5 h-5 rounded-full bg-accent/80 border-2 border-background flex items-center justify-center">
                        <d.icon className={`h-2.5 w-2.5 ${d.color}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <h3 className="font-display text-xl font-bold mb-1">War Room - Sala de Comando</h3>
              <p className="text-xs text-muted-foreground mb-1">Todos os departamentos unificados em um único canal</p>
              <p className="text-[10px] text-muted-foreground mb-6 max-w-md">
                O Orquestrador Master coordena CISO, CFO, CGO e COO simultaneamente. 
                Faça uma pergunta e todos os departamentos relevantes irão contribuir com suas análises.
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                {QUICK_COMMANDS.map((cmd) => (
                  <button
                    key={cmd.label}
                    onClick={() => sendMessage(cmd.label)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/30 hover:bg-accent/50 text-[11px] text-muted-foreground hover:text-foreground transition-all text-left border border-white/[0.04] hover:border-white/[0.08]"
                  >
                    <cmd.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    {cmd.label}
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
                  <div className="flex flex-col items-center mr-2 mt-1 shrink-0 gap-1">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 flex items-center justify-center">
                      <Crown className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {DEPARTMENTS.slice(1, 5).map((d) => (
                        <div key={d.id} className="w-4 h-4 rounded-md bg-accent/40 flex items-center justify-center mx-auto">
                          <d.icon className={`h-2 w-2 ${d.color}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent/30 border border-white/[0.06]"
                }`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-medium text-amber-400">Orquestrador Master</span>
                      <div className="flex gap-0.5">
                        {DEPARTMENTS.slice(1).map((d) => (
                          <Badge key={d.id} className={`text-[7px] border-0 px-1 py-0 bg-white/[0.04] ${d.color}`}>
                            {d.name}
                          </Badge>
                        ))}
                      </div>
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
              <div className="flex flex-col items-center shrink-0 gap-1">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <div className="bg-accent/30 border border-white/[0.06] rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  <span className="text-xs text-muted-foreground">Consultando todos os departamentos...</span>
                </div>
                <div className="flex gap-1.5">
                  {DEPARTMENTS.map((d, i) => (
                    <motion.div
                      key={d.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.03]"
                    >
                      <d.icon className={`h-3 w-3 ${d.color}`} />
                      <span className="text-[9px] text-muted-foreground">{d.name}</span>
                      <Loader2 className="h-2 w-2 animate-spin text-muted-foreground" />
                    </motion.div>
                  ))}
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
            placeholder="Dê uma ordem ou faça uma pergunta para toda a diretoria..."
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
          Canal seguro - Somente o Presidente tem acesso à War Room
        </p>
      </div>
    </div>
  );
};

export default AdminWarRoom;
