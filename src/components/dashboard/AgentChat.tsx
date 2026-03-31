import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Trash2, Mail, CheckSquare, BarChart3, Search, Calendar, TrendingUp, Zap, Square, Volume2, VolumeX, ArrowRightLeft, GitBranch, Sparkles, ArrowUpRight, ShieldCheck, Crown, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAgentChat, type ToolResult, type Message } from "@/hooks/useAgentChat";
import ReactMarkdown from "react-markdown";
import ChatFeedback from "./ChatFeedback";
import VoiceInput from "./VoiceInput";
import { Link } from "react-router-dom";

interface AgentChatProps {
  agentId?: string;
  agentName?: string;
}

const TOOL_META: Record<string, { icon: any; label: string; color: string }> = {
  send_email: { icon: Mail, label: "Email Enviado", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  create_task: { icon: CheckSquare, label: "Tarefa Criada", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  generate_report: { icon: BarChart3, label: "Relatório Gerado", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  search_leads: { icon: Search, label: "Leads Encontrados", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  schedule_meeting: { icon: Calendar, label: "Reunião Agendada", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  analyze_data: { icon: TrendingUp, label: "Análise Concluída", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  delegate_to_agent: { icon: GitBranch, label: "Delegação A2A", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
};

function ToolResultCard({ toolResult }: { toolResult: ToolResult }) {
  const meta = TOOL_META[toolResult.tool_name] || { icon: Zap, label: toolResult.tool_name, color: "text-muted-foreground bg-white/5 border-white/10" };
  const Icon = meta.icon;
  const result = toolResult.result;

  // Handle failed delegation — show upgrade/hire card
  if (toolResult.tool_name === "delegate_to_agent" && !toolResult.success) {
    const reason = result.reason || "not_contracted";
    const isUpgrade = reason === "plan_insufficient" || reason === "tier_insufficient";
    const targetAgent = result.target_agent || "Agente Especialista";
    const requiredPlan = result.required_plan;
    const requiredTier = result.required_tier;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="rounded-2xl border mt-3 overflow-hidden"
        style={{
          borderColor: isUpgrade ? "hsl(var(--primary) / 0.3)" : "hsl(266 100% 65% / 0.3)",
          background: isUpgrade
            ? "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))"
            : "linear-gradient(135deg, hsl(266 100% 65% / 0.08), hsl(266 100% 65% / 0.02))",
        }}
      >
        {/* Glow bar */}
        <div className="h-1 w-full" style={{
          background: isUpgrade
            ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.3))"
            : "linear-gradient(90deg, hsl(266 100% 65%), hsl(266 100% 65% / 0.3))"
        }} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isUpgrade ? "bg-primary/15" : "bg-accent-violet/15"
            }`}>
              {isUpgrade ? (
                <Crown className="h-5 w-5 text-primary" />
              ) : (
                <Sparkles className="h-5 w-5 text-accent-violet" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {isUpgrade ? "Upgrade Necessário" : "Agente Recomendado"}
                </span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-0">
                  Delegação A2A
                </Badge>
              </div>
              <p className="text-sm font-semibold">{targetAgent}</p>
            </div>
          </div>

          {/* Context message */}
          <div className="bg-black/20 rounded-xl p-3 mb-3">
            <div className="flex items-start gap-2">
              <GitBranch className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
              <div className="text-[12px] text-muted-foreground leading-relaxed">
                {isUpgrade ? (
                  <>
                    O agente tentou delegar uma tarefa para <span className="font-semibold text-foreground">{targetAgent}</span>, mas seu plano atual não inclui acesso a esse recurso.
                    {requiredPlan && (
                      <span className="block mt-1 text-primary/80">
                        Plano necessário: <span className="font-bold">{requiredPlan}</span>
                      </span>
                    )}
                    {requiredTier && (
                      <span className="block mt-0.5 text-primary/80">
                        Tier mínimo: <span className="font-bold capitalize">{requiredTier}</span>
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    O agente identificou que <span className="font-semibold text-foreground">{targetAgent}</span> é o especialista ideal para completar esta tarefa, mas você ainda não o contratou.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Task that triggered the delegation */}
          {result.task && (
            <div className="text-[11px] text-muted-foreground mb-3 px-1">
              <span className="opacity-60">Tarefa pendente:</span>{" "}
              <span className="font-medium text-foreground/80">"{result.task}"</span>
            </div>
          )}

          {/* Benefits / Trust signals */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: Zap, label: "Delegação automática" },
              { icon: ShieldCheck, label: "Segurança A2A" },
              { icon: ArrowRightLeft, label: "Colaboração IA" },
            ].map(({ icon: I, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-white/5 rounded-lg px-2 py-1.5">
                <I className="h-3 w-3 text-primary/70 shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2">
            {isUpgrade ? (
              <Link to="/pricing" className="flex-1">
                <Button size="sm" className="w-full glow rounded-xl font-semibold text-xs h-9 gap-1.5">
                  <Crown className="h-3.5 w-3.5" />
                  Fazer Upgrade
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            ) : (
              <Link to="/marketplace" className="flex-1">
                <Button size="sm" className="w-full glow rounded-xl font-semibold text-xs h-9 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Contratar {targetAgent}
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Special rendering for successful Agent-to-Agent delegation
  if (toolResult.tool_name === "delegate_to_agent") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border p-3 text-indigo-400 bg-indigo-500/10 border-indigo-500/20 mt-2"
      >
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Delegação Agent-to-Agent</span>
          {toolResult.success && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-0">
              ✓ Completa
            </Badge>
          )}
        </div>
        
        {/* Delegation chain visualization */}
        <div className="bg-black/20 rounded-lg p-2.5 mb-2">
          <div className="flex items-center gap-2 text-[11px]">
            <div className="flex items-center gap-1">
              <Bot className="h-3 w-3 text-primary" />
              <span className="font-medium">Agente Origem</span>
            </div>
            <ArrowRightLeft className="h-3 w-3 text-indigo-400 animate-pulse" />
            <div className="flex items-center gap-1">
              <Bot className="h-3 w-3 text-indigo-400" />
              <span className="font-medium text-indigo-300">{result.target_agent}</span>
            </div>
          </div>
          {result.delegation_id && (
            <span className="text-[9px] opacity-50 mt-1 block">ID: {result.delegation_id}</span>
          )}
        </div>

        {/* Task */}
        <div className="text-[11px] mb-2">
          <span className="opacity-60">Tarefa:</span>{" "}
          <span className="font-medium">{result.task}</span>
        </div>

        {/* Response from delegated agent */}
        {result.response && (
          <div className="bg-black/30 rounded-lg p-2.5 text-[11px] border border-indigo-500/10">
            <div className="flex items-center gap-1 mb-1.5 text-indigo-300">
              <Bot className="h-3 w-3" />
              <span className="font-semibold text-[10px] uppercase">Resposta de {result.target_agent}</span>
            </div>
            <div className="prose prose-sm prose-invert max-w-none text-[11px] leading-relaxed opacity-90">
              <ReactMarkdown>{result.response.length > 600 ? result.response.slice(0, 600) + "..." : result.response}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Sub-actions executed by delegated agent */}
        {result.sub_actions && result.sub_actions.length > 0 && (
          <div className="mt-2 space-y-1">
            <span className="text-[10px] uppercase font-semibold opacity-60">Sub-ações executadas:</span>
            {result.sub_actions.map((sub: any, i: number) => {
              const subMeta = TOOL_META[sub.tool_name] || { icon: Zap, label: sub.tool_name };
              const SubIcon = subMeta.icon;
              return (
                <div key={i} className="flex items-center gap-2 bg-black/20 rounded-lg px-2 py-1 text-[10px]">
                  <SubIcon className="h-3 w-3" />
                  <span>{subMeta.label}</span>
                  {sub.success && <span className="text-emerald-400">✓</span>}
                </div>
              );
            })}
          </div>
        )}

        {result.priority && result.priority !== "normal" && (
          <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 mt-2 border-0 ${
            result.priority === "urgent" ? "bg-red-500/20 text-red-400" : 
            result.priority === "high" ? "bg-amber-500/20 text-amber-400" : "bg-white/5"
          }`}>
            Prioridade: {result.priority}
          </Badge>
        )}
      </motion.div>
    );
  }

  // Handle missing credentials — show CTA to connect
  if (!toolResult.success && result.error && (
    String(result.error).includes("No credentials") ||
    String(result.error).includes("credentials") ||
    String(result.error).includes("not yet implemented")
  )) {
    const serviceName = result.integration_key || toolResult.tool_name?.replace(/_/g, " ") || "serviço";
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mt-2"
      >
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">Credenciais Necessárias</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Para executar esta ação, conecte sua conta do <strong className="text-foreground">{serviceName}</strong> na página de Integrações.
        </p>
        <Link to="/dashboard" onClick={() => {}} state={{ section: "integrations" }}>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs border-amber-500/20 hover:bg-amber-500/10 text-amber-400">
            <Plug className="h-3.5 w-3.5" />
            Conectar Integrações
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border p-3 ${meta.color} mt-2`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{meta.label}</span>
        {toolResult.success && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-0">
            ✓ Executado
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        {Object.entries(result).map(([key, value]) => {
          if (key === "sections" && Array.isArray(value)) {
            return (
              <div key={key} className="space-y-2 mt-2">
                {(value as any[]).map((section: any, i: number) => (
                  <div key={i} className="bg-black/20 rounded-lg p-2">
                    <p className="text-xs font-semibold">{section.heading}</p>
                    <p className="text-[11px] opacity-80">{section.content}</p>
                    {section.metrics && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {section.metrics.map((m: any, j: number) => (
                          <span key={j} className="text-[10px] bg-white/5 rounded px-1.5 py-0.5">
                            {m.label}: <strong>{m.value}</strong>
                            {m.trend === "up" && " ↑"}
                            {m.trend === "down" && " ↓"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          }
          if (key === "leads" && Array.isArray(value)) {
            return (
              <div key={key} className="space-y-1 mt-1">
                {(value as any[]).map((lead: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-black/20 rounded-lg px-2 py-1.5 text-[11px]">
                    <span className="font-medium">{lead.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="opacity-70">{lead.industry}</span>
                      <Badge variant="secondary" className={`text-[9px] px-1 py-0 border-0 ${
                        lead.status === "hot" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {lead.score}% • {lead.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            );
          }
          if (key === "insights" && Array.isArray(value)) {
            return (
              <div key={key} className="space-y-1 mt-1">
                {(value as any[]).map((insight: any, i: number) => (
                  <div key={i} className="bg-black/20 rounded-lg px-2 py-1.5 text-[11px]">
                    <span>{insight.finding}</span>
                    <span className="ml-2 opacity-60">({insight.confidence})</span>
                  </div>
                ))}
              </div>
            );
          }
          if (typeof value === "object") return null;
          return (
            <div key={key} className="flex items-center justify-between text-[11px]">
              <span className="opacity-60 capitalize">{key.replace(/_/g, " ")}</span>
              <span className="font-medium truncate max-w-[60%] text-right">{String(value)}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// === TTS HOOK ===
function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Strip markdown for cleaner speech
    const cleanText = text
      .replace(/[#*_~`>\-\[\]()!]/g, "")
      .replace(/\n+/g, ". ")
      .trim();
    
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Try to pick an English voice
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith("en")) || voices[0];
    if (enVoice) utterance.voice = enVoice;

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    if (ttsEnabled) {
      stop();
    }
    setTtsEnabled(prev => !prev);
  }, [ttsEnabled, stop]);

  return { isSpeaking, ttsEnabled, speak, stop, toggle };
}

const AgentChat = ({ agentId, agentName = "Assistente IA" }: AgentChatProps) => {
  const { messages, isLoading, isStreaming, sendMessage, clearMessages, stopStreaming } = useAgentChat(agentId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isSpeaking, ttsEnabled, speak, stop, toggle: toggleTTS } = useTTS();
  const prevMessageCountRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { clearMessages(); }, [agentId]);

  // Auto-speak when a new assistant message is complete (streaming done)
  useEffect(() => {
    if (isStreaming || isLoading) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && messages.length > prevMessageCountRef.current) {
      speak(lastMsg.content);
    }
    prevMessageCountRef.current = messages.length;
  }, [isStreaming, isLoading, messages, speak]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/10 flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">{agentName}</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">
                Online • Streaming {ttsEnabled ? "• 🔊 Voz" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* TTS Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTTS}
            className={`h-8 w-8 ${ttsEnabled ? "text-primary" : "text-muted-foreground"}`}
            title={ttsEnabled ? "Desativar voz" : "Ativar voz"}
          >
            {ttsEnabled ? (
              isSpeaking ? <Volume2 className="h-3.5 w-3.5 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
          </Button>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Agente Autônomo
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {agentId
                ? `${agentName} está pronto para AGIR!`
                : "Selecione um agente ativo para iniciar."}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mb-3">
              🔊 Ative o botão de voz para ouvir as respostas
            </p>
            {agentId && (
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {Object.values(TOOL_META).map((t) => {
                  const I = t.icon;
                  return (
                    <span key={t.label} className="text-[10px] text-muted-foreground bg-white/5 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <I className="h-3 w-3" /> {t.label.split(" ")[0]}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`max-w-3xl mx-auto w-full py-4 ${idx > 0 ? "border-t border-border/5" : ""}`}
            >
              <div className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    message.role === "user" ? "bg-primary/20" : "bg-accent/60 border border-border/10"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-primary" />
                  ) : (
                    <Bot className="h-4 w-4 text-foreground/70" />
                  )}
                </div>
                <div className={`flex-1 min-w-0 ${message.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={`inline-block text-left rounded-2xl px-5 py-3.5 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border/10"
                    }`}
                    style={{ maxWidth: message.role === "user" ? "85%" : "100%" }}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-[15px] leading-relaxed prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                        {isStreaming && idx === messages.length - 1 && (
                          <span className="inline-block w-2 h-5 bg-primary/80 animate-pulse ml-0.5 rounded-sm align-middle" />
                        )}
                      </div>
                    ) : (
                      <p className="text-[15px] leading-relaxed">{message.content}</p>
                    )}
                  </div>
                  {/* Tool Results */}
                  {message.tool_results && message.tool_results.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {message.tool_results.map((tr, i) => (
                        <ToolResultCard key={i} toolResult={tr} />
                      ))}
                    </div>
                  )}
                  {/* Feedback buttons for assistant messages */}
                  {message.role === "assistant" && !isStreaming && idx > 0 && (
                    <ChatFeedback
                      userMessage={messages[idx - 1]?.content || ""}
                      assistantMessage={message.content}
                      agentId={agentId}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto w-full py-4">
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-accent/60 border border-border/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-foreground/70" />
              </div>
              <div className="bg-card border border-border/10 rounded-2xl px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Processando ações...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* AI Disclaimer */}
      <div className="px-4 pt-2 shrink-0">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          IA com streaming em tempo real + voz. Não substitui aconselhamento profissional.
        </p>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 shrink-0 border-t border-border/10 bg-background/80 backdrop-blur-sm">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={agentId ? "Peça uma ação: enviar email, criar tarefa, gerar relatório..." : "Selecione um agente primeiro"}
            className="flex-1 h-12 text-[15px] bg-card border-border/20 focus:border-primary/50 rounded-xl"
            disabled={isLoading || !agentId}
          />
          <VoiceInput
            onTranscript={(text) => {
              setInput(text);
              setTimeout(() => sendMessage(text), 300);
            }}
            disabled={isLoading || !agentId}
          />
          {isStreaming ? (
            <Button type="button" size="icon" variant="destructive" onClick={stopStreaming} className="shrink-0 h-12 w-12 rounded-xl" title="Parar streaming">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading || !agentId} className="shrink-0 h-12 w-12 rounded-xl">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AgentChat;
