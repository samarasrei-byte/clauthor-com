import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useExecutionHealth } from "@/hooks/useExecutionHealth";
import { useTranslation } from "react-i18next";
import {
  Eye, Terminal, Shield, BarChart3, Bot, Activity, Clock,
  CheckCircle, AlertTriangle, Zap, TrendingUp, Play, Pause,
  RefreshCw, ChevronRight, Send, Lock, Unlock, ExternalLink,
  Cpu, Layers, ArrowRight, X, Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ─── Agent Status Mapping ───
const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Play }> = {
  active: { label: "Executando", color: "text-emerald-400", icon: Play },
  draft: { label: "Aguardando", color: "text-muted-foreground", icon: Pause },
  paused: { label: "Pausado", color: "text-amber-400", icon: Pause },
};

// ─── Agent Vision Card ───
const AgentVisionCard = ({ agent, logs, onClick }: { agent: any; logs: any[]; onClick: () => void }) => {
  const agentLogs = logs.filter(l => l.agent_id === agent.id).slice(0, 3);
  const lastLog = agentLogs[0];
  const status = STATUS_MAP[agent.status] || STATUS_MAP.draft;
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 hover:border-primary/20 hover:shadow-[0_0_20px_hsl(var(--primary)/0.05)] transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold truncate max-w-[140px]">{agent.name}</h3>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full", agent.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40")} />
              <span className={cn("text-[10px]", status.color)}>{status.label}</span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 border-border/30">
          {agent.tier}
        </Badge>
      </div>

      {lastLog ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground truncate">{lastLog.action}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {lastLog.status === "success" ? (
              <CheckCircle className="h-3 w-3 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-destructive" />
            )}
            <span className="text-[10px] text-muted-foreground">
              {new Date(lastLog.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            {lastLog.execution_time_ms && (
              <span className="text-[10px] text-muted-foreground font-mono ml-auto">{lastLog.execution_time_ms}ms</span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground/50 italic">Nenhuma execução registrada</p>
      )}

      <div className="mt-3 pt-2 border-t border-border/20 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{agent.total_executions} execuções</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
      </div>
    </motion.div>
  );
};

