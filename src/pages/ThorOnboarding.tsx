import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Globe, ArrowRight, Bot, Sparkles, MessageSquare, Users,
  Clock, AlertTriangle, Calendar, HeadphonesIcon, Zap,
  Building2, ShoppingCart, BookOpen, CheckCircle2, Loader2,
  Phone, Upload, ChevronRight, Star, Shield, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import thorOrb from "@/assets/thor-orb.png";
import clauthorLogo from "@/assets/clauthor-logo.png";

// ── Types ──────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "thor" | "user" | "system";
  content: string;
  type?: "text" | "options" | "agents" | "models" | "specialists" | "integrations" | "final";
  options?: OptionItem[];
  agents?: AgentRec[];
  typing?: boolean;
}

interface OptionItem {
  id: string;
  label: string;
  icon?: string;
  desc?: string;
}

interface AgentRec {
  name: string;
  role: string;
  icon: string;
}

interface SiteAnalysis {
  company: string;
  industry: string;
  services: string[];
  faqs: string[];
  city?: string;
}

// ── Pain point options ─────────────────────────────
const PAIN_OPTIONS: OptionItem[] = [
  { id: "slow_reply", label: "Demora para responder no WhatsApp", icon: "⏳" },
  { id: "repetitive", label: "Muitos clientes perguntando as mesmas coisas", icon: "🔄" },
  { id: "lead_loss", label: "Perda de leads", icon: "📉" },
  { id: "scheduling", label: "Dificuldade para agendar clientes", icon: "📅" },
  { id: "overload", label: "Equipe sobrecarregada", icon: "😓" },
  { id: "after_hours", label: "Atendimento fora do horário", icon: "🌙" },
];

// ── Model options ──────────────────────────────────
const MODEL_OPTIONS: OptionItem[] = [
  { id: "department", label: "Departamentos Prontos", icon: "🏢", desc: "Departamento completo com vários agentes" },
  { id: "squad", label: "Montar meu Squad", icon: "⚡", desc: "Recomendado - pequeno time personalizado" },
  { id: "library", label: "Biblioteca de 200+ Agentes", icon: "📚", desc: "Escolha agente por agente" },
];

// ── Analysis steps ─────────────────────────────────
const ANALYSIS_STEPS = [
  "Analisando estrutura do site...",
  "Identificando serviços...",
  "Detectando especialistas...",
  "Analisando perguntas frequentes...",
  "Mapeando oportunidades de automação...",
];

// ── Neural background particles ────────────────────
const NeuralBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/[0.02]" />
    {/* Floating particles */}
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/20"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.1, 0.4, 0.1],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 3 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 3,
        }}
      />
    ))}
    {/* Connection lines */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.line
          key={i}
          x1={`${10 + Math.random() * 80}%`}
          y1={`${10 + Math.random() * 80}%`}
          x2={`${10 + Math.random() * 80}%`}
          y2={`${10 + Math.random() * 80}%`}
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 4 + i, repeat: Infinity }}
        />
      ))}
    </svg>
    {/* Radial glow */}
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
  </div>
);

