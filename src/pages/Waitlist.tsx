import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Zap, CheckCircle2, Clock, ArrowRight, Shield, Timer,
  Rocket, Gift, Crown, Lock, Play, Cpu, Users, Headphones, Target,
  Globe, Instagram, Twitter, Linkedin, Mail, TrendingUp, Bot, BrainCircuit,
  Send, MessageSquare, Crosshair, PenTool, BarChart3, DollarSign, Smartphone,
  Search, Settings, Palette, Truck, Scale, type LucideIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import thorOrb from "@/assets/thor-orb.png";
import ClauthorLogo from "@/components/ClauthorLogo";

const waitlistSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  whatsapp: z.string().trim().min(10, "WhatsApp inválido").max(20, "WhatsApp muito longo"),
  name: z.string().trim().max(100, "Nome muito longo").optional(),
  company: z.string().trim().max(100, "Nome da empresa muito longo").optional(),
});

const recentNames = [
  "João S.", "Maria C.", "Pedro L.", "Ana B.", "Lucas M.",
  "Carla R.", "Rafael D.", "Julia F.", "Bruno G.", "Fernanda T.",
  "Gabriel H.", "Larissa P.", "Matheus S.", "Amanda K.", "Thiago N.",
  "James W.", "Sophie M.", "Hiroshi T.", "Elena R.", "Ahmed K."
];

const trendingCountries = [
  { flag: "🇧🇷", name: "Brasil", users: "2.1K+" },
  { flag: "🇺🇸", name: "USA", users: "1.8K+" },
  { flag: "🇬🇧", name: "UK", users: "890+" },
  { flag: "🇩🇪", name: "Alemanha", users: "720+" },
  { flag: "🇯🇵", name: "Japão", users: "650+" },
  { flag: "🇫🇷", name: "França", users: "580+" },
  { flag: "🇮🇳", name: "Índia", users: "1.2K+" },
  { flag: "🇦🇪", name: "Emirados", users: "430+" },
  { flag: "🇰🇷", name: "Coreia", users: "390+" },
  { flag: "🇵🇹", name: "Portugal", users: "340+" },
];

// ── Simulated Chat Messages ──
const SQUAD_AGENTS: { name: string; icon: LucideIcon; dept: string }[] = [
  { name: "SDR Outbound", icon: Crosshair, dept: "Prospecção" },
  { name: "Copywriter IA", icon: PenTool, dept: "Criação" },
  { name: "Growth Hacker", icon: TrendingUp, dept: "Marketing" },
  { name: "CFO Agent", icon: DollarSign, dept: "Financeiro" },
  { name: "Social Media", icon: Smartphone, dept: "Comunicação" },
  { name: "SEO Specialist", icon: Search, dept: "Marketing" },
  { name: "CS Agent", icon: Headphones, dept: "Suporte" },
  { name: "Data Analyst", icon: BarChart3, dept: "Tecnologia" },
  { name: "Closer Pro", icon: Target, dept: "Comercial" },
  { name: "Email Marketer", icon: Mail, dept: "Marketing" },
  { name: "Jurídico IA", icon: Scale, dept: "Jurídico" },
  { name: "RH Recruiter", icon: Users, dept: "RH" },
  { name: "DevOps Agent", icon: Settings, dept: "Tecnologia" },
  { name: "Designer IA", icon: Palette, dept: "Criação" },
  { name: "Logistics Pro", icon: Truck, dept: "Logística" },
];

interface SimMessage {
  id: number;
  sender: string;
  emoji: string;
  content: string;
  isOrchestrator?: boolean;
  isSystem?: boolean;
  agentsAdded?: string[];
}

