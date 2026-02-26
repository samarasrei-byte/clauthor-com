import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Target, FileText, Zap, Globe, Database,
  Shield, Clock, Plug, ChevronRight, CheckCircle, ArrowRight, Loader2, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const steps = [
  { icon: Bot, label: "Nome & Objetivo" },
  { icon: FileText, label: "Instruções" },
  { icon: Zap, label: "Ações" },
  { icon: Globe, label: "Canais" },
  { icon: Database, label: "Conhecimento" },
  { icon: Plug, label: "Integrações" },
  { icon: Shield, label: "Limites" },
  { icon: Clock, label: "Agendamento" },
];

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showTemplateSuggestions, setShowTemplateSuggestions] = useState(false);

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
      toast.error("Nome do agente é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("agents").insert({
        user_id: user.id,
        name: name.trim(),
        objective: objective || null,
        description: `${sector ? `Setor: ${sector}. ` : ""}${tone ? `Tom: ${tone}.` : ""}`,
        instructions: instructions || null,
        channels: selectedChannels.length > 0 ? selectedChannels : null,
        integrations: selectedIntegrations.length > 0 ? selectedIntegrations : null,
        actions: selectedActions.length > 0 ? selectedActions : null,
        knowledge_base: knowledgeBase ? [{ type: "text", content: knowledgeBase }] : null,
        status: "active",
        tier: "basic",
        monthly_price: 0,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["my-agents"] });
      toast.success("Agente criado com sucesso!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar agente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-1">Criar Novo Agente</h1>
        <p className="text-muted-foreground">Configure seu funcionário digital passo a passo.</p>
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
                  Templates sugeridos para você
                </CardTitle>
                <p className="text-xs text-muted-foreground">Baseado na sua descrição, esses modelos podem acelerar a criação:</p>
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
                  Prefiro criar do zero →
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
                  <Label>Nome do Agente *</Label>
                  <Input placeholder="Ex: Atendimento WhatsApp Premium" value={name} onChange={e => setName(e.target.value)} className="glass" />
                </div>
                <div className="space-y-2">
                  <Label>Objetivo Principal</Label>
                  <Textarea
                    placeholder="Descreva o que este agente deve fazer..."
                    value={objective}
                    onChange={e => {
                      setObjective(e.target.value);
                      if (e.target.value.trim().length > 5) setShowTemplateSuggestions(true);
                    }}
                    className="glass min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Setor</Label>
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
                  <Label>Instruções e Regras</Label>
                  <Textarea placeholder="Defina as regras de comportamento do agente..." value={instructions} onChange={e => setInstructions(e.target.value)} className="glass min-h-[200px]" />
                </div>
                <div className="space-y-2">
                  <Label>Tom de Voz</Label>
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
                <p className="text-sm text-muted-foreground">Selecione as ações que o agente pode executar:</p>
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
                  <Label>Base de Conhecimento</Label>
                  <Textarea placeholder="Cole textos, FAQs, documentos ou links que o agente deve usar como referência." value={knowledgeBase} onChange={e => setKnowledgeBase(e.target.value)} className="glass min-h-[150px]" />
                </div>
                <div className="glass rounded-lg p-4 neon-border text-center cursor-pointer hover:bg-accent/30 transition-colors">
                  <Database className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Arraste arquivos ou clique para upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, CSV (até 50MB)</p>
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
                      {selectedIntegrations.includes(ig) ? "Conectado" : "Conectar"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Limite de Execuções/Dia</Label>
                  <Input type="number" value={execLimit} onChange={e => setExecLimit(e.target.value)} className="glass" />
                </div>
                <div className="space-y-2">
                  <Label>Timeout por Ação (segundos)</Label>
                  <Input type="number" value={timeout} onChange={e => setTimeoutVal(e.target.value)} className="glass" />
                </div>
                <div className="space-y-2">
                  <Label>Nível de Auditoria</Label>
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
                  <span className="text-sm">Ativar execução 24/7 (sem limites de horário)</span>
                </div>
                {!is24h && (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Horário de Início</Label>
                        <Input type="time" className="glass" value={startTime} onChange={e => setStartTime(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Horário de Fim</Label>
                        <Input type="time" className="glass" value={endTime} onChange={e => setEndTime(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Dias da Semana</Label>
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
          Voltar
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep(currentStep + 1)} className="glow">
            Próximo <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={saving || !name.trim()} className="glow">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Criar e Ativar Agente <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CreateAgentPage;
