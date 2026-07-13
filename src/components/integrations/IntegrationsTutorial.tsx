import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, MousePointerClick, KeyRound, CheckCircle2, Lightbulb,
  ShieldCheck, HelpCircle, ExternalLink, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "clauthor_integrations_tutorial_dismissed_v2";

type Step = {
  icon: typeof Search;
  title: string;
  description: string;
  bullets?: string[];
};

const STEPS: Step[] = [
  {
    icon: Search,
    title: "1. Encontre o conector",
    description:
      "Use a busca ou filtre por categoria (Comunicação, CRM, Ads...). Cada card mostra um badge:",
    bullets: [
      "🟢 API ativa · pronto para uso imediato",
      "🟡 Beta · funcional, mas em ajustes finais",
      "⚪ Em breve · ainda não implementado (não gaste credenciais)",
    ],
  },
  {
    icon: MousePointerClick,
    title: "2. Abra o card e revise o escopo",
    description:
      "Clique no conector. Você verá exatamente quais ferramentas os agentes ganham (send-message, get-insights, create-deal...) e qual desenvolvedor mantém a integração.",
  },
  {
    icon: KeyRound,
    title: "3. Preencha as credenciais",
    description:
      "Dois modos, escolha o do card:",
    bullets: [
      "OAuth (1 clique): Meta Ads, Instagram, LinkedIn · abre popup do provedor, você autoriza, pronto.",
      "API Key: cole a chave no campo indicado. Sempre marcada como password e cifrada em repouso.",
      "Nunca compartilhe a chave em chat, e-mail ou print. Se vazar, revogue no provedor e reconecte aqui.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "4. Segurança e isolamento",
    description:
      "Suas credenciais nunca aparecem em texto puro na plataforma. Cada tenant tem chaves próprias · nem outros usuários da sua empresa acessam. Você pode revogar a qualquer momento no card do conector.",
  },
  {
    icon: CheckCircle2,
    title: "5. Pronto · agentes ativos",
    description:
      "Ao aparecer o selo verde 'Vinculado', seus agentes já podem executar ações reais nessa integração. Teste no Playground ou dispare uma tarefa.",
  },
];

// Where to grab credentials for each provider
const CREDENTIAL_SOURCES: { name: string; url: string; hint: string }[] = [
  { name: "Gmail / SendGrid", url: "https://app.sendgrid.com/settings/api_keys", hint: "Settings → API Keys → Create API Key" },
  { name: "WhatsApp Business", url: "https://developers.facebook.com/apps", hint: "App → WhatsApp → API Setup → copie Phone ID + Access Token" },
  { name: "Notion", url: "https://www.notion.so/my-integrations", hint: "New integration → copie o Internal Integration Token" },
  { name: "LinkedIn", url: "https://www.linkedin.com/developers/apps", hint: "Crie app → Auth → gere Access Token com scopes necessários" },
  { name: "Slack", url: "https://api.slack.com/apps", hint: "Create app → Incoming Webhooks + Bot Token (xoxb-)" },
  { name: "Meta Ads / Instagram", url: "#", hint: "Clique em 'Conexão rápida via OAuth Meta' no card · 1 clique." },
  { name: "HubSpot", url: "https://app.hubspot.com/private-apps", hint: "Settings → Private Apps → Create private app → copie o token (pat-...)" },
  { name: "Google Sheets", url: "https://console.cloud.google.com/apis/credentials", hint: "Service Account → JSON key. Compartilhe a planilha com o e-mail do service account." },
  { name: "Pipedrive", url: "https://app.pipedrive.com/settings/api", hint: "Seu perfil → Settings → API → copie o Personal API token" },
  { name: "Trello", url: "https://trello.com/power-ups/admin", hint: "Power-Up → API Key + Token" },
  { name: "Cobanky", url: "https://cobanky.com.br/api-docs", hint: "Dashboard → API → gere chave ck_live_..." },
  { name: "ClickSign", url: "https://www.clicksign.com/api", hint: "Config → API Keys → Access Token" },
  { name: "DocuSign", url: "https://admin.docusign.com/", hint: "Apps and Keys → Integration Key → OAuth Access Token" },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Vou pagar a mais pela integração?",
    a: "Não pela conexão. Você paga apenas o consumo de tokens dos agentes que a usarem. Custos do provedor (ex: WhatsApp Business por conversa) seguem a política do provedor.",
  },
  {
    q: "E se a credencial vazar ou eu quiser desligar?",
    a: "Vá em Integrações → clique no conector → Revogar credenciais. Recomendamos também gerar nova chave no painel do provedor para invalidar a antiga.",
  },
  {
    q: "Preciso ser admin para conectar?",
    a: "Sim, apenas owners e admins do tenant conectam integrações. Membros normais podem usá-las via agentes.",
  },
  {
    q: "Onde vejo se um agente realmente usou a integração?",
    a: "Menu Governança → Trilha de auditoria mostra cada ação executada, com input, output, custo e hash imutável.",
  },
];

