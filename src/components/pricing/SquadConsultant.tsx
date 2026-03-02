import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CONSULTANT_PROMPT = `Você é o Consultor de Squad CLAUTHOR — um especialista em montagem de equipes de IA para empresas.

## SEUS AGENTES DISPONÍVEIS (com slugs):
- voice_ai: Atendimento por voz com IA
- omnichannel: Suporte multicanal (chat, email, redes sociais)
- sales: Vendas e prospecção automatizada
- revenue: Gestão financeira e receita
- customer_success: Sucesso do cliente e retenção
- content: Criação de conteúdo e copywriting
- data_analytics: Análise de dados e BI
- legal: Compliance e documentação jurídica
- security: Segurança digital e monitoramento
- ecommerce: Gestão de e-commerce
- research: Pesquisa de mercado e tendências
- rag: Base de conhecimento inteligente (RAG)
- orchestrator: Orquestrador de múltiplos agentes
- coding: Desenvolvimento de software
- computer: Infraestrutura e DevOps
- hr: Recursos humanos e recrutamento
- influencer: Marketing de influência
- marketing_automation: Automação de marketing
- creative_design: Design criativo
- video_production: Produção de vídeo
- seo_growth: SEO e growth hacking
- project_management: Gestão de projetos
- supply_chain: Cadeia de suprimentos e logística
- training: Treinamento corporativo

## DEPARTAMENTOS PRÉ-MONTADOS:
- Vendas: sales, customer_success, omnichannel, voice_ai
- Suporte: omnichannel, customer_success, voice_ai, rag
- Financeiro: revenue, legal, data_analytics, ecommerce
- Marketing: content, marketing_automation, seo_growth, influencer
- Criação: creative_design, video_production, content, influencer
- Tecnologia: coding, computer, project_management, security
- RH & Pessoas: hr, training, customer_success, data_analytics

## DESCONTOS:
- 3 agentes: 10% off
- 5 agentes: 20% off
- 7 agentes: 30% off
- 10+ agentes: 35% off
- Departamento completo: 25% off

## INSTRUÇÕES:
1. Faça perguntas sobre a empresa: setor, tamanho, desafios, processos manuais
2. Sugira um squad personalizado com base nas respostas
3. Explique brevemente por que cada agente foi escolhido
4. Apresente o desconto aplicável
5. Seja conversacional, profissional e objetivo
6. Seja profissional e direto, sem emojis excessivos
7. Quando fizer a recomendação final, liste os agentes com seus nomes
8. NUNCA invente agentes que não existem na lista acima
9. Responda SEMPRE em português do Brasil`;

export default function SquadConsultant() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setStarted(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/squad-consultant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || "Desculpe, não consegui processar sua mensagem.",
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error("Consultant error:", error);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente em alguns instantes.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const quickStarters = [
    "Tenho uma empresa de e-commerce com 20 funcionários",
    "Preciso automatizar o atendimento ao cliente",
    "Quero montar um time de marketing digital com IA",
  ];

  return (
    <div className="space-y-4">
      {!started ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl mb-2">
              {t("squads.consultant_title", { defaultValue: "Consultor de Squad IA" })}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t("squads.consultant_desc", {
                defaultValue: "Conte sobre sua empresa e nosso consultor de IA vai montar o squad perfeito para você.",
              })}
            </p>
          </div>

          <div className="flex flex-col gap-2 max-w-md mx-auto">
            {quickStarters.map((starter, i) => (
              <Button
                key={i}
                variant="outline"
                className="text-left justify-start h-auto py-3 px-4 text-sm rounded-xl border-border hover:border-primary/30 hover:bg-primary/5"
                onClick={() => sendMessage(starter)}
              >
                <ArrowRight className="h-3.5 w-3.5 mr-2 shrink-0 text-primary" />
                <span className="line-clamp-1">{starter}</span>
              </Button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("squads.consultant_placeholder", {
                defaultValue: "Descreva sua empresa ou desafio...",
              })}
              className="rounded-xl bg-card/50 border-border"
            />
            <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col"
        >
          {/* Chat messages */}
          <div
            ref={scrollRef}
            className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-4 scrollbar-thin"
          >
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card/60 border border-border rounded-bl-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_li]:mb-0.5">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-card/60 border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("squads.consultant_placeholder", {
                defaultValue: "Descreva sua empresa ou desafio...",
              })}
              className="rounded-xl bg-card/50 border-border"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-xl shrink-0"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <div className="text-center mt-3">
            <Link to="/auth">
              <Button variant="link" size="sm" className="text-xs text-muted-foreground gap-1">
                {t("squads.consultant_cta", { defaultValue: "Criar conta para contratar seu squad" })}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
