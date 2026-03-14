import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Zap, CheckCircle2, Clock, ArrowRight, Sparkles, Shield, Star, Timer,
  Rocket, Gift, Crown, Lock, Play, Cpu, Users, Headphones, Target,
  Globe, Instagram, Twitter, Linkedin, Mail, TrendingUp, Bot, BrainCircuit
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import thorOrchestrating from "@/assets/thor-orchestrating.png";
import thorOrb from "@/assets/thor-orb.png";

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
  { flag: "🇩🇪", name: "Germany", users: "720+" },
  { flag: "🇯🇵", name: "Japan", users: "650+" },
  { flag: "🇫🇷", name: "France", users: "580+" },
  { flag: "🇮🇳", name: "India", users: "1.2K+" },
  { flag: "🇦🇪", name: "UAE", users: "430+" },
  { flag: "🇰🇷", name: "Korea", users: "390+" },
  { flag: "🇵🇹", name: "Portugal", users: "340+" },
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
        You're <span className="gradient-text" style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.3)' }}>in!</span>
      </h1>
      <GlassCard hover={false} className="p-10 mb-8">
        <p className="text-muted-foreground mb-4 text-sm uppercase tracking-[0.2em]">Your position</p>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }}
          className="font-display text-7xl font-bold gradient-text mb-3" style={{ textShadow: '0 0 40px hsl(var(--primary) / 0.4)' }}>
          #{position}
        </motion.div>
        <p className="text-sm text-muted-foreground">We'll reach out via WhatsApp when it's your turn</p>
      </GlassCard>
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span>Launching this week</span></div>
        <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><span>Priority access</span></div>
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
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const bannerScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

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
        if (error.code === "23505") toast.error("This email is already on the waitlist!");
        else throw error;
        return;
      }
      setPosition(Math.floor(Math.random() * 50) + 1);
      setSuccess(true);
      toast.success("You're on the list! 🎉");
    } catch {
      toast.error("Error signing up. Please try again.");
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
                <span className="tabular-nums font-medium text-foreground">{displayCount.toLocaleString()}+</span> in queue
              </div>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary px-3 py-1.5 gap-1.5 font-mono text-xs backdrop-blur-sm">
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Timer className="h-3 w-3" />
                </motion.div>
                <span className="tabular-nums">EARLY ACCESS</span>
              </Badge>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ─── 1. THOR ORCHESTRATOR BANNER — PARALLAX HERO ─── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex flex-col">
        {/* Parallax background image - Thor orchestrating */}
        <motion.div style={{ y: heroY, scale: bannerScale }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80 z-10" />
          <img src={thorOrchestrating} alt="Thor AI Orchestrator coordinating agent team" className="w-full h-full object-cover object-center opacity-40" />
        </motion.div>

        {/* Thor Orb floating element */}
        <motion.div
          style={{ opacity: heroOpacity }}
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-24 right-[5%] w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] lg:w-[360px] lg:h-[360px] z-[5] hidden md:block"
        >
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-[60px]" />
          <img src={thorOrb} alt="Thor AI Orb" className="w-full h-full object-contain opacity-60 drop-shadow-[0_0_40px_hsl(var(--primary)/0.3)]" />
        </motion.div>

        {/* Hero content */}
        <motion.div style={{ opacity: heroOpacity }} className="relative z-20 flex-1 flex flex-col justify-center px-4 pt-24 pb-16">
          <div className="max-w-5xl mx-auto w-full">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>

              {/* Trending badge */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mb-6">
                <Badge variant="outline" className="border-accent-emerald/30 bg-accent-emerald/5 text-accent-emerald px-4 py-2 gap-2 backdrop-blur-sm text-sm">
                  <TrendingUp className="h-4 w-4" />
                  Trending in 10+ countries
                  <Globe className="h-3.5 w-3.5 ml-1" />
                </Badge>
              </motion.div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[0.95] tracking-tight max-w-3xl">
                <span className="block text-foreground">Imagine an AI</span>
                <span className="block mt-2">
                  <span className="gradient-text" style={{ textShadow: '0 0 50px hsl(var(--primary) / 0.35)' }}>
                    Orchestrator
                  </span>
                </span>
                <span className="block text-foreground/90 mt-2 text-3xl sm:text-4xl lg:text-5xl">
                  that coordinates your <span className="text-primary">entire team</span>
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                <span className="text-foreground font-medium">83 AI agents</span> across{" "}
                <span className="text-foreground font-medium">15 departments</span>.
                One orchestrator. Zero complexity.
                <span className="text-primary font-semibold"> Save 88%</span> vs traditional hiring.
              </p>

              {/* Dual CTA */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  onClick={scrollToForm}
                  className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-display font-semibold text-lg overflow-hidden transition-all duration-500 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary-glow rounded-2xl" />
                  <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <span className="relative z-10 flex items-center gap-3 text-primary-foreground">
                    <Rocket className="h-5 w-5" />
                    Get Early Access
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </button>
                <button
                  onClick={() => window.open('https://clauthor.com', '_blank')}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-display font-medium text-base overflow-hidden glass-btn"
                >
                  <Play className="h-4 w-4 text-primary fill-primary" />
                  <span className="text-foreground/90">Watch Demo</span>
                </button>
              </div>

              {/* Live activity toast */}
              <AnimatePresence mode="wait">
                <motion.div key={recentSignup} initial={{ opacity: 0, x: -20, y: 10 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full border border-primary/10 bg-card/30 backdrop-blur-xl">
                  <div className="relative">
                    <div className="w-2 h-2 bg-accent-emerald rounded-full" />
                    <div className="absolute inset-0 w-2 h-2 bg-accent-emerald rounded-full animate-ping" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{recentSignup}</span> just joined the waitlist
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>

        {/* Countdown at bottom of hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="relative z-20 pb-12 px-4"
        >
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Early access opens in</p>
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <CountdownDigit value={String(timeLeft.days).padStart(2, '0')} label="Days" />
              <span className="font-display text-xl sm:text-3xl text-primary/40 mt-[-16px]">:</span>
              <CountdownDigit value={String(timeLeft.hours).padStart(2, '0')} label="Hours" />
              <span className="font-display text-xl sm:text-3xl text-primary/40 mt-[-16px]">:</span>
              <CountdownDigit value={String(timeLeft.minutes).padStart(2, '0')} label="Min" />
              <span className="font-display text-xl sm:text-3xl text-primary/40 mt-[-16px]">:</span>
              <CountdownDigit value={String(timeLeft.seconds).padStart(2, '0')} label="Sec" />
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
            Trending worldwide
          </p>
          <CountryMarquee />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── 3. ORCHESTRATOR SHOWCASE ─── */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2 text-sm">
              <BrainCircuit className="h-4 w-4" />
              AI Orchestration
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              One Command. <span className="gradient-text" style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.25)' }}>Entire Team Moves.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Thor delegates, coordinates, and orchestrates 83 AI agents across your business — from marketing to cybersecurity.
            </p>
          </motion.div>

          {/* Orchestrator visual card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <GlassCard hover={false} className="overflow-hidden">
              <div className="relative h-[300px] sm:h-[400px] lg:h-[500px]">
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-card/60 via-transparent to-card/60 z-10" />
                <img src={thorOrchestrating} alt="AI orchestrator coordinating agents" className="w-full h-full object-cover" />

                {/* Floating agent indicators */}
                {[
                  { label: "Marketing AI", x: "10%", y: "20%", delay: 0 },
                  { label: "Sales AI", x: "75%", y: "15%", delay: 0.2 },
                  { label: "CFO Agent", x: "85%", y: "55%", delay: 0.4 },
                  { label: "Growth Hacker", x: "15%", y: "65%", delay: 0.6 },
                ].map((agent, i) => (
                  <motion.div
                    key={agent.label}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + agent.delay, type: "spring" }}
                    className="absolute z-20"
                    style={{ left: agent.x, top: agent.y }}
                  >
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-xl border border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
                      <Bot className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-foreground/90">{agent.label}</span>
                      <div className="w-1.5 h-1.5 bg-accent-emerald rounded-full" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom bar with stats */}
              <div className="relative z-20 p-6 border-t border-primary/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { value: "83", label: "AI Agents", icon: Bot },
                  { value: "15", label: "Departments", icon: Users },
                  { value: "88%", label: "Cost Savings", icon: TrendingUp },
                  { value: "24/7", label: "Autonomous", icon: Zap },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <stat.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── 4. BENEFITS ─── */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Why Join the <span className="gradient-text" style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.25)' }}>White List?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Exclusive perks for those who secure their spot before the official launch.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Early Access", desc: "Be the first to experience the full platform. Set up your AI agents and departments before anyone else." },
              { icon: Headphones, title: "Premium Support", desc: "Dedicated onboarding team. Personalized 1:1 setup to ensure your AI workforce hits the ground running." },
              { icon: Crown, title: "Exclusive Pricing", desc: "50% off launch pricing for white list members. Lock in your rate before public launch." },
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
      {/* ─── 5. FORM + CHECKOUT CARD ─── */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="waitlist-form" className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Secure Your Spot <span className="gradient-text" style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.25)' }}>Now</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Only white list members get priority access. Join now and claim your VIP position.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Left — Value props */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-5">
              {[
                { icon: Crown, text: "Exclusive early access", tag: "VIP" },
                { icon: Gift, text: "50% off at launch", tag: "BONUS" },
                { icon: Zap, text: "Personalized 1:1 onboarding", tag: "FREE" },
                { icon: Shield, text: "Lifetime priority support", tag: "PRO" },
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
                  <span className="font-bold text-primary text-lg tabular-nums">{displayCount.toLocaleString()}+</span>
                  <span className="text-muted-foreground"> professionals waiting</span>
                </div>
              </motion.div>

              {/* Transparent checkout info card */}
              <GlassCard hover={false} className="p-5 mt-4 border-accent-emerald/15">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-accent-emerald" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Transparent Checkout</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      After early access, pay seamlessly with PayPal — all in one card. No hidden fees, no redirects. Enterprise-grade security.
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="outline" className="text-[10px] border-accent-emerald/20 text-accent-emerald/80 gap-1">
                        <Lock className="h-2.5 w-2.5" /> PayPal
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-accent-emerald/20 text-accent-emerald/80 gap-1">
                        <Shield className="h-2.5 w-2.5" /> Encrypted
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-accent-emerald/20 text-accent-emerald/80 gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> In-app
                      </Badge>
                    </div>
                  </div>
                </div>
              </GlassCard>
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
                    <h3 className="font-display text-2xl font-bold mb-2">Join the White List</h3>
                    <p className="text-muted-foreground text-sm">Fill in your details and secure priority access</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Your name" className="h-12 bg-background/30 border-primary/10 rounded-xl backdrop-blur-sm focus:border-primary/30 transition-colors" />
                        {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-xs uppercase tracking-wider text-muted-foreground">Company</Label>
                        <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Your company" className="h-12 bg-background/30 border-primary/10 rounded-xl backdrop-blur-sm focus:border-primary/30 transition-colors" />
                        {errors.company && <p className="text-destructive text-xs">{errors.company}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">E-mail *</Label>
                      <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="you@email.com" className="h-12 bg-background/30 border-primary/10 rounded-xl backdrop-blur-sm focus:border-primary/30 transition-colors" required />
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
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                      <span className="relative z-10 flex items-center justify-center gap-2 text-primary-foreground">
                        {loading ? (
                          <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Joining...</>
                        ) : (
                          <><Rocket className="h-5 w-5" />Get Early Access<ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" /></>
                        )}
                      </span>
                    </button>

                    <p className="text-[11px] text-center text-muted-foreground/70 pt-1">
                      Invites sent in limited batches · <a href="/privacy" className="text-primary/60 hover:text-primary transition-colors underline-offset-2 hover:underline">Privacy Policy</a>
                    </p>
                  </form>

                  <div className="flex items-center justify-center gap-5 mt-6 text-muted-foreground/50">
                    {[
                      { icon: Lock, label: "Encrypted" },
                      { icon: Shield, label: "GDPR" },
                      { icon: Cpu, label: "Cutting-edge AI" },
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
              <span className="text-sm font-medium text-foreground/80">Trending in 10+ countries — Exclusive white list</span>
              <CheckCircle2 className="h-4 w-4 text-accent-emerald" />
            </GlassCard>
          </motion.div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors duration-300">About</a>
              <span className="text-border">·</span>
              <a href="#" className="hover:text-primary transition-colors duration-300">Contact</a>
              <span className="text-border">·</span>
              <a href="#" className="hover:text-primary transition-colors duration-300">Partners</a>
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
            <p className="text-xs text-muted-foreground/40">© 2026 Clauthor · All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Waitlist;
