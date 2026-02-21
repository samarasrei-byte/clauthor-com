import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2, ShoppingCart, Code, Briefcase, HeartHandshake,
  GraduationCap, Factory, Rocket, ArrowRight, ArrowLeft,
  Sparkles, Users, Target, Shield, X, Zap, Bot,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const industries = [
  { id: "saas", label: "SaaS / Tech", icon: Code, color: "from-cyan-500/20 to-cyan-600/10" },
  { id: "ecommerce", label: "E-commerce", icon: ShoppingCart, color: "from-emerald-500/20 to-emerald-600/10" },
  { id: "services", label: "Serviços", icon: Briefcase, color: "from-amber-500/20 to-amber-600/10" },
  { id: "health", label: "Saúde", icon: HeartHandshake, color: "from-rose-500/20 to-rose-600/10" },
  { id: "education", label: "Educação", icon: GraduationCap, color: "from-violet-500/20 to-violet-600/10" },
  { id: "industry", label: "Indústria", icon: Factory, color: "from-slate-500/20 to-slate-600/10" },
  { id: "startup", label: "Startup", icon: Rocket, color: "from-primary/20 to-primary-glow/10" },
  { id: "agency", label: "Agência", icon: Target, color: "from-pink-500/20 to-pink-600/10" },
];

const painPoints = [
  { id: "sales", label: "Vendas & Prospecção", icon: "🎯", agents: ["sales", "voice_ai", "omnichannel"] },
  { id: "support", label: "Atendimento ao Cliente", icon: "💬", agents: ["omnichannel", "customer_success"] },
  { id: "marketing", label: "Marketing & Conteúdo", icon: "📣", agents: ["content", "marketing_automation", "seo_growth"] },
  { id: "finance", label: "Financeiro & Cobrança", icon: "💰", agents: ["revenue", "ai_cfo"] },
  { id: "operations", label: "Operações & Processos", icon: "⚙️", agents: ["orchestrator", "project_management"] },
  { id: "security", label: "Segurança & Compliance", icon: "🛡️", agents: ["security", "legal"] },
  { id: "hr", label: "RH & People", icon: "👥", agents: ["hr", "training"] },
  { id: "tech", label: "Tecnologia & Dev", icon: "💻", agents: ["coding", "data_analytics"] },
];

const teamSizes = [
  { id: "solo", label: "Só eu", subtitle: "1 agente starter", recommended: 1 },
  { id: "small", label: "2-10 pessoas", subtitle: "Squad de 3 agentes", recommended: 3 },
  { id: "medium", label: "11-50 pessoas", subtitle: "Squad de 5 agentes", recommended: 5 },
  { id: "large", label: "50+ pessoas", subtitle: "Squad de 10 agentes", recommended: 10 },
];

const OnboardingWizard = ({ isOpen, onClose }: OnboardingWizardProps) => {
  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState("");
  const [pains, setPains] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("");
  const navigate = useNavigate();

  if (!isOpen) return null;

  const togglePain = (id: string) => {
    setPains(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const getRecommendedAgents = () => {
    const agentSet = new Set<string>();
    pains.forEach(p => {
      const pain = painPoints.find(pp => pp.id === p);
      pain?.agents.forEach(a => agentSet.add(a));
    });
    return Array.from(agentSet).slice(0, teamSizes.find(t => t.id === teamSize)?.recommended || 3);
  };

  const handleFinish = () => {
    onClose();
    navigate("/library");
  };

  const steps = [
    // Step 0: Industry
    <motion.div key="industry" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
      <div className="text-center">
        <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Passo 1 de 3</Badge>
        <h2 className="font-display text-2xl font-bold mb-2">Qual é o seu setor?</h2>
        <p className="text-muted-foreground text-sm">Isso nos ajuda a recomendar os agentes ideais</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {industries.map(ind => (
          <button
            key={ind.id}
            onClick={() => { setIndustry(ind.id); setStep(1); }}
            className={`p-4 rounded-xl border transition-all duration-300 text-left group hover:scale-[1.02] ${
              industry === ind.id
                ? "border-primary/40 bg-primary/5"
                : "border-white/5 bg-white/[0.02] hover:border-white/10"
            }`}
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${ind.color} flex items-center justify-center mb-3`}>
              <ind.icon className="h-5 w-5 text-foreground" />
            </div>
            <p className="font-medium text-sm">{ind.label}</p>
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 1: Pain Points
    <motion.div key="pains" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
      <div className="text-center">
        <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Passo 2 de 3</Badge>
        <h2 className="font-display text-2xl font-bold mb-2">Onde dói mais?</h2>
        <p className="text-muted-foreground text-sm">Selecione os problemas que quer resolver (múltiplos)</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {painPoints.map(pain => (
          <button
            key={pain.id}
            onClick={() => togglePain(pain.id)}
            className={`p-4 rounded-xl border transition-all duration-300 text-left ${
              pains.includes(pain.id)
                ? "border-primary/40 bg-primary/5 scale-[1.02]"
                : "border-white/5 bg-white/[0.02] hover:border-white/10"
            }`}
          >
            <span className="text-2xl mb-2 block">{pain.icon}</span>
            <p className="font-medium text-sm">{pain.label}</p>
            {pains.includes(pain.id) && (
              <CheckCircle2 className="h-4 w-4 text-primary mt-2" />
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(0)} className="border-white/10">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button onClick={() => setStep(2)} disabled={pains.length === 0} className="flex-1 glow">
          Continuar <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>,

    // Step 2: Team Size + Results
    <motion.div key="team" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
      <div className="text-center">
        <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Passo 3 de 3</Badge>
        <h2 className="font-display text-2xl font-bold mb-2">Tamanho da equipe</h2>
        <p className="text-muted-foreground text-sm">Isso define a quantidade ideal de agentes IA</p>
      </div>
      <div className="space-y-2">
        {teamSizes.map(size => (
          <button
            key={size.id}
            onClick={() => setTeamSize(size.id)}
            className={`w-full p-4 rounded-xl border transition-all duration-300 text-left flex items-center justify-between ${
              teamSize === size.id
                ? "border-primary/40 bg-primary/5"
                : "border-white/5 bg-white/[0.02] hover:border-white/10"
            }`}
          >
            <div>
              <p className="font-medium text-sm">{size.label}</p>
              <p className="text-xs text-muted-foreground">{size.subtitle}</p>
            </div>
            <Badge variant="outline" className="border-primary/20 text-primary text-[10px]">
              {size.recommended} agentes
            </Badge>
          </button>
        ))}
      </div>

      {teamSize && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-display font-semibold text-sm">Seu Squad Ideal</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {getRecommendedAgents().map(agent => (
              <Badge key={agent} className="bg-white/5 text-foreground border-white/10 text-xs">
                <Bot className="h-3 w-3 mr-1" />
                {agent.replace("_", " ")}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" />
            <span>Economia estimada: R$ 15k-45k/mês vs. equipe CLT</span>
          </div>
        </motion.div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="border-white/10">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button onClick={handleFinish} disabled={!teamSize} className="flex-1 glow">
          Ver Meus Agentes <Rocket className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>,
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25 }}
          className="w-full max-w-lg holo-card rounded-2xl p-6 overflow-y-auto max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div className="flex gap-2 mb-6">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-primary" : "bg-white/5"}`} />
            ))}
          </div>

          <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>

          <AnimatePresence mode="wait">
            {steps[step]}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingWizard;
