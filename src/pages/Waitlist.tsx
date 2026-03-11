import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Zap, CheckCircle2, Clock,
  ArrowRight, Sparkles, Shield, Bot, Star, Timer, TrendingUp, Users,
  Cpu, Lock, Play, BarChart3, Calendar, MessageSquare, Target,
  Rocket, Gift, Crown, ChevronDown, Building2, Brain, Headphones,
  DollarSign, Megaphone, ShoppingCart, Scale, Truck, Gem,
  Cog, Briefcase, MonitorSmartphone, UserCheck, Layers
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

// ── Futuristic Background ──
const WaitlistBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-to-b from-primary/[0.06] to-transparent rounded-full blur-[150px]" />
    <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-gradient-to-t from-primary/[0.03] to-transparent rounded-full blur-[120px]" />
    <motion.div
      animate={{ y: [-20, 20, -20], opacity: [0.03, 0.08, 0.03] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[10%] left-[15%] w-[350px] h-[350px] rounded-full bg-primary/[0.06] blur-[120px]"
    />
    <motion.div
      animate={{ y: [15, -25, 15], opacity: [0.02, 0.07, 0.02] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute top-[50%] right-[10%] w-[280px] h-[280px] rounded-full bg-primary/[0.05] blur-[100px]"
    />
  </div>
);

// ── Success Screen ──
const SuccessView = ({ position }: { position: number | null }) => (
  <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
    <WaitlistBackground />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.12, 0.05] }} transition={{ duration: 4, repeat: Infinity }} className="w-[500px] h-[500px] rounded-full border border-primary/10" />
    </div>

    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center max-w-lg">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8 relative"
      >
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" />
        <CheckCircle2 className="h-14 w-14 text-primary" />
      </motion.div>

      <h1 className="font-display text-5xl sm:text-6xl font-bold mb-4">
        Você está <span className="gradient-text glow-text">dentro!</span>
      </h1>

      <div className="holo-card rounded-2xl p-10 mb-8">
        <p className="text-muted-foreground mb-4 text-sm uppercase tracking-[0.2em]">Sua posição na fila</p>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="font-display text-7xl font-bold gradient-text glow-text mb-3"
        >
          #{position}
        </motion.div>
        <p className="text-sm text-muted-foreground">Entraremos em contato pelo WhatsApp assim que sua vez chegar</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Lançamento esta semana</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Acesso prioritário</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="p-4 rounded-xl border border-primary/20 bg-primary/5"
        >
          <p className="text-sm text-foreground/80">
            <Gift className="h-4 w-4 text-primary inline mr-2" />
            <span className="font-semibold text-primary">Bônus:</span> Compartilhe com colegas e suba na fila!
          </p>
        </motion.div>
      </div>
    </motion.div>
  </div>
);

// ── Benefit Cards ──
const benefits = [
  { icon: Bot, title: "83 Agentes Autônomos", desc: "Uma frota completa de IA que trabalha 24/7 — vendendo, atendendo, prospectando e executando sem intervenção humana." },
  { icon: Target, title: "Prospecção Inteligente", desc: "IA que encontra, qualifica e engaja leads automaticamente em múltiplos canais." },
  { icon: BarChart3, title: "Analytics em Tempo Real", desc: "Dashboards com métricas de ROI, performance de agentes e previsão de receita." },
  { icon: Calendar, title: "Agendamento Automático", desc: "Reuniões agendadas pela IA sem troca de e-mails. Tudo no piloto automático." },
  { icon: MessageSquare, title: "Atendimento Omnichannel", desc: "WhatsApp, e-mail e chat unificados com IA respondendo em segundos." },
  { icon: TrendingUp, title: "Escalabilidade Infinita", desc: "De 1 a 10.000 conversas simultâneas sem contratar mais ninguém." },
];

// ── 15 Departments ──
const departments = [
  { icon: MonitorSmartphone, name: "Tecnologia", agents: 12 },
  { icon: Target, name: "Vendas", agents: 8 },
  { icon: Megaphone, name: "Marketing", agents: 7 },
  { icon: DollarSign, name: "Financeiro", agents: 6 },
  { icon: Gem, name: "Criação", agents: 5 },
  { icon: Headphones, name: "Suporte", agents: 6 },
  { icon: Users, name: "RH", agents: 5 },
  { icon: UserCheck, name: "Prospecção", agents: 5 },
  { icon: MessageSquare, name: "Comunicação", agents: 4 },
  { icon: Cog, name: "Operações", agents: 5 },
  { icon: ShoppingCart, name: "E-commerce & Growth", agents: 4 },
  { icon: Scale, name: "Jurídico", agents: 3 },
  { icon: Briefcase, name: "Compras", agents: 3 },
  { icon: Truck, name: "Logística", agents: 3 },
  { icon: CheckCircle2, name: "Qualidade", agents: 3 },
];

