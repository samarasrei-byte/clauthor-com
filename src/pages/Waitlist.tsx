import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Zap, CheckCircle2, Clock, ArrowRight, Sparkles, Shield, Star, Timer,
  Rocket, Gift, Crown, Lock, Play, Cpu, Users, Headphones, Target,
  Globe, Instagram, Twitter, Linkedin, Mail, TrendingUp, Bot, BrainCircuit,
  Send, MessageSquare, Crosshair, PenTool, BarChart3, DollarSign, Smartphone,
  Search, Settings, Palette, Truck, Scale, type LucideIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import thorOrb from "@/assets/thor-orb.png";
import clauthorLogo from "@/assets/clauthor-logo.png";

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
  { id: 9, sender: "Thor", emoji: "⚡", content: "Squad TechNova: campanha no ar em 47 minutos. Isso é o poder de 200 agentes autônomos trabalhando juntos. 🚀", isOrchestrator: true },
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
    const getNextThursday = () => {
      const now = new Date();
      const thursday = new Date(now);
      const day = now.getDay();
      const daysUntilThursday = (4 - day + 7) % 7 || 7;
      thursday.setDate(now.getDate() + daysUntilThursday);
      thursday.setHours(10, 0, 0, 0);
      return thursday;
    };
    const target = getNextThursday();
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
    <div className="min-h-screen relative overflow-hidden bg-background">
      <ParticleField />

      {/* ─── FIXED HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="backdrop-blur-xl bg-background/40 border-b border-primary/5">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
              <img src={clauthorLogo} alt="Clauthor" className="h-8 w-auto" />
              <span className="font-display font-bold text-foreground text-sm tracking-tight">Clauthor</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
              {/* Big live counter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-accent-emerald rounded-full" />
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-accent-emerald rounded-full animate-ping" />
                </div>
                <span className="font-display font-bold text-lg sm:text-xl tabular-nums text-primary" style={{ textShadow: '0 0 15px hsl(var(--primary) / 0.3)' }}>
                  {displayCount.toLocaleString('pt-BR')}+
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">na fila</span>
              </div>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary px-3 py-1.5 gap-1.5 font-mono text-xs backdrop-blur-sm">
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Timer className="h-3 w-3" />
                </motion.div>
                <span className="tabular-nums">ACESSO ANTECIPADO</span>
              </Badge>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ─── 1. HERO — LIVE CHAT SIMULATION TOP BANNER ─── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex flex-col">
        {/* Ambient glow background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        {/* Thor Orb floating */}
        <motion.div
          style={{ opacity: heroOpacity }}
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-[3%] w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] z-[5] hidden lg:block"
        >
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-[40px]" />
          <img src={thorOrb} alt="Thor AI Orb" className="w-full h-full object-contain opacity-50 drop-shadow-[0_0_30px_hsl(var(--primary)/0.3)]" />
        </motion.div>

        {/* Hero content */}
        <motion.div style={{ opacity: heroOpacity }} className="relative z-20 flex-1 flex flex-col justify-center px-4 pt-24 pb-8">
          <div className="max-w-6xl mx-auto w-full">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>

              {/* Trending badge */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mb-4 text-center">
                <Badge variant="outline" className="border-accent-emerald/30 bg-accent-emerald/5 text-accent-emerald px-4 py-2 gap-2 backdrop-blur-sm text-sm">
                  <TrendingUp className="h-4 w-4" />
                  🔥 Febre em 10+ países
                  <Globe className="h-3.5 w-3.5 ml-1" />
                </Badge>
              </motion.div>

              {/* Title + counter highlight */}
              <div className="text-center mb-6">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 leading-[0.95] tracking-tight">
                  <span className="text-foreground">Imagine um</span>{" "}
                  <span className="gradient-text" style={{ textShadow: '0 0 50px hsl(var(--primary) / 0.35)' }}>
                    Orquestrador IA
                  </span>
                  <br />
                  <span className="text-foreground/90 text-2xl sm:text-3xl lg:text-4xl">
                    que coordena seu <span className="text-primary">time inteiro</span>
                  </span>
                </h1>

                {/* Big counter highlight */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-primary/15 bg-primary/5 backdrop-blur-sm mb-4"
                >
                  <div className="relative">
                    <div className="w-3 h-3 bg-accent-emerald rounded-full" />
                    <div className="absolute inset-0 w-3 h-3 bg-accent-emerald rounded-full animate-ping" />
                  </div>
                  <span className="font-display font-bold text-3xl sm:text-4xl tabular-nums text-primary" style={{ textShadow: '0 0 25px hsl(var(--primary) / 0.4)' }}>
                    {displayCount.toLocaleString('pt-BR')}+
                  </span>
                  <span className="text-sm text-muted-foreground">profissionais já entraram</span>
                </motion.div>

                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                  <span className="text-foreground font-medium">+30 agentes autônomos</span> organizados em{" "}
                  <span className="text-foreground font-medium">squads inteligentes</span>.
                  Um orquestrador. Zero complexidade.
                  <span className="text-primary font-semibold"> Economize 88%</span> vs contratação tradicional.
                </p>
              </div>

              {/* ─── LIVE CHAT SIMULATION ─── */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="mb-6"
              >
                <LiveChatSimulation />
              </motion.div>

              {/* CTA + live activity */}
              <div className="text-center space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={scrollToForm}
                    className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-display font-semibold text-lg overflow-hidden transition-all duration-500 hover:scale-[1.03] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary-glow rounded-2xl" />
                    <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <span className="relative z-10 flex items-center gap-3 text-primary-foreground">
                      <Rocket className="h-5 w-5" />
                      Garantir Acesso Antecipado
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={recentSignup} initial={{ opacity: 0, x: -20, y: 10 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full border border-primary/10 bg-card/30 backdrop-blur-xl">
                    <div className="relative">
                      <div className="w-2 h-2 bg-accent-emerald rounded-full" />
                      <div className="absolute inset-0 w-2 h-2 bg-accent-emerald rounded-full animate-ping" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{recentSignup}</span> acabou de entrar na lista
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="relative z-20 pb-12 px-4"
        >
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Acesso antecipado abre em</p>
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <CountdownDigit value={String(timeLeft.days).padStart(2, '0')} label="Dias" />
              <span className="font-display text-xl sm:text-3xl text-primary/40 mt-[-16px]">:</span>
              <CountdownDigit value={String(timeLeft.hours).padStart(2, '0')} label="Horas" />
              <span className="font-display text-xl sm:text-3xl text-primary/40 mt-[-16px]">:</span>
              <CountdownDigit value={String(timeLeft.minutes).padStart(2, '0')} label="Min" />
              <span className="font-display text-xl sm:text-3xl text-primary/40 mt-[-16px]">:</span>
              <CountdownDigit value={String(timeLeft.seconds).padStart(2, '0')} label="Seg" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── 2. TRENDING COUNTRIES MARQUEE ─── */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="relative z-10 py-8 border-y border-primary/5">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            <TrendingUp className="h-3 w-3 inline mr-2 text-accent-emerald" />
            🔥 Febre no mundo todo
          </p>
          <CountryMarquee />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── 3. STATS BAR ─── */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="relative z-10 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <GlassCard hover={false} className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { value: "+30", label: "Agentes Autônomos", icon: Bot },
                { value: "∞", label: "Squads sob Demanda", icon: Users },
                { value: "88%", label: "Economia", icon: TrendingUp },
                { value: "24/7", label: "Operação Contínua", icon: Zap },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" strokeWidth={1.5} />
                  <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── 4. BENEFÍCIOS ─── */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Por que entrar na <span className="gradient-text" style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.25)' }}>White List?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Benefícios exclusivos para quem garantir sua vaga antes do lançamento oficial.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Acesso Antecipado", desc: "Seja o primeiro a montar seus squads de IA. Configure agentes especializados e coloque-os para trabalhar antes de todos." },
              { icon: Headphones, title: "Suporte Premium", desc: "Equipe dedicada de onboarding. Setup personalizado 1:1 para garantir que seus squads comecem voando desde o dia 1." },
              { icon: Crown, title: "Preço Exclusivo", desc: "50% de desconto no lançamento para membros da white list. Monte squads ilimitados com a melhor taxa do mercado." },
            ].map((benefit, i) => (
              <motion.div key={benefit.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.15, duration: 0.6 }}>
                <GlassCard className="p-8 h-full group">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/10 group-hover:border-primary/25 transition-all duration-700 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]">
                    <benefit.icon className="h-7 w-7 text-primary/80" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3 text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── 5. FORMULÁRIO + CHECKOUT ─── */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="waitlist-form" className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Garanta Sua Vaga <span className="gradient-text" style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.25)' }}>Agora</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Somente membros da white list têm acesso prioritário. Entre agora e garanta sua posição VIP.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Left — Value props */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-5">
              {[
                { icon: Crown, text: "Acesso antecipado exclusivo", tag: "VIP" },
                { icon: Gift, text: "50% de desconto no lançamento", tag: "BÔNUS" },
                { icon: Zap, text: "Onboarding personalizado 1:1", tag: "GRÁTIS" },
                { icon: Shield, text: "Suporte prioritário vitalício", tag: "PRO" },
              ].map((item, i) => (
                <motion.div key={item.text} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <GlassCard className="p-4 flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)] transition-all duration-700">
                      <item.icon className="h-5 w-5 text-primary/80" strokeWidth={1.5} />
                    </div>
                    <span className="font-medium text-foreground/90 flex-1">{item.text}</span>
                    <Badge variant="outline" className="text-[10px] border-primary/20 text-primary/70 px-2 py-0.5 backdrop-blur-sm">
                      {item.tag}
                    </Badge>
                  </GlassCard>
                </motion.div>
              ))}

              {/* Social proof */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-sm" />
                      <span className="text-xs font-bold relative z-10 text-foreground/80">{String.fromCharCode(64 + i)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-bold text-primary text-2xl tabular-nums" style={{ textShadow: '0 0 15px hsl(var(--primary) / 0.3)' }}>{displayCount.toLocaleString('pt-BR')}+</span>
                  <span className="text-muted-foreground"> profissionais na fila</span>
                </div>
              </motion.div>

            </motion.div>

            {/* Right — Form */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <GlassCard hover={false} className="p-8 md:p-10 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[80px]" />
                <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-primary/5 rounded-full blur-[60px]" />

                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-[0_0_25px_hsl(var(--primary)/0.15)]">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </motion.div>
                    <h3 className="font-display text-2xl font-bold mb-2">Entrar na White List</h3>
                    <p className="text-muted-foreground text-sm">Preencha seus dados e garanta acesso prioritário</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Seu nome" className="h-12 bg-background/30 border-primary/10 rounded-xl backdrop-blur-sm focus:border-primary/30 transition-colors" />
                        {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-xs uppercase tracking-wider text-muted-foreground">Empresa</Label>
                        <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Sua empresa" className="h-12 bg-background/30 border-primary/10 rounded-xl backdrop-blur-sm focus:border-primary/30 transition-colors" />
                        {errors.company && <p className="text-destructive text-xs">{errors.company}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">E-mail *</Label>
                      <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="voce@email.com" className="h-12 bg-background/30 border-primary/10 rounded-xl backdrop-blur-sm focus:border-primary/30 transition-colors" required />
                      {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp *</Label>
                      <Input id="whatsapp" type="tel" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: formatWhatsApp(e.target.value) })} placeholder="(11) 99999-9999" className="h-12 bg-background/30 border-primary/10 rounded-xl backdrop-blur-sm focus:border-primary/30 transition-colors" required />
                      {errors.whatsapp && <p className="text-destructive text-xs">{errors.whatsapp}</p>}
                    </div>

                    <button type="submit" disabled={loading}
                      className="group relative w-full h-14 rounded-xl font-display font-semibold text-lg overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary bg-[length:200%_100%] animate-gradient-shift rounded-xl" />
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 via-primary-glow/40 to-primary/40 rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                      <span className="relative z-10 flex items-center justify-center gap-2 text-primary-foreground">
                        {loading ? (
                          <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Entrando...</>
                        ) : (
                          <><Rocket className="h-5 w-5" />Garantir Acesso Antecipado<ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" /></>
                        )}
                      </span>
                    </button>

                    <p className="text-[11px] text-center text-muted-foreground/70 pt-1">
                      Convites enviados em lotes limitados · <a href="/privacy" className="text-primary/60 hover:text-primary transition-colors underline-offset-2 hover:underline">Política de Privacidade</a>
                    </p>
                  </form>

                  <div className="flex items-center justify-center gap-5 mt-6 text-muted-foreground/50">
                    {[
                      { icon: Lock, label: "Criptografado" },
                      { icon: Shield, label: "LGPD" },
                      { icon: Cpu, label: "IA de ponta" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <item.icon className="h-3 w-3 text-primary/40" />
                        <span className="text-[10px] uppercase tracking-[0.15em]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 px-4 py-16 border-t border-primary/5">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <GlassCard hover={false} className="inline-flex items-center gap-3 px-6 py-3">
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground/80">🔥 Febre em 10+ países — White list exclusiva</span>
              <CheckCircle2 className="h-4 w-4 text-accent-emerald" />
            </GlassCard>
          </motion.div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors duration-300">Sobre</a>
              <span className="text-border">·</span>
              <a href="#" className="hover:text-primary transition-colors duration-300">Contato</a>
              <span className="text-border">·</span>
              <a href="#" className="hover:text-primary transition-colors duration-300">Parceiros</a>
            </div>
            <div className="flex items-center gap-4">
              {[
                { icon: Instagram, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Mail, href: "#" },
              ].map((social, i) => (
                <a key={i} href={social.href} className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center hover:bg-primary/15 hover:border-primary/25 hover:shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-all duration-500">
                  <social.icon className="h-4 w-4 text-primary/70" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground/40">© 2026 Clauthor · Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Waitlist;