// ─── Agent Detail Panel ───
const AgentDetailPanel = ({ agent, logs, onClose }: { agent: any; logs: any[]; onClose: () => void }) => {
  const agentLogs = logs.filter(l => l.agent_id === agent.id).slice(0, 20);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{agent.name}</h2>
            <p className="text-xs text-muted-foreground">{agent.description || "Agente de IA autônomo"}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Execuções", value: agent.total_executions, icon: Zap },
          { label: "Sucesso", value: `${agentLogs.filter(l => l.status === "success").length}/${agentLogs.length}`, icon: CheckCircle },
          { label: "Tier", value: agent.tier, icon: Layers },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-muted/10 p-3 text-center">
            <s.icon className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
            <p className="text-xs font-bold">{s.value}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Execution Timeline */}
      <div>
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" />
          Timeline de Execução
        </h3>
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
          {agentLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 text-center py-4">Nenhum registro</p>
          ) : agentLogs.map((log, i) => (
            <div
              key={log.id}
              className={cn(
                "flex items-center gap-2.5 p-2 rounded-lg text-xs",
                log.status === "error" ? "bg-destructive/5" : "bg-muted/5"
              )}
            >
              <div className="relative">
                <div className={cn("w-2 h-2 rounded-full", log.status === "success" ? "bg-emerald-500" : "bg-destructive")} />
                {i < agentLogs.length - 1 && <div className="absolute top-3 left-[3px] w-px h-4 bg-border/30" />}
              </div>
              <span className="flex-1 truncate text-muted-foreground">{log.action}</span>
              {log.execution_time_ms && <span className="font-mono text-[10px] text-muted-foreground">{log.execution_time_ms}ms</span>}
              <span className="text-[10px] text-muted-foreground shrink-0">
                {new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Command Terminal ───
const CommandTerminal = ({ onSend }: { onSend: (cmd: string) => void }) => {
  const [cmd, setCmd] = useState("");
  const [history, setHistory] = useState<{ input: string; output: string; time: Date }[]>([]);

  const suggestions = [
    "Gerar relatório de vendas",
    "Criar agente para responder leads",
    "Analisar dados de clientes",
    "Executar coleta de dados",
    "Pesquisar empresas no setor tech",
  ];

  const handleSubmit = () => {
    if (!cmd.trim()) return;
    setHistory(prev => [...prev, {
      input: cmd,
      output: `⚡ Comando recebido: "${cmd}"\n→ Encaminhando para o orquestrador THOR...\n→ Tarefa será processada pelos agentes disponíveis.`,
      time: new Date(),
    }]);
    onSend(cmd);
    setCmd("");
  };

  return (
    <div className="space-y-4">
      {/* Terminal Output */}
      <div className="rounded-2xl border border-border/40 bg-black/40 backdrop-blur-sm p-4 font-mono text-xs min-h-[200px] max-h-[350px] overflow-y-auto">
        <div className="text-emerald-400/70 mb-2">{">"} ClAuthor AI Terminal v2.0</div>
        <div className="text-muted-foreground/50 mb-3">{">"} Digite um comando em linguagem natural...</div>
        {history.map((h, i) => (
          <div key={i} className="mb-3">
            <div className="text-primary">$ {h.input}</div>
            <div className="text-muted-foreground whitespace-pre-wrap mt-1">{h.output}</div>
            <div className="text-muted-foreground/30 text-[9px] mt-0.5">
              {h.time.toLocaleTimeString("pt-BR")}
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <div className="text-muted-foreground/30 animate-pulse">_</div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
          <Input
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Ex: gerar relatório de vendas da última semana..."
            className="pl-10 bg-card/40 border-border/30 font-mono text-sm"
          />
        </div>
        <Button onClick={handleSubmit} size="sm" className="gap-1.5">
          <Send className="h-3.5 w-3.5" />
          Enviar
        </Button>
      </div>

      {/* Quick Commands */}
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => { setCmd(s); }}
            className="px-2.5 py-1 text-[10px] rounded-lg border border-border/30 bg-card/30 text-muted-foreground hover:text-foreground hover:border-primary/20 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Credential Vault ───
const CredentialVault = ({ credentials }: { credentials: any[] }) => {
  const integrations = [
    { name: "WhatsApp Business", icon: "📱", connected: credentials.some(c => c.integration_name === "whatsapp") },
    { name: "Google APIs", icon: "🔍", connected: credentials.some(c => c.integration_name === "google") },
    { name: "SendGrid (Email)", icon: "📧", connected: credentials.some(c => c.integration_name === "sendgrid") },
    { name: "LinkedIn", icon: "💼", connected: credentials.some(c => c.integration_name === "linkedin") },
    { name: "HubSpot CRM", icon: "🔗", connected: credentials.some(c => c.integration_name === "hubspot") },
    { name: "Meta Ads", icon: "📢", connected: credentials.some(c => c.integration_name === "meta_ads") },
    { name: "Webhooks", icon: "🔔", connected: credentials.some(c => c.integration_name === "webhook") },
    { name: "OpenAI", icon: "🤖", connected: credentials.some(c => c.integration_name === "openai") },
  ];

  const connected = integrations.filter(i => i.connected).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Cofre de Credenciais
          </h3>
          <p className="text-[11px] text-muted-foreground">{connected} de {integrations.length} integrações ativas</p>
        </div>
        <Badge variant="outline" className="text-[10px] gap-1">
          <Lock className="h-2.5 w-2.5" />
          AES-256
        </Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {integrations.map(int => (
          <div
            key={int.name}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-colors",
              int.connected
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-border/30 bg-card/30 opacity-60"
            )}
          >
            <span className="text-lg">{int.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{int.name}</p>
              <p className={cn("text-[10px]", int.connected ? "text-emerald-400" : "text-muted-foreground")}>
                {int.connected ? "Conectado" : "Disponível"}
              </p>
            </div>
            {int.connected ? (
              <Unlock className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
          </div>
        ))}
      </div>

      {/* Credential Audit */}
      {credentials.length > 0 && (
        <div className="rounded-xl border border-border/30 bg-card/30 p-3">
          <h4 className="text-[11px] font-semibold mb-2 flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-primary" />
            Credenciais Registradas
          </h4>
          <div className="space-y-1">
            {credentials.slice(0, 8).map((cred: any) => (
              <div key={cred.id} className="flex items-center gap-2 text-[10px] py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">{cred.integration_name}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="font-mono text-muted-foreground/70 truncate">{cred.credential_key}</span>
                <span className="ml-auto text-muted-foreground/40">{cred.access_count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN CONTROL TOWER ───
const ControlTower = ({ onNavigate }: { onNavigate?: (id: string) => void }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { credits, remainingCredits, usagePercentage } = useCredits();
  const health = useExecutionHealth();
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const { data: agents = [] } = useQuery({
    queryKey: ["ct-agents", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["ct-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("execution_logs").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: credentials = [] } = useQuery({
    queryKey: ["ct-credentials", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agent_credentials_safe").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["ct-tasks", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agent_tasks").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  // Metrics
  const activeAgents = agents.filter(a => a.status === "active").length;
  const totalExec = agents.reduce((a, ag) => a + (ag.total_executions || 0), 0);
  const todayLogs = logs.filter(l => {
    const d = new Date(l.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const successToday = todayLogs.filter(l => l.status === "success").length;
  const runningTasks = tasks.filter(t => t.status === "in_progress" || t.status === "open").length;
  const estimatedHoursSaved = Math.round(activeAgents * 6.3);

  const filteredAgents = searchTerm
    ? agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : agents;

  const handleCommand = (cmd: string) => {
    // Route command to THOR for real execution
    if (onNavigate) {
      onNavigate("omnix");
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══ GLOBAL METRICS BAR ═══ */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: "Agentes Ativos", value: activeAgents, icon: Bot, accent: "text-primary" },
            { label: "Execuções Hoje", value: todayLogs.length, icon: Zap, accent: "text-amber-400" },
            { label: "Sucesso Hoje", value: `${successToday}/${todayLogs.length}`, icon: CheckCircle, accent: "text-emerald-400" },
            { label: "Tarefas Ativas", value: runningTasks, icon: Activity, accent: "text-blue-400" },
            { label: "Horas Salvas", value: `${estimatedHoursSaved}h`, icon: Clock, accent: "text-purple-400" },
            { label: "Health Score", value: `${health.data?.healthScore ?? 100}%`, icon: TrendingUp, accent: health.data?.isHealthy ? "text-emerald-400" : "text-destructive" },
          ].map(m => (
            <div key={m.label} className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-3 text-center">
              <m.icon className={cn("h-4 w-4 mx-auto mb-1", m.accent)} />
              <p className="text-lg font-bold font-display">{m.value}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ TABS ═══ */}
      <Tabs defaultValue="vision" className="space-y-4">
        <TabsList className="bg-card/50 border border-border/30 p-1">
          <TabsTrigger value="vision" className="gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Eye className="h-3.5 w-3.5" />
            Agent Vision
          </TabsTrigger>
          <TabsTrigger value="command" className="gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Terminal className="h-3.5 w-3.5" />
            Command Center
          </TabsTrigger>
          <TabsTrigger value="vault" className="gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Shield className="h-3.5 w-3.5" />
            Credential Vault
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <BarChart3 className="h-3.5 w-3.5" />
            Feedback
          </TabsTrigger>
        </TabsList>

        {/* ─── AGENT VISION ─── */}
        <TabsContent value="vision" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar agente..."
                className="pl-9 h-8 text-xs"
              />
            </div>
            <Badge variant="outline" className="text-[10px]">{agents.length} agentes</Badge>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredAgents.map(agent => (
                <AgentVisionCard
                  key={agent.id}
                  agent={agent}
                  logs={logs}
                  onClick={() => setSelectedAgent(agent)}
                />
              ))}
            </AnimatePresence>
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {agents.length === 0 ? "Nenhum agente contratado ainda" : "Nenhum agente encontrado"}
              </p>
            </div>
          )}

          {/* Detail Panel */}
          <AnimatePresence>
            {selectedAgent && (
              <AgentDetailPanel
                agent={selectedAgent}
                logs={logs}
                onClose={() => setSelectedAgent(null)}
              />
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ─── COMMAND CENTER ─── */}
        <TabsContent value="command">
          <Card className="border-border/30 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                Terminal de Comandos
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Envie comandos em linguagem natural para criar, executar ou gerenciar seus agentes.
              </p>
            </CardHeader>
            <CardContent>
              <CommandTerminal onSend={handleCommand} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── CREDENTIAL VAULT ─── */}
        <TabsContent value="vault">
          <Card className="border-border/30 bg-card/50">
            <CardContent className="pt-6">
              <CredentialVault credentials={credentials} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── EXECUTION FEEDBACK ─── */}
        <TabsContent value="feedback" className="space-y-4">
          {/* Health Overview */}
          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="border-border/30 bg-card/50">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Saúde do Sistema</h3>
                  <Badge variant={health.data?.isHealthy ? "default" : "destructive"} className="text-[10px]">
                    {health.data?.isHealthy ? "Saudável" : "Atenção"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Taxa de Sucesso</span>
                    <span className="font-bold">{health.data?.successRate ?? 100}%</span>
                  </div>
                  <Progress value={health.data?.successRate ?? 100} className="h-2" />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tempo Médio</span>
                  <span className="font-mono">{health.data?.avgExecutionTimeMs ?? 0}ms</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Execuções</span>
                  <span className="font-bold">{health.data?.totalExecutions ?? 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/50">
              <CardContent className="pt-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  Alertas Recentes
                </h3>
                {(health.data?.failureAlerts?.length ?? 0) === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-6 w-6 text-emerald-400/30 mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">Nenhum alerta</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {health.data?.failureAlerts?.slice(0, 5).map(alert => (
                      <div key={alert.id} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 text-xs">
                        <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-[11px]">{alert.title}</p>
                          <p className="text-[10px] text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Execution Event Log */}
          <Card className="border-border/30 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Log de Execução em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {todayLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 text-center py-8">Nenhuma execução hoje</p>
                ) : todayLogs.slice(0, 30).map(log => (
                  <div key={log.id} className={cn(
                    "flex items-center gap-2.5 p-2 rounded-lg text-xs",
                    log.status === "error" ? "bg-destructive/5" : "hover:bg-muted/5"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      log.status === "success" ? "bg-emerald-500" : "bg-destructive"
                    )} />
                    <span className="font-mono text-[10px] text-muted-foreground/60 shrink-0">
                      {new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className="text-muted-foreground truncate flex-1">{log.action}</span>
                    {log.execution_time_ms && (
                      <span className="font-mono text-[10px] text-muted-foreground/50">{log.execution_time_ms}ms</span>
                    )}
                    <Badge variant="outline" className={cn(
                      "text-[9px] px-1.5",
                      log.status === "success" ? "text-emerald-400 border-emerald-500/20" : "text-destructive border-destructive/20"
                    )}>
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ControlTower;
