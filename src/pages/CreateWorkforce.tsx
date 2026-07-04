import { useMemo, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Search, Plus, X, Target, Users, Building2, Globe, Wrench, Plug, BookOpen, Radio, Brain, Shield, Wand2, Rocket, Save, Check, Loader2, ChevronDown } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StepRail from "@/components/workforce/StepRail";
import LivePreview from "@/components/workforce/LivePreview";
import {
  builderReducer, initialBuilderState, AUTONOMY_META, SCALE_META,
  type AutonomyLevel, type WorkforceScale
} from "@/lib/workforce/types";
import {
  WORKFORCE_CATALOG, WORKFORCE_CATALOG_COUNT, DEPARTMENTS,
  SUGGESTED_TOOLS, SUGGESTED_INTEGRATIONS, SUGGESTED_CHANNELS
} from "@/data/workforceCatalog";

const STEPS = [
  { id: 1, label: "Objetivo de negócio", hint: "O que você quer alcançar" },
  { id: 2, label: "Escala", hint: "Agente, equipe, departamento ou organização" },
  { id: 3, label: "Função e cargo", hint: "Escolha entre 201+ especialistas" },
  { id: 4, label: "Autonomia", hint: "Quanto poder o agente tem para agir" },
  { id: 5, label: "Capacidades", hint: "Ferramentas, integrações, canais, memória" },
  { id: 6, label: "Hierarquia", hint: "Quem reporta a quem (IA → IA → Humano)" },
  { id: 7, label: "Governança", hint: "Aprovações, limites, escalonamento" },
  { id: 8, label: "Blueprint final", hint: "Revisar e implantar" },
];

