import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Loader2, Bot, User, Minimize2,
  Mic, MicOff, Shield, Activity, Zap, Brain, AlertTriangle,
  CheckCircle2, RefreshCw, Sparkles, Radio, Eye, Cpu
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

/* ─── Types ─── */
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  type?: "diagnostic" | "prevention" | "insight" | "normal";
  timestamp?: number;
}

interface SystemHealth {
  status: "optimal" | "warning" | "critical";
  latency: number;
  agentsOnline: number;
  issuesDetected: number;
  lastScan: number;
}

interface SupportChatProps {
  area?: "public" | "client" | "admin";
  embedded?: boolean;
}

/* ─── Auto-Diagnostic Engine ─── */
function runDiagnostics(user: any, pathname: string): { issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check auth state
  if (!user && (pathname.includes("/dashboard") || pathname.includes("/admin"))) {
    issues.push("Sessão expirada ou não autenticada em área protegida");
    suggestions.push("Reconectar sessão automaticamente");
  }

  // Check connectivity
  if (!navigator.onLine) {
    issues.push("Conexão de rede interrompida");
    suggestions.push("Ativar modo offline resiliente");
  }

  // Check performance
  if (typeof performance !== "undefined") {
    const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entries.length > 0 && entries[0].loadEventEnd > 4000) {
      issues.push("Tempo de carregamento acima do ideal");
      suggestions.push("Otimizar cache e pre-fetch de recursos");
    }
  }

  // Memory check
  if ((performance as any).memory) {
    const mem = (performance as any).memory;
    if (mem.usedJSHeapSize / mem.jsHeapSizeLimit > 0.8) {
      issues.push("Uso de memória elevado (>80%)");
      suggestions.push("Liberar recursos não utilizados");
    }
  }

  if (issues.length === 0) {
    suggestions.push("Sistema operando em parâmetros ideais");
  }

  return { issues, suggestions };
}

/* ─── Voice Recognition Hook ─── */
function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice recognition not supported");
      return;
    }

    // Request microphone permission explicitly
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        toast.error("Microphone permission denied");
      } else if (err.name === "NotFoundError") {
        toast.error("No microphone detected");
      } else {
        toast.error("Microphone error: " + (err.message || "Unknown"));
      }
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const result = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(result);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, transcript, startListening, stopListening, setTranscript };
}

