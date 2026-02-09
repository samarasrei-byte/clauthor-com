import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, CheckCircle2, Clock, 
  ArrowRight, Sparkles, Shield, Bot, Star, Timer, TrendingUp, Users
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

// Simulated recent signups for social proof
const recentNames = [
  "João S.", "Maria C.", "Pedro L.", "Ana B.", "Lucas M.",
  "Carla R.", "Rafael D.", "Julia F.", "Bruno G.", "Fernanda T.",
  "Gabriel H.", "Larissa P.", "Matheus S.", "Amanda K.", "Thiago N."
];

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
  
  // Animated counter starting from ~4000
  const [displayCount, setDisplayCount] = useState(4127);
  const [recentSignup, setRecentSignup] = useState(recentNames[0]);
  
  // Countdown timer (expires in 24h from page load)
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  // Animated counter effect - increment randomly
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setDisplayCount(prev => prev + 1);
        setRecentSignup(recentNames[Math.floor(Math.random() * recentNames.length)]);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
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
    const formatted = formatWhatsApp(e.target.value);
    setFormData({ ...formData, whatsapp: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = waitlistSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
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
        if (error.code === "23505") {
          toast.error("Este email já está na lista de espera!");
        } else {
          throw error;
        }
        return;
      }

      setPosition(data.position);
      setSuccess(true);
      toast.success("Você está na lista! 🎉");
    } catch (error: any) {
      toast.error("Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] opacity-50" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </motion.div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Você está <span className="gradient-text">dentro!</span>
          </h1>

          <div className="glass-card rounded-2xl p-8 mb-8">
            <p className="text-muted-foreground mb-4">Sua posição na fila:</p>
            <div className="font-display text-6xl font-bold gradient-text mb-2">
              #{position}
            </div>
            <p className="text-sm text-muted-foreground">
              Entraremos em contato pelo WhatsApp assim que sua vez chegar
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Urgency timer badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Badge 
              variant="outline" 
              className="border-red-500/40 bg-red-500/10 text-red-400 px-4 py-2 gap-2 animate-pulse"
            >
              <Timer className="h-4 w-4" />
              Oferta expira em {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </Badge>
          </motion.div>

          <Badge 
            variant="outline" 
            className="mb-4 border-primary/40 bg-primary/10 text-primary px-4 py-2 gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            +{displayCount.toLocaleString('pt-BR')} pessoas já entraram
          </Badge>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1]">
            Entre na fila.
            <br />
            <span className="gradient-text">Garanta seu lugar.</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            O ApexBot está prestes a revolucionar a forma como empresas operam com IA. 
            Seja um dos primeiros a experimentar o futuro da automação inteligente.
          </p>

          {/* Benefits */}
          <div className="space-y-4 mb-8">
            {[
              { icon: Zap, text: "Acesso antecipado exclusivo" },
              { icon: Star, text: "Desconto especial de lançamento" },
              { icon: Users, text: "Suporte prioritário" },
              { icon: Bot, text: "Onboarding personalizado" },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Social proof with animated counter */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-purple-500/40 border-2 border-background flex items-center justify-center"
                >
                  <span className="text-xs font-bold">{String.fromCharCode(64 + i)}</span>
                </motion.div>
              ))}
            </div>
            <div className="text-sm">
              <motion.span 
                key={displayCount}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-bold text-primary text-lg"
              >
                {displayCount.toLocaleString('pt-BR')}+
              </motion.span>
              <span className="text-muted-foreground"> pessoas na fila</span>
            </div>
          </div>

          {/* Live activity indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={recentSignup}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-sm text-muted-foreground"
              >
                <span className="font-medium text-foreground">{recentSignup}</span> acabou de entrar na fila
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Right side - Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="glass-card rounded-3xl p-8 md:p-10 gradient-border relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">
                  Garanta sua vaga
                </h2>
                <p className="text-muted-foreground text-sm">
                  Preencha seus dados e entre para a lista VIP
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome (opcional)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome"
                    className="h-12 bg-background/50 border-white/10 rounded-xl"
                  />
                  {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Empresa (opcional)</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Nome da sua empresa"
                    className="h-12 bg-background/50 border-white/10 rounded-xl"
                  />
                  {errors.company && <p className="text-red-400 text-xs">{errors.company}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="h-12 bg-background/50 border-white/10 rounded-xl"
                    required
                  />
                  {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={handleWhatsAppChange}
                    placeholder="(11) 99999-9999"
                    className="h-12 bg-background/50 border-white/10 rounded-xl"
                    required
                  />
                  {errors.whatsapp && <p className="text-red-400 text-xs">{errors.whatsapp}</p>}
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 text-lg font-semibold rounded-xl glow group"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Entrando na fila...
                    </div>
                  ) : (
                    <>
                      Garantir minha vaga
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao se cadastrar, você concorda com nossa{" "}
                  <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
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
