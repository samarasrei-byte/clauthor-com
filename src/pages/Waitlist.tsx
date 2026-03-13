import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Zap, CheckCircle2, Clock, ArrowRight, Sparkles, Shield, Star, Timer,
  Rocket, Gift, Crown, Lock, Play, Cpu, Users, Headphones, Target,
  Globe, Instagram, Twitter, Linkedin, Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  whatsapp: z.string().trim().min(10, "WhatsApp inválido").max(20, "WhatsApp muito longo"),
  name: z.string().trim().max(100, "Nome muito longo").optional(),
  company: z.string().trim().max(100, "Nome da empresa muito longo").optional(),
});

const recentNames = [
  "João S.", "Maria C.", "Pedro L.", "Ana B.", "Lucas M.",
  "Carla R.", "Rafael D.", "Julia F.", "Bruno G.", "Fernanda T.",
  "Gabriel H.", "Larissa P.", "Matheus S.", "Amanda K.", "Thiago N."
];

// ── Particle System ──
const Particle = ({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
    animate={{
      y: [-20, -60, -20],
      opacity: [0, 0.6, 0],
      scale: [0.5, 1, 0.5],
    }}
    transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

const ParticleField = () => {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
    })), []
  );
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => <Particle key={p.id} {...p} />)}
    </div>
  );
};

// ── Glassmorphism Background ──
const GlassBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {/* Primary gradient orbs */}
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent rounded-full blur-[200px]"
    />
    <motion.div
      animate={{ x: [-30, 30, -30], y: [20, -20, 20] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[30%] -left-[10%] w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[150px]"
    />
    <motion.div
      animate={{ x: [20, -20, 20], y: [-30, 30, -30] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      className="absolute bottom-[10%] -right-[10%] w-[600px] h-[600px] bg-primary/[0.05] rounded-full blur-[180px]"
    />
    {/* Subtle grid */}
    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
  </div>
);

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
    <GlassCard hover={false} className="px-4 py-3 sm:px-6 sm:py-4 min-w-[60px] sm:min-w-[80px]">
      <span className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-primary tabular-nums block text-center" style={{ textShadow: '0 0 20px hsl(var(--primary) / 0.4)' }}>
        {value}
      </span>
    </GlassCard>
    <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">{label}</span>
  </div>
);

// ── Success Screen ──
const SuccessView = ({ position }: { position: number | null }) => (
  <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
    <GlassBackground />
    <ParticleField />
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center max-w-lg">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 relative"
      >
        <div className="absolute inset-0 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/20" />
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" />
        <CheckCircle2 className="h-14 w-14 text-primary relative z-10" />
      </motion.div>

      <h1 className="font-display text-5xl sm:text-6xl font-bold mb-4">
        Você está <span className="gradient-text" style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.3)' }}>dentro!</span>
      </h1>

      <GlassCard hover={false} className="p-10 mb-8">
        <p className="text-muted-foreground mb-4 text-sm uppercase tracking-[0.2em]">Sua posição na fila</p>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }}
          className="font-display text-7xl font-bold gradient-text mb-3" style={{ textShadow: '0 0 40px hsl(var(--primary) / 0.4)' }}>
          #{position}
        </motion.div>
        <p className="text-sm text-muted-foreground">Entraremos em contato pelo WhatsApp assim que sua vez chegar</p>
      </GlassCard>

      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span>Lançamento esta semana</span></div>
        <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><span>Acesso prioritário</span></div>
      </div>
    </motion.div>
  </div>
);

