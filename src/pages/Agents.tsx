import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Plus, MoreHorizontal, Activity, Zap, Settings
} from "lucide-react";

const agents = [
  { name: "Atendimento WhatsApp", status: "Online", type: "Atendimento", executions: 342, errors: 2 },
  { name: "Prospecção LinkedIn", status: "Executando", type: "Vendas", executions: 128, errors: 0 },
  { name: "Gerador de Conteúdo", status: "Em Espera", type: "Conteúdo", executions: 56, errors: 1 },
  { name: "Cobranças PIX", status: "Online", type: "Financeiro", executions: 231, errors: 0 },
  { name: "Agenda Clínica", status: "Online", type: "Agenda", executions: 89, errors: 0 },
  { name: "Fiscal NF-e", status: "Em Espera", type: "Fiscal", executions: 34, errors: 3 },
];

const statusColor: Record<string, string> = {
  Online: "bg-primary/20 text-primary",
  Executando: "bg-yellow-500/20 text-yellow-400",
  "Em Espera": "bg-muted text-muted-foreground",
};

const AgentsPage = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1">Meus Agentes</h1>
        <p className="text-muted-foreground">Gerencie seus funcionários digitais</p>
      </div>
      <Link to="/create-agent">
        <Button className="neon-glow">
          <Plus className="h-4 w-4 mr-2" /> Novo Agente
        </Button>
      </Link>
    </motion.div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {agents.map((a, i) => (
        <motion.div
          key={a.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="glass border-border hover:neon-border transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className={statusColor[a.status]}>{a.status}</Badge>
              </div>
              <h3 className="font-display font-semibold mb-1">{a.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{a.type}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {a.executions} exec.</span>
                {a.errors > 0 && (
                  <span className="flex items-center gap-1 text-destructive"><Activity className="h-3 w-3" /> {a.errors} erros</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs">
                  <Settings className="h-3 w-3 mr-1" /> Configurar
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

export default AgentsPage;
