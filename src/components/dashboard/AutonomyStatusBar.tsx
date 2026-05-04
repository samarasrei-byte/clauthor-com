/**
 * AutonomyStatusBar - Mostra o nível de autonomia de um agente
 * e permite ao usuário ajustar o nível diretamente.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Handshake, Zap, Rocket, ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type AutonomyLevel = "observer" | "assistant" | "executor" | "autonomous";

interface AutonomyStatusBarProps {
  agentName: string;
  level?: AutonomyLevel;
  onChange?: (level: AutonomyLevel) => void;
  readonly?: boolean;
  compact?: boolean;
}

const LEVELS: {
  id: AutonomyLevel;
  label: string;
  shortLabel: string;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
  capabilities: string[];
}[] = [
  {
    id: "observer",
    label: "Observador",
    shortLabel: "OBS",
    icon: Eye,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    description: "Apenas analisa e sugere. Não executa ações.",
    capabilities: ["Analisar dados", "Sugerir ações", "Responder perguntas"],
  },
  {
    id: "assistant",
    label: "Assistente",
    shortLabel: "ASS",
    icon: Handshake,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    description: "Executa tarefas simples com notificação ao usuário.",
    capabilities: ["Criar tarefas", "Gerar relatórios", "Buscar leads"],
  },
  {
    id: "executor",
    label: "Executor",
    shortLabel: "EXE",
    icon: Zap,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    description: "Executa ações de médio impacto automaticamente.",
    capabilities: ["Enviar emails", "Agendar reuniões", "Delegar tarefas", "Atualizar status"],
  },
  {
    id: "autonomous",
    label: "Autônomo",
    shortLabel: "AUT",
    icon: Rocket,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/20",
    description: "Autonomia máxima. Opera proativamente dentro do seu escopo.",
    capabilities: ["Responder leads", "Qualificar clientes", "Resolver suporte", "Gerar relatórios", "Criar tarefas internas"],
  },
];

export default function AutonomyStatusBar({
  agentName,
  level = "assistant",
  onChange,
  readonly = false,
  compact = false,
}: AutonomyStatusBarProps) {
  const [open, setOpen] = useState(false);
  const currentLevel = LEVELS.find(l => l.id === level) || LEVELS[1];
  const currentIndex = LEVELS.findIndex(l => l.id === level);
  const Icon = currentLevel.icon;

  if (compact) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold border",
        currentLevel.bgColor,
        currentLevel.color
      )}>
        <Icon className="h-3 w-3" />
        <span>{currentLevel.label}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Nível de Autonomia</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                <Info className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-xs" side="top">
              <p className="font-semibold mb-2">Níveis de Autonomia</p>
              <div className="space-y-2">
                {LEVELS.map(l => {
                  const LIcon = l.icon;
                  return (
                    <div key={l.id} className="flex items-start gap-2">
                      <LIcon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", l.color)} />
                      <div>
                        <span className="font-medium">{l.label}:</span>
                        <span className="text-muted-foreground ml-1">{l.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border",
          currentLevel.bgColor,
          currentLevel.color
        )}>
          <Icon className="h-3 w-3" />
          {currentLevel.label}
        </div>
      </div>

      {/* Level track */}
      <div className="flex gap-1">
        {LEVELS.map((l, i) => {
          const LIcon = l.icon;
          const isActive = i <= currentIndex;
          const isCurrent = l.id === level;
          return (
            <button
              key={l.id}
              onClick={() => !readonly && onChange?.(l.id)}
              disabled={readonly}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border transition-all text-center",
                isCurrent
                  ? cn(l.bgColor, l.color, "ring-1 ring-current/30")
                  : isActive
                    ? "bg-border/20 border-border/30 text-muted-foreground"
                    : "bg-transparent border-border/10 text-muted-foreground/30",
                !readonly && "cursor-pointer hover:opacity-80"
              )}
            >
              <LIcon className="h-3.5 w-3.5" />
              <span className="text-[9px] font-semibold leading-none">{l.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Current level capabilities */}
      <div className="flex flex-wrap gap-1">
        {currentLevel.capabilities.map(cap => (
          <span key={cap} className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-md border",
            currentLevel.bgColor,
            currentLevel.color
          )}>
            {cap}
          </span>
        ))}
      </div>
    </div>
  );
}
