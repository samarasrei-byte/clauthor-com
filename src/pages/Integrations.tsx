import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail, MessageSquare, Globe, Facebook,
  FileSpreadsheet, BookOpen, Trello, BarChart3,
  TrendingUp, Code, CheckCircle, ArrowRight
} from "lucide-react";

const integrations = [
  { icon: Mail, name: "Gmail", desc: "Envie e receba e-mails automaticamente.", status: "Disponível", category: "Comunicação" },
  { icon: MessageSquare, name: "WhatsApp", desc: "Atenda clientes e envie notificações via WhatsApp.", status: "Disponível", category: "Comunicação" },
  { icon: Globe, name: "Instagram", desc: "Responda DMs e comentários automaticamente.", status: "Disponível", category: "Social" },
  { icon: Facebook, name: "Facebook", desc: "Gerencie mensagens e posts no Facebook.", status: "Em Breve", category: "Social" },
  { icon: FileSpreadsheet, name: "Google Sheets", desc: "Leia e escreva dados em planilhas.", status: "Disponível", category: "Produtividade" },
  { icon: BookOpen, name: "Notion", desc: "Sincronize dados com seu workspace Notion.", status: "Disponível", category: "Produtividade" },
  { icon: Trello, name: "Trello", desc: "Crie cards e gerencie boards automaticamente.", status: "Disponível", category: "Produtividade" },
  { icon: BarChart3, name: "HubSpot", desc: "Sincronize leads, deals e contatos.", status: "Disponível", category: "CRM" },
  { icon: TrendingUp, name: "Pipedrive", desc: "Gerencie pipeline de vendas automaticamente.", status: "Disponível", category: "CRM" },
  { icon: Code, name: "APIs Customizadas", desc: "Conecte qualquer API REST ou GraphQL.", status: "Disponível", category: "Desenvolvimento" },
];

const IntegrationsPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-1">Integrações</h1>
        <p className="text-muted-foreground">Conecte seus agentes com as ferramentas que você já usa.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((ig, i) => (
          <motion.div
            key={ig.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass border-border hover:neon-border transition-all h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ig.icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge
                    variant="secondary"
                    className={ig.status === "Disponível" ? "bg-primary/15 text-primary" : ""}
                  >
                    {ig.status}
                  </Badge>
                </div>
                <h3 className="font-display font-semibold text-base mb-1">{ig.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-1">{ig.desc}</p>
                <Badge variant="outline" className="w-fit text-xs mb-3">{ig.category}</Badge>
                <Button
                  size="sm"
                  variant={ig.status === "Disponível" ? "default" : "secondary"}
                  className={ig.status === "Disponível" ? "neon-glow" : ""}
                  disabled={ig.status !== "Disponível"}
                >
                  {ig.status === "Disponível" ? "Conectar" : "Em Breve"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsPage;