// ── Testimonials ──
const testimonials = [
  { name: "Ricardo M.", role: "CEO, TechScale", quote: "Reduzimos 70% do tempo de prospecção no primeiro mês de teste.", rating: 5 },
  { name: "Ana L.", role: "Head de Growth, StartupX", quote: "Os agentes de IA geraram 3x mais reuniões qualificadas do que nosso SDR.", rating: 5 },
  { name: "Carlos S.", role: "Diretor Comercial, InnovaCorp", quote: "Plataforma impressionante. Estamos ansiosos pelo acesso completo.", rating: 5 },
];

// ── How It Works Steps ──
const howItWorks = [
  { step: "01", title: "Cadastre-se na Whitelist", desc: "Preencha o formulário com seu e-mail e WhatsApp. Os dados vão direto para nossa base." },
  { step: "02", title: "Receba seu Convite", desc: "Liberamos acesso em lotes limitados. Quanto antes você entrar, mais rápido recebe." },
  { step: "03", title: "Ative seus Agentes", desc: "Escolha entre 83 agentes e 15 departamentos. Configure em minutos, sem código." },
  { step: "04", title: "Opere no Piloto Automático", desc: "Agentes trabalham 24/7 — prospectam, atendem, vendem e escalam seu negócio." },
];

const Waitlist = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [formData, setFormData] = useState({ email: "", whatsapp: "", name: "", company: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [displayCount, setDisplayCount] = useState(4127);
  const [recentSignup, setRecentSignup] = useState(recentNames[0]);
  const [spotsLeft, setSpotsLeft] = useState(47);

  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setDisplayCount(prev => prev + 1);
        setRecentSignup(recentNames[Math.floor(Math.random() * recentNames.length)]);
        if (Math.random() > 0.6) setSpotsLeft(prev => Math.max(12, prev - 1));
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

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

  if (success) return <SuccessView position={position} />;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <WaitlistBackground />

      {/* ─── HERO SECTION ─── */}
      <section className="relative z-10 px-4 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — Copy */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            {/* Urgency timer */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-5">
              <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive px-4 py-2.5 gap-2 font-mono">
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Timer className="h-4 w-4" />
                </motion.div>
                <span className="tabular-nums">
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-muted-foreground text-xs">para garantir bônus de lançamento</span>
              </Badge>
            </motion.div>

            {/* Spots counter */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2 backdrop-blur-sm">
                <Rocket className="h-4 w-4" />
                Apenas <span className="font-bold tabular-nums">{spotsLeft}</span> vagas restantes neste lote
              </Badge>
            </motion.div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[0.95] tracking-tight">
              <span className="block text-foreground">83 agentes de IA</span>
              <span className="block text-foreground">autônomos para</span>
              <span className="block gradient-text glow-text">sua empresa.</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
              Entre na whitelist e tenha <span className="text-foreground font-semibold">acesso antecipado</span> à plataforma com{" "}
              <span className="text-primary font-semibold">15 departamentos completos</span> — vendas, marketing, suporte, financeiro e muito mais.
              Tudo operado por IA autônoma 24/7.
            </p>

            {/* Benefit pills */}
            <div className="space-y-3 mb-8">
              {[
                { icon: Crown, text: "Acesso antecipado exclusivo", tag: "VIP" },
                { icon: Gift, text: "50% de desconto no lançamento", tag: "BÔNUS" },
                { icon: Zap, text: "Onboarding personalizado 1:1", tag: "GRÁTIS" },
                { icon: Shield, text: "Suporte prioritário vitalício", tag: "PRO" },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                    <item.icon className="h-5 w-5 text-primary/80" />
                  </div>
                  <span className="font-medium text-foreground/90">{item.text}</span>
                  <Badge variant="outline" className="text-[10px] border-primary/20 text-primary/70 px-2 py-0.5 ml-auto">
                    {item.tag}
                  </Badge>
                </motion.div>
              ))}
            </div>

            {/* Social proof */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.08, type: "spring", stiffness: 300 }}
                    className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10" />
                    <span className="text-xs font-bold relative z-10 text-foreground/80">{String.fromCharCode(64 + i)}</span>
                  </motion.div>
                ))}
              </div>
              <div className="text-sm">
                <motion.span key={displayCount} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="font-bold text-primary text-lg tabular-nums">
                  {displayCount.toLocaleString('pt-BR')}+
                </motion.span>
                <span className="text-muted-foreground"> profissionais na fila</span>
              </div>
            </motion.div>

            {/* Live activity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="mt-5 flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-accent-emerald rounded-full" />
                <div className="absolute inset-0 w-2.5 h-2.5 bg-accent-emerald rounded-full animate-ping" />
              </div>
              <AnimatePresence mode="wait">
                <motion.span key={recentSignup} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{recentSignup}</span> acabou de entrar na whitelist
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Right — Form */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
            <div className="rounded-3xl p-8 md:p-10 relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm shadow-[0_1px_3px_hsl(0_0%_0%/0.2)]">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/15 rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-primary/10 rounded-full blur-[60px]" />

              <div className="relative z-10">
                <div className="text-center mb-8">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-4"
                  >
                    <Sparkles className="h-8 w-8 text-primary" />
                  </motion.div>
                  <h2 className="font-display text-2xl font-bold mb-2">Garanta sua vaga agora</h2>
                  <p className="text-muted-foreground text-sm">Preencha seus dados e entre para a lista exclusiva</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Seu nome"
                        className="h-12 bg-background/50 border-border/50 rounded-xl"
                      />
                      {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-xs uppercase tracking-wider text-muted-foreground">Empresa</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Sua empresa"
                        className="h-12 bg-background/50 border-border/50 rounded-xl"
                      />
                      {errors.company && <p className="text-destructive text-xs">{errors.company}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="h-12 bg-background/50 border-border/50 rounded-xl"
                      required
                    />
                    {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp *</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: formatWhatsApp(e.target.value) })}
                      placeholder="(11) 99999-9999"
                      className="h-12 bg-background/50 border-border/50 rounded-xl"
                      required
                    />
                    {errors.whatsapp && <p className="text-destructive text-xs">{errors.whatsapp}</p>}
                  </div>

                  {/* CTA button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full h-14 rounded-xl font-display font-semibold text-lg text-primary-foreground overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary bg-[length:200%_100%] animate-gradient-shift rounded-xl" />
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 via-primary-glow/40 to-primary/40 rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute inset-0 overflow-hidden rounded-xl">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Entrando na fila...
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 fill-current" />
                          Garantir minha vaga
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                        </>
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

                {/* Data destination info */}
                <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-[11px] text-muted-foreground text-center">
                    📧 Seus dados ficam salvos com segurança na nossa base.
                    Entraremos em contato pelo <span className="text-primary font-medium">WhatsApp</span> e <span className="text-primary font-medium">e-mail</span> cadastrados.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="flex justify-center mt-16"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-muted-foreground/30">
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Layers className="h-4 w-4" />
              Como funciona
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Da whitelist ao piloto automático
              <br />
              <span className="gradient-text">em 4 passos.</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.12 }}
                className="relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm text-center"
              >
                <div className="font-display text-5xl font-bold text-primary/10 mb-3">{item.step}</div>
                <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 text-primary/20">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 15 DEPARTMENTS ─── */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Building2 className="h-4 w-4" />
              15 Departamentos Completos
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Uma empresa inteira
              <br />
              <span className="gradient-text">movida por IA.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              83 agentes autônomos distribuídos em 15 departamentos corporativos.
              Cada departamento opera de forma independente, 24 horas por dia.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {departments.map((dept, i) => (
              <motion.div
                key={dept.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.05 }}
                className="group p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-500 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                  <dept.icon className="h-5 w-5 text-primary/80" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1">{dept.name}</h3>
                <p className="text-xs text-muted-foreground">{dept.agents} agentes</p>
              </motion.div>
            ))}
          </div>

          {/* Total agents highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 p-6 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8"
          >
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <p className="font-display text-3xl font-bold gradient-text">83</p>
                <p className="text-sm text-muted-foreground">Agentes Autônomos</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border/50" />
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="font-display text-3xl font-bold gradient-text">15</p>
                <p className="text-sm text-muted-foreground">Departamentos</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border/50" />
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              <div>
                <p className="font-display text-3xl font-bold gradient-text">24/7</p>
                <p className="text-sm text-muted-foreground">Operação Contínua</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── VALUE PROOF SECTION ─── */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Zap className="h-4 w-4" />
              O que você vai acessar
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Tudo que sua empresa precisa.
              <br />
              <span className="gradient-text">Em uma plataforma.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Agentes de IA autônomos que trabalham 24/7, prospectam clientes, respondem leads e agendam reuniões — tudo no piloto automático.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 hover:bg-card/80 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                  <b.icon className="h-6 w-6 text-primary/80" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW AUTONOMOUS AGENTS WORK ─── */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Brain className="h-4 w-4" />
              Inteligência Autônoma
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Não é chatbot.
              <br />
              <span className="gradient-text">É funcionário digital.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Nossos agentes não esperam comandos. Eles detectam oportunidades, tomam decisões e executam ações — com segurança e auditoria completa.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Execução Autônoma",
                items: ["Respondem WhatsApp e e-mail sozinhos", "Criam tarefas e relatórios", "Agendam reuniões automaticamente"],
                color: "text-accent-emerald",
                label: "Baixo Risco — Execução Direta",
              },
              {
                icon: Shield,
                title: "Notificação + Ação",
                items: ["Enviam e-mails individuais", "Delegam entre agentes", "Agendamentos inteligentes"],
                color: "text-accent-amber",
                label: "Médio Risco — Executa e Notifica",
              },
              {
                icon: Lock,
                title: "Aprovação Humana",
                items: ["E-mails em massa", "Exclusão de dados sensíveis", "Chamadas a APIs externas"],
                color: "text-destructive",
                label: "Alto Risco — Só com Aprovação",
              },
            ].map((level, i) => (
              <motion.div
                key={level.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <level.icon className={`h-6 w-6 ${level.color}`} />
                  <h3 className="font-display font-semibold text-lg text-foreground">{level.title}</h3>
                </div>
                <Badge variant="outline" className="mb-4 text-[10px] border-border/40 text-muted-foreground">
                  {level.label}
                </Badge>
                <ul className="space-y-2">
                  {level.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Security highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 p-5 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm flex items-center gap-4"
          >
            <Shield className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-sm text-foreground">Segurança Enterprise</p>
              <p className="text-xs text-muted-foreground">
                Criptografia AES-256-GCM · Auditoria completa de ações · Conformidade LGPD · Limites automáticos (500 ações/dia de baixo risco, 3/dia de alto risco)
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF / TESTIMONIALS ─── */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Star className="h-4 w-4" />
              Primeiros testadores
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              O que os primeiros testadores dizem
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15 }}
                className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground/90 mb-4 leading-relaxed">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 grid grid-cols-3 gap-6 p-8 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm"
          >
            {[
              { value: "4.127+", label: "Na whitelist" },
              { value: "150+", label: "Empresas interessadas" },
              { value: "83", label: "Agentes de IA disponíveis" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ RÁPIDO ─── */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Perguntas frequentes</h2>
          </motion.div>

          <div className="space-y-4">
            {[
              { q: "Preciso pagar para entrar na whitelist?", a: "Não. A inscrição é 100% gratuita. Quem entrar agora terá 50% de desconto no lançamento." },
              { q: "Meus dados ficam seguros?", a: "Sim. Utilizamos criptografia AES-256-GCM e conformidade total com LGPD. Seus dados vão direto para nossa base segura." },
              { q: "Quando vou receber o acesso?", a: "Convites são liberados em lotes limitados via WhatsApp e e-mail. Quanto antes você se cadastrar, mais cedo recebe." },
              { q: "A plataforma aguenta muitas pessoas?", a: "Sim. Nossa infraestrutura escala automaticamente com Lovable Cloud. De 1 a 100.000+ usuários sem degradação de performance." },
              { q: "Os agentes substituem minha equipe?", a: "Não substituem. Eles trabalham ao lado da sua equipe, automatizando tarefas repetitivas para que seu time foque em decisões estratégicas." },
            ].map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm"
              >
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Não fique de fora.
              <br />
              <span className="gradient-text glow-text">Sua vaga está esperando.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              Convites são liberados em lotes limitados. Quem entra primeiro, tem prioridade.
            </p>
            <Button
              size="lg"
              className="h-14 px-10 text-lg font-display gap-2 rounded-xl"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Rocket className="h-5 w-5" />
              Entrar na Whitelist agora
              <ArrowRight className="h-5 w-5" />
            </Button>
            <p className="text-xs text-muted-foreground/50 mt-4">Sem cartão de crédito · Acesso gratuito no lançamento</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Waitlist;
