import { motion } from "framer-motion";
import HelpTooltip from "@/components/HelpTooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail, MessageSquare, Globe, Facebook,
  FileSpreadsheet, BookOpen, Trello, BarChart3,
  TrendingUp, Code, ArrowRight, Linkedin, Megaphone,
  Instagram, ShoppingCart, CreditCard, Database,
  Clock, Star, Key
} from "lucide-react";
import WhatsAppSetupGuide from "@/components/dashboard/WhatsAppSetupGuide";
import SendGridSetupGuide from "@/components/dashboard/SendGridSetupGuide";
import LinkedInSetupGuide from "@/components/dashboard/LinkedInSetupGuide";
import MetaAdsSetupGuide from "@/components/dashboard/MetaAdsSetupGuide";
import { useState } from "react";

const integrations = [
  { icon: MessageSquare, name: "WhatsApp", desc: "Atenda clientes e envie notificações via WhatsApp.", status: "Disponível", category: "Comunicação", hasSetup: true, setupKey: "whatsapp", difficulty: "Médio", difficultyStars: 2, totalTime: "~30 min", needsApi: true, apiInfo: "Phone ID + Access Token (Meta Business)" },
  { icon: Mail, name: "E-mail (SendGrid)", desc: "Envie e receba e-mails automaticamente.", status: "Disponível", category: "Comunicação", hasSetup: true, setupKey: "email", difficulty: "Fácil", difficultyStars: 1, totalTime: "~10 min", needsApi: true, apiInfo: "API Key (conta gratuita)" },
  { icon: Linkedin, name: "LinkedIn", desc: "Automatize prospecção e networking no LinkedIn.", status: "Disponível", category: "Social", hasSetup: true, setupKey: "linkedin", difficulty: "Médio", difficultyStars: 2, totalTime: "~20 min", needsApi: true, apiInfo: "Client ID + Secret + Access Token" },
  { icon: Megaphone, name: "Meta Ads", desc: "Gerencie campanhas no Facebook e Instagram Ads.", status: "Disponível", category: "Ads", hasSetup: true, setupKey: "meta-ads", difficulty: "Médio", difficultyStars: 2, totalTime: "~25 min", needsApi: true, apiInfo: "Access Token + Ad Account ID" },
  { icon: Instagram, name: "Instagram", desc: "Responda DMs e comentários automaticamente.", status: "Disponível", category: "Social", hasSetup: false, difficulty: "Fácil", difficultyStars: 1, totalTime: "~5 min", needsApi: true, apiInfo: "Via Meta Business (mesmo token)" },
  { icon: Facebook, name: "Facebook", desc: "Gerencie mensagens e posts no Facebook.", status: "Em Breve", category: "Social", hasSetup: false, difficulty: "Fácil", difficultyStars: 1, totalTime: "-", needsApi: true, apiInfo: "Via Meta Business" },
  { icon: FileSpreadsheet, name: "Google Sheets", desc: "Leia e escreva dados em planilhas.", status: "Disponível", category: "Produtividade", hasSetup: false, difficulty: "Fácil", difficultyStars: 1, totalTime: "~5 min", needsApi: true, apiInfo: "OAuth Google" },
  { icon: BookOpen, name: "Notion", desc: "Sincronize dados com seu workspace Notion.", status: "Disponível", category: "Produtividade", hasSetup: false, difficulty: "Fácil", difficultyStars: 1, totalTime: "~5 min", needsApi: true, apiInfo: "Integration Token" },
  { icon: Trello, name: "Trello", desc: "Crie cards e gerencie boards automaticamente.", status: "Disponível", category: "Produtividade", hasSetup: false, difficulty: "Fácil", difficultyStars: 1, totalTime: "~5 min", needsApi: true, apiInfo: "API Key + Token" },
  { icon: BarChart3, name: "HubSpot", desc: "Sincronize leads, deals e contatos.", status: "Disponível", category: "CRM", hasSetup: false, difficulty: "Fácil", difficultyStars: 1, totalTime: "~3 min", needsApi: true, apiInfo: "API Key (gratuito)" },
  { icon: TrendingUp, name: "Pipedrive", desc: "Gerencie pipeline de vendas automaticamente.", status: "Disponível", category: "CRM", hasSetup: false, difficulty: "Fácil", difficultyStars: 1, totalTime: "~3 min", needsApi: true, apiInfo: "API Token" },
  { icon: ShoppingCart, name: "Shopify", desc: "Integre catálogo, pedidos e atendimento.", status: "Em Breve", category: "E-commerce", hasSetup: false, difficulty: "Médio", difficultyStars: 2, totalTime: "-", needsApi: true, apiInfo: "Admin API Key" },
  { icon: CreditCard, name: "Stripe", desc: "Gerencie pagamentos e assinaturas.", status: "Em Breve", category: "Pagamentos", hasSetup: false, difficulty: "Fácil", difficultyStars: 1, totalTime: "-", needsApi: true, apiInfo: "Secret Key" },
  { icon: Database, name: "Zapier", desc: "Conecte com +5000 apps via automações.", status: "Em Breve", category: "Automação", hasSetup: false, difficulty: "Fácil", difficultyStars: 1, totalTime: "-", needsApi: true, apiInfo: "Webhook URL" },
  { icon: Code, name: "APIs Customizadas", desc: "Conecte qualquer API REST ou GraphQL.", status: "Disponível", category: "Desenvolvimento", hasSetup: false, difficulty: "Avançado", difficultyStars: 3, totalTime: "Variável", needsApi: true, apiInfo: "Depende da API" },
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
        <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">
          Integrações
          <HelpTooltip id="integrations-intro" text="Conecte seus agentes com WhatsApp, E-mail, LinkedIn, Meta Ads e mais. Clique em 'Configurar' para ativar cada integração." position="bottom" size={16} />
        </h1>
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
                        <p className="text-sm text-muted-foreground mb-3 flex-1">{ig.desc}</p>
                        
                        {/* Difficulty + Time + API info */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {ig.difficulty === "Fácil" ? "⭐" : ig.difficulty === "Médio" ? "⭐⭐" : "⭐⭐⭐"} {ig.difficulty}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {ig.totalTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                            <Key className="h-3 w-3 shrink-0" />
                            <span className="truncate">{ig.apiInfo}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{ig.category}</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant={ig.status === "Disponível" ? "default" : "secondary"}
                          className={`mt-3 ${ig.status === "Disponível" ? "neon-glow" : ""}`}
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
