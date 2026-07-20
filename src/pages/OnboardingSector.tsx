import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Wand, Plug, CheckCircle2 } from "lucide-react";
import { SECTOR_GROUPS, type AgentPreset } from "@/data/agentPresets";

/**
 * Onboarding por setor:
 *  1) Usuário escolhe o setor (chip único).
 *  2) Mostramos 3 agentes prontos, cada um com sua toolkit de integrações.
 *  3) "Usar este agente" → navega para o Criador de Agentes já pré-preenchido
 *     via query params (name, sector, tone, objective, integrations, channels).
 */
export default function OnboardingSector() {
  const navigate = useNavigate();
  const [sectorId, setSectorId] = useState<string | null>(null);

  const group = useMemo(
    () => SECTOR_GROUPS.find((g) => g.id === sectorId) ?? null,
    [sectorId],
  );

  const handleUsePreset = (preset: AgentPreset) => {
    const params = new URLSearchParams({
      preset: preset.id,
      name: preset.name,
      sector: preset.sector,
      tone: preset.tone,
      objetivo: preset.objective,
      instructions: preset.instructions,
      integrations: preset.integrations.join(","),
      channels: preset.channels.join(","),
      actions: preset.actions.join(","),
    });
    navigate(`/create-agent/classic?${params.toString()}`);
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Badge variant="outline" className="mb-3 gap-1.5 border-primary/30 text-primary">
            <Wand className="h-3 w-3" /> Onboarding · 2 passos
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
            Qual é o setor do seu agente?
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Escolha um setor e receba 3 agentes prontos, com as integrações básicas já selecionadas.
          </p>
        </motion.div>

        {/* Passo 1 — Setor */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {SECTOR_GROUPS.map((g) => {
            const active = sectorId === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setSectorId(g.id)}
                className={`text-left rounded-xl border p-4 transition-all hover:border-primary/50 hover:bg-muted/30 ${
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-card"
                }`}
                aria-pressed={active}
              >
                <div className="text-2xl mb-2">{g.icon}</div>
                <div className="font-medium text-sm">{g.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{g.description}</div>
              </button>
            );
          })}
        </div>

        {/* Passo 2 — Agentes sugeridos */}
        <AnimatePresence mode="wait">
          {group && (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  3 agentes prontos para {group.label}
                </h2>
                <button
                  onClick={() => navigate("/create-agent/classic")}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  Preferir do zero →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {group.presets.map((p) => (
                  <Card
                    key={p.id}
                    className="group flex flex-col hover:border-primary/50 transition-colors"
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="text-3xl mb-3">{p.icon}</div>
                      <div className="font-semibold text-base mb-1">{p.name}</div>
                      <div className="text-xs text-muted-foreground mb-4">
                        {p.tagline}
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                          <Plug className="h-3 w-3" /> Integrações inclusas
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.integrations.map((i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px] font-normal gap-1 py-0.5"
                            >
                              <CheckCircle2 className="h-2.5 w-2.5 text-primary" />
                              {i}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto pt-3">
                        <Button
                          onClick={() => handleUsePreset(p)}
                          className="w-full gap-1.5"
                          size="sm"
                        >
                          Usar este agente
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!group && (
          <p className="text-center text-xs text-muted-foreground">
            Selecione um setor acima para ver os agentes sugeridos.
          </p>
        )}
      </div>
    </div>
  );
}