const CHAT_SCRIPT: SimMessage[] = [
  { id: 1, sender: "Thor", emoji: "⚡", content: "Equipe, temos uma nova missão: lançar campanha de Q2 para o cliente TechNova. Vou montar o squad agora.", isOrchestrator: true },
  { id: 2, sender: "Sistema", emoji: "🔄", content: "Squad \"Campanha TechNova\" criado · 8 agentes convocados", isSystem: true, agentsAdded: ["SDR Outbound", "Copywriter IA", "Growth Hacker", "Social Media", "SEO Specialist", "Email Marketer", "Designer IA", "Data Analyst"] },
  { id: 3, sender: "Growth Hacker", emoji: "📈", content: "Recebi a missão. Analisando 3.2K leads no funil... Identificados 847 leads quentes com score > 75. Recomendo segmentação por vertical." },
  { id: 4, sender: "Thor", emoji: "⚡", content: "Perfeito. Copywriter, crie variações A/B para cada vertical. SDR, prepare a sequência de outreach. Designer, precisamos dos criativos em 2h.", isOrchestrator: true },
  { id: 5, sender: "Copywriter IA", emoji: "✍️", content: "Gerando 12 variações de copy para 4 verticais... Versão A focada em ROI, versão B em eficiência operacional. CTR estimado: 4.2%." },
  { id: 6, sender: "SDR Outbound", emoji: "🎯", content: "Sequência de 5 toques configurada. LinkedIn + Email + WhatsApp. Disparando para os 847 leads em ondas de 100/dia." },
  { id: 7, sender: "Designer IA", emoji: "🎨", content: "Criativos prontos: 8 banners responsivos + 4 stories + 2 vídeos curtos. Tudo no brand guide do cliente." },
  { id: 8, sender: "CFO Agent", emoji: "💰", content: "Estimativa de custo da campanha: R$ 12.400. ROI projetado: 340%. Budget aprovado automaticamente (baixo risco)." },
  { id: 9, sender: "Thor", emoji: "⚡", content: "Squad TechNova: campanha no ar em 47 minutos. Isso é o poder de 225 agentes autônomos trabalhando juntos. 🚀", isOrchestrator: true },
  { id: 10, sender: "Sistema", emoji: "✅", content: "Missão concluída · 847 leads engajados · 12 criativos publicados · ROI projetado: 340%", isSystem: true },
  { id: 11, sender: "CS Agent", emoji: "🎧", content: "Monitorando feedback dos leads em tempo real. 23 respostas positivas nos primeiros 15 minutos. Encaminhando para Closer Pro." },
  { id: 12, sender: "Closer Pro", emoji: "🤝", content: "Recebi 23 leads quentes. Iniciando cadência de fechamento personalizada. Meta: 8 conversões hoje." },
];

// ── Particle System ──
const Particle = ({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
    animate={{ y: [-20, -60, -20], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
    transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

const ParticleField = () => {
  const particles = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: 2 + Math.random() * 4, delay: Math.random() * 5,
    })), []
  );
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => <Particle key={p.id} {...p} />)}
    </div>
  );
};

// ── Glass Card Component ──
const GlassCard = ({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <div className={`
    relative rounded-2xl border border-primary/10 
    bg-card/20 backdrop-blur-[20px] 
    shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.05)]
    ${hover ? 'hover:border-primary/25 hover:bg-card/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.18),0_0_20px_hsl(var(--primary)/0.08)] transition-all duration-700' : ''}
    ${className}
  `}>
    {children}
  </div>
);

// ── Countdown Digit ──
const CountdownDigit = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center">
    <GlassCard hover={false} className="px-3 py-2 sm:px-5 sm:py-3 min-w-[52px] sm:min-w-[72px]">
      <span className="font-display text-xl sm:text-3xl lg:text-4xl font-bold text-primary tabular-nums block text-center" style={{ textShadow: '0 0 20px hsl(var(--primary) / 0.4)' }}>
        {value}
      </span>
    </GlassCard>
    <span className="text-[9px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1.5">{label}</span>
  </div>
);

// ── Success Screen ──
const SuccessView = ({ position }: { position: number | null }) => (
  <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
    <ParticleField />
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center max-w-lg">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 relative">
        <div className="absolute inset-0 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/20" />
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" />
        <CheckCircle2 className="h-14 w-14 text-primary relative z-10" />
      </motion.div>
      <h1 className="font-display text-5xl sm:text-6xl font-bold mb-4">
        Você está <span className="gradient-text" style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.3)' }}>dentro!</span>
      </h1>
      <GlassCard hover={false} className="p-10 mb-8">
        <p className="text-muted-foreground mb-4 text-sm uppercase tracking-[0.2em]">Sua posição</p>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }}
          className="font-display text-7xl font-bold gradient-text mb-3" style={{ textShadow: '0 0 40px hsl(var(--primary) / 0.4)' }}>
          #{position}
        </motion.div>
        <p className="text-sm text-muted-foreground">Entraremos em contato via WhatsApp quando for sua vez</p>
      </GlassCard>
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span>Lançamento esta semana</span></div>
        <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><span>Acesso prioritário</span></div>
      </div>
    </motion.div>
  </div>
);