const IntegrationsTutorial = () => {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);
  const [showSources, setShowSources] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) setVisible(false);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) {
    return (
      <button
        onClick={() => {
          sessionStorage.removeItem(STORAGE_KEY);
          setStep(0);
          setVisible(true);
        }}
        className="text-xs text-primary/70 hover:text-primary transition-colors inline-flex items-center gap-1.5"
      >
        <Lightbulb className="h-3.5 w-3.5" />
        Rever tutorial completo
      </button>
    );
  }

  const Current = STEPS[step];
  const Icon = Current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5"
      >
        <button
          onClick={dismiss}
          aria-label="Fechar tutorial"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider text-primary/70 font-semibold">
                Tutorial · {step + 1}/{STEPS.length}
              </span>
            </div>
            <h3 className="font-display font-semibold text-sm mb-1">{Current.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{Current.description}</p>

            {Current.bullets && (
              <ul className="mt-2 space-y-1">
                {Current.bullets.map((b, i) => (
                  <li key={i} className="text-xs text-muted-foreground/90 leading-relaxed pl-3 relative">
                    <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-primary/50" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-2 mt-4">
              <div className="flex gap-1 flex-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= step ? "bg-primary" : "bg-primary/15"
                    }`}
                  />
                ))}
              </div>
              {step > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setStep((s) => s - 1)}>
                  Voltar
                </Button>
              )}
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
              >
                {isLast ? "Concluir" : "Próximo"}
              </Button>
            </div>
          </div>
        </div>

        {/* Onde pegar as credenciais */}
        <div className="mt-4 pt-4 border-t border-primary/10">
          <button
            onClick={() => setShowSources((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-medium text-foreground/90 hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              Onde pegar cada credencial ({CREDENTIAL_SOURCES.length} provedores)
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSources ? "rotate-180" : ""}`} />
          </button>
          {showSources && (
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {CREDENTIAL_SOURCES.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target={s.url === "#" ? undefined : "_blank"}
                  rel="noreferrer"
                  onClick={(e) => s.url === "#" && e.preventDefault()}
                  className="group text-[11px] leading-snug rounded-lg border border-border/40 bg-card/50 hover:border-primary/40 hover:bg-primary/5 p-2 transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-medium text-foreground/90">
                    {s.name}
                    {s.url !== "#" && <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity" />}
                  </div>
                  <div className="text-muted-foreground text-[10px] mt-0.5">{s.hint}</div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="mt-2 pt-2">
          <button
            onClick={() => setShowFaq((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-medium text-foreground/90 hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              Perguntas frequentes
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFaq ? "rotate-180" : ""}`} />
          </button>
          {showFaq && (
            <div className="mt-3 space-y-2.5">
              {FAQ.map((item, i) => (
                <div key={i} className="text-[11px] leading-relaxed">
                  <div className="font-medium text-foreground/90">{item.q}</div>
                  <div className="text-muted-foreground mt-0.5">{item.a}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IntegrationsTutorial;
