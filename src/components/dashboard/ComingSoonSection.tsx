import { motion } from "framer-motion";
import { Rocket, Network, Target, Mic, Store } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";

const features: Record<string, { title: string; icon: typeof Rocket; desc: string; color: string }> = {
  "mission-control": {
    title: "Mission Control Live",
    icon: Rocket,
    desc: "Command Center que executa tarefas em tempo real e mostra resultados via streaming. Acompanhe cada passo dos seus agentes enquanto trabalham.",
    color: "from-orange-500/20 to-red-500/10",
  },
  "agent-memory": {
    title: "Agent Memory Graph",
    icon: Network,
    desc: "Visualização completa de tudo que cada agente sabe sobre sua empresa. Mapa interativo de conhecimento com conexões entre dados.",
    color: "from-violet-500/20 to-purple-500/10",
  },
  "autonomous-goals": {
    title: "Autonomous Goals",
    icon: Target,
    desc: "Defina OKRs e metas estratégicas. Seus agentes trabalham autonomamente para atingi-los, reportando progresso em tempo real.",
    color: "from-emerald-500/20 to-teal-500/10",
  },
  "voice-first": {
    title: "Voice-First Meeting",
    icon: Mic,
    desc: "Reuniões por voz real com Text-to-Speech dos agentes. Converse naturalmente com sua equipe de IA como em uma call.",
    color: "from-blue-500/20 to-cyan-500/10",
  },
  "marketplace-p2p": {
    title: "Marketplace P2P",
    icon: Store,
    desc: "Empresas publicam agentes treinados para outros usarem. Monetize seus agentes e descubra especialistas criados pela comunidade.",
    color: "from-amber-500/20 to-yellow-500/10",
  },
};

const ComingSoonSection = ({ feature }: { feature: string }) => {
  const f = features[feature];
  if (!f) return null;
  const Icon = f.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-20 px-6"
    >
      <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${f.color} border border-border/20 flex items-center justify-center mb-6`}>
        <Icon className="h-10 w-10 text-foreground/70" strokeWidth={1.5} />
      </div>
      
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
        <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
        <span className="text-xs font-bold text-primary tracking-wider uppercase">Em breve</span>
      </div>

      <h2 className="font-display text-3xl font-bold mb-3">{f.title}</h2>
      <p className="text-muted-foreground text-sm max-w-md leading-relaxed">{f.desc}</p>

      <div className="mt-8 px-6 py-3 rounded-xl bg-card/50 border border-border/30">
        <p className="text-xs text-muted-foreground">
          🔔 Você será notificado quando esta funcionalidade estiver disponível.
        </p>
      </div>
    </motion.div>
  );
};

export default ComingSoonSection;
