import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Target, FileText, Zap, Globe, Database,
  Shield, Clock, Plug, ChevronRight, CheckCircle, ArrowRight
} from "lucide-react";

const steps = [
  { icon: Bot, label: "Nome & Objetivo" },
  { icon: FileText, label: "Instruções" },
  { icon: Zap, label: "Ações (CLAWS)" },
  { icon: Globe, label: "Canais" },
  { icon: Database, label: "Conhecimento" },
  { icon: Plug, label: "Integrações" },
  { icon: Shield, label: "Limites" },
  { icon: Clock, label: "Agendamento" },
];

const CreateAgentPage = () => {
  const [currentStep, setCurrentStep] = useState(0);

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
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              {(() => {
                const StepIcon = steps[currentStep].icon;
                return <StepIcon className="h-5 w-5 text-primary" />;
              })()}
              {steps[currentStep].label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Nome do Agente</Label>
                  <Input placeholder="Ex: Atendimento WhatsApp Premium" className="glass" />
                </div>
                <div className="space-y-2">
                  <Label>Objetivo Principal</Label>
                  <Textarea
                    placeholder="Descreva o que este agente deve fazer. Ex: Atender clientes via WhatsApp, realizar triagem e resolver dúvidas comuns automaticamente."
                    className="glass min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Atendimento", "Vendas", "Marketing", "Financeiro", "RH", "Jurídico", "TI", "Outro"].map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors px-3 py-1"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Instruções e Regras</Label>
                  <Textarea
                    placeholder="Defina as regras de comportamento do agente. Ex: Sempre cumprimente o cliente pelo nome. Nunca forneça informações financeiras sem validação."
                    className="glass min-h-[200px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tom de Voz</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Formal", "Amigável", "Técnico", "Casual", "Corporativo"].map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors px-3 py-1"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione as ações que o agente pode executar (CLAWS + API Chains):
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    "Enviar mensagens", "Buscar dados", "Criar registros", "Atualizar CRM",
                    "Gerar documentos", "Enviar e-mails", "Agendar tarefas", "Chamar APIs",
                    "Processar pagamentos", "Escalar para humano", "Analisar sentimento", "Gerar relatórios"
                  ].map((action) => (
                    <div
                      key={action}
                      className="flex items-center gap-3 p-3 rounded-lg glass cursor-pointer hover:neon-border transition-all"
                    >
                      <div className="w-4 h-4 rounded border border-muted-foreground/30" />
                      <span className="text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {["WhatsApp", "Instagram", "Facebook", "Site (Widget)", "E-mail", "Telegram", "SMS", "API"].map((ch) => (
                  <div
                    key={ch}
                    className="flex items-center gap-3 p-4 rounded-lg glass cursor-pointer hover:neon-border transition-all"
                  >
                    <Globe className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{ch}</span>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Base de Conhecimento</Label>
                  <Textarea
                    placeholder="Cole textos, FAQs, documentos ou links que o agente deve usar como referência."
                    className="glass min-h-[150px]"
                  />
                </div>
                <div className="glass rounded-lg p-4 neon-border text-center cursor-pointer hover:bg-accent/30 transition-colors">
                  <Database className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Arraste arquivos ou clique para upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, CSV — até 50MB</p>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {["Gmail", "WhatsApp API", "Google Sheets", "Notion", "HubSpot", "Pipedrive", "Trello", "API Customizada"].map((ig) => (
                  <div
                    key={ig}
                    className="flex items-center justify-between p-4 rounded-lg glass cursor-pointer hover:neon-border transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Plug className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{ig}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">Conectar</Badge>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Limite de Execuções/Dia</Label>
                  <Input type="number" placeholder="500" className="glass" />
                </div>
                <div className="space-y-2">
                  <Label>Timeout por Ação (segundos)</Label>
                  <Input type="number" placeholder="30" className="glass" />
                </div>
                <div className="space-y-2">
                  <Label>Nível de Auditoria</Label>
                  <div className="flex gap-2">
                    {["Básico", "Detalhado", "Completo"].map((l) => (
                      <Badge
                        key={l}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors px-3 py-1"
                      >
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário de Início</Label>
                    <Input type="time" className="glass" defaultValue="08:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário de Fim</Label>
                    <Input type="time" className="glass" defaultValue="22:00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dias da Semana</Label>
                  <div className="flex gap-2">
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                      <Badge
                        key={d}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors px-3 py-1"
                      >
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg glass">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm">Ativar execução 24/7 (sem limites de horário)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Voltar
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep(currentStep + 1)} className="neon-glow">
            Próximo
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button className="neon-glow">
            Criar e Ativar Agente
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CreateAgentPage;