// ── Trending Country Marquee ──
const CountryMarquee = () => (
  <div className="overflow-hidden relative">
    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
    <motion.div
      animate={{ x: ["0%", "-50%"] }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      className="flex gap-4 whitespace-nowrap"
    >
      {[...trendingCountries, ...trendingCountries].map((c, i) => (
        <div key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/10 bg-card/20 backdrop-blur-sm shrink-0">
          <span className="text-lg">{c.flag}</span>
          <span className="text-xs font-medium text-foreground/80">{c.name}</span>
          <span className="text-[10px] text-primary font-mono">{c.users}</span>
          <TrendingUp className="h-3 w-3 text-accent-emerald" />
        </div>
      ))}
    </motion.div>
  </div>
);

// ── Live Chat Simulation ──
const LiveChatSimulation = () => {
  const [visibleMessages, setVisibleMessages] = useState<SimMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentIndex >= CHAT_SCRIPT.length) {
      // Loop back
      const timeout = setTimeout(() => {
        setVisibleMessages([]);
        setCurrentIndex(0);
      }, 5000);
      return () => clearTimeout(timeout);
    }

    const delay = currentIndex === 0 ? 1000 : (CHAT_SCRIPT[currentIndex].isSystem ? 1200 : 2200 + Math.random() * 1500);
    const timeout = setTimeout(() => {
      setVisibleMessages(prev => [...prev, CHAT_SCRIPT[currentIndex]]);
      setCurrentIndex(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timeout);
  }, [currentIndex]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleMessages]);

  return (
    <GlassCard hover={false} className="overflow-hidden w-full max-w-2xl mx-auto">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-primary/10 flex items-center justify-between bg-card/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-sm">⚡</span>
          </div>
          <div>
            <p className="text-sm font-display font-bold text-foreground">Thor · Orquestrador</p>
            <p className="text-[10px] text-muted-foreground">Squad Campanha TechNova · 8 agentes online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {SQUAD_AGENTS.slice(0, 6).map((a, i) => (
              <div key={i} className="w-5 h-5 rounded-full bg-primary/10 border border-background flex items-center justify-center">
                <a.icon className="w-2.5 h-2.5 text-primary/70" strokeWidth={1.5} />
              </div>
            ))}
            <div className="w-5 h-5 rounded-full bg-primary/20 border border-background flex items-center justify-center text-[7px] text-primary font-bold">
              +9
            </div>
          </div>
          <Badge variant="outline" className="text-[8px] border-accent-emerald/30 text-accent-emerald gap-1 px-1.5 py-0.5">
            <div className="w-1.5 h-1.5 bg-accent-emerald rounded-full" />
            AO VIVO
          </Badge>
        </div>
      </div>

      {/* Squad agents bar */}
      <div className="px-3 py-1.5 border-b border-primary/5 bg-card/5 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 min-w-max">
          {SQUAD_AGENTS.map((a, i) => (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md shrink-0 bg-card/30 border border-border/30 hover:border-primary/20 transition-colors group"
            >
              <a.icon className="w-3 h-3 text-primary/60 group-hover:text-primary transition-colors icon-modern" strokeWidth={1.5} />
              <span className="text-[9px] text-foreground/60 font-medium tracking-wide">{a.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} className="h-[320px] sm:h-[380px] overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        <AnimatePresence>
          {visibleMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {msg.isSystem ? (
                <div className="flex justify-center my-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-emerald/5 border border-accent-emerald/15 text-[11px] text-accent-emerald">
                    <span>{msg.emoji}</span>
                    <span>{msg.content}</span>
                  </div>
                  {msg.agentsAdded && (
                    <div className="hidden" /> // agents shown in bar above
                  )}
                </div>
              ) : (
                <div className={`flex gap-2 ${msg.isOrchestrator ? '' : ''}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-sm ${
                    msg.isOrchestrator
                      ? 'bg-primary/15 border border-primary/25 shadow-[0_0_10px_hsl(var(--primary)/0.15)]'
                      : 'bg-card/60 border border-primary/10'
                  }`}>
                    {msg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[11px] font-bold ${msg.isOrchestrator ? 'text-primary' : 'text-foreground/80'}`}>
                        {msg.sender}
                      </span>
                      {msg.isOrchestrator && (
                        <Badge variant="outline" className="text-[7px] px-1 py-0 border-primary/25 text-primary/70 h-3.5">
                          CEO
                        </Badge>
                      )}
                    </div>
                    <div className={`text-[12px] leading-relaxed rounded-xl px-3 py-2 max-w-[95%] ${
                      msg.isOrchestrator
                        ? 'bg-primary/5 border border-primary/10 text-foreground/90'
                        : 'bg-card/40 border border-border/50 text-foreground/80'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {currentIndex < CHAT_SCRIPT.length && visibleMessages.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center pl-9">
            <div className="flex gap-1">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            </div>
            <span className="text-[10px] text-muted-foreground">{CHAT_SCRIPT[currentIndex]?.sender} digitando...</span>
          </motion.div>
        )}
      </div>

      {/* Fake input */}
      <div className="px-3 py-2.5 border-t border-primary/10 bg-card/20">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/30 border border-primary/5">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/40 flex-1">Delegue uma missão ao Thor...</span>
          <Send className="h-3.5 w-3.5 text-primary/30" />
        </div>
      </div>
    </GlassCard>
  );
};

const Waitlist = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [formData, setFormData] = useState({ email: "", whatsapp: "", name: "", company: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [displayCount, setDisplayCount] = useState(4127);
  const [recentSignup, setRecentSignup] = useState(recentNames[0]);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    // Lançamento fixo: 17 dias a partir do primeiro carregamento (persistido)
    const LAUNCH_KEY = "clauthor_launch_target";
    let stored = localStorage.getItem(LAUNCH_KEY);
    let target: Date;
    if (stored) {
      target = new Date(stored);
      if (isNaN(target.getTime()) || target.getTime() < Date.now()) {
        target = new Date(Date.now() + 17 * 24 * 60 * 60 * 1000);
        localStorage.setItem(LAUNCH_KEY, target.toISOString());
      }
    } else {
      target = new Date(Date.now() + 17 * 24 * 60 * 60 * 1000);
      localStorage.setItem(LAUNCH_KEY, target.toISOString());
    }
    const timer = setInterval(() => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) { clearInterval(timer); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setDisplayCount(prev => prev + 1);
        setRecentSignup(recentNames[Math.floor(Math.random() * recentNames.length)]);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const formatWhatsApp = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = waitlistSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[err.path[0] as string] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("waitlist").insert({
        email: formData.email.trim().toLowerCase(),
        whatsapp: formData.whatsapp.replace(/\D/g, ""),
        name: formData.name.trim() || null,
        company: formData.company.trim() || null,
      });
      if (error) {
        if (error.code === "23505") toast.error("Este email já está na lista!");
        else throw error;
        return;
      }
      setPosition(Math.floor(Math.random() * 50) + 1);
      setSuccess(true);
      toast.success("Você está na lista! 🎉");
    } catch {
      toast.error("Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (success) return <SuccessView position={position} />;

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-background waitlist-noir"
      style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}
    >
      {/* Scoped Noir & Ember typography: Sora display + Manrope body */}
      <style>{`
        .waitlist-noir .font-display,
        .waitlist-noir h1,
        .waitlist-noir h2,
        .waitlist-noir h3 { font-family: 'Sora', system-ui, sans-serif; letter-spacing: -0.02em; }
        .waitlist-noir .mono { font-family: 'JetBrains Mono', monospace; }
        .noir-surface { background: linear-gradient(180deg, hsl(0 0% 4%) 0%, hsl(0 0% 6%) 100%); }
        .noir-divider { background: linear-gradient(90deg, transparent, hsl(var(--primary)/0.35), transparent); }
      `}</style>

      <ParticleField />

      {/* ─── SLIM FIXED HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="backdrop-blur-xl bg-background/70 border-b border-primary/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
            <ClauthorLogo size="md" />
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/15 bg-primary/5">
                <div className="relative">
                  <div className="w-2 h-2 bg-accent-emerald rounded-full" />
                  <div className="absolute inset-0 w-2 h-2 bg-accent-emerald rounded-full animate-ping" />
                </div>
                <span className="mono text-xs tabular-nums text-foreground/80">
                  {displayCount.toLocaleString('pt-BR')} <span className="text-muted-foreground">na fila</span>
                </span>
              </div>
              <button
                onClick={scrollToForm}
                className="mono text-[11px] tracking-[0.15em] uppercase px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — HERO SPLIT SCREEN
          Left: Story · Right: Form (sticky on desktop)
      ══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative z-10 pt-24 pb-16 lg:pt-32 lg:pb-24 px-4 sm:px-6">
        {/* Ambient ember glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 -right-40 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-start">
          {/* ═══ LEFT — Narrative ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:pt-8"
          >
            {/* Kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="mono text-[10px] tracking-[0.25em] uppercase text-primary/90">Acesso antecipado · Vagas limitadas</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[0.95] mb-6">
              <span className="text-foreground">Um orquestrador</span>
              <br />
              <span className="text-foreground/70">que coordena</span>
              <br />
              <span className="text-primary" style={{ textShadow: '0 0 40px hsl(var(--primary)/0.35)' }}>
                225 agentes IA.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
              Squads inteligentes que rodam marketing, vendas, financeiro e operações no automático.
              Você delega uma missão, o Thor executa. <span className="text-foreground font-medium">Custo por agente muito abaixo de um profissional CLT equivalente</span> — economia real varia por empresa.
            </p>

            {/* Bullets — separação limpa */}
            <ul className="space-y-3 mb-10 max-w-lg">
              {[
                { label: "225 agentes autônomos prontos para operar" },
                { label: "Squads sob demanda em qualquer vertical" },
                { label: "Orquestração em tempo real, 24/7" },
                { label: "Setup 1:1 gratuito para membros da waitlist" },
              ].map((b) => (
                <li key={b.label} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-primary" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm text-foreground/80">{b.label}</span>
                </li>
              ))}
            </ul>

            {/* Social proof strip */}
            <div className="flex items-center gap-4 pt-6 border-t border-primary/10">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-background bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-[10px] font-bold text-foreground/80">
                    {String.fromCharCode(64+i)}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <span className="font-display text-2xl font-bold text-primary tabular-nums leading-none" style={{ textShadow: '0 0 15px hsl(var(--primary)/0.3)' }}>
                  {displayCount.toLocaleString('pt-BR')}+
                </span>
                <span className="text-xs text-muted-foreground mt-1">profissionais já na waitlist</span>
              </div>
            </div>
          </motion.div>

          {/* ═══ RIGHT — Form Card (sticky on desktop) ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-24"
            id="waitlist-form"
          >
            <GlassCard hover={false} className="p-6 sm:p-8 relative overflow-hidden">
              {/* Ember accent */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/15 rounded-full blur-[80px] pointer-events-none" />

              {/* Countdown ribbon */}
              <div className="relative z-10 mb-6 pb-6 border-b border-primary/10">
                <p className="mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3 text-center">
                  Lançamento em
                </p>
                <div className="flex items-center justify-center gap-2">
                  <CountdownDigit value={String(timeLeft.days).padStart(2, '0')} label="Dias" />
                  <span className="font-display text-2xl text-primary/40 mt-[-14px]">:</span>
                  <CountdownDigit value={String(timeLeft.hours).padStart(2, '0')} label="Horas" />
                  <span className="font-display text-2xl text-primary/40 mt-[-14px]">:</span>
                  <CountdownDigit value={String(timeLeft.minutes).padStart(2, '0')} label="Min" />
                  <span className="font-display text-2xl text-primary/40 mt-[-14px]">:</span>
                  <CountdownDigit value={String(timeLeft.seconds).padStart(2, '0')} label="Seg" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="font-display text-2xl font-bold mb-1.5 text-foreground">Garanta sua vaga</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Convites em lotes limitados · <span className="text-primary/90 font-medium">50% off vitalício</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Nome</Label>
                      <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Seu nome" className="h-11 bg-background/40 border-primary/10 rounded-lg focus:border-primary/40 transition-colors" />
                      {errors.name && <p className="text-destructive text-[11px]">{errors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="company" className="mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Empresa</Label>
                      <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Sua empresa" className="h-11 bg-background/40 border-primary/10 rounded-lg focus:border-primary/40 transition-colors" />
                      {errors.company && <p className="text-destructive text-[11px]">{errors.company}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">E-mail *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="voce@empresa.com" className="h-11 bg-background/40 border-primary/10 rounded-lg focus:border-primary/40 transition-colors" required />
                    {errors.email && <p className="text-destructive text-[11px]">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp" className="mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">WhatsApp *</Label>
                    <Input id="whatsapp" type="tel" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: formatWhatsApp(e.target.value) })} placeholder="(11) 99999-9999" className="h-11 bg-background/40 border-primary/10 rounded-lg focus:border-primary/40 transition-colors" required />
                    {errors.whatsapp && <p className="text-destructive text-[11px]">{errors.whatsapp}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full h-13 py-4 rounded-lg font-display font-semibold text-base overflow-hidden transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2 bg-primary hover:bg-primary/90"
                  >
                    <div className="absolute -inset-0.5 bg-primary/40 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center justify-center gap-2 text-primary-foreground">
                      {loading ? (
                        <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Entrando...</>
                      ) : (
                        <>Garantir minha vaga <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </span>
                  </button>

                  <div className="flex items-center justify-center gap-4 pt-3 text-muted-foreground/60">
                    {[
                      { icon: Lock, label: "Criptografado" },
                      { icon: Shield, label: "LGPD" },
                      { icon: Cpu, label: "IA de ponta" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <item.icon className="h-2.5 w-2.5 text-primary/50" />
                        <span className="mono text-[9px] uppercase tracking-[0.15em]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </form>
              </div>
            </GlassCard>

            {/* Recent activity ping */}
            <AnimatePresence mode="wait">
              <motion.div
                key={recentSignup}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-emerald/20 bg-accent-emerald/5"
              >
                <div className="w-1.5 h-1.5 bg-accent-emerald rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">{recentSignup}</span> acabou de entrar
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — LIVE DEMO (isolated)
      ══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-4 sm:px-6 py-20 noir-surface border-y border-primary/5">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} className="text-center mb-10">
            <p className="mono text-[10px] tracking-[0.3em] uppercase text-primary/70 mb-3">Ao vivo · demo real</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Veja o Thor orquestrando um squad</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Uma missão de campanha completa, do briefing ao ROI, executada por agentes IA em minutos.</p>
          </motion.div>
          <LiveChatSimulation />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — BENEFÍCIOS (3 cards)
      ══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-4 sm:px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} className="text-center mb-14">
            <p className="mono text-[10px] tracking-[0.3em] uppercase text-primary/70 mb-3">Benefícios exclusivos</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Por que entrar <span className="text-primary">agora</span>?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: "Acesso Antecipado", desc: "Configure seus squads antes de todo mundo. Fila prioritária de convites." },
              { icon: Crown, title: "50% Off Vitalício", desc: "Preço bloqueado para sempre. Membros da waitlist pagam metade, para sempre." },
              { icon: Headphones, title: "Onboarding 1:1", desc: "Setup personalizado com nosso time. Squads voando desde o primeiro dia." },
            ].map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                <GlassCard className="p-7 h-full group">
                  <div className="w-11 h-11 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/15 group-hover:border-primary/30 transition-all">
                    <b.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2 text-foreground">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — STATS + COUNTRIES (compact strip)
      ══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 noir-surface border-y border-primary/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {[
              { value: "225", label: "Agentes IA" },
              { value: "20", label: "Departamentos" },
              { value: "88%", label: "Economia" },
              { value: "24/7", label: "Operação" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-4xl sm:text-5xl font-bold text-primary tabular-nums" style={{ textShadow: '0 0 20px hsl(var(--primary)/0.3)' }}>{s.value}</p>
                <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-primary/10">
            <p className="mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-center mb-4">Tendência global</p>
            <CountryMarquee />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — FINAL CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-4 sm:px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-5 text-foreground">
              A fila fecha em breve.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Depois disso, o preço dobra e o onboarding 1:1 sai da mesa.
            </p>
            <button
              onClick={scrollToForm}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-base hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
            >
              <Rocket className="h-5 w-5" />
              Garantir minha vaga
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 px-4 sm:px-6 py-10 border-t border-primary/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ClauthorLogo size="sm" />
            <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">© 2026 Clauthor</span>
          </div>
          <div className="flex items-center gap-3">
            {[
              { icon: Instagram, href: "#" },
              { icon: Twitter, href: "#" },
              { icon: Linkedin, href: "#" },
              { icon: Mail, href: "#" },
            ].map((s, i) => (
              <a key={i} href={s.href} className="w-9 h-9 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center hover:bg-primary/15 hover:border-primary/25 transition-all">
                <s.icon className="h-3.5 w-3.5 text-primary/70" strokeWidth={1.75} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Waitlist;
