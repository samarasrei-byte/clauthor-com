import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Sparkles, ArrowRight, Building2, ShoppingCart, Code,
  Briefcase, HeartHandshake, GraduationCap, Factory, Rocket,
  Target, Zap, Shield, Users, MessageSquare, BarChart3,
  CheckCircle2, ChevronRight, Cpu, Globe, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// ─── Typing Effect Hook ────────────────────────────────
const useTypingEffect = (text: string, speed = 40, startDelay = 0) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          setDone(true);
          clearInterval(interval);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);

  return { displayed, done };
};

// ─── Data ───────────────────────────────────────────────
const industries = [
  { id: "saas", label: "SaaS / Tech", icon: Code, gradient: "from-cyan-500 to-blue-600" },
  { id: "ecommerce", label: "E-commerce", icon: ShoppingCart, gradient: "from-emerald-500 to-teal-600" },
  { id: "services", label: "Serviços", icon: Briefcase, gradient: "from-amber-500 to-orange-600" },
  { id: "health", label: "Saúde", icon: HeartHandshake, gradient: "from-rose-500 to-pink-600" },
  { id: "education", label: "Educação", icon: GraduationCap, gradient: "from-violet-500 to-purple-600" },
  { id: "industry", label: "Indústria", icon: Factory, gradient: "from-slate-400 to-zinc-600" },
  { id: "startup", label: "Startup", icon: Rocket, gradient: "from-primary to-primary-glow" },
  { id: "agency", label: "Agência", icon: Target, gradient: "from-pink-500 to-fuchsia-600" },
];

const painPoints = [
  { id: "sales", label: "Vendas & Prospecção", icon: "🎯", desc: "Geração de leads e fechamento", agents: ["sales", "voice_ai"] },
  { id: "support", label: "Atendimento", icon: "💬", desc: "Suporte 24/7 com IA", agents: ["omnichannel", "customer_success"] },
  { id: "marketing", label: "Marketing", icon: "📣", desc: "Conteúdo e automações", agents: ["content", "seo_growth"] },
  { id: "finance", label: "Financeiro", icon: "💰", desc: "Cobrança e gestão", agents: ["revenue", "ai_cfo"] },
  { id: "operations", label: "Operações", icon: "⚙️", desc: "Processos e projetos", agents: ["orchestrator", "project_management"] },
  { id: "security", label: "Segurança", icon: "🛡️", desc: "Compliance e auditorias", agents: ["security", "legal"] },
];

const teamSizes = [
  { id: "solo", label: "Só eu", agents: 2 },
  { id: "small", label: "2-10", agents: 4 },
  { id: "medium", label: "11-50", agents: 6 },
  { id: "large", label: "50+", agents: 10 },
];

// ─── Floating Particles ────────────────────────────────
const FloatingParticle = ({ delay, size }: { delay: number; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{ width: size, height: size }}
    initial={{ opacity: 0, x: Math.random() * 100 - 50, y: Math.random() * 100 }}
    animate={{
      opacity: [0, 0.6, 0],
      y: [100, -200],
      x: [Math.random() * 200 - 100, Math.random() * 200 - 100],
    }}
    transition={{ duration: 4 + Math.random() * 3, delay, repeat: Infinity, ease: "easeOut" }}
  />
);

// ─── Main Component ─────────────────────────────────────
interface PostSignupOnboardingProps {
  onComplete: () => void;
}

