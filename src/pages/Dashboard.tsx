import { motion } from "framer-motion";
import {
  Activity, Bot, Zap, Clock, DollarSign, AlertTriangle,
  CheckCircle, TrendingUp, BarChart3, Wifi
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { icon: Zap, label: "Execuções Hoje", value: "1.284", change: "+12%", color: "text-primary" },
  { icon: Clock, label: "Tempo Economizado", value: "47h", change: "+8%", color: "text-primary" },
  { icon: DollarSign, label: "Economia Financeira", value: "R$ 12.400", change: "+23%", color: "text-primary" },
  { icon: CheckCircle, label: "Ações Concluídas", value: "3.847", change: "+15%", color: "text-primary" },
];

const agentsList = [
  { name: "Atendimento WhatsApp", status: "Online", executions: 342, type: "Atendimento" },
  { name: "Prospecção LinkedIn", status: "Executando", executions: 128, type: "Vendas" },
  { name: "Gerador de Conteúdo", status: "Em Espera", executions: 56, type: "Conteúdo" },
  { name: "Cobranças PIX", status: "Online", executions: 231, type: "Financeiro" },
  { name: "Agenda Clínica", status: "Online", executions: 89, type: "Agenda" },
];

const recentLogs = [
  { time: "14:32", agent: "Atendimento WhatsApp", action: "Ticket #4521 resolvido automaticamente", type: "success" },
  { time: "14:28", agent: "Prospecção LinkedIn", action: "15 leads qualificados encontrados", type: "success" },
  { time: "14:25", agent: "Cobranças PIX", action: "Erro ao gerar boleto, retry em 5min", type: "error" },
  { time: "14:20", agent: "Gerador de Conteúdo", action: "3 posts agendados para Instagram", type: "success" },
  { time: "14:15", agent: "Agenda Clínica", action: "12 confirmações enviadas via WhatsApp", type: "success" },
];

const statusColor: Record<string, string> = {
  Online: "bg-primary/20 text-primary",
  Executando: "bg-yellow-500/20 text-yellow-400",
  "Em Espera": "bg-muted text-muted-foreground",
};

const DashboardPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua operação autônoma</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08] hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <span className="text-xs text-primary font-medium">{s.change}</span>
                </div>
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agents */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Agentes Ativos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agentsList.map((agent) => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse-neon" />
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{agent.executions} exec.</span>
                    <Badge variant="secondary" className={statusColor[agent.status]}>
                      {agent.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentLogs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                    {log.time}
                  </span>
                  <div>
                    <p className="text-xs font-medium">{log.agent}</p>
                    <p className={`text-xs ${log.type === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                      {log.action}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Executions chart placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Execuções por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88, 92, 78].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-primary/60 hover:bg-primary transition-colors"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>27 Jan</span>
              <span>Hoje</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
