import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, CheckCircle2, Clock, 
  ArrowRight, Sparkles, Shield, Bot, Star, Timer, TrendingUp, Users,
  Cpu, Lock, Play
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

// ── Futuristic Background (matching Home) ──
const WaitlistBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    {/* Dot grid */}
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle, hsl(0 65% 48%) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
    
    {/* Primary ambient glows */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-to-b from-primary/[0.06] to-transparent rounded-full blur-[150px]" />
    <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-gradient-to-t from-primary/[0.03] to-transparent rounded-full blur-[120px]" />

    {/* Floating AI orbs */}
    <motion.div
      animate={{ y: [-20, 20, -20], x: [-10, 10, -10], opacity: [0.03, 0.08, 0.03] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[10%] left-[15%] w-[350px] h-[350px] rounded-full bg-primary/[0.06] blur-[120px]"
    />
    <motion.div
      animate={{ y: [15, -25, 15], x: [10, -15, 10], opacity: [0.02, 0.07, 0.02] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute top-[50%] right-[10%] w-[280px] h-[280px] rounded-full bg-primary/[0.05] blur-[100px]"
    />
    <motion.div
      animate={{ y: [10, -10, 10], opacity: [0.02, 0.05, 0.02] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      className="absolute bottom-[15%] left-[35%] w-[250px] h-[250px] rounded-full bg-primary/[0.04] blur-[90px]"
    />

    {/* Neural network lines */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <motion.line x1="10%" y1="20%" x2="30%" y2="40%" stroke="hsl(0 65% 48%)" strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: [0, 0.6, 0] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.line x1="70%" y1="15%" x2="50%" y2="45%" stroke="hsl(0 65% 48%)" strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: [0, 0.5, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} />
      <motion.line x1="85%" y1="65%" x2="60%" y2="35%" stroke="hsl(0 65% 48%)" strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: [0, 0.4, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 2 }} />
      <motion.line x1="25%" y1="75%" x2="50%" y2="55%" stroke="hsl(0 65% 48%)" strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: [0, 0.5, 0] }} transition={{ duration: 4.5, repeat: Infinity, delay: 1.5 }} />
      {[
        { cx: "10%", cy: "20%" }, { cx: "30%", cy: "40%" }, { cx: "70%", cy: "15%" },
        { cx: "50%", cy: "45%" }, { cx: "85%", cy: "65%" }, { cx: "60%", cy: "35%" },
        { cx: "25%", cy: "75%" }, { cx: "50%", cy: "55%" },
      ].map((node, i) => (
        <motion.circle key={i} cx={node.cx} cy={node.cy} r="2" fill="hsl(0 65% 48%)"
          animate={{ opacity: [0.1, 0.6, 0.1], r: [1.5, 2.5, 1.5] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </svg>
  </div>
);

// ── Success Screen ──
const SuccessView = ({ position }: { position: number | null }) => (
  <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
    <WaitlistBackground />
    
    {/* Pulsing rings */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.12, 0.05] }} transition={{ duration: 4, repeat: Infinity }} className="w-[500px] h-[500px] rounded-full border border-primary/10" />
      <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 6, repeat: Infinity, delay: 1 }} className="absolute -inset-12 rounded-full border border-primary/5" />
    </div>

    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative z-10 text-center max-w-lg"
    >
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

      <div className="holo-card rounded-2xl p-10 mb-8 scan-line">
        <p className="text-muted-foreground mb-4 text-sm uppercase tracking-[0.2em]">Sua posição na fila</p>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="font-display text-7xl font-bold gradient-text glow-text mb-3"
        >
          #{position}
        </motion.div>
        <p className="text-sm text-muted-foreground">
          Entraremos em contato pelo WhatsApp assim que sua vez chegar
        </p>
      </div>

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
    </motion.div>
  </div>
);

const Waitlist = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    whatsapp: "",
    name: "",
    company: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [displayCount, setDisplayCount] = useState(4127);
  const [recentSignup, setRecentSignup] = useState(recentNames[0]);
  
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setDisplayCount(prev => prev + 1);
        setRecentSignup(recentNames[Math.floor(Math.random() * recentNames.length)]);
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

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, whatsapp: formatWhatsApp(e.target.value) });
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
      const { data, error } = await supabase
        .from("waitlist")
        .insert({
          email: formData.email.trim().toLowerCase(),
          whatsapp: formData.whatsapp.replace(/\D/g, ""),
          name: formData.name.trim() || null,
          company: formData.company.trim() || null,
        })
        .select("position")
        .single();
      if (error) {
        if (error.code === "23505") toast.error("Este email já está na lista de espera!");
        else throw error;
        return;
      }
      setPosition(data.position);
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
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
      <WaitlistBackground />

      {/* Pulsing AI rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 5, repeat: Infinity }} className="w-[700px] h-[700px] rounded-full border border-primary/10" />
        <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.02, 0.05, 0.02] }} transition={{ duration: 7, repeat: Infinity, delay: 1 }} className="absolute -inset-16 rounded-full border border-primary/5" />
      </div>

      {/* Scan line overlay */}
      <div className="absolute inset-0 scan-line pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Urgency timer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Badge 
              variant="outline" 
              className="border-destructive/40 bg-destructive/10 text-destructive px-4 py-2.5 gap-2 font-mono"
            >
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Timer className="h-4 w-4" />
              </motion.div>
              <span className="tabular-nums">
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-muted-foreground">para garantir bônus</span>
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Badge 
              variant="outline" 
              className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2 backdrop-blur-sm"
            >
              <TrendingUp className="h-4 w-4" />
              +{displayCount.toLocaleString('pt-BR')} pessoas já entraram
            </Badge>
          </motion.div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-[0.95] tracking-tight">
            <span className="block text-foreground">Entre na fila.</span>
            <span className="block animate-gradient-shift">Garanta seu lugar.</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-lg">
            O <span className="text-foreground font-semibold">PROMETHEUS</span> está prestes a revolucionar a forma como empresas operam com IA. 
            Seja um dos primeiros a experimentar o{" "}
            <span className="text-primary font-semibold">futuro da automação inteligente.</span>
          </p>

          {/* Benefits with stagger */}
          <div className="space-y-3 mb-10">
            {[
              { icon: Zap, text: "Acesso antecipado exclusivo", tag: "VIP" },
              { icon: Star, text: "Desconto especial de lançamento", tag: "50% OFF" },
              { icon: Users, text: "Suporte prioritário 24/7", tag: "PRO" },
              { icon: Bot, text: "Onboarding personalizado", tag: "1:1" },
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

          {/* Social proof avatars */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
              <motion.span 
                key={displayCount}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-bold text-primary text-lg tabular-nums"
              >
                {displayCount.toLocaleString('pt-BR')}+
              </motion.span>
              <span className="text-muted-foreground"> na fila</span>
            </div>
          </motion.div>

          {/* Live activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-6 flex items-center gap-3 p-3 rounded-xl glass-card"
          >
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-accent-emerald rounded-full" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-accent-emerald rounded-full animate-ping" />
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={recentSignup}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-sm text-muted-foreground"
              >
                <span className="font-medium text-foreground">{recentSignup}</span> acabou de entrar
              </motion.span>
            </AnimatePresence>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center gap-6 mt-8 text-muted-foreground"
          >
            {[
              { icon: Lock, label: "Dados criptografados" },
              { icon: Shield, label: "LGPD compliant" },
              { icon: Cpu, label: "IA de ponta" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 opacity-50">
                <item.icon className="h-3 w-3 text-primary/60" />
                <span className="text-[10px] uppercase tracking-[0.15em]">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right side - Form */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="holo-card rounded-3xl p-8 md:p-10 relative overflow-hidden">
            {/* Corner accent glow */}
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
                <h2 className="font-display text-2xl font-bold mb-2">
                  Garanta sua vaga
                </h2>
                <p className="text-muted-foreground text-sm">
                  Preencha seus dados e entre para a lista VIP
                </p>
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
                      className="h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary/30 transition-colors"
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
                      className="h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary/30 transition-colors"
                    />
                    {errors.company && <p className="text-destructive text-xs">{errors.company}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary/30 transition-colors"
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
                    onChange={handleWhatsAppChange}
                    placeholder="(11) 99999-9999"
                    className="h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary/30 transition-colors"
                    required
                  />
                  {errors.whatsapp && <p className="text-destructive text-xs">{errors.whatsapp}</p>}
                </div>

                {/* Premium CTA button */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="group relative w-full h-14 rounded-xl font-display font-semibold text-lg text-primary-foreground overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary bg-[length:200%_100%] animate-gradient-shift rounded-xl" />
                  {/* Glow ring */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 via-primary-glow/40 to-primary/40 rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                  {/* Shine sweep */}
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  {/* Content */}
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

                <p className="text-[10px] text-center text-muted-foreground/60 uppercase tracking-wider pt-1">
                  Ao se cadastrar, você concorda com nossa{" "}
                  <a href="#" className="text-primary/60 hover:text-primary transition-colors">Política de Privacidade</a>
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Waitlist;
