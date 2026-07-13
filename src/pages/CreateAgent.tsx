import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Target, FileText, Zap, Globe, Database, Shield, Clock, Plug, ChevronRight, CheckCircle, ArrowRight, Loader2, Rocket, Wand2, FolderPlus, FolderOpen, MessageSquareText } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ThorConsultantPanel from "@/components/thor/ThorConsultantPanel";

const sectorOptions = ["Atendimento", "Vendas", "Marketing", "Financeiro", "RH", "Jurídico", "TI", "Outro"];
const toneOptions = ["Formal", "Amigável", "Técnico", "Casual", "Corporativo"];
const actionOptions = [
  "Enviar mensagens", "Buscar dados", "Criar registros", "Atualizar CRM",
  "Gerar documentos", "Enviar e-mails", "Agendar tarefas", "Chamar APIs",
  "Processar pagamentos", "Escalar para humano", "Analisar sentimento", "Gerar relatórios"
];
const channelOptions = ["WhatsApp", "Instagram", "Facebook", "Site (Widget)", "E-mail", "Telegram", "SMS", "API"];
const integrationOptions = ["Gmail", "WhatsApp API", "Google Sheets", "Notion", "HubSpot", "Pipedrive", "Trello", "API Customizada"];
const auditLevels = ["Básico", "Detalhado", "Completo"];
const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// Template suggestions based on keywords
const AGENT_TEMPLATES = [
  { name: "Atendimento WhatsApp", sector: "Atendimento", tone: "Amigável", keywords: ["whatsapp", "atendimento", "suporte", "cliente", "chat"], icon: "💬", description: "Agente de atendimento automatizado via WhatsApp" },
  { name: "SDR de Vendas", sector: "Vendas", tone: "Corporativo", keywords: ["venda", "lead", "prospecção", "sdr", "comercial", "pipeline"], icon: "🎯", description: "Qualificação e prospecção de leads automatizada" },
  { name: "Gestor de Marketing", sector: "Marketing", tone: "Casual", keywords: ["marketing", "campanha", "tráfego", "conteúdo", "social", "ads"], icon: "📣", description: "Automação de campanhas e análise de métricas" },
  { name: "Assistente Financeiro", sector: "Financeiro", tone: "Formal", keywords: ["financeiro", "contábil", "dre", "fluxo de caixa", "pagamento", "cobrança"], icon: "💰", description: "Gestão financeira e análise de relatórios" },
  { name: "Recrutador IA", sector: "RH", tone: "Amigável", keywords: ["rh", "recrutamento", "vaga", "currículo", "contratação", "people"], icon: "👥", description: "Triagem de candidatos e processos seletivos" },
  { name: "Agente Jurídico", sector: "Jurídico", tone: "Formal", keywords: ["jurídico", "contrato", "compliance", "legal", "regulatório"], icon: "⚖️", description: "Análise de contratos e conformidade legal" },
  { name: "Suporte Técnico", sector: "TI", tone: "Técnico", keywords: ["ti", "técnico", "bug", "sistema", "software", "dev", "código"], icon: "🛠️", description: "Resolução de problemas técnicos e troubleshooting" },
  { name: "Agendador Inteligente", sector: "Atendimento", tone: "Amigável", keywords: ["agenda", "agendamento", "consulta", "horário", "clínica", "médico"], icon: "📅", description: "Automação de agendamentos e confirmações" },
  // Novos templates
  { name: "Gestor de Logística", sector: "Outro", tone: "Técnico", keywords: ["logística", "frete", "entrega", "estoque", "armazém", "frota", "transporte", "supply chain", "expedição"], icon: "🚛", description: "Otimização de rotas, rastreio e gestão de estoque" },
  { name: "Tutor Educacional", sector: "Outro", tone: "Amigável", keywords: ["educação", "aluno", "curso", "aula", "escola", "universidade", "ensino", "professor", "treinamento", "ead"], icon: "🎓", description: "Suporte pedagógico, dúvidas e trilhas de aprendizado" },
  { name: "Assistente de Saúde", sector: "Outro", tone: "Formal", keywords: ["saúde", "paciente", "hospital", "médico", "exame", "prontuário", "farmácia", "clínica", "nutrição", "bem-estar"], icon: "🏥", description: "Triagem de sintomas, agendamentos e acompanhamento" },
  { name: "E-commerce Manager", sector: "Vendas", tone: "Casual", keywords: ["e-commerce", "ecommerce", "loja", "produto", "carrinho", "checkout", "shopify", "marketplace", "pedido", "catálogo"], icon: "🛒", description: "Gestão de pedidos, catálogo e atendimento de loja online" },
  { name: "Analista de Dados", sector: "TI", tone: "Técnico", keywords: ["dados", "análise", "dashboard", "métricas", "kpi", "bi", "relatório", "excel", "planilha", "indicador"], icon: "📊", description: "Análise de dados, dashboards e insights automatizados" },
  { name: "Gestor Imobiliário", sector: "Vendas", tone: "Corporativo", keywords: ["imobiliário", "imóvel", "aluguel", "corretor", "condomínio", "locação", "propriedade"], icon: "🏠", description: "Gestão de leads imobiliários e agendamento de visitas" },
];

