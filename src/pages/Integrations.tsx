import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail, MessageSquare, Globe, Facebook,
  FileSpreadsheet, BookOpen, Trello, BarChart3,
  TrendingUp, Code, ArrowRight, Linkedin, Megaphone,
  Instagram, ShoppingCart, CreditCard, Database
} from "lucide-react";
import WhatsAppSetupGuide from "@/components/dashboard/WhatsAppSetupGuide";
import SendGridSetupGuide from "@/components/dashboard/SendGridSetupGuide";
import LinkedInSetupGuide from "@/components/dashboard/LinkedInSetupGuide";
import MetaAdsSetupGuide from "@/components/dashboard/MetaAdsSetupGuide";
import { useState } from "react";

const integrations = [
  { icon: MessageSquare, name: "WhatsApp", desc: "Atenda clientes e envie notificações via WhatsApp.", status: "Disponível", category: "Comunicação", hasSetup: true, setupKey: "whatsapp" },
  { icon: Mail, name: "E-mail (SendGrid)", desc: "Envie e receba e-mails automaticamente.", status: "Disponível", category: "Comunicação", hasSetup: true, setupKey: "email" },
  { icon: Linkedin, name: "LinkedIn", desc: "Automatize prospecção e networking no LinkedIn.", status: "Disponível", category: "Social", hasSetup: true, setupKey: "linkedin" },
  { icon: Megaphone, name: "Meta Ads", desc: "Gerencie campanhas no Facebook e Instagram Ads.", status: "Disponível", category: "Ads", hasSetup: true, setupKey: "meta-ads" },
  { icon: Instagram, name: "Instagram", desc: "Responda DMs e comentários automaticamente.", status: "Disponível", category: "Social", hasSetup: false },
  { icon: Facebook, name: "Facebook", desc: "Gerencie mensagens e posts no Facebook.", status: "Em Breve", category: "Social", hasSetup: false },
  { icon: FileSpreadsheet, name: "Google Sheets", desc: "Leia e escreva dados em planilhas.", status: "Disponível", category: "Produtividade", hasSetup: false },
  { icon: BookOpen, name: "Notion", desc: "Sincronize dados com seu workspace Notion.", status: "Disponível", category: "Produtividade", hasSetup: false },
  { icon: Trello, name: "Trello", desc: "Crie cards e gerencie boards automaticamente.", status: "Disponível", category: "Produtividade", hasSetup: false },
  { icon: BarChart3, name: "HubSpot", desc: "Sincronize leads, deals e contatos.", status: "Disponível", category: "CRM", hasSetup: false },
  { icon: TrendingUp, name: "Pipedrive", desc: "Gerencie pipeline de vendas automaticamente.", status: "Disponível", category: "CRM", hasSetup: false },
  { icon: ShoppingCart, name: "Shopify", desc: "Integre catálogo, pedidos e atendimento.", status: "Em Breve", category: "E-commerce", hasSetup: false },
  { icon: CreditCard, name: "Stripe", desc: "Gerencie pagamentos e assinaturas.", status: "Em Breve", category: "Pagamentos", hasSetup: false },
  { icon: Database, name: "Zapier", desc: "Conecte com +5000 apps via automações.", status: "Em Breve", category: "Automação", hasSetup: false },
  { icon: Code, name: "APIs Customizadas", desc: "Conecte qualquer API REST ou GraphQL.", status: "Disponível", category: "Desenvolvimento", hasSetup: false },
];

const IntegrationsPage = () => {
  const [activeSetup, setActiveSetup] = useState<string | null>(null);

  if (activeSetup) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setActiveSetup(null)} className="gap-1 mb-2">
          ← Voltar para Integrações
        </Button>
        {activeSetup === "whatsapp" && <WhatsAppSetupGuide />}
        {activeSetup === "email" && <SendGridSetupGuide />}
        {activeSetup === "linkedin" && <LinkedInSetupGuide />}
        {activeSetup === "meta-ads" && <MetaAdsSetupGuide />}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-1">Integrações</h1>
        <p className="text-muted-foreground">Conecte seus agentes com as ferramentas que você já usa.</p>
      </motion.div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="Comunicação">Comunicação</TabsTrigger>
          <TabsTrigger value="Social">Social</TabsTrigger>
          <TabsTrigger value="Ads">Ads</TabsTrigger>
          <TabsTrigger value="CRM">CRM</TabsTrigger>
          <TabsTrigger value="Produtividade">Produtividade</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
        </TabsList>

        {["all", "Comunicação", "Social", "Ads", "CRM", "Produtividade", "outros"].map((tab) => {
          const filtered = tab === "all"
            ? integrations
            : tab === "outros"
            ? integrations.filter((ig) => !["Comunicação", "Social", "Ads", "CRM", "Produtividade"].includes(ig.category))
            : integrations.filter((ig) => ig.category === tab);

          return (
            <TabsContent key={tab} value={tab}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((ig, i) => (
                  <motion.div
                    key={ig.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
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
                          onClick={() => ig.hasSetup && ig.setupKey ? setActiveSetup(ig.setupKey) : undefined}
                        >
                          {ig.hasSetup && ig.status === "Disponível" ? (
                            <>Configurar <ArrowRight className="h-3.5 w-3.5 ml-1" /></>
                          ) : ig.status === "Disponível" ? "Conectar" : "Em Breve"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default IntegrationsPage;
