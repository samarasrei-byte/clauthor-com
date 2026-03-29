import { useMemo } from "react";
import { motion } from "framer-motion";
import { Dna, Fingerprint, Activity, Sparkles, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Generate a unique DNA pattern from agent data
const generateDNA = (name: string, executions: number, tier: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  
  const segments = 12;
  const dna: { size: number; hue: number; intensity: number; type: "core" | "skill" | "memory" | "network" }[] = [];
  
  for (let i = 0; i < segments; i++) {
    const seed = Math.abs((hash * (i + 1) * 31) % 1000) / 1000;
    const execFactor = Math.min(1, executions / 100);
    dna.push({
      size: 0.3 + seed * 0.7,
      hue: (hash * (i + 7)) % 360,
      intensity: 0.2 + execFactor * 0.8,
      type: ["core", "skill", "memory", "network"][i % 4] as any,
    });
  }
  return dna;
};

const tierGradients: Record<string, string> = {
  basic: "from-blue-500/20 to-cyan-500/20",
  intermediate: "from-emerald-500/20 to-teal-500/20",
  advanced: "from-purple-500/20 to-pink-500/20",
  enterprise: "from-amber-500/20 to-orange-500/20",
};

const DNAVisualization = ({ name, executions, tier }: { name: string; executions: number; tier: string }) => {
  const dna = useMemo(() => generateDNA(name, executions, tier), [name, executions, tier]);
  const gradient = tierGradients[tier] || tierGradients.basic;

  return (
    <div className="relative w-full aspect-square max-w-[180px] mx-auto">
      {/* Background glow */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient} blur-2xl opacity-40`} />
      
      {/* DNA rings */}
      <svg viewBox="0 0 200 200" className="w-full h-full relative z-10">
        {dna.map((seg, i) => {
          const angle = (i / dna.length) * Math.PI * 2;
          const radius = 40 + seg.size * 35;
          const cx = 100 + Math.cos(angle) * radius * 0.7;
          const cy = 100 + Math.sin(angle) * radius * 0.7;
          const r = 4 + seg.size * 12;

          return (
            <motion.g key={i}>
              {/* Connection line to center */}
              <motion.line
                x1="100" y1="100" x2={cx} y2={cy}
                stroke={`hsla(${seg.hue}, 70%, 60%, ${seg.intensity * 0.3})`}
                strokeWidth={0.5 + seg.intensity}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              />
              {/* Node */}
              <motion.circle
                cx={cx} cy={cy} r={r}
                fill={`hsla(${seg.hue}, 70%, 60%, ${seg.intensity * 0.3})`}
                stroke={`hsla(${seg.hue}, 70%, 60%, ${seg.intensity * 0.7})`}
                strokeWidth={1}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08 + 0.3, type: "spring", damping: 15 }}
              />
              {/* Inner dot */}
              <motion.circle
                cx={cx} cy={cy} r={r * 0.35}
                fill={`hsla(${seg.hue}, 80%, 70%, ${seg.intensity})`}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: i * 0.08 + 0.5 }}
              />
            </motion.g>
          );
        })}
        {/* Center core */}
        <motion.circle
          cx="100" cy="100" r="12"
          fill="hsla(var(--primary), 0.2)"
          stroke="hsla(var(--primary), 0.5)"
          strokeWidth={2}
          animate={{ r: [12, 14, 12] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.circle
          cx="100" cy="100" r="5"
          fill="hsl(var(--primary))"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>

      {/* Evolution level */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <div className="text-[9px] text-muted-foreground font-mono">
          LVL {Math.min(99, Math.floor(Math.log2(executions + 1) * 10))}
        </div>
      </div>
    </div>
  );
};

const AgentDNA = () => {
  const { user } = useAuth();

  const { data: agents = [] } = useQuery({
    queryKey: ["dna-agents", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Demo agents if none exist
  const displayAgents = agents.length > 0 ? agents : [
    { id: "demo1", name: "SDR Outbound", total_executions: 142, tier: "advanced", status: "active", description: "Prospecção automatizada" },
    { id: "demo2", name: "Copywriter IA", total_executions: 87, tier: "intermediate", status: "active", description: "Criação de conteúdo" },
    { id: "demo3", name: "Analista de Dados", total_executions: 23, tier: "basic", status: "active", description: "Análise e relatórios" },
    { id: "demo4", name: "Customer Success", total_executions: 5, tier: "basic", status: "draft", description: "Suporte ao cliente" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Dna className="h-5 w-5 text-primary" />
            Agent DNA — Fingerprint
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Cada agente tem um DNA visual único que evolui conforme aprende e executa tarefas.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
          <Fingerprint className="h-3 w-3 mr-1" /> BIOMETRIA IA
        </Badge>
      </div>

      {/* DNA Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayAgents.map((agent: any, idx: number) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-4 bg-card/50 backdrop-blur border-border/30 hover:border-primary/20 transition-all hover:scale-[1.02] cursor-pointer group">
              <DNAVisualization
                name={agent.name}
                executions={agent.total_executions || 0}
                tier={agent.tier || "basic"}
              />
              <div className="text-center mt-3 space-y-1">
                <h3 className="text-xs font-semibold truncate">{agent.name}</h3>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="text-[8px] border-border/30">
                    {agent.tier || "basic"}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                    <Activity className="h-2.5 w-2.5" />
                    {agent.total_executions || 0} exec
                  </span>
                </div>
                {agent.description && (
                  <p className="text-[9px] text-muted-foreground truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {agent.description}
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <Card className="p-3 bg-card/30 border-border/20">
        <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
          <span className="font-semibold text-foreground">Legenda DNA:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Core (personalidade)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Skills (habilidades)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Memory (experiência)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Network (conexões A2A)
          </span>
          <span className="ml-auto">Tamanho dos nós = intensidade de uso</span>
        </div>
      </Card>
    </div>
  );
};

export default AgentDNA;
