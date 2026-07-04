/**
 * AgentDemoModal.tsx - Live simulated demo of agents working in real-time
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ArrowRight } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";

export type DemoType = "sdr" | "support" | "hr" | "content" | "data" | "generic";

interface AgentDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  demoType: DemoType;
  lang: string;
  onCTA?: () => void;
}

interface DemoStep {
  label: string;
  content: string;
  delayMs: number;
}

const DEMO_SCENARIOS: Record<DemoType, { title: string; agent: string; emoji: string; steps: DemoStep[] }> = {
  sdr: {
    title: "SDR Agent - Prospecção",
    agent: "Apollo SDR",
    emoji: "🎯",
    steps: [
      { label: "Analisando perfil do lead...", content: "Lead: Carlos Mendes, CTO @ TechNova (SaaS B2B, 50 funcionários, São Paulo)", delayMs: 1200 },
      { label: "Pesquisando empresa...", content: "TechNova levantou R$8M Série A em Jan/2026. Stack: React, AWS. Dor provável: escalar operações sem aumentar headcount.", delayMs: 1800 },
      { label: "Gerando email personalizado...", content: "", delayMs: 800 },
      { label: "✅ Email pronto!", content: `Assunto: Carlos, como a TechNova pode escalar sem contratar +20 pessoas\n\nOlá Carlos,\n\nParabéns pela Série A da TechNova! Vi que vocês estão expandindo rápido.\n\nEmpresas no mesmo estágio que a TechNova costumam enfrentar um dilema: escalar operações sem triplicar o time. Nossos agentes de IA resolvem isso automatizando prospecção, suporte e análise - como um departamento inteiro, 24h/dia.\n\nPosso te mostrar em 15 min como funciona?\n\nAbraço,\nApollo SDR`, delayMs: 0 },
    ],
  },
  support: {
    title: "Support Agent - Ticket",
    agent: "Athena Support",
    emoji: "🛡️",
    steps: [
      { label: "Novo ticket recebido...", content: "Cliente: Maria Silva | Prioridade: Alta | \"Não consigo acessar meu painel desde ontem\"", delayMs: 1000 },
      { label: "Consultando base de conhecimento...", content: "3 artigos relevantes encontrados. Padrão detectado: sessão expirada por atualização de segurança v2.4.1", delayMs: 1500 },
      { label: "Gerando resposta...", content: "", delayMs: 800 },
      { label: "✅ Resposta enviada!", content: `Olá Maria! 👋\n\nIdentifiquei que o problema está relacionado à nossa atualização de segurança recente (v2.4.1). Para resolver:\n\n1. Limpe os cookies do navegador\n2. Acesse novamente: app.exemplo.com\n3. Faça login com suas credenciais\n\nSe persistir, já escalei internamente com prioridade. Tempo médio de resolução: 2 min.\n\nEstou aqui se precisar! 💜`, delayMs: 0 },
    ],
  },
  hr: {
    title: "HR Agent - Triagem",
    agent: "Diana HR",
    emoji: "👥",
    steps: [
      { label: "Novo currículo recebido...", content: "Candidato: João Oliveira | Vaga: Desenvolvedor Full-Stack Sr | 8 anos exp.", delayMs: 1000 },
      { label: "Analisando compatibilidade...", content: "Match: 87% | Stack compatível: React, Node, AWS | Experiência em SaaS B2B ✅ | Liderança técnica ✅", delayMs: 1600 },
      { label: "Agendando entrevista...", content: "", delayMs: 1200 },
      { label: "✅ Triagem completa!", content: `Resumo da triagem:\n\n📊 Compatibilidade: 87%\n✅ Skills técnicas: Aprovado\n✅ Cultura: Alto potencial\n⚡ Disponibilidade: Imediata\n\nEntrevista agendada: Terça, 14h\nEntrevistador: Equipe técnica\nLink enviado ao candidato automaticamente.`, delayMs: 0 },
    ],
  },
  content: {
    title: "Content Agent - Post",
    agent: "Hermes Content",
    emoji: "✍️",
    steps: [
      { label: "Analisando tendências...", content: "Trending: IA no trabalho, automação de processos, produtividade. Melhor formato: LinkedIn carousel.", delayMs: 1200 },
      { label: "Pesquisando dados...", content: "Fonte: McKinsey 2026 - \"67% das empresas que adotaram IA aumentaram receita em 15%+\"", delayMs: 1400 },
      { label: "Criando conteúdo...", content: "", delayMs: 800 },
      { label: "✅ Post pronto!", content: `🚀 Sua empresa ainda opera como em 2020?\n\nEnquanto 67% das empresas que adotaram IA já aumentaram receita em 15%+, muitas ainda gastam horas em tarefas que um agente resolve em minutos.\n\n3 sinais de que você precisa de IA:\n→ Sua equipe gasta +50% do tempo em tarefas repetitivas\n→ Leads esfriam porque ninguém responde em <5min\n→ Relatórios levam dias ao invés de segundos\n\nA pergunta não é "se" você vai adotar, mas "quando".\n\n#IA #Produtividade #Automação`, delayMs: 0 },
    ],
  },
  data: {
    title: "Data Agent - Análise",
    agent: "Oracle Analytics",
    emoji: "📊",
    steps: [
      { label: "Coletando dados de vendas...", content: "Período: últimos 90 dias | 1.247 transações | 3 canais", delayMs: 1100 },
      { label: "Processando análise...", content: "Padrão detectado: queda de 12% no canal orgânico, crescimento de 34% via referral.", delayMs: 1600 },
      { label: "Gerando insights...", content: "", delayMs: 900 },
      { label: "✅ Relatório pronto!", content: `📈 Resumo Executivo Q1/2026:\n\nReceita: R$487K (+18% vs Q4)\nMelhor canal: Referral (+34%)\n⚠️ Alerta: Orgânico caiu 12%\n\nRecomendações:\n1. Investir em programa de indicação (ROI 4.2x)\n2. Revisar SEO - 3 keywords perderam posição\n3. Upsell para base ativa: potencial R$89K\n\nPróxima ação sugerida: Reunião de estratégia amanhã 9h.`, delayMs: 0 },
    ],
  },
  generic: {
    title: "Agente IA - Demo",
    agent: "Thor AI",
    emoji: "⚡",
    steps: [
      { label: "Recebendo tarefa...", content: "Tarefa: Analisar oportunidade de mercado para expansão", delayMs: 1000 },
      { label: "Pesquisando dados...", content: "Mercado brasileiro de IA: R$12B em 2026, crescimento de 42% YoY", delayMs: 1500 },
      { label: "Processando...", content: "", delayMs: 800 },
      { label: "✅ Análise pronta!", content: `O mercado está pronto para sua entrada:\n\n📊 TAM: R$12B\n📈 Crescimento: 42% YoY\n🎯 Segmento ideal: PMEs (85% ainda não usam IA)\n💰 Ticket médio estimado: R$297/mês\n\nRecomendação: Foco em empresas de 10-200 funcionários no setor de serviços.`, delayMs: 0 },
    ],
  },
};

export function AgentDemoModal({ isOpen, onClose, demoType, lang, onCTA }: AgentDemoModalProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [typewriterText, setTypewriterText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const scenario = DEMO_SCENARIOS[demoType] || DEMO_SCENARIOS.generic;
  const isPt = lang.startsWith("pt");

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(-1);
      setTypewriterText("");
      setIsComplete(false);
      // Start first step after a short delay
      const t = setTimeout(() => setCurrentStep(0), 500);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Progress through steps
  useEffect(() => {
    if (!isOpen || currentStep < 0 || currentStep >= scenario.steps.length) return;

    const step = scenario.steps[currentStep];
    
    if (currentStep === scenario.steps.length - 1) {
      // Last step - typewriter effect
      const fullText = step.content;
      let charIdx = 0;
      setTypewriterText("");
      const interval = setInterval(() => {
        charIdx++;
        setTypewriterText(fullText.slice(0, charIdx));
        if (charIdx >= fullText.length) {
          clearInterval(interval);
          setIsComplete(true);
        }
      }, 12);
      return () => clearInterval(interval);
    } else {
      // Intermediate steps - auto-advance
      const t = setTimeout(() => setCurrentStep(prev => prev + 1), step.delayMs);
      return () => clearTimeout(t);
    }
  }, [isOpen, currentStep, scenario.steps]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg bg-background border border-accent-violet/20 rounded-2xl shadow-2xl shadow-accent-violet/10 overflow-hidden"
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-accent-violet/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{scenario.emoji}</span>
              <div>
                <h3 className="text-sm font-bold font-mono tracking-wide text-foreground">{scenario.title}</h3>
                <p className="text-[10px] font-mono text-muted-foreground">{scenario.agent} {isPt ? "em ação" : "in action"}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted/20 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Steps */}
          <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
            {scenario.steps.map((step, idx) => {
              if (idx > currentStep) return null;
              const isLast = idx === scenario.steps.length - 1;
              const isCurrent = idx === currentStep;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Step label */}
                  <div className="flex items-center gap-2 mb-1.5">
                    {idx < currentStep || isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <motion.div
                        className="w-4 h-4 rounded-full border-2 border-accent-violet/40 border-t-accent-violet shrink-0"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                    <span className={`text-xs font-mono ${idx < currentStep || isComplete ? "text-emerald-500" : "text-accent-violet"}`}>
                      {step.label}
                    </span>
                  </div>

                  {/* Step content */}
                  {step.content && (
                    <div className="ml-6 bg-muted/10 border border-accent-violet/5 rounded-lg p-3">
                      {isLast && isCurrent ? (
                        <pre className="text-[11px] font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed">
                          {typewriterText}
                          {!isComplete && (
                            <motion.span
                              className="inline-block w-[6px] h-[14px] bg-accent-violet/70 ml-[1px]"
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                            />
                          )}
                        </pre>
                      ) : (
                        <p className="text-[11px] font-mono text-foreground/60 leading-relaxed">{step.content}</p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                className="px-5 py-4 border-t border-accent-violet/10"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-xs font-mono text-muted-foreground mb-3 text-center">
                  {isPt
                    ? "Esse agente pode fazer isso por você 24h/dia. Quer começar?"
                    : "This agent can do this for you 24/7. Want to get started?"}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-accent-violet/10 text-xs font-mono text-muted-foreground hover:bg-muted/10 transition-colors"
                  >
                    {isPt ? "Fechar" : "Close"}
                  </button>
                  <button
                    onClick={() => {
                      onCTA?.();
                      onClose();
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-accent-violet text-accent-violet-foreground text-xs font-mono font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-accent-violet/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isPt ? "Quero esse agente" : "I want this agent"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