const Waitlist = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [formData, setFormData] = useState({ email: "", whatsapp: "", name: "", company: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [displayCount, setDisplayCount] = useState(4127);
  const [recentSignup, setRecentSignup] = useState(recentNames[0]);

  // Countdown to Thursday (next occurrence)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setDisplayCount(prev => prev + 1);
        setRecentSignup(recentNames[Math.floor(Math.random() * recentNames.length)]);
      }
    }, 8000);
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
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
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
        if (error.code === "23505") toast.error("Este e-mail já está na lista de espera!");
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
      <GlassBackground />
      <ParticleField />

      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="backdrop-blur-xl bg-background/30 border-b border-primary/5">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center backdrop-blur-sm">
                <span className="font-display text-primary font-bold text-sm">C</span>
              </div>
              <span className="font-display font-bold text-foreground text-sm tracking-tight">Clauthor</span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <div className="relative">
                  <div className="w-2 h-2 bg-accent-emerald rounded-full" />
                  <div className="absolute inset-0 w-2 h-2 bg-accent-emerald rounded-full animate-ping" />
                </div>
                <span className="tabular-nums font-medium text-foreground">{displayCount.toLocaleString('pt-BR')}+</span> na fila
              </div>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary px-3 py-1.5 gap-1.5 font-mono text-xs backdrop-blur-sm">
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Timer className="h-3 w-3" />
                </motion.div>
                <span className="tabular-nums">QUINTA</span>
              </Badge>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════ */}
      {/* ─── 1. HERO SECTION ─── */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative z-10 px-4 pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <Badge variant="outline" className="mb-8 border-primary/20 bg-primary/5 text-primary px-5 py-2.5 gap-2 backdrop-blur-sm text-sm">
                <Sparkles className="h-4 w-4" />
                Acesso Antecipado · Quinta-feira
              </Badge>
            </motion.div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[0.95] tracking-tight">
              <span className="block text-foreground">Prepare-se para o Futuro</span>
              <span className="block mt-2">
                <span className="gradient-text" style={{ textShadow: '0 0 40px hsl(var(--primary) / 0.3)' }}>
                  Prioridade Exclusiva
                </span>
              </span>
              <span className="block text-foreground mt-2">para a White List</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              O lançamento oficial será na <span className="text-foreground font-semibold">sexta-feira</span>. 
              Quem está na white list terá <span className="text-primary font-semibold">acesso antecipado na quinta-feira</span>, 
              garantindo prioridade e experiências exclusivas.
            </p>

            {/* CTA Glassmorphism */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <button
                onClick={scrollToForm}
                className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-display font-semibold text-lg overflow-hidden transition-all duration-500 hover:scale-[1.03] active:scale-[0.98]"
              >
                {/* Glass background */}
                <div className="absolute inset-0 bg-primary/15 backdrop-blur-xl border border-primary/25 rounded-2xl" />
                {/* Glow on hover */}
                <div className="absolute -inset-1 bg-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                {/* Pulse ring */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 border border-primary/20 rounded-2xl"
                />
                <span className="relative z-10 flex items-center gap-3 text-primary">
                  <Rocket className="h-5 w-5" />
                  Garantir Meu Acesso Antecipado
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </motion.div>
          </motion.div>

          {/* ── Countdown Timer ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-16"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground mb-6">Acesso antecipado em</p>
            <div className="flex items-center justify-center gap-3 sm:gap-5">
              <CountdownDigit value={String(timeLeft.days).padStart(2, '0')} label="Dias" />
              <span className="font-display text-2xl sm:text-4xl text-primary/40 mt-[-20px]">:</span>
              <CountdownDigit value={String(timeLeft.hours).padStart(2, '0')} label="Horas" />
              <span className="font-display text-2xl sm:text-4xl text-primary/40 mt-[-20px]">:</span>
              <CountdownDigit value={String(timeLeft.minutes).padStart(2, '0')} label="Min" />
              <span className="font-display text-2xl sm:text-4xl text-primary/40 mt-[-20px]">:</span>
              <CountdownDigit value={String(timeLeft.seconds).padStart(2, '0')} label="Seg" />
            </div>
          </motion.div>

          {/* Live activity */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-10 flex justify-center">
            <GlassCard hover={false} className="px-5 py-3 inline-flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-accent-emerald rounded-full" />
                <div className="absolute inset-0 w-2.5 h-2.5 bg-accent-emerald rounded-full animate-ping" />
              </div>
              <AnimatePresence mode="wait">
                <motion.span key={recentSignup} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{recentSignup}</span> acabou de entrar na white list
                </motion.span>
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ─── 2. BENEFÍCIOS / EXCLUSIVIDADE ─── */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Por Que Entrar na <span className="gradient-text" style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.25)' }}>White List?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Benefícios exclusivos para quem garante a vaga antes do lançamento oficial.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Acesso Antecipado",
                desc: "Experimente antes de todos e explore recursos exclusivos. Seja o primeiro a configurar seus agentes e departamentos.",
              },
              {
                icon: Headphones,
                title: "Suporte Premium",
                desc: "Departamento e agências dedicadas para ajudar você. Onboarding personalizado 1:1 com nossa equipe.",
              },
              {
                icon: Crown,
                title: "Oportunidades Exclusivas",
                desc: "Participe de campanhas e estratégias VIP. 50% de desconto no lançamento para membros da white list.",
              },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
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

      {/* ═══════════════════════════════════════ */}
      {/* ─── 3. FORM + COUNTDOWN CTA ─── */}
      {/* ═══════════════════════════════════════ */}
      <section id="waitlist-form" className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Não Perca – <span className="gradient-text" style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.25)' }}>Acesso Exclusivo na Quinta!</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Somente os membros da white list terão prioridade. Entre agora e garanta sua posição VIP para o lançamento.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Left — Value props */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
              {[
                { icon: Crown, text: "Acesso antecipado exclusivo", tag: "VIP" },
                { icon: Gift, text: "50% de desconto no lançamento", tag: "BÔNUS" },
                { icon: Zap, text: "Onboarding personalizado 1:1", tag: "GRÁTIS" },
                { icon: Shield, text: "Suporte prioritário vitalício", tag: "PRO" },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
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
                  <span className="font-bold text-primary text-lg tabular-nums">{displayCount.toLocaleString('pt-BR')}+</span>
                  <span className="text-muted-foreground"> profissionais na fila</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right — Form */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <GlassCard hover={false} className="p-8 md:p-10 relative overflow-hidden">
                {/* Inner glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[80px]" />
                <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-primary/5 rounded-full blur-[60px]" />

                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-[0_0_25px_hsl(var(--primary)/0.15)]"
                    >
                      <Sparkles className="h-8 w-8 text-primary" />
                    </motion.div>
                    <h3 className="font-display text-2xl font-bold mb-2">Entrar na White List Agora</h3>
                    <p className="text-muted-foreground text-sm">Preencha seus dados e garanta prioridade</p>
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
                      <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="seu@email.com" className="h-12 bg-background/30 border-primary/10 rounded-xl backdrop-blur-sm focus:border-primary/30 transition-colors" required />
                      {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp *</Label>
                      <Input id="whatsapp" type="tel" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: formatWhatsApp(e.target.value) })} placeholder="(11) 99999-9999" className="h-12 bg-background/30 border-primary/10 rounded-xl backdrop-blur-sm focus:border-primary/30 transition-colors" required />
                      {errors.whatsapp && <p className="text-destructive text-xs">{errors.whatsapp}</p>}
                    </div>

                    {/* CTA Glassmorphism Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full h-14 rounded-xl font-display font-semibold text-lg overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary bg-[length:200%_100%] animate-gradient-shift rounded-xl" />
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 via-primary-glow/40 to-primary/40 rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                      <span className="relative z-10 flex items-center justify-center gap-2 text-primary-foreground">
                        {loading ? (
                          <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Entrando na fila...</>
                        ) : (
                          <><Play className="h-5 w-5 fill-current" />Garantir Meu Acesso Antecipado<ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" /></>
                        )}
                      </span>
                    </button>

                    <p className="text-[11px] text-center text-muted-foreground/70 pt-1">
                      Convites enviados em lotes limitados · <a href="/privacidade" className="text-primary/60 hover:text-primary transition-colors underline-offset-2 hover:underline">Política de Privacidade</a>
                    </p>
                  </form>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-5 mt-6 text-muted-foreground/50">
                    {[
                      { icon: Lock, label: "Criptografia" },
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

      {/* ═══════════════════════════════════════ */}
      {/* ─── 4. RODAPÉ ─── */}
      {/* ═══════════════════════════════════════ */}
      <footer className="relative z-10 px-4 py-16 border-t border-primary/5">
        <div className="max-w-5xl mx-auto">
          {/* Selo de confiança */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <GlassCard hover={false} className="inline-flex items-center gap-3 px-6 py-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground/80">Lançamento garantido — exclusivo white list</span>
              <CheckCircle2 className="h-4 w-4 text-accent-emerald" />
            </GlassCard>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Links rápidos */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors duration-300">Sobre</a>
              <span className="text-border">·</span>
              <a href="#" className="hover:text-primary transition-colors duration-300">Contato</a>
              <span className="text-border">·</span>
              <a href="#" className="hover:text-primary transition-colors duration-300">Agências Parceiras</a>
            </div>

            {/* Redes sociais neon */}
            <div className="flex items-center gap-4">
              {[
                { icon: Instagram, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Mail, href: "#" },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center hover:bg-primary/15 hover:border-primary/25 hover:shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-all duration-500"
                >
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
