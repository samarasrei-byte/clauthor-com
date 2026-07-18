import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Scissors, Inbox, Users, Bot, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";

type CTA = {
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
};

/**
 * Mapa: rota atual → próxima ação primária recomendada.
 * Regra UX: toda página tem UMA única ação clara em destaque.
 */
const CTA_MAP: Record<string, CTA> = {
  "/dashboard/inbox": {
    label: "Ver Video Hub",
    hint: "Aprovou? Gere o próximo",
    icon: Sparkles,
    to: "/video",
  },
  "/video": {
    label: "Cortar vídeo longo",
    hint: "Reels prontos em 1 clique",
    icon: Scissors,
    to: "/video?tab=clipper",
  },
  "/video-studio": {
    label: "Auto-Clipper",
    hint: "Corte reels automáticos",
    icon: Scissors,
    to: "/video?tab=clipper",
  },
  "/video-clipper": {
    label: "Gerar novo vídeo",
    hint: "Veo 3 · texto → vídeo",
    icon: Sparkles,
    to: "/video?tab=studio",
  },
  "/dashboard/traces": {
    label: "Ir para Inbox",
    hint: "Aprove tarefas pendentes",
    icon: Inbox,
    to: "/dashboard/inbox",
  },
  "/dashboard/ativacao": {
    label: "Ver meu time",
    hint: "Agentes prontos pra rodar",
    icon: Users,
    to: "/dashboard?tab=agents",
  },
};

/** Fallbacks por prefixo de rota (opcional). */
function resolveCTA(pathname: string): CTA | null {
  if (CTA_MAP[pathname]) return CTA_MAP[pathname];
  if (pathname.startsWith("/app/agente/")) {
    return { label: "Ver todos os agentes", icon: Bot, to: "/dashboard?tab=agents", hint: "Comparar performance" };
  }
  if (pathname.startsWith("/hunter")) {
    return { label: "THOR Overview", icon: Radar, to: "/dashboard?tab=thor-center", hint: "Visão geral do time" };
  }
  return null;
}

/**
 * Botão flutuante de ação primária, mostra a próxima ação recomendada
 * conforme a rota atual. Discreto (canto inferior direito) mas sempre visível.
 */
export default function PrimaryCTA() {
  const location = useLocation();
  const navigate = useNavigate();

  const cta = useMemo(() => resolveCTA(location.pathname), [location.pathname]);
  if (!cta) return null;

  const Icon = cta.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.18 }}
        className="fixed bottom-4 right-4 z-40 hidden md:block"
      >
        <Button
          onClick={() => navigate(cta.to)}
          size="sm"
          className="h-10 gap-2 pl-3 pr-4 rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-foreground/15">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[11px] opacity-80">{cta.hint ?? "Próximo passo"}</span>
            <span className="text-xs font-medium">{cta.label}</span>
          </span>
          <ArrowRight className="h-3.5 w-3.5 opacity-80" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