export default function CreateWorkforce() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(builderReducer, initialBuilderState);
  const [reachable, setReachable] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const advance = () => {
    // Auto-fill name when leaving step 2 (Função e cargo) if user didn't type one
    if (state.step === 2 && !state.name.trim() && state.selectedTemplates.length > 0) {
      const first = WORKFORCE_CATALOG.find((t) => t.id === state.selectedTemplates[0]);
      const auto =
        state.scale === "agent" ? (first?.role ?? "Meu Assistente") :
        state.scale === "squad" ? `Equipe de ${first?.role ?? "Trabalho"}` :
        state.scale === "department" ? "Meu Departamento" :
        "Minha Organização IA";
      dispatch({ type: "PATCH", patch: { name: auto } });
    }
    const next = Math.min(state.step + 1, STEPS.length - 1);
    dispatch({ type: "SET_STEP", step: next });
    setReachable((r) => Math.max(r, next));
  };
  const back = () => dispatch({ type: "SET_STEP", step: Math.max(0, state.step - 1) });
  const goto = (n: number) => dispatch({ type: "SET_STEP", step: n });

  const canAdvance = useMemo(() => {
    switch (state.step) {
      case 0: return state.objective.trim().length > 10;
      case 1: return !!state.scale;
      case 2: return state.selectedTemplates.length > 0; // nome é opcional (auto-preenchido)
      case 3: return !!state.autonomy;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      default: return true;
    }
  }, [state]);

  const advanceHint = useMemo(() => {
    if (canAdvance) return null;
    switch (state.step) {
      case 0: return "Descreva seu objetivo com mais detalhes (pelo menos 10 caracteres).";
      case 1: return "Escolha uma escala para continuar.";
      case 2: return "Selecione pelo menos um cargo para continuar.";
      case 3: return "Selecione um nível de autonomia.";
      default: return null;
    }
  }, [canAdvance, state.step]);

  // ─── AI Architect ──────────────────────────────────────────────────────
  const aiArchitect = async () => {
    if (!state.objective.trim()) {
      toast({ title: "Descreva o objetivo primeiro", description: "A IA precisa entender o que você quer alcançar." });
      return;
    }
    setAiThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("workforce-architect", {
        body: { objective: state.objective, scale: state.scale },
      });
      if (error) throw error;
      const bp = data?.blueprint;
      if (!bp) throw new Error("Sem resposta");
      dispatch({
        type: "PATCH",
        patch: {
          name: bp.name ?? state.name,
          scale: bp.scale ?? state.scale,
          selectedTemplates: bp.selectedTemplates?.length ? bp.selectedTemplates : state.selectedTemplates,
          autonomy: bp.autonomy ?? state.autonomy,
          tools: bp.tools ?? state.tools,
          integrations: bp.integrations ?? state.integrations,
          channels: bp.channels ?? state.channels,
          aiAssisted: true,
        },
      });
      setReachable(STEPS.length - 1);
      toast({ title: "Arquitetura proposta", description: "Revise cada etapa e ajuste o que quiser." });
    } catch (e: any) {
      toast({ title: "IA indisponível", description: e?.message || "Continue manualmente.", variant: "destructive" });
    } finally {
      setAiThinking(false);
    }
  };

  // ─── Deploy ────────────────────────────────────────────────────────────
  const deploy = async () => {
    if (!user) { toast({ title: "Entre para implantar" }); return; }
    setDeploying(true);
    try {
      const { error } = await supabase.from("workforce_blueprints").insert({
        user_id: user.id,
        name: state.name || "Sem nome",
        scale: state.scale,
        objective: state.objective,
        status: "deployed",
        blueprint: state as any,
      });
      if (error) throw error;
      toast({ title: "Força de trabalho implantada", description: "Você já pode comandá-la pelo dashboard." });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Erro ao implantar", description: e?.message, variant: "destructive" });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-border/30 px-5 flex items-center justify-between bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-8">
            <ArrowLeft className="h-4 w-4 mr-1" /> Sair
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-rose-600 grid place-items-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="font-display text-sm font-bold leading-tight">Digital Workforce OS</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Crie sua força de trabalho autônoma</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={aiArchitect} disabled={aiThinking} className="h-8 gap-1.5">
            {aiThinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Arquitetar com IA
          </Button>
        </div>
      </header>

      {/* 3-col layout */}
      <div className="flex-1 grid grid-cols-[260px_1fr_320px] min-h-0">
        {/* Step rail */}
        <aside className="border-r border-border/30 p-4 overflow-y-auto bg-card/20">
          <StepRail steps={STEPS} current={state.step} reachable={reachable} onGo={goto} />
          <div className="mt-6 rounded-lg border border-primary/15 bg-primary/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Catálogo</p>
            <p className="font-mono text-xl text-primary">{WORKFORCE_CATALOG_COUNT}+</p>
            <p className="text-[10px] text-muted-foreground">funcionários digitais especializados</p>
          </div>
        </aside>

        {/* Canvas */}
        <main className="overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-10">
            <AnimatePresence mode="wait">
              <motion.section
                key={state.step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Etapa {state.step + 1} de {STEPS.length}
                </p>
                <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  {STEPS[state.step].label}
                </h1>
                <p className="text-muted-foreground mb-8">{STEPS[state.step].hint}</p>

                {state.step === 0 && <StepObjective state={state} dispatch={dispatch} />}
                {state.step === 1 && <StepScale state={state} dispatch={dispatch} />}
                {state.step === 2 && <StepRoles state={state} dispatch={dispatch} />}
                {state.step === 3 && <StepAutonomy state={state} dispatch={dispatch} />}
                {state.step === 4 && <StepCapabilities state={state} dispatch={dispatch} />}
                {state.step === 5 && <StepHierarchy state={state} />}
                {state.step === 6 && <StepGovernance state={state} dispatch={dispatch} />}
                {state.step === 7 && <StepBlueprint state={state} onDeploy={deploy} deploying={deploying} />}
              </motion.section>
            </AnimatePresence>

            {/* Footer nav */}
            <div className="mt-12 flex items-center justify-between">
              <Button variant="ghost" onClick={back} disabled={state.step === 0}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              {state.step < STEPS.length - 1 ? (
                <div className="flex flex-col items-end gap-1.5">
                  {advanceHint && (
                    <p className="text-[11px] text-amber-500/90">{advanceHint}</p>
                  )}
                  <Button onClick={advance} disabled={!canAdvance} className="gap-1.5">
                    Avançar <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </main>

        {/* Live preview */}
        <aside className="border-l border-border/30 p-3 bg-card/10 overflow-hidden">
          <LivePreview state={state} />
        </aside>
      </div>
    </div>
  );
}

// ─── Steps ───────────────────────────────────────────────────────────────

const StepObjective = ({ state, dispatch }: any) => (
  <div className="space-y-4">
    <Textarea
      autoFocus
      value={state.objective}
      onChange={(e) => dispatch({ type: "PATCH", patch: { objective: e.target.value } })}
      placeholder="Ex: Quero dobrar a geração de leads B2B em 90 dias, com qualificação automática e marcação de reuniões direto no calendário dos vendedores."
      className="min-h-[160px] text-base leading-relaxed resize-none"
    />
    <div className="flex flex-wrap gap-2">
      {[
        "Reduzir churn em 30%",
        "Automatizar atendimento N1 no WhatsApp",
        "Montar departamento de marketing inteiro",
        "Operação financeira 24/7",
      ].map((s) => (
        <button
          key={s}
          onClick={() => dispatch({ type: "PATCH", patch: { objective: s } })}
          className="text-xs px-3 py-1.5 rounded-full border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
    <p className="text-xs text-muted-foreground">
      Quanto mais específico, melhor a arquitetura sugerida pela IA.
    </p>
  </div>
);

const StepScale = ({ state, dispatch }: any) => {
  const icons: Record<WorkforceScale, any> = { agent: Target, squad: Users, department: Building2, org: Globe };
  return (
    <div className="grid grid-cols-2 gap-3">
      {(Object.keys(SCALE_META) as WorkforceScale[]).map((k) => {
        const m = SCALE_META[k];
        const Icon = icons[k];
        const selected = state.scale === k;
        return (
          <button
            key={k}
            onClick={() => dispatch({ type: "PATCH", patch: { scale: k } })}
            className={cn(
              "text-left rounded-xl border p-5 transition-all",
              selected ? "border-primary/40 bg-primary/5 shadow-[0_0_32px_hsl(var(--primary)/0.12)]" : "border-border/40 hover:border-border/70 bg-card/30"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn("h-10 w-10 rounded-lg grid place-items-center", selected ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground")}>
                <Icon className="h-5 w-5" />
              </div>
              {selected && <Check className="h-4 w-4 text-primary" />}
            </div>
            <h3 className="font-display font-bold text-lg leading-tight">{m.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
            <p className="text-[10px] font-mono text-muted-foreground/70 mt-3">{m.max}</p>
          </button>
        );
      })}
    </div>
  );
};

const StepRoles = ({ state, dispatch }: any) => {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("all");
  const filtered = WORKFORCE_CATALOG.filter((t) => {
    if (dept !== "all" && t.department !== dept) return false;
    if (q && !(`${t.role} ${t.tagline} ${t.resultTags.join(" ")}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Nome da estrutura</Label>
        <Input
          value={state.name}
          onChange={(e) => dispatch({ type: "PATCH", patch: { name: e.target.value } })}
          placeholder="Ex: Departamento de Vendas Outbound"
          className="mt-1"
        />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por função ou resultado…" className="pl-9" />
        </div>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="h-10 rounded-lg border border-border/60 bg-card/40 px-3 text-sm"
        >
          <option value="all">Todos departamentos</option>
          {DEPARTMENTS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {filtered.length} de {WORKFORCE_CATALOG.length} cargos · {state.selectedTemplates.length} selecionados
      </p>

      <ScrollArea className="h-[480px] rounded-xl border border-border/30 bg-card/20">
        <div className="grid grid-cols-2 gap-2 p-2">
          {filtered.map((t) => {
            const selected = state.selectedTemplates.includes(t.id);
            const deptMeta = DEPARTMENTS.find((d) => d.key === t.department);
            return (
              <button
                key={t.id}
                onClick={() => dispatch({ type: "TOGGLE_TEMPLATE", id: t.id })}
                className={cn(
                  "text-left rounded-lg border p-3 transition-all",
                  selected ? "border-primary/40 bg-primary/5" : "border-border/30 hover:border-border/60 bg-background/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight truncate">{t.role}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{t.tagline}</p>
                  </div>
                  <div className={cn("h-5 w-5 rounded-md grid place-items-center shrink-0 border", selected ? "bg-primary border-primary" : "border-border/60")}>
                    {selected ? <Check className="h-3 w-3 text-primary-foreground" /> : <Plus className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-normal">{deptMeta?.label}</Badge>
                  <span className="text-[9px] text-muted-foreground font-mono">{(t.baselineCostCredits / 1000).toFixed(1)}k cr/mês</span>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

const StepAutonomy = ({ state, dispatch }: any) => (
  <div className="space-y-2">
    {(Object.keys(AUTONOMY_META) as AutonomyLevel[]).map((k) => {
      const m = AUTONOMY_META[k];
      const selected = state.autonomy === k;
      return (
        <button
          key={k}
          onClick={() => dispatch({ type: "PATCH", patch: { autonomy: k } })}
          className={cn(
            "w-full text-left rounded-xl border p-4 transition-all flex items-center gap-4",
            selected ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card/30 hover:border-border/70"
          )}
        >
          <div className={cn("h-12 w-12 rounded-lg bg-gradient-to-br grid place-items-center text-white font-bold", m.color)}>
            {k[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold">{m.label}</p>
            <p className="text-xs text-muted-foreground">{m.desc}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Governança</p>
            <p className="text-[11px] font-medium">{m.approval}</p>
          </div>
          {selected && <Check className="h-4 w-4 text-primary" />}
        </button>
      );
    })}
  </div>
);

const StepCapabilities = ({ state, dispatch }: any) => {
  const Section = ({ k, items }: { k: "tools" | "integrations" | "channels"; items: { id: string; label: string }[] }) => (
    <div className="grid grid-cols-3 gap-2">
      {items.map((it) => {
        const sel = state[k].includes(it.id);
        return (
          <button
            key={it.id}
            onClick={() => dispatch({ type: "TOGGLE_LIST", key: k, value: it.id })}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-xs text-left transition-all",
              sel ? "border-primary/40 bg-primary/5 text-foreground" : "border-border/40 bg-card/30 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium truncate">{it.label}</span>
              {sel && <Check className="h-3 w-3 text-primary shrink-0" />}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <Tabs defaultValue="tools" className="w-full">
      <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="tools" className="text-xs"><Wrench className="h-3 w-3 mr-1" />Ferramentas</TabsTrigger>
        <TabsTrigger value="integrations" className="text-xs"><Plug className="h-3 w-3 mr-1" />Integrações</TabsTrigger>
        <TabsTrigger value="knowledge" className="text-xs"><BookOpen className="h-3 w-3 mr-1" />Conhecimento</TabsTrigger>
        <TabsTrigger value="channels" className="text-xs"><Radio className="h-3 w-3 mr-1" />Canais</TabsTrigger>
        <TabsTrigger value="memory" className="text-xs"><Brain className="h-3 w-3 mr-1" />Memória</TabsTrigger>
      </TabsList>
      <TabsContent value="tools" className="mt-4"><Section k="tools" items={SUGGESTED_TOOLS} /></TabsContent>
      <TabsContent value="integrations" className="mt-4"><Section k="integrations" items={SUGGESTED_INTEGRATIONS} /></TabsContent>
      <TabsContent value="channels" className="mt-4"><Section k="channels" items={SUGGESTED_CHANNELS} /></TabsContent>
      <TabsContent value="knowledge" className="mt-4">
        <div className="rounded-xl border border-dashed border-border/50 p-8 text-center bg-card/20">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Anexe documentos, URLs ou cole texto</p>
          <p className="text-xs text-muted-foreground mt-1">Disponível após a implantação na aba Conhecimento.</p>
        </div>
      </TabsContent>
      <TabsContent value="memory" className="mt-4 space-y-3">
        {(["short", "long", "shared"] as const).map((m) => (
          <label key={m} className="flex items-center justify-between rounded-lg border border-border/40 p-3 bg-card/30 cursor-pointer">
            <div>
              <p className="text-sm font-medium">
                {m === "short" ? "Memória curta (sessão)" : m === "long" ? "Memória longa (vetorial)" : "Memória compartilhada (equipe)"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {m === "short" ? "Lembra do contexto da conversa atual" : m === "long" ? "Aprende e lembra entre conversas" : "Compartilha aprendizado com a equipe"}
              </p>
            </div>
            <input
              type="checkbox"
              checked={state.memory[m]}
              onChange={(e) => dispatch({ type: "PATCH", patch: { memory: { ...state.memory, [m]: e.target.checked } } })}
              className="h-4 w-4 accent-primary"
            />
          </label>
        ))}
      </TabsContent>
    </Tabs>
  );
};

const StepHierarchy = ({ state }: any) => {
  const tpls = state.selectedTemplates.map((id: string) => WORKFORCE_CATALOG.find((t) => t.id === id)).filter(Boolean);
  if (tpls.length === 0) {
    return <p className="text-sm text-muted-foreground">Selecione agentes na etapa 3 para visualizar a hierarquia.</p>;
  }
  // Auto-derived hierarchy: executive > coordinator > others
  const exec = tpls.filter((t: any) => t.recommendedAutonomy === "executive");
  const coord = tpls.filter((t: any) => t.recommendedAutonomy === "coordinator");
  const others = tpls.filter((t: any) => !exec.includes(t) && !coord.includes(t));

  const Node = ({ title, items, accent }: any) => (
    <div className="rounded-xl border border-border/30 p-3 bg-card/30">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
      <div className="space-y-1.5">
        {items.length === 0 ? <p className="text-[11px] text-muted-foreground/60 italic">Vazio</p> : items.map((t: any) => (
          <div key={t.id} className={cn("rounded-md px-2.5 py-1.5 bg-gradient-to-r text-white text-xs font-medium", accent)}>
            {t.role}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-4 flex items-start gap-3">
        <Shield className="h-4 w-4 text-primary mt-0.5" />
        <div>
          <p className="text-sm font-medium">Supervisão IA → IA → Humano</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Agentes coordenadores supervisionam operadores e escalonam para humano quando a confiança cai abaixo de 80%.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Node title="🧠 Executivos" items={exec} accent="from-rose-500 to-red-600" />
        <Node title="🎯 Coordenadores" items={coord} accent="from-amber-500 to-orange-600" />
        <Node title="⚡ Operadores & Especialistas" items={others} accent="from-violet-500 to-purple-600" />
      </div>
      <p className="text-[11px] text-muted-foreground">
        A hierarquia detalhada (drag-and-drop) está disponível após implantação no Org Chart.
      </p>
    </div>
  );
};

const StepGovernance = ({ state, dispatch }: any) => {
  const APPROVALS = [
    { id: "email", label: "Enviar e-mails" },
    { id: "spend", label: "Gastar dinheiro / créditos" },
    { id: "external_contact", label: "Contatar clientes externos" },
    { id: "data_export", label: "Exportar dados sensíveis" },
  ] as const;
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs">Ações que exigem aprovação humana</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {APPROVALS.map((a) => {
            const sel = state.governance.approvalRequired.includes(a.id);
            return (
              <button
                key={a.id}
                onClick={() => {
                  const cur = state.governance.approvalRequired;
                  const next = sel ? cur.filter((v: string) => v !== a.id) : [...cur, a.id];
                  dispatch({ type: "PATCH", patch: { governance: { ...state.governance, approvalRequired: next } } });
                }}
                className={cn("rounded-lg border p-3 text-left transition-all", sel ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card/30")}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{a.label}</span>
                  {sel && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Teto mensal de créditos</Label>
          <span className="font-mono text-sm">{(state.governance.monthlyCreditCap / 1000).toFixed(0)}k</span>
        </div>
        <Slider
          value={[state.governance.monthlyCreditCap]}
          min={10000} max={500000} step={5000}
          onValueChange={(v) => dispatch({ type: "PATCH", patch: { governance: { ...state.governance, monthlyCreditCap: v[0] } } })}
        />
      </div>

      <div>
        <Label className="text-xs">Escalonar para humano (e-mail)</Label>
        <Input
          type="email"
          value={state.governance.escalateToHuman}
          onChange={(e) => dispatch({ type: "PATCH", patch: { governance: { ...state.governance, escalateToHuman: e.target.value } } })}
          placeholder="supervisor@suaempresa.com"
          className="mt-1"
        />
      </div>
    </div>
  );
};

const StepBlueprint = ({ state, onDeploy, deploying }: any) => {
  const tpls = state.selectedTemplates.map((id: string) => WORKFORCE_CATALOG.find((t) => t.id === id)).filter(Boolean);
  const totalCost = tpls.reduce((acc: number, t: any) => acc + t.baselineCostCredits, 0);
  const allKPIs = Array.from(new Set(tpls.flatMap((t: any) => t.defaultKPIs)));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Blueprint</p>
            <h2 className="font-display text-2xl font-bold">{state.name || "Sem nome"}</h2>
          </div>
          <Badge className="bg-primary/15 text-primary border-primary/30">{SCALE_META[state.scale as WorkforceScale].label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{state.objective}</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label="Agentes" value={tpls.length} />
        <Stat label="Integrações" value={state.integrations.length} />
        <Stat label="Canais" value={state.channels.length} />
        <Stat label="Custo/mês" value={`${(totalCost / 1000).toFixed(1)}k cr`} />
      </div>

      <Section title="Estrutura">
        <div className="grid grid-cols-2 gap-2">
          {tpls.map((t: any) => (
            <div key={t.id} className="rounded-lg border border-border/30 p-2.5 bg-card/30">
              <p className="text-sm font-medium">{t.role}</p>
              <p className="text-[11px] text-muted-foreground">{t.tagline}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="KPIs iniciais">
        <div className="flex flex-wrap gap-1.5">
          {allKPIs.map((k: any) => <Badge key={k} variant="outline" className="text-[10px]">{k}</Badge>)}
        </div>
      </Section>

      <Section title="Stack">
        <p className="text-xs text-muted-foreground"><b>Ferramentas:</b> {state.tools.join(", ") || "—"}</p>
        <p className="text-xs text-muted-foreground"><b>Integrações:</b> {state.integrations.join(", ") || "—"}</p>
        <p className="text-xs text-muted-foreground"><b>Canais:</b> {state.channels.join(", ") || "—"}</p>
      </Section>

      <Section title="Governança">
        <p className="text-xs text-muted-foreground">
          Aprovação humana: {state.governance.approvalRequired.join(", ") || "nenhuma"} · Teto: {(state.governance.monthlyCreditCap / 1000).toFixed(0)}k cr/mês
          {state.governance.escalateToHuman ? ` · Escalona para ${state.governance.escalateToHuman}` : ""}
        </p>
      </Section>

      <div className="flex gap-2 pt-2">
        <Button size="lg" className="flex-1 gap-2" onClick={onDeploy} disabled={deploying}>
          {deploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
          Implantar força de trabalho
        </Button>
        <Button size="lg" variant="outline" className="gap-2"><Save className="h-4 w-4" /> Salvar rascunho</Button>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: any) => (
  <div className="rounded-lg border border-border/30 bg-card/30 p-3">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="font-mono text-xl mt-1">{value}</p>
  </div>
);

const Section = ({ title, children }: any) => (
  <div className="rounded-xl border border-border/30 bg-card/20 p-4">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
    {children}
  </div>
);