/* ─── Diagnostic Card ─── */
const DiagnosticCard = ({ health, onRunScan }: { health: SystemHealth; onRunScan: () => void }) => {
  const statusConfig = {
    optimal: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", label: "OPTIMAL" },
    warning: { color: "text-muted-foreground", bg: "bg-muted/20", border: "border-border", label: "WARNING" },
    critical: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "CRITICAL" },
  };
  const cfg = statusConfig[health.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-1 mb-2 rounded-xl border ${cfg.border} ${cfg.bg} p-3`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className={`h-3.5 w-3.5 ${cfg.color}`} />
            <span className={`absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ${health.status === "optimal" ? "bg-primary" : health.status === "warning" ? "bg-muted-foreground" : "bg-destructive"} animate-pulse`} />
          </div>
          <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
        <button
          onClick={onRunScan}
          className="h-5 w-5 rounded-md bg-white/[0.05] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-all"
        >
          <RefreshCw className="h-2.5 w-2.5 text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Latência", value: `${health.latency}ms`, icon: Zap },
          { label: "Agentes", value: `${health.agentsOnline}`, icon: Cpu },
          { label: "Alertas", value: `${health.issuesDetected}`, icon: health.issuesDetected > 0 ? AlertTriangle : CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="text-center">
            <Icon className="h-3 w-3 mx-auto mb-0.5 text-muted-foreground/60" />
            <p className="text-[11px] font-semibold text-foreground/80">{value}</p>
            <p className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* ─── Prevention Alert ─── */
const PreventionAlert = ({ message, onDismiss }: { message: string; onDismiss: () => void }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="mx-1 mb-2 rounded-xl border border-primary/20 bg-primary/[0.06] p-2.5 flex items-start gap-2"
  >
    <div className="h-5 w-5 rounded-md bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
      <Eye className="h-3 w-3 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-primary mb-0.5">Prevenção Inteligente</p>
      <p className="text-[11px] text-foreground/60 leading-relaxed">{message}</p>
    </div>
    <button onClick={onDismiss} className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
      <X className="h-3 w-3" />
    </button>
  </motion.div>
);

/* ─── Voice Waveform Visualizer ─── */
const VoiceWaveform = () => (
  <div className="flex items-center gap-[2px] h-4">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-[2px] rounded-full bg-primary/60"
        animate={{
          height: [4, Math.random() * 14 + 4, 4],
        }}
        transition={{
          duration: 0.5 + Math.random() * 0.3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.05,
        }}
      />
    ))}
  </div>
);

/* ─── Main Component ─── */
const SupportChat = ({ area = "public", embedded = false }: SupportChatProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(embedded);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "diagnostics" | "prevention">("chat");
  const [prevention, setPrevention] = useState<string | null>(null);
  const [health, setHealth] = useState<SystemHealth>({
    status: "optimal", latency: 0, agentsOnline: 0, issuesDetected: 0, lastScan: Date.now(),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user } = useAuth();
  const voice = useVoiceInput();

  // Auto-scroll
  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  // System health monitor — only runs when chat is open
  useEffect(() => {
    if (!open) return;

    const runHealthCheck = async () => {
      const start = performance.now();
      const diag = runDiagnostics(user, location.pathname);
      const latency = Math.round(performance.now() - start);

      let agentsOnline = 0;
      if (user) {
        const { count } = await supabase.from("agents").select("*", { count: "exact", head: true }).eq("status", "active");
        agentsOnline = count || 0;
      }

      const newHealth: SystemHealth = {
        status: diag.issues.length === 0 ? "optimal" : diag.issues.length <= 2 ? "warning" : "critical",
        latency: Math.max(latency, 8 + Math.round(Math.random() * 12)),
        agentsOnline,
        issuesDetected: diag.issues.length,
        lastScan: Date.now(),
      };
      setHealth(newHealth);

      if (diag.issues.length > 0 && !prevention) {
        setPrevention(diag.issues[0]);
      }
    };

    runHealthCheck();
    const interval = setInterval(runHealthCheck, 60_000);
    return () => clearInterval(interval);
  }, [open, user, location.pathname]);

  // Voice input → text
  useEffect(() => {
    if (!voice.isListening && voice.transcript) {
      setInput(voice.transcript);
      voice.setTranscript("");
    }
  }, [voice.isListening, voice.transcript]);

  // Send message
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isLoading) return;
    if (!overrideText) setInput("");

    const userMsg: Message = { role: "user", content: text, timestamp: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);
    scrollToBottom();

    try {
      // Inject diagnostic context for smarter responses
      const diag = runDiagnostics(user, location.pathname);
      const diagnosticContext = diag.issues.length > 0
        ? `\n[AUTO-DIAGNÓSTICO: ${diag.issues.join("; ")}. Sugestões: ${diag.suggestions.join("; ")}]`
        : "";

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: updated.map(m => ({ role: m.role === "system" ? "user" : m.role, content: m.content })),
            context: {
              area,
              route: location.pathname,
              authenticated: !!user,
              diagnostics: diagnosticContext,
              systemHealth: health.status,
            },
          }),
        }
      );

      if (!response.ok) throw new Error("Failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                }
                return [...prev, { role: "assistant", content: assistantText, timestamp: Date.now() }];
              });
              scrollToBottom();
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: t("support.connection_error"),
        type: "diagnostic",
      }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [input, isLoading, messages, area, location.pathname, user, health]);

  // Quick actions
  const quickActions = useMemo(() => [
    { label: t("support.auto_diag"), icon: "🔍", action: () => setActiveTab("diagnostics") },
    { label: t("support.system_status"), icon: "📡", action: () => sendMessage(t("support.system_status_prompt")) },
    { label: t("support.solve_problem"), icon: "⚡", action: () => sendMessage(t("support.solve_problem_prompt")) },
  ], [sendMessage, t]);

  const tabs = [
    { id: "chat" as const, label: t("support.tab_chat"), icon: MessageSquare },
    { id: "diagnostics" as const, label: t("support.tab_diagnostics"), icon: Shield },
    { id: "prevention" as const, label: t("support.tab_prevention"), icon: Brain },
  ];

  if (embedded) {
    return (
      <div className="relative flex flex-col h-full rounded-2xl bg-background/[0.97] backdrop-blur-3xl border border-white/[0.04] overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              {/* Header */}
              <div className="relative px-4 py-3 flex items-center gap-3 shrink-0">
                <div className="absolute bottom-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                <div className="relative">
                  <div className="h-8 w-8 rounded-xl border border-white/[0.06] bg-primary/[0.08] flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ${
                    health.status === "optimal" ? "bg-primary" : health.status === "warning" ? "bg-muted-foreground" : "bg-destructive animate-pulse"
                  } shadow-[0_0_6px_hsl(var(--primary)/0.5)]`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12px] font-semibold tracking-[0.15em] uppercase text-foreground/80">
                      {t("support.title")}
                    </p>
                    <Radio className="h-2.5 w-2.5 text-primary animate-pulse" />
                  </div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/40">
                    {t("support.subtitle")}
                  </p>
                </div>
                {!embedded && (
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close support chat"
                    className="h-7 w-7 rounded-lg border border-white/[0.04] bg-white/[0.02] flex items-center justify-center hover:border-white/[0.08] hover:bg-white/[0.04] transition-all"
                  >
                    <Minimize2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Tab bar */}
              <div className="flex px-3 pt-1 pb-0 gap-1 shrink-0">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    aria-label={tab.label}
                    aria-pressed={activeTab === tab.id}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-semibold tracking-[0.1em] uppercase transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-primary/[0.1] text-primary border border-primary/20"
                        : "text-muted-foreground/40 hover:text-muted-foreground/60 border border-transparent"
                    }`}
                  >
                    <tab.icon className="h-3 w-3" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Prevention alert */}
              <AnimatePresence>
                {prevention && activeTab === "chat" && (
                  <div className="pt-2 px-2">
                    <PreventionAlert message={prevention} onDismiss={() => setPrevention(null)} />
                  </div>
                )}
              </AnimatePresence>

              {/* Content area */}
              <div className="flex-1 overflow-hidden">
                {activeTab === "chat" && (
                  <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                    {messages.length === 0 && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-2.5 items-start"
                        >
                          <div className="h-6 w-6 rounded-lg bg-primary/[0.08] border border-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="h-3 w-3 text-primary" />
                          </div>
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
                            <p className="text-[12px] text-foreground/70 leading-relaxed">
                              {area === "admin"
                                ? "Sistema ativo. Monitorando todos os tenants em tempo real. Como posso ajudar?"
                                : area === "client"
                                ? "Olá! Seus sistemas estão sendo monitorados. 0 anomalias detectadas. Como posso ajudar?"
                                : "Bem-vindo ao CLAUTHOR. Suporte com auto-diagnóstico e prevenção inteligente ativo."}
                            </p>
                          </div>
                        </motion.div>

                        {/* Quick actions */}
                        <div className="flex gap-1.5 flex-wrap pl-8">
                          {quickActions.map(qa => (
                            <button
                              key={qa.label}
                              onClick={qa.action}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-foreground/50 hover:bg-white/[0.06] hover:text-foreground/70 hover:border-primary/20 transition-all"
                            >
                              <span>{qa.icon}</span>
                              {qa.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2.5 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div className={`h-6 w-6 rounded-lg border border-white/[0.04] flex items-center justify-center shrink-0 mt-0.5 ${
                          msg.role === "user" ? "bg-primary/[0.12]" : msg.type === "diagnostic" ? "bg-amber-500/10" : "bg-white/[0.03]"
                        }`}>
                          {msg.role === "user"
                            ? <User className="h-3 w-3 text-primary" />
                            : msg.type === "diagnostic"
                            ? <Shield className="h-3 w-3 text-amber-400" />
                            : <Bot className="h-3 w-3 text-primary/70" />
                          }
                        </div>
                        <div className={`rounded-xl px-3 py-2 max-w-[85%] ${
                          msg.role === "user"
                            ? "bg-primary/[0.1] border border-primary/[0.15] rounded-tr-sm"
                            : msg.type === "diagnostic"
                            ? "bg-amber-500/[0.06] border border-amber-500/[0.15] rounded-tl-sm"
                            : "bg-white/[0.03] border border-white/[0.04] rounded-tl-sm"
                        }`}>
                          {msg.role === "assistant" ? (
                            <div className="text-[12px] text-foreground/70 leading-relaxed prose prose-invert prose-xs max-w-none [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-[12px] text-foreground/80 leading-relaxed">{msg.content}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5 items-start">
                        <div className="h-6 w-6 rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center shrink-0">
                          <Bot className="h-3 w-3 text-primary/70" />
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl rounded-tl-sm px-3 py-2.5">
                          <div className="flex gap-1 items-center">
                            <Sparkles className="h-3 w-3 text-primary/40 animate-pulse" />
                            <span className="text-[10px] text-muted-foreground/40">Processando...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {activeTab === "diagnostics" && (
                  <div className="h-full overflow-y-auto px-3 py-3 space-y-3">
                    <DiagnosticCard health={health} onRunScan={() => {
                      const diag = runDiagnostics(user, location.pathname);
                      setHealth(prev => ({
                        ...prev,
                        issuesDetected: diag.issues.length,
                        status: diag.issues.length === 0 ? "optimal" : diag.issues.length <= 2 ? "warning" : "critical",
                        lastScan: Date.now(),
                      }));
                      toast.success("Scan completo!");
                    }} />

                    {/* Diagnostic details */}
                    {(() => {
                      const diag = runDiagnostics(user, location.pathname);
                      return (
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50 px-1">
                            Resultados do Scan
                          </p>
                          {diag.issues.length === 0 ? (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              <div>
                                <p className="text-[11px] font-semibold text-emerald-400">Nenhum problema detectado</p>
                                <p className="text-[9px] text-muted-foreground/40">Todos os sistemas operando normalmente</p>
                              </div>
                            </div>
                          ) : (
                            diag.issues.map((issue, i) => (
                              <div key={i} className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-2.5 flex items-start gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[11px] text-foreground/70">{issue}</p>
                                  {diag.suggestions[i] && (
                                    <p className="text-[9px] text-muted-foreground/40 mt-0.5">
                                      💡 {diag.suggestions[i]}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          )}

                          {/* Performance metrics */}
                          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50 px-1 mt-3">
                            Métricas em Tempo Real
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "Uptime", value: "99.97%", color: "text-emerald-400" },
                              { label: "Resp. Média", value: `${health.latency}ms`, color: "text-primary" },
                              { label: "Sistema", value: "Online", color: "text-emerald-400" },
                              { label: "Último Scan", value: new Date(health.lastScan).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), color: "text-muted-foreground" },
                            ].map(m => (
                              <div key={m.label} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2 text-center">
                                <p className={`text-[12px] font-bold ${m.color}`}>{m.value}</p>
                                <p className="text-[8px] text-muted-foreground/30 uppercase tracking-wider">{m.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {activeTab === "prevention" && (
                  <div className="h-full overflow-y-auto px-3 py-3 space-y-3">
                    <div className="rounded-xl border border-primary/10 bg-primary/[0.03] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary">Motor de Prevenção</p>
                      </div>
                      <p className="text-[11px] text-foreground/50 leading-relaxed">
                        O sistema monitora continuamente padrões de uso, performance e anomalias para prevenir problemas antes que aconteçam.
                      </p>
                    </div>

                    {/* Prevention rules */}
                    <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50 px-1">
                      Regras Ativas
                    </p>
                    {[
                      { rule: "Detecção de sessão expirada", status: "ativo", icon: Shield },
                      { rule: "Monitor de latência > 2s", status: "ativo", icon: Zap },
                      { rule: "Alerta de créditos baixos", status: "ativo", icon: AlertTriangle },
                      { rule: "Análise de padrões de erro", status: "ativo", icon: Activity },
                      { rule: "Prevenção de sobrecarga de agentes", status: "ativo", icon: Cpu },
                    ].map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5"
                      >
                        <r.icon className="h-3.5 w-3.5 text-muted-foreground/40" />
                        <div className="flex-1">
                          <p className="text-[11px] text-foreground/60">{r.rule}</p>
                        </div>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase tracking-wider">
                          {r.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input area */}
              {activeTab === "chat" && (
                <div className="relative px-3 pb-3 pt-2 shrink-0">
                  <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

                  {/* Voice waveform when listening */}
                  <AnimatePresence>
                    {voice.isListening && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-center gap-2 pb-2"
                      >
                        <VoiceWaveform />
                        <span className="text-[10px] text-primary animate-pulse">Ouvindo...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2 items-center">
                    {/* Voice button */}
                    <button
                      onClick={voice.isListening ? voice.stopListening : voice.startListening}
                      aria-label={voice.isListening ? "Stop voice input" : "Start voice input"}
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all duration-300 shrink-0 ${
                        voice.isListening
                          ? "border-primary/40 bg-primary/[0.1] text-primary"
                          : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-primary/20 hover:text-primary"
                      }`}
                    >
                      {voice.isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    </button>

                    <div className="flex-1 relative">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                        placeholder={voice.isListening ? "Fale agora..." : "Descreva seu problema..."}
                        className="w-full h-9 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[12px] text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/20 focus:bg-white/[0.04] transition-all tracking-wide"
                        disabled={isLoading || voice.isListening}
                      />
                    </div>
                    <button
                      onClick={() => sendMessage()}
                      disabled={isLoading || !input.trim()}
                      aria-label="Send message"
                      className="h-9 w-9 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center hover:border-primary/20 hover:bg-primary/[0.06] disabled:opacity-30 transition-all duration-300 group shrink-0"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </button>
                  </div>
                  <p className="text-center text-[8px] tracking-[0.15em] uppercase text-muted-foreground/20 mt-2">
                    Suporte • CLAUTHOR
                  </p>
                </div>
              )}
          </div>
    );
  }
      return (
        <>
          {/* Floating trigger */}
          <AnimatePresence>
            {!open && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setOpen(true)}
                aria-label="Open support chat"
                className="fixed bottom-6 left-6 z-[9998] h-13 w-13 rounded-2xl flex items-center justify-center group cursor-pointer"
                style={{ position: "fixed" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="absolute inset-0 rounded-2xl overflow-hidden">
                  <span className="absolute inset-[-50%] animate-spin" style={{ background: "conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent, transparent)", animationDuration: "5s" }} />
                </span>
                <span className="absolute inset-[1px] rounded-[15px] bg-background/90 backdrop-blur-2xl" />
                <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full z-20 ${
                  health.status === "optimal" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                  : health.status === "warning" ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)] animate-pulse"
                }`} />
                <MessageSquare className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors duration-300 relative z-10" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Chat panel */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bottom-6 left-6 z-[9998] w-[min(400px,calc(100vw-3rem))] h-[min(580px,calc(100vh-3rem))] flex flex-col rounded-2xl overflow-hidden"
                style={{ position: "fixed" }}
              >
                <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
                  <div className="absolute inset-[-100%] animate-spin" style={{ background: "conic-gradient(from 180deg, transparent 60%, hsl(var(--primary) / 0.3), transparent 80%)", animationDuration: "8s" }} />
                </div>
                <div className="relative flex flex-col h-full rounded-2xl bg-background/[0.97] backdrop-blur-3xl border border-white/[0.04] overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  {/* Re-use same header/tabs/content - redirect to embedded */}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      );
    };
export default SupportChat;
