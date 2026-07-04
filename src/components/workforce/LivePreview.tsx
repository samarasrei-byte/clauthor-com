import { motion } from "framer-motion";
import { Activity, Boxes, DollarSign, Network, Zap } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Badge } from "@/components/ui/badge";
import type { BuilderState } from "@/lib/workforce/types";
import { AUTONOMY_META, SCALE_META } from "@/lib/workforce/types";
import { WORKFORCE_CATALOG } from "@/data/workforceCatalog";

interface Props { state: BuilderState }

const LivePreview = ({ state }: Props) => {
  const tpls = state.selectedTemplates
    .map((id) => WORKFORCE_CATALOG.find((t) => t.id === id))
    .filter(Boolean) as typeof WORKFORCE_CATALOG;

  const totalCost = tpls.reduce((acc, t) => acc + t.baselineCostCredits, 0);
  const a = AUTONOMY_META[state.autonomy];

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col gap-3 p-4 rounded-2xl border border-border/30 bg-card/30 backdrop-blur"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Live Blueprint</span>
        </div>
        <Badge variant="outline" className="text-[9px] font-mono">{SCALE_META[state.scale].label}</Badge>
      </header>

      <div>
        <p className="text-[10px] text-muted-foreground">Nome</p>
        <p className="font-display text-base font-semibold truncate">
          {state.name || <span className="text-muted-foreground/60">Sem nome…</span>}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric icon={Boxes} label="Agentes" value={tpls.length || 0} />
        <Metric icon={Network} label="Integrações" value={state.integrations.length} />
        <Metric icon={Activity} label="Canais" value={state.channels.length} />
        <Metric icon={DollarSign} label="Custo/mês" value={`${(totalCost / 1000).toFixed(1)}k cr`} />
      </div>

      <div className="rounded-lg border border-border/30 p-2.5 bg-background/40">
        <p className="text-[10px] text-muted-foreground mb-1">Autonomia</p>
        <div className={`text-xs font-medium bg-gradient-to-r ${a.color} bg-clip-text text-transparent`}>{a.label}</div>
        <p className="text-[10px] text-muted-foreground/80 mt-0.5">{a.approval}</p>
      </div>

      <div className="flex-1 min-h-0">
        <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1"><Zap className="h-3 w-3" /> Quadro de funcionários</p>
        <div className="space-y-1.5 overflow-y-auto pr-1 max-h-full">
          {tpls.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/60 italic">Selecione agentes para visualizar…</p>
          ) : (
            tpls.map((t) => (
              <div key={t.id} className="rounded-md border border-border/30 px-2 py-1.5 bg-background/40 text-[11px]">
                <p className="font-medium leading-tight truncate">{t.role}</p>
                <p className="text-muted-foreground/70 text-[10px] truncate">{t.tagline}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Metric = ({ icon: Icon, label, value }: any) => (
  <div className="rounded-md border border-border/30 bg-background/40 p-2">
    <div className="flex items-center gap-1 text-muted-foreground">
      <Icon className="h-3 w-3" />
      <span className="text-[9px] uppercase tracking-wide">{label}</span>
    </div>
    <p className="font-mono text-sm mt-0.5">{value}</p>
  </div>
);

export default LivePreview;