// ── Thor Avatar ────────────────────────────────────
const ThorAvatar = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const dims = size === "lg" ? "w-20 h-20" : size === "md" ? "w-12 h-12" : "w-8 h-8";
  return (
    <motion.div
      className={cn("relative rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0", dims)}
      animate={{ boxShadow: ["0 0 15px hsl(var(--primary)/0.2)", "0 0 25px hsl(var(--primary)/0.4)", "0 0 15px hsl(var(--primary)/0.2)"] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <img src={thorOrb} alt="Thor" className="w-full h-full object-cover" />
    </motion.div>
  );
};

// ── Typing indicator ───────────────────────────────
const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start gap-3 px-4"
  >
    <ThorAvatar size="sm" />
    <div className="bg-card/60 border border-border/30 rounded-2xl rounded-tl-md px-4 py-3">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/60"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

// ── Message bubble ─────────────────────────────────
const MessageBubble = ({ msg, onOptionSelect, onModelSelect }: {
  msg: ChatMessage;
  onOptionSelect?: (id: string) => void;
  onModelSelect?: (id: string) => void;
}) => {
  const isThor = msg.role === "thor";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("flex gap-3 px-4", isThor ? "items-start" : "items-start justify-end")}
    >
      {isThor && <ThorAvatar size="sm" />}
      <div className={cn(
        "max-w-[85%] md:max-w-[70%]",
        isThor
          ? "bg-card/60 border border-border/30 rounded-2xl rounded-tl-md"
          : "bg-primary/15 border border-primary/20 rounded-2xl rounded-tr-md"
      )}>
        {/* Text content */}
        <div className="px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
        </div>

        {/* Pain point options */}
        {msg.type === "options" && msg.options && (
          <div className="px-4 pb-4 grid grid-cols-1 gap-2">
            {msg.options.map(opt => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOptionSelect?.(opt.id)}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-background/40 hover:bg-primary/5 hover:border-primary/20 transition-all text-left group"
              >
                <span className="text-lg">{opt.icon}</span>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{opt.label}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Agent recommendations */}
        {msg.type === "agents" && msg.agents && (
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Time Recomendado</span>
            </div>
            {msg.agents.map((agent, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-base">{agent.icon}</div>
                <div>
                  <p className="text-sm font-semibold">{agent.name}</p>
                  <p className="text-[10px] text-muted-foreground">{agent.role}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
              </motion.div>
            ))}
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Zap className="h-3 w-3 text-primary" />
              Esse time resolve ~80% do atendimento automático.
            </p>
          </div>
        )}

        {/* Model selection */}
        {msg.type === "models" && (
          <div className="px-4 pb-4 space-y-2">
            {MODEL_OPTIONS.map((opt, i) => (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onModelSelect?.(opt.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left group",
                  opt.id === "squad"
                    ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                    : "border-border/30 bg-background/40 hover:bg-primary/5 hover:border-primary/20"
                )}
              >
                <span className="text-2xl">{opt.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{opt.label}</span>
                    {opt.id === "squad" && (
                      <Badge className="bg-primary/20 text-primary text-[9px] border-0">Recomendado</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            ))}
          </div>
        )}

        {/* Integration selection */}
        {msg.type === "integrations" && msg.options && (
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Integrações</span>
            </div>
            {msg.options.map((opt, i) => (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOptionSelect?.(opt.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                  opt.id === "skip"
                    ? "border-border/20 bg-muted/10 hover:bg-muted/20"
                    : "border-border/30 bg-background/40 hover:bg-primary/5 hover:border-primary/20"
                )}
              >
                <span className="text-lg">{opt.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">{opt.label}</span>
                  {opt.desc && <p className="text-[10px] text-muted-foreground">{opt.desc}</p>}
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            ))}
          </div>
        )}

        {/* Final screen */}
        {msg.type === "final" && (
          <div className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {["Responder clientes", "Explicar serviços", "Qualificar leads", "Agendar atendimentos"].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-[11px] font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">Tudo automaticamente. 🚀</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Main component ─────────────────────────────────
const ThorOnboarding = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<"welcome" | "analyzing" | "analysis_done" | "pain" | "agents" | "model" | "specialists" | "knowledge" | "integrations" | "whatsapp" | "done">("welcome");
  const [url, setUrl] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [siteData, setSiteData] = useState<SiteAnalysis | null>(null);
  const [selectedPain, setSelectedPain] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  const addMessage = useCallback((msg: Omit<ChatMessage, "id">) => {
    const newMsg = { ...msg, id: crypto.randomUUID() };
    setMessages(prev => [...prev, newMsg]);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
    return newMsg;
  }, []);

  const thorSays = useCallback(async (content: string, extra?: Partial<ChatMessage>) => {
    setIsTyping(true);
    scrollToBottom();
    // Perf: reduzido de 800-1400ms para 250-450ms para agilizar percepção de resposta
    await new Promise(r => setTimeout(r, 250 + Math.random() * 200));
    setIsTyping(false);
    addMessage({ role: "thor", content, ...extra });
  }, [addMessage, scrollToBottom]);

  // Initial greeting
  useEffect(() => {
    const timer = setTimeout(() => {
      addMessage({
        role: "thor",
        content: "Olá, eu sou o Thor. 👋\n\nVou montar seu time de agentes de IA em menos de 2 minutos.\n\nVou entender seu negócio, identificar oportunidades e recomendar os agentes ideais para você.",
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [addMessage]);

  // ── Analyze site ─────────────────────────────────
  const handleAnalyze = async () => {
    if (!url.trim()) return;

    addMessage({ role: "user", content: url });
    setStep("analyzing");

    // Simulate analysis progress
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysisStep(i);
      setAnalysisProgress(((i + 1) / ANALYSIS_STEPS.length) * 100);
      await new Promise(r => setTimeout(r, 1200));
    }

    // Try real analysis via edge function, fallback to smart defaults
    let analysis: SiteAnalysis;
    try {
      const { data } = await supabase.functions.invoke("company-scanner", {
        body: { action: "scan_url", url: url.trim() },
      });
      const d = data?.data;
      if (d?.companyName) {
        analysis = {
          company: d.companyName,
          industry: d.industry || "serviços",
          services: d.products ? d.products.split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 5) : ["serviços gerais"],
          faqs: d.commonQuestions ? d.commonQuestions.split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 5) : ["preços", "horários", "localização"],
          city: d.contactInfo || undefined,
        };
      } else {
        throw new Error("no data");
      }
    } catch {
      const domain = url.replace(/https?:\/\//, "").split("/")[0].split(".")[0];
      analysis = {
        company: domain.charAt(0).toUpperCase() + domain.slice(1),
        industry: "serviços",
        services: ["serviços especializados", "consultoria", "atendimento"],
        faqs: ["preços", "horários de atendimento", "agendamento"],
      };
    }

    setSiteData(analysis);
    setStep("analysis_done");

    await thorSays(
      `Perfeito. Já analisei seu site. ✅\n\nIdentifiquei que a **${analysis.company}** atua no setor de ${analysis.industry}${analysis.city ? ` em ${analysis.city}` : ""}.\n\n**Serviços principais:**\n${analysis.services.map(s => `• ${s}`).join("\n")}\n\nVejo que muitos clientes provavelmente perguntam sobre:\n${analysis.faqs.map(f => `• ${f}`).join("\n")}`
    );

    setStep("pain");
    await thorSays(
      "Agora me conta uma coisa.\n\nQual desses desafios acontece mais no seu negócio?",
      { type: "options", options: PAIN_OPTIONS }
    );
  };

  // ── Upload de documento (PDF/DOC/TXT) ────────────
  const handleUploadDocument = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      await thorSays("Esse arquivo é grande demais (>10MB). Tenta um PDF menor ou envie o site.");
      return;
    }

    addMessage({ role: "user", content: `📎 ${file.name}` });
    setStep("analyzing");

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysisStep(i);
      setAnalysisProgress(((i + 1) / ANALYSIS_STEPS.length) * 100);
      await new Promise(r => setTimeout(r, 400));
    }

    // Converte para base64
    const data_base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    let analysis: SiteAnalysis;
    try {
      const { data, error } = await supabase.functions.invoke("document-parser", {
        body: { filename: file.name, mime: file.type || "application/octet-stream", data_base64 },
      });
      if (error) throw error;
      const d = data?.data;
      if (d?.companyName) {
        analysis = {
          company: d.companyName,
          industry: d.industry || "serviços",
          services: d.products ? d.products.split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 5) : ["serviços gerais"],
          faqs: d.commonQuestions ? d.commonQuestions.split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 5) : ["preços", "horários", "localização"],
          city: d.contactInfo || undefined,
        };
      } else {
        throw new Error("no data");
      }
    } catch {
      const base = file.name.replace(/\.[^.]+$/, "");
      analysis = {
        company: base.charAt(0).toUpperCase() + base.slice(1),
        industry: "serviços",
        services: ["serviços especializados", "consultoria", "atendimento"],
        faqs: ["preços", "horários de atendimento", "agendamento"],
      };
    }

    setSiteData(analysis);
    setStep("analysis_done");

    await thorSays(
      `Perfeito. Já processei seu documento. ✅\n\nIdentifiquei que a **${analysis.company}** atua no setor de ${analysis.industry}.\n\n**Serviços principais:**\n${analysis.services.map(s => `• ${s}`).join("\n")}\n\nProváveis dúvidas dos clientes:\n${analysis.faqs.map(f => `• ${f}`).join("\n")}`
    );

    setStep("pain");
    await thorSays(
      "Agora me conta uma coisa.\n\nQual desses desafios acontece mais no seu negócio?",
      { type: "options", options: PAIN_OPTIONS }
    );
  };

  // ── Handle pain selection ────────────────────────
  const handlePainSelect = async (painId: string) => {
    const pain = PAIN_OPTIONS.find(p => p.id === painId);
    if (!pain) return;

    setSelectedPain(painId);
    addMessage({ role: "user", content: `${pain.icon} ${pain.label}` });

    const painResponses: Record<string, string> = {
      slow_reply: "Entendi! A demora no WhatsApp é um dos maiores motivos de perda de clientes. Um agente de Recepção resolve isso em segundos.",
      repetitive: "Perfeito, isso é super comum. Um agente FAQ Inteligente responde automaticamente as perguntas repetitivas.",
      lead_loss: "Isso é crítico! Um agente de Qualificação captura e classifica cada lead antes que ele escape.",
      scheduling: "Agendamento manual é um gargalo enorme. Um agente de Agendamento Automático resolve isso 24/7.",
      overload: "Equipe sobrecarregada significa oportunidades perdidas. Vamos automatizar o operacional pra liberar seu time.",
      after_hours: "Atendimento 24h é impossível com humanos, mas trivial com IA. Seus agentes nunca dormem!",
    };

    await thorSays(painResponses[painId] || "Entendi! Vou recomendar o time ideal para resolver isso.");

    setStep("agents");
    const agents: AgentRec[] = [
      { name: "Agente Recepção WhatsApp", role: "Primeiro contato e triagem inteligente", icon: "📱" },
      { name: "Agente Agendamento Automático", role: "Agenda consultas e reuniões 24/7", icon: "📅" },
      { name: "Agente FAQ Inteligente", role: "Responde dúvidas frequentes instantaneamente", icon: "💡" },
      { name: "Agente Qualificação de Leads", role: "Identifica e prioriza os melhores leads", icon: "🎯" },
    ];

    await thorSays(
      `Baseado no seu negócio, eu recomendo montar esse time inicial de IA para a ${siteData?.company || "sua empresa"}:`,
      { type: "agents", agents }
    );

    setStep("model");
    await thorSays(
      "Como você quer configurar seu time?\n\nEscolha o modelo que faz mais sentido para você:",
      { type: "models" }
    );
  };

  // ── Handle model selection ───────────────────────
  const handleModelSelect = async (modelId: string) => {
    const model = MODEL_OPTIONS.find(m => m.id === modelId);
    if (!model) return;

    addMessage({ role: "user", content: `${model.icon} ${model.label}` });

    if (modelId === "department") {
      await thorSays("Ótima escolha! Vou te levar para os departamentos prontos. Cada um já vem com um time completo de agentes especializados.");
      setTimeout(() => navigate("/departamentos"), 1500);
      return;
    }

    if (modelId === "library") {
      await thorSays("Perfeito! Você terá acesso a mais de 200 agentes autônomos. SDR, Closer, Suporte Técnico, Pós-venda e muito mais.");
      setTimeout(() => navigate("/library"), 1500);
      return;
    }

    // Squad flow
    await thorSays("Excelente escolha! O squad é a opção mais eficiente.\n\nVou criar automaticamente sua base de conhecimento usando:\n\n• Site da empresa\n• Serviços detectados\n• Perguntas frequentes\n• Especialistas cadastrados");

    setStep("integrations");
    await thorSays(
      "Agora vamos conectar as ferramentas que seu time de IA vai usar. Quais dessas integrações fazem sentido para o seu negócio?",
      {
        type: "integrations",
        options: [
          { id: "whatsapp", label: "WhatsApp Business", icon: "📱", desc: "Atendimento automático via WhatsApp" },
          { id: "gmail", label: "Gmail / E-mail", icon: "📧", desc: "Envio e leitura de e-mails" },
          { id: "notion", label: "Notion", icon: "📝", desc: "Base de conhecimento e docs" },
          { id: "hubspot", label: "HubSpot CRM", icon: "📊", desc: "Gestão de leads e pipeline" },
          { id: "google_sheets", label: "Google Sheets", icon: "📋", desc: "Relatórios e dados" },
          { id: "slack", label: "Slack", icon: "💬", desc: "Notificações internas" },
          { id: "skip", label: "Fazer depois no Dashboard", icon: "⏭️", desc: "Conectar integrações depois" },
        ],
      }
    );
  };

  // ── Handle integration selection ─────────────────
  const handleIntegrationSelect = async (integrationId: string) => {
    if (integrationId === "skip") {
      addMessage({ role: "user", content: "⏭️ Vou conectar depois" });
      await thorSays("Sem problemas! Você pode conectar todas as integrações a qualquer momento no menu **Conectores** do dashboard.");
    } else {
      const selected = [
        { id: "whatsapp", name: "WhatsApp Business" },
        { id: "gmail", name: "Gmail" },
        { id: "notion", name: "Notion" },
        { id: "hubspot", name: "HubSpot" },
        { id: "google_sheets", name: "Google Sheets" },
        { id: "slack", name: "Slack" },
      ].find(i => i.id === integrationId);
      
      addMessage({ role: "user", content: `Quero conectar ${selected?.name || integrationId}` });
      await thorSays(`Ótimo! Para conectar o **${selected?.name}**, vou te levar direto para a tela de configuração no dashboard. É bem simples: você só precisa colar sua chave de API e pronto! 🔑`);
    }

    setStep("whatsapp");
    await thorSays(
      "Seu time de agentes está quase pronto! 🎉\n\nVamos finalizar a configuração?",
      {
        type: "options",
        options: [
          { id: "connect_now", label: "Ir para o Dashboard agora", icon: "🚀" },
          { id: "connect_later", label: "Ver mais opções primeiro", icon: "👀" },
        ],
      }
    );
  };

  // ── Handle WhatsApp connection choice ────────────
  const handleWhatsAppChoice = async (choice: string) => {
    addMessage({ role: "user", content: choice === "connect_now" ? "🚀 Ir para o Dashboard" : "👀 Ver mais opções" });

    if (choice === "connect_later") {
      await thorSays("Você pode explorar a **Biblioteca de 200+ Agentes**, configurar **Departamentos** ou ir direto pro **Dashboard**. Pra onde quer ir?", {
        type: "options",
        options: [
          { id: "go_dashboard", label: "Dashboard", icon: "📊" },
          { id: "go_library", label: "Biblioteca de Agentes", icon: "📚" },
          { id: "go_integrations", label: "Conectores", icon: "🔌" },
        ],
      });
      return;
    }

    setStep("done");
    await thorSays(
      "Perfeito! ✨\n\nSeu time de IA já está pronto para trabalhar.\n\nEles já podem:",
      { type: "final" }
    );

    setTimeout(() => navigate("/dashboard"), 3000);
  };

  // ── Generic option handler ───────────────────────
  const handleOptionSelect = (id: string) => {
    if (step === "pain") handlePainSelect(id);
    else if (step === "integrations") handleIntegrationSelect(id);
    else if (step === "whatsapp") handleWhatsAppChoice(id);
    else if (step === "done") {
      // Handle extra navigation options
      if (id === "go_dashboard") navigate("/dashboard");
      else if (id === "go_library") navigate("/library");
      else if (id === "go_integrations") navigate("/integrations");
    }
  };

  const progressPercent = {
    welcome: 0, analyzing: 15, analysis_done: 30, pain: 45,
    agents: 60, model: 70, specialists: 80, knowledge: 85,
    integrations: 88, whatsapp: 92, done: 100,
  }[step];

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <NeuralBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-border/20 bg-background/80 backdrop-blur-xl">
        <img src={clauthorLogo} alt="Clauthor" className="h-7 object-contain" />
        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="w-28 h-1.5" />
          <span className="text-[10px] text-muted-foreground font-mono">{progressPercent}%</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-xs text-muted-foreground">
          <X className="h-3.5 w-3.5 mr-1" /> Sair
        </Button>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto relative z-10 py-6 space-y-4">
        {/* Thor hero (only on welcome) */}
        <AnimatePresence>
          {step === "welcome" && messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, height: 0 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <ThorAvatar size="lg" />
              <div className="text-center">
                <h1 className="font-display text-xl font-bold">Thor - Consultor de IA</h1>
                <p className="text-xs text-muted-foreground mt-1">Seu time de agentes em menos de 2 minutos</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <AnimatePresence mode="popLayout">
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onOptionSelect={handleOptionSelect}
              onModelSelect={handleModelSelect}
            />
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Analysis progress */}
        <AnimatePresence>
          {step === "analyzing" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-4 p-5 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-sm font-bold">Analisando seu negócio...</span>
              </div>
              <Progress value={analysisProgress} className="h-2 mb-3" />
              <AnimatePresence mode="wait">
                <motion.p
                  key={analysisStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-muted-foreground flex items-center gap-2"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  {ANALYSIS_STEPS[analysisStep]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="relative z-10 border-t border-border/20 bg-background/80 backdrop-blur-xl p-4">
        {step === "welcome" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2 max-w-lg mx-auto"
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="Digite o site da sua empresa"
                  className="pl-10 h-12 rounded-xl bg-card/60 border-border/40 text-sm"
                  onKeyDown={e => e.key === "Enter" && handleAnalyze()}
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={!url.trim()}
                className="h-12 px-6 rounded-xl font-bold"
              >
                Analisar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <span className="text-[11px] text-muted-foreground">ou</span>
              <label className="text-[11px] text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1 font-medium">
                <Upload className="h-3 w-3" />
                Enviar apresentação (PDF, DOC, TXT)
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleUploadDocument(e.target.files[0])}
                />
              </label>
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 max-w-lg mx-auto"
          >
            <Button onClick={() => navigate("/dashboard")} className="flex-1 h-12 rounded-xl font-bold">
              Ir para o Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Consultant button - always visible */}
        <div className="flex justify-center gap-4 mt-3">
          <button className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <HeadphonesIcon className="h-3 w-3" /> Falar com especialista
          </button>
          <button className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Agendar treinamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThorOnboarding;