const PostSignupOnboarding = ({ onComplete }: PostSignupOnboardingProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState(0); // 0=welcome, 1=company, 2=pain, 3=team, 4=deploying, 5=done
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [pains, setPains] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("");
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployedAgents, setDeployedAgents] = useState<string[]>([]);
  const [deployingName, setDeployingName] = useState("");

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "CEO";

  // Phase 0 typing
  const greeting = useTypingEffect(
    `Bem-vindo(a), ${userName}. Sua equipe de IA está pronta para ser montada.`,
    35,
    600
  );
  const subtitle = useTypingEffect(
    "Em 60 segundos, vamos configurar os agentes ideais para sua empresa.",
    30,
    2200
  );

  const totalPhases = 6;
  const progressPct = Math.round((phase / (totalPhases - 1)) * 100);

  const togglePain = (id: string) => {
    setPains(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const getSelectedAgentSlugs = useCallback(() => {
    const set = new Set<string>();
    pains.forEach(p => {
      const pain = painPoints.find(pp => pp.id === p);
      pain?.agents.forEach(a => set.add(a));
    });
    const maxAgents = teamSizes.find(t => t.id === teamSize)?.agents || 4;
    return Array.from(set).slice(0, maxAgents);
  }, [pains, teamSize]);

  // Deploy animation
  const startDeploy = async () => {
    setPhase(4);
    const slugs = getSelectedAgentSlugs();
    const totalSteps = slugs.length + 2;
    let step = 0;

    // Simulate setup steps
    setDeployingName("Inicializando ambiente seguro...");
    await wait(800);
    step++;
    setDeployProgress(Math.round((step / totalSteps) * 100));

    setDeployingName("Configurando tenant...");
    // Create tenant + profile if needed
    try {
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || "empresa";
      const { data: existing } = await supabase.from("tenants").select("id").limit(1);
      
      if (!existing || existing.length === 0) {
        const { data: tenant } = await supabase.from("tenants").insert({
          name: companyName || "Minha Empresa",
          slug,
          plan_type: "free",
        }).select().single();

        if (tenant) {
          await supabase.from("tenant_members").insert({
            tenant_id: tenant.id,
            user_id: user!.id,
            role: "admin",
          });
        }
      }

      // Update profile with company
      await supabase.from("profiles").upsert({
        user_id: user!.id,
        company_name: companyName || null,
        full_name: user?.user_metadata?.full_name || null,
      }, { onConflict: "user_id" });
    } catch (e) {
      console.error("Tenant setup:", e);
    }

    step++;
    setDeployProgress(Math.round((step / totalSteps) * 100));
    await wait(600);

    // Deploy agents
    for (const agentSlug of slugs) {
      const niceName = agentSlug.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      setDeployingName(`Ativando ${niceName}...`);

      try {
        const { data: template } = await supabase
          .from("agent_templates")
          .select("*")
          .eq("slug", agentSlug)
          .eq("is_active", true)
          .single();

        if (template) {
          await supabase.from("agents").insert({
            user_id: user!.id,
            name: template.name,
            description: template.description,
            instructions: template.system_prompt || template.instructions,
            objective: template.description,
            tier: template.tier as any,
            monthly_price: 0,
            status: "active",
            channels: template.default_channels,
            integrations: template.default_integrations,
            actions: template.default_actions,
          });
          setDeployedAgents(prev => [...prev, template.name]);
        } else {
          setDeployedAgents(prev => [...prev, niceName]);
        }
      } catch (err) {
        console.error(`Deploy ${agentSlug}:`, err);
        setDeployedAgents(prev => [...prev, niceName]);
      }

      step++;
      setDeployProgress(Math.round((step / totalSteps) * 100));
      await wait(700);
    }

    setDeployProgress(100);
    setDeployingName("Squad montado com sucesso!");
    await wait(1000);
    queryClient.invalidateQueries({ queryKey: ["my-agents"] });
    setPhase(5);
  };

  const finishOnboarding = () => {
    if (user) {
      localStorage.setItem(`clauthor_onboarding_done_${user.id}`, "true");
    }
    onComplete();
    toast.success("🚀 Sua equipe de IA está pronta!");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background overflow-hidden flex flex-col"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 blur-[200px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 blur-[150px] rounded-full" />
        {Array.from({ length: 12 }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.5} size={3 + Math.random() * 5} />
        ))}
      </div>

      {/* Top progress */}
      <div className="relative z-10 px-6 pt-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-display font-bold text-xs tracking-widest uppercase text-muted-foreground">
                CLAUTHOR SETUP
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-1" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* ═══ PHASE 0: WELCOME ═══ */}
            {phase === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2, damping: 12 }}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto border border-primary/10"
                >
                  <Sparkles className="h-9 w-9 text-primary" />
                </motion.div>

                <div className="space-y-3">
                  <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight min-h-[2.5em]">
                    {greeting.displayed}
                    {!greeting.done && <span className="animate-pulse text-primary">|</span>}
                  </h1>
                  <p className="text-muted-foreground text-sm min-h-[1.5em]">
                    {subtitle.displayed}
                    {greeting.done && !subtitle.done && <span className="animate-pulse text-primary">|</span>}
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: subtitle.done ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Button
                    onClick={() => setPhase(1)}
                    className="glow h-12 px-8 text-sm font-semibold rounded-xl gap-2 group"
                  >
                    Começar Setup
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* ═══ PHASE 1: COMPANY ═══ */}
            {phase === 1 && (
              <motion.div
                key="company"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 text-[10px]">
                    PASSO 1 DE 4
                  </Badge>
                  <h2 className="font-display text-2xl font-bold mb-1">Qual é a sua empresa?</h2>
                  <p className="text-sm text-muted-foreground">Vamos personalizar tudo para o seu negócio</p>
                </div>

                <Input
                  placeholder="Nome da empresa"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-14 text-center text-lg bg-white/[0.03] border-white/[0.08] rounded-xl focus:border-primary/40"
                  autoFocus
                />

                <div className="grid grid-cols-4 gap-2">
                  {industries.map((ind) => (
                    <motion.button
                      key={ind.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIndustry(ind.id)}
                      className={`relative p-3 rounded-xl border transition-all text-center group ${
                        industry === ind.id
                          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ind.gradient} flex items-center justify-center mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity`}>
                        <ind.icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-[11px] font-medium leading-tight">{ind.label}</p>
                      {industry === ind.id && (
                        <motion.div
                          layoutId="industry-check"
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                        >
                          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                <Button
                  onClick={() => setPhase(2)}
                  disabled={!industry}
                  className="w-full h-12 glow rounded-xl gap-2"
                >
                  Continuar <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* ═══ PHASE 2: PAIN POINTS ═══ */}
            {phase === 2 && (
              <motion.div
                key="pains"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 text-[10px]">
                    PASSO 2 DE 4
                  </Badge>
                  <h2 className="font-display text-2xl font-bold mb-1">Onde a IA pode te ajudar?</h2>
                  <p className="text-sm text-muted-foreground">Selecione as áreas que precisa de suporte</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {painPoints.map((pain, i) => (
                    <motion.button
                      key={pain.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => togglePain(pain.id)}
                      className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                        pains.includes(pain.id)
                          ? "border-primary/40 bg-primary/5"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                      }`}
                    >
                      {pains.includes(pain.id) && (
                        <motion.div
                          layoutId={`pain-glow-${pain.id}`}
                          className="absolute inset-0 bg-primary/5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xl">{pain.icon}</span>
                          {pains.includes(pain.id) && (
                            <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="font-medium text-sm">{pain.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{pain.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setPhase(1)} className="border-white/10">
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setPhase(3)}
                    disabled={pains.length === 0}
                    className="flex-1 h-12 glow rounded-xl gap-2"
                  >
                    Continuar <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ═══ PHASE 3: TEAM SIZE ═══ */}
            {phase === 3 && (
              <motion.div
                key="team"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 text-[10px]">
                    PASSO 3 DE 4
                  </Badge>
                  <h2 className="font-display text-2xl font-bold mb-1">Tamanho da equipe</h2>
                  <p className="text-sm text-muted-foreground">Isso define quantos agentes vamos ativar</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {teamSizes.map((size) => (
                    <motion.button
                      key={size.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setTeamSize(size.id)}
                      className={`p-5 rounded-xl border text-center transition-all ${
                        teamSize === size.id
                          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                      }`}
                    >
                      <Users className={`h-6 w-6 mx-auto mb-2 ${teamSize === size.id ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-semibold text-sm">{size.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{size.agents} agentes IA</p>
                    </motion.button>
                  ))}
                </div>

                {/* Preview */}
                {teamSize && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-primary/15 bg-primary/[0.03]"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold">Seu Squad</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {getSelectedAgentSlugs().map(slug => (
                        <Badge key={slug} variant="secondary" className="text-[10px] bg-white/5 border-white/10">
                          <Bot className="h-3 w-3 mr-1" />
                          {slug.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setPhase(2)} className="border-white/10">
                    Voltar
                  </Button>
                  <Button
                    onClick={startDeploy}
                    disabled={!teamSize}
                    className="flex-1 h-12 glow rounded-xl gap-2 group"
                  >
                    <Rocket className="h-4 w-4" />
                    Montar Meu Squad
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ═══ PHASE 4: DEPLOYING ═══ */}
            {phase === 4 && (
              <motion.div
                key="deploying"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-8"
              >
                {/* Animated logo */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center mx-auto"
                >
                  <Cpu className="h-10 w-10 text-primary" />
                </motion.div>

                <div>
                  <h2 className="font-display text-2xl font-bold mb-2">Montando seu Squad</h2>
                  <motion.p
                    key={deployingName}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-muted-foreground font-mono"
                  >
                    {deployingName}
                  </motion.p>
                </div>

                <div className="max-w-sm mx-auto">
                  <Progress value={deployProgress} className="h-2 mb-3" />
                  <p className="text-xs text-muted-foreground">{deployProgress}% completo</p>
                </div>

                {/* Deployed agents list */}
                <div className="flex flex-wrap justify-center gap-2">
                  {deployedAgents.map((name, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, scale: 0, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: i * 0.1, type: "spring", damping: 15 }}
                    >
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5 py-1.5 px-3">
                        <CheckCircle2 className="h-3 w-3" />
                        {name}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ═══ PHASE 5: COMPLETE ═══ */}
            {phase === 5 && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2, damping: 10 }}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center mx-auto border border-emerald-500/20"
                >
                  <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                </motion.div>

                <div>
                  <h2 className="font-display text-3xl font-bold mb-2">Squad Ativo! 🚀</h2>
                  <p className="text-muted-foreground text-sm">
                    {deployedAgents.length} agentes prontos para trabalhar pela{" "}
                    <span className="text-foreground font-medium">{companyName || "sua empresa"}</span>
                  </p>
                </div>

                {/* Agent grid */}
                <div className="grid grid-cols-2 gap-2">
                  {deployedAgents.map((name, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-medium truncate">{name}</p>
                        <p className="text-[10px] text-emerald-400">● Ativo</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    onClick={finishOnboarding}
                    className="glow h-12 px-10 rounded-xl gap-2 group text-sm font-semibold"
                  >
                    Acessar Meu Painel
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="relative z-10 pb-4 text-center">
        <p className="text-[10px] text-muted-foreground/50 tracking-widest uppercase">
          Powered by CLAUTHOR AI
        </p>
      </div>
    </motion.div>
  );
};

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export default PostSignupOnboarding;