function matchTemplates(text: string): typeof AGENT_TEMPLATES {
  if (!text.trim()) return [];
  const lower = text.toLowerCase();
  return AGENT_TEMPLATES
    .map(t => ({ ...t, score: t.keywords.filter(k => lower.includes(k)).length }))
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

const CreateAgentPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Bot, label: t("create_agent.step_name", { defaultValue: "Nome & Objetivo" }) },
    { icon: FileText, label: t("create_agent.step_instructions", { defaultValue: "Instruções" }) },
    { icon: Zap, label: t("create_agent.step_actions", { defaultValue: "Ações" }) },
    { icon: Globe, label: t("create_agent.step_channels", { defaultValue: "Canais" }) },
    { icon: Database, label: t("create_agent.step_knowledge", { defaultValue: "Conhecimento" }) },
    { icon: Plug, label: t("create_agent.step_integrations", { defaultValue: "Integrações" }) },
    { icon: Shield, label: t("create_agent.step_limits", { defaultValue: "Limites" }) },
    { icon: Clock, label: t("create_agent.step_schedule", { defaultValue: "Agendamento" }) },
  ];
  const [saving, setSaving] = useState(false);
  const [showTemplateSuggestions, setShowTemplateSuggestions] = useState(false);

  // NEW: intake flow
  const [mode, setMode] = useState<null | "express" | "guided">(null);
  const [projectMode, setProjectMode] = useState<"existing" | "new" | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [expressPrompt, setExpressPrompt] = useState("");

  // Fetch user projects (derived from existing agents' description prefix "Projeto: X ·")
  const { data: existingProjects = [] } = useQuery({
    queryKey: ["user-projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("description").eq("user_id", user!.id);
      const projects = new Set<string>();
      (data || []).forEach((r: any) => {
        const m = /Projeto:\s*([^·\.]+)/i.exec(r.description || "");
        if (m) projects.add(m[1].trim());
      });
      return Array.from(projects);
    },
  });

  // Form state
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");

  // Pre-fill from query params (from Concierge fallback)
  useEffect(() => {
    const prefilledObjective = searchParams.get("objetivo");
    if (prefilledObjective) {
      setObjective(prefilledObjective);
      setShowTemplateSuggestions(true);
    }
  }, [searchParams]);
  const [sector, setSector] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tone, setTone] = useState("");
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [execLimit, setExecLimit] = useState("500");
  const [timeout, setTimeoutVal] = useState("30");
  const [auditLevel, setAuditLevel] = useState("Detalhado");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("22:00");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Seg", "Ter", "Qua", "Qui", "Sex"]);
  const [is24h, setIs24h] = useState(false);

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleCreate = async () => {
    if (!user || !name.trim()) {
      toast.error(t("create_agent.name_required", { defaultValue: "Nome do agente é obrigatório" }));
      return;
    }
    setSaving(true);
    try {
      // Build config with steps 6-7 data
      const agentConfig = {
        exec_limit: parseInt(execLimit) || 500,
        timeout_seconds: parseInt(timeout) || 30,
        audit_level: auditLevel,
        schedule: is24h
          ? { mode: "24/7" }
          : { mode: "scheduled", start: startTime, end: endTime, days: selectedDays },
      };

      const kbEntries: any[] = [];
      if (knowledgeBase) kbEntries.push({ type: "text", content: knowledgeBase });
      kbEntries.push({ type: "config", content: agentConfig });

      const { error } = await supabase.from("agents").insert({
        user_id: user.id,
        name: name.trim(),
        objective: objective || null,
        description: `${projectName ? `Projeto: ${projectName} · ` : ""}${sector ? `Setor: ${sector}. ` : ""}${tone ? `Tom: ${tone}.` : ""}`,
        instructions: instructions || null,
        channels: selectedChannels.length > 0 ? selectedChannels : null,
        integrations: selectedIntegrations.length > 0 ? selectedIntegrations : null,
        actions: selectedActions.length > 0 ? selectedActions : null,
        knowledge_base: kbEntries,
        status: "active",
        tier: "basic",
        monthly_price: 0,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["my-agents"] });
      toast.success(t("create_agent.created_success", { defaultValue: "Agente criado com sucesso!" }));
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || t("create_agent.create_error", { defaultValue: "Erro ao criar agente" }));
    } finally {
      setSaving(false);
    }
  };

  const handleExpressCreate = async () => {
    if (!user || !expressPrompt.trim()) {
      toast.error("Descreva seu agente em poucas linhas.");
      return;
    }
    setSaving(true);
    try {
      const matches = matchTemplates(expressPrompt);
      const best = matches[0];
      const derivedName = best?.name || expressPrompt.split(/[\.\n]/)[0].slice(0, 60) || "Novo Agente";
      const { error } = await supabase.from("agents").insert({
        user_id: user.id,
        name: derivedName,
        objective: expressPrompt.trim(),
        description: `${projectName ? `Projeto: ${projectName} · ` : ""}${best ? `Setor: ${best.sector}. Tom: ${best.tone}.` : "Criado via Express."}`,
        instructions: `Você é ${derivedName}. Missão: ${expressPrompt.trim()}. Aja de forma proativa, clara e alinhada ao objetivo.`,
        status: "active",
        tier: "basic",
        monthly_price: 0,
        knowledge_base: [{ type: "config", content: { exec_limit: 500, timeout_seconds: 30, audit_level: "Detalhado", schedule: { mode: "24/7" } } }],
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["my-agents"] });
      toast.success(`Agente "${derivedName}" criado!`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar agente");
    } finally {
      setSaving(false);
    }
  };

  // INTAKE: pick project scope + mode
  if (!mode) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Novo agente
          </div>
          <h1 className="font-display text-4xl font-bold">Vamos criar seu agente</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Escolha o projeto e o caminho que combina com você. Leva menos de 60 segundos no Express.</p>
        </motion.div>

        {/* Project scope */}
        <Card className="glass border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" /> Para qual projeto?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => setProjectMode("existing")}
                disabled={existingProjects.length === 0}
                className={`p-4 rounded-xl border text-left transition-all ${projectMode === "existing" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <FolderOpen className="h-5 w-5 text-primary mb-2" />
                <p className="font-semibold text-sm">Projeto atual</p>
                <p className="text-xs text-muted-foreground">{existingProjects.length > 0 ? `${existingProjects.length} disponíveis` : "Nenhum ainda"}</p>
              </button>
              <button
                onClick={() => { setProjectMode("new"); setProjectName(""); }}
                className={`p-4 rounded-xl border text-left transition-all ${projectMode === "new" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
              >
                <FolderPlus className="h-5 w-5 text-primary mb-2" />
                <p className="font-semibold text-sm">Novo projeto</p>
                <p className="text-xs text-muted-foreground">Começar do zero</p>
              </button>
            </div>

            {projectMode === "existing" && (
              <div className="flex flex-wrap gap-2 pt-1">
                {existingProjects.map(p => (
                  <Badge key={p} variant="secondary" onClick={() => setProjectName(p)} className={`cursor-pointer px-3 py-1.5 ${projectName === p ? "bg-primary/20 text-primary" : "hover:bg-primary/10"}`}>{p}</Badge>
                ))}
              </div>
            )}
            {projectMode === "new" && (
              <Input placeholder="Nome do projeto (ex: Lançamento Q1)" value={projectName} onChange={e => setProjectName(e.target.value)} className="glass" />
            )}
          </CardContent>
        </Card>

        {/* Path selector */}
        <div className="grid sm:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ y: -3 }}
            onClick={() => setMode("express")}
            className="group text-left p-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:shadow-[0_0_40px_hsl(var(--primary)/0.2)] transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center"><Rocket className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="font-bold">Express</p>
                <p className="text-[11px] text-muted-foreground">~60 segundos</p>
              </div>
              <Badge className="ml-auto bg-primary/20 text-primary border-0 text-[10px]">Recomendado</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Descreva o agente em linguagem natural. Nós preenchemos o resto.</p>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">Começar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></div>
          </motion.button>

          <motion.button
            whileHover={{ y: -3 }}
            onClick={() => setMode("guided")}
            className="group text-left p-6 rounded-2xl border border-border hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><Wand2 className="h-5 w-5" /></div>
              <div>
                <p className="font-bold">Guiado</p>
                <p className="text-[11px] text-muted-foreground">8 passos, controle total</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Configure canais, ações, integrações, limites e agenda em detalhe.</p>
            <div className="flex items-center gap-2 text-sm font-medium">Configurar passo a passo <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></div>
          </motion.button>
        </div>
      </div>
    );
  }

  // EXPRESS mode: single natural-language input
  if (mode === "express") {
    const matches = matchTemplates(expressPrompt);
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <button onClick={() => setMode(null)} className="text-xs text-muted-foreground hover:text-foreground">← Voltar</button>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            <Rocket className="h-3 w-3" /> Express{projectName && ` · ${projectName}`}
          </div>
          <h1 className="font-display text-3xl font-bold">Descreva seu agente</h1>
          <p className="text-muted-foreground">Uma frase ou um parágrafo. Quanto mais claro o objetivo, melhor.</p>
        </div>

        <Card className="glass border-border">
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <MessageSquareText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                autoFocus
                value={expressPrompt}
                onChange={e => setExpressPrompt(e.target.value)}
                placeholder="Ex: Quero um SDR que qualifique leads de LinkedIn e agende reuniões no meu Google Calendar, com tom corporativo."
                className="glass min-h-[160px] pl-10 pt-3 text-base"
              />
            </div>

            {matches.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Template detectado:</p>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
                  <span className="text-2xl">{matches[0].icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{matches[0].name}</p>
                    <p className="text-xs text-muted-foreground">{matches[0].description}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setMode("guided")} className="flex-1">Ajustar detalhes</Button>
              <Button onClick={handleExpressCreate} disabled={saving || !expressPrompt.trim()} className="flex-1 glow">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                Criar agente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">{t("create_agent.title", { defaultValue: "Criar Novo Agente" })}</h1>
          <p className="text-muted-foreground">{projectName ? `Projeto: ${projectName}` : t("create_agent.subtitle", { defaultValue: "Configure seu funcionário digital passo a passo." })}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMode(null)}>← Trocar caminho</Button>
      </motion.div>

      {/* Steps indicator */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <button
            key={step.label}
            onClick={() => setCurrentStep(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              i === currentStep
                ? "bg-primary/10 text-primary neon-border"
                : i < currentStep
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {i < currentStep ? (
              <CheckCircle className="h-4 w-4 text-primary" />
            ) : (
              <step.icon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      {/* Template suggestions wizard */}
      <AnimatePresence>
        {showTemplateSuggestions && objective.trim() && currentStep === 0 && matchTemplates(objective).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="glass border-primary/20 mb-4 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t("create_agent.templates_title", { defaultValue: "Templates sugeridos para você" })}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{t("create_agent.templates_desc", { defaultValue: "Baseado na sua descrição, esses modelos podem acelerar a criação:" })}</p>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {matchTemplates(objective).map((tpl, idx) => (
                  <motion.button
                    key={tpl.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    onClick={() => {
                      setName(tpl.name);
                      setSector(tpl.sector);
                      setTone(tpl.tone);
                      setShowTemplateSuggestions(false);
                      toast.success(`Template "${tpl.name}" aplicado!`);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                  >
                    <span className="text-2xl">{tpl.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground">{tpl.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </motion.button>
                ))}
                <button
                  onClick={() => setShowTemplateSuggestions(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                >
                  {t("create_agent.prefer_scratch", { defaultValue: "Prefiro criar do zero →" })}
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              {(() => { const StepIcon = steps[currentStep].icon; return <StepIcon className="h-5 w-5 text-primary" />; })()}
              {steps[currentStep].label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 0 && (
              <>
                <div className="space-y-2">
                  <Label>{t("create_agent.agent_name", { defaultValue: "Nome do Agente *" })}</Label>
                  <Input placeholder={t("create_agent.agent_name_placeholder", { defaultValue: "Ex: Atendimento WhatsApp Premium" })} value={name} onChange={e => setName(e.target.value)} className="glass" />
                </div>
                <div className="space-y-2">
                  <Label>{t("create_agent.main_objective", { defaultValue: "Objetivo Principal" })}</Label>
                  <Textarea
                    placeholder={t("create_agent.objective_placeholder", { defaultValue: "Descreva o que este agente deve fazer..." })}
                    value={objective}
                    onChange={e => {
                      setObjective(e.target.value);
                      if (e.target.value.trim().length > 5) setShowTemplateSuggestions(true);
                    }}
                    className="glass min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("create_agent.sector", { defaultValue: "Setor" })}</Label>
                  <div className="flex flex-wrap gap-2">
                    {sectorOptions.map(s => (
                      <Badge key={s} variant="secondary" onClick={() => setSector(s)} className={`cursor-pointer transition-colors px-3 py-1 ${sector === s ? "bg-primary/20 text-primary" : "hover:bg-primary/10"}`}>{s}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label>{t("create_agent.instructions_rules", { defaultValue: "Instruções e Regras" })}</Label>
                  <Textarea placeholder={t("create_agent.instructions_placeholder", { defaultValue: "Defina as regras de comportamento do agente..." })} value={instructions} onChange={e => setInstructions(e.target.value)} className="glass min-h-[200px]" />
                </div>
                <div className="space-y-2">
                  <Label>{t("create_agent.tone", { defaultValue: "Tom de Voz" })}</Label>
                  <div className="flex flex-wrap gap-2">
                    {toneOptions.map(t => (
                      <Badge key={t} variant="secondary" onClick={() => setTone(t)} className={`cursor-pointer transition-colors px-3 py-1 ${tone === t ? "bg-primary/20 text-primary" : "hover:bg-primary/10"}`}>{t}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("create_agent.actions_desc", { defaultValue: "Selecione as ações que o agente pode executar:" })}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {actionOptions.map(action => (
                    <div key={action} onClick={() => toggleItem(action, selectedActions, setSelectedActions)} className={`flex items-center gap-3 p-3 rounded-lg glass cursor-pointer transition-all ${selectedActions.includes(action) ? "neon-border bg-primary/5" : "hover:neon-border"}`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedActions.includes(action) ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                        {selectedActions.includes(action) && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className="text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {channelOptions.map(ch => (
                  <div key={ch} onClick={() => toggleItem(ch, selectedChannels, setSelectedChannels)} className={`flex items-center gap-3 p-4 rounded-lg glass cursor-pointer transition-all ${selectedChannels.includes(ch) ? "neon-border bg-primary/5" : "hover:neon-border"}`}>
                    <Globe className={`h-5 w-5 ${selectedChannels.includes(ch) ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">{ch}</span>
                    {selectedChannels.includes(ch) && <CheckCircle className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                ))}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("create_agent.knowledge_base", { defaultValue: "Base de Conhecimento" })}</Label>
                  <Textarea placeholder={t("create_agent.knowledge_placeholder", { defaultValue: "Cole textos, FAQs, documentos ou links que o agente deve usar como referência." })} value={knowledgeBase} onChange={e => setKnowledgeBase(e.target.value)} className="glass min-h-[150px]" />
                </div>
                <div
                  className="glass rounded-lg p-4 neon-border text-center cursor-pointer hover:bg-accent/30 transition-colors opacity-60"
                  onClick={() => toast.info("Upload de arquivos estará disponível em breve!")}
                >
                  <Database className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Arraste arquivos ou clique para upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, CSV - Em breve</p>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {integrationOptions.map(ig => (
                  <div key={ig} onClick={() => toggleItem(ig, selectedIntegrations, setSelectedIntegrations)} className={`flex items-center justify-between p-4 rounded-lg glass cursor-pointer transition-all ${selectedIntegrations.includes(ig) ? "neon-border bg-primary/5" : "hover:neon-border"}`}>
                    <div className="flex items-center gap-3">
                      <Plug className={`h-5 w-5 ${selectedIntegrations.includes(ig) ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium">{ig}</span>
                    </div>
                    <Badge variant="secondary" className={`text-xs ${selectedIntegrations.includes(ig) ? "bg-primary/20 text-primary" : ""}`}>
                      {selectedIntegrations.includes(ig) ? t("integrations.status_connected", { defaultValue: "Conectado" }) : t("integrations.connect", { defaultValue: "Conectar" })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("create_agent.exec_limit", { defaultValue: "Limite de Execuções/Dia" })}</Label>
                  <Input type="number" value={execLimit} onChange={e => setExecLimit(e.target.value)} className="glass" />
                </div>
                <div className="space-y-2">
                  <Label>{t("create_agent.timeout", { defaultValue: "Timeout por Ação (segundos)" })}</Label>
                  <Input type="number" value={timeout} onChange={e => setTimeoutVal(e.target.value)} className="glass" />
                </div>
                <div className="space-y-2">
                  <Label>{t("create_agent.audit_level", { defaultValue: "Nível de Auditoria" })}</Label>
                  <div className="flex gap-2">
                    {auditLevels.map(l => (
                      <Badge key={l} variant="secondary" onClick={() => setAuditLevel(l)} className={`cursor-pointer transition-colors px-3 py-1 ${auditLevel === l ? "bg-primary/20 text-primary" : "hover:bg-primary/10"}`}>{l}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg glass cursor-pointer" onClick={() => setIs24h(!is24h)}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${is24h ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                    {is24h && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm">{t("create_agent.always_on", { defaultValue: "Ativar execução 24/7 (sem limites de horário)" })}</span>
                </div>
                {!is24h && (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("create_agent.start_time", { defaultValue: "Horário de Início" })}</Label>
                        <Input type="time" className="glass" value={startTime} onChange={e => setStartTime(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("create_agent.end_time", { defaultValue: "Horário de Fim" })}</Label>
                        <Input type="time" className="glass" value={endTime} onChange={e => setEndTime(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("create_agent.active_days", { defaultValue: "Dias da Semana" })}</Label>
                      <div className="flex gap-2">
                        {weekDays.map(d => (
                          <Badge key={d} variant="secondary" onClick={() => toggleItem(d, selectedDays, setSelectedDays)} className={`cursor-pointer transition-colors px-3 py-1 ${selectedDays.includes(d) ? "bg-primary/20 text-primary" : "hover:bg-primary/10"}`}>{d}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>
          {t("create_agent.previous", { defaultValue: "Voltar" })}
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep(currentStep + 1)} className="glow">
            {t("create_agent.next", { defaultValue: "Próximo" })} <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={saving || !name.trim()} className="glow">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("create_agent.create_button", { defaultValue: "Criar e Ativar Agente" })} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CreateAgentPage;
