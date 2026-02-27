import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

// Pre-scripted demo conversations per agent key (no tokens consumed)
const agentDemos: Record<string, ChatMessage[]> = {
  voice_ai: [
    { role: "user", text: "Preciso ligar para 50 leads qualificados hoje." },
    { role: "agent", text: "Iniciando discagem automática. Prioridade: leads score > 80. Primeira chamada em 3s... 📞" },
    { role: "user", text: "E se o lead não atender?" },
    { role: "agent", text: "Agendo callback automático em 2h e envio SMS personalizado. Taxa de reconexão: 73%." },
  ],
  orchestrator: [
    { role: "user", text: "Preciso de um relatório financeiro + análise de mercado." },
    { role: "agent", text: "Delegando para CFO Agent (financeiro) e Research Agent (mercado). ETA: 4 min." },
    { role: "agent", text: "✅ CFO: relatório pronto. ✅ Research: análise concluída. Consolidando..." },
  ],
  coding: [
    { role: "user", text: "Tem um bug no checkout, clientes não finalizam compra." },
    { role: "agent", text: "Analisando logs... Encontrei: timeout na API de pagamento (linha 247). Corrigindo e abrindo PR." },
    { role: "agent", text: "PR #142 aberto com fix + teste unitário. Pipeline verde. ✅" },
  ],
  sales: [
    { role: "user", text: "Qual o status do pipeline esse mês?" },
    { role: "agent", text: "47 oportunidades ativas. R$ 380k em forecast. 12 deals para fechar essa semana. Agendei follow-ups." },
  ],
  omnichannel: [
    { role: "user", text: "Cliente reclamando no WhatsApp sobre atraso." },
    { role: "agent", text: "Identifiquei o pedido #4521. Rastreamento mostra entrega para amanhã. Respondi o cliente com tracking link e cupom de desculpas." },
  ],
  content: [
    { role: "user", text: "Preciso de posts para a Black Friday." },
    { role: "agent", text: "Criados: 5 carrosséis Instagram, 3 reels com copy, 10 stories com countdown. Agendados de 20-29/nov. 🎯" },
  ],
  security: [
    { role: "user", text: "Rodou o scan de vulnerabilidade?" },
    { role: "agent", text: "Scan completo. 0 críticos, 2 médios (deps desatualizadas). PRs de fix já abertos. Relatório LGPD atualizado. 🛡️" },
  ],
  revenue: [
    { role: "user", text: "Como está o fluxo de caixa?" },
    { role: "agent", text: "Positivo em R$ 142k. Projeção 90 dias: estável. 3 faturas vencendo sexta — lembretes enviados automaticamente. 💰" },
  ],
  customer_success: [
    { role: "user", text: "Algum cliente em risco de churn?" },
    { role: "agent", text: "3 contas com health score < 40. Já iniciei playbook de retenção: call personalizada + oferta exclusiva agendada." },
  ],
  hr: [
    { role: "user", text: "Como está o processo seletivo?" },
    { role: "agent", text: "45 CVs triados, 12 entrevistas agendadas. Top 3 candidatos com fit cultural > 90%. Relatório enviado ao seu email. 📋" },
  ],
  data_analytics: [
    { role: "user", text: "Qual produto vende mais às terças?" },
    { role: "agent", text: "Produto A: +47% às terças vs média. Correlação com campanha de email (enviada segunda 18h). Recomendo replicar padrão. 📊" },
  ],
  legal: [
    { role: "user", text: "Revisa esse contrato de fornecedor?" },
    { role: "agent", text: "Analisado. 3 cláusulas de risco identificadas: penalidade desproporcional (§4.2), foro desfavorável (§12), IP ambígua (§7). Sugestões de redação prontas. ⚖️" },
  ],
  ecommerce: [
    { role: "user", text: "Quais produtos preciso repor?" },
    { role: "agent", text: "7 SKUs com estoque < 3 dias. Pedido de reposição gerado automaticamente. Previsão de demanda atualizada para próximos 30 dias. 📦" },
  ],
  marketing_automation: [
    { role: "user", text: "Como está a campanha de nutrição?" },
    { role: "agent", text: "Sequência ativa: 2.340 leads. Taxa abertura: 42% (acima do benchmark). 89 MQLs prontos para vendas. Disparando notificação ao time. 🎯" },
  ],
  tax_content: [
    { role: "user", text: "Preciso de conteúdo sobre o novo regime tributário." },
    { role: "agent", text: "Criados: 3 artigos (Simples Nacional 2025, MEI atualizado, ICMS-ST). Linguagem acessível, referências legais incluídas. Agendados no blog. 📋" },
  ],
  copywriting: [
    { role: "user", text: "Preciso de copy pra página de vendas do curso." },
    { role: "agent", text: "Headline testada: 'De R$ 0 a R$ 50k/mês em 90 dias'. 3 variações de VSL, 5 CTAs com urgência progressiva. Taxa conversão estimada: 4.2%. ✍️" },
  ],
  positioning: [
    { role: "user", text: "Como posicionar nossa marca no mercado premium?" },
    { role: "agent", text: "Análise concorrencial pronta. 3 territórios de marca identificados. Recomendo: 'expertise + exclusividade'. Manifesto de marca e tom de voz criados. 🎯" },
  ],
  branding: [
    { role: "user", text: "Precisamos atualizar nossa identidade visual." },
    { role: "agent", text: "Auditoria de marca concluída. Proposta: paleta atualizada (3 cores), tipografia premium, guidelines de aplicação. Moodboard aprovado internamente. 🎨" },
  ],
  public_relations: [
    { role: "user", text: "Saiu uma matéria negativa sobre nós." },
    { role: "agent", text: "Monitoramento ativo. Nota oficial redigida e enviada a 12 veículos. 3 pautas positivas agendadas. Sentimento já revertendo nas redes. 📰" },
  ],
  social_proof: [
    { role: "user", text: "Preciso de mais depoimentos de clientes." },
    { role: "agent", text: "Disparei pesquisa NPS para 340 clientes. 47 respostas 9-10 coletadas. 12 cases formatados com antes/depois. Carrossel de provas prontos. ⭐" },
  ],
  events_speaker: [
    { role: "user", text: "Temos um evento em 30 dias, preciso organizar tudo." },
    { role: "agent", text: "Checklist criado: 84 itens. Palestrantes confirmados (3/5). Landing page publicada. Email marketing agendado em 3 ondas. Já vendemos 120 ingressos. 🎤" },
  ],
  sdr_social: [
    { role: "user", text: "Preciso prospectar no Instagram e TikTok." },
    { role: "agent", text: "247 perfis ICP mapeados. 89 DMs personalizadas enviadas. Taxa de resposta: 23%. 12 calls agendadas para essa semana. 📱" },
  ],
  sdr_linkedin: [
    { role: "user", text: "Quero atingir decision-makers de tecnologia." },
    { role: "agent", text: "Lista de 180 CTOs/VPs segmentada. Sequência de 4 touchpoints ativa. 34 conexões aceitas hoje. 8 interessados para call. 💼" },
  ],
  sdr_instagram: [
    { role: "user", text: "Como está a prospecção pelo Instagram?" },
    { role: "agent", text: "Stories com enquete: 1.2k respostas. 89 leads qualificados via DM. Funil ativo: 23 em negociação. Próximo: live com oferta exclusiva. 📸" },
  ],
  sdr_whatsapp: [
    { role: "user", text: "Manda a lista de leads de hoje." },
    { role: "agent", text: "142 leads contatados via WhatsApp. 67 responderam. 28 qualificados (BANT). 9 agendamentos confirmados. Follow-up automático em 2h. 💬" },
  ],
  sdr_outbound: [
    { role: "user", text: "Preciso de 50 reuniões esse mês." },
    { role: "agent", text: "Meta: 50 reuniões. Cadência ativa: 800 prospects. 340 emails enviados hoje. 12 respostas positivas. Projeção: 54 reuniões. 🎯" },
  ],
  sdr_inbound: [
    { role: "user", text: "Quantos leads entraram pelo site hoje?" },
    { role: "agent", text: "78 leads capturados. 45 qualificados automaticamente (score > 70). 12 encaminhados para closers. Tempo médio de resposta: 47 segundos. ⚡" },
  ],
  sdr_database: [
    { role: "user", text: "Preciso enriquecer minha base de leads." },
    { role: "agent", text: "Base atualizada: 4.200 contatos. 890 emails validados. 340 novos telefones encontrados. 67 empresas com fit ideal identificadas. 🔍" },
  ],
  sdr_events: [
    { role: "user", text: "Tem uma feira de tecnologia semana que vem." },
    { role: "agent", text: "Lista de participantes obtida: 2.300 empresas. 180 pré-agendamentos via email. QR code para captação no stand configurado. Follow-up D+1 programado. 🏢" },
  ],
  sdr_partnerships: [
    { role: "user", text: "Quero expandir via canais de parceria." },
    { role: "agent", text: "45 parceiros potenciais mapeados. 12 propostas de co-marketing enviadas. 3 acordos em negociação. Receita projetada: R$ 89k/mês via canal. 🤝" },
  ],
  pre_qualifier: [
    { role: "user", text: "Muitos leads ruins chegando no closer." },
    { role: "agent", text: "Filtro BANT+ICP ativado. De 200 leads, 34 passaram (17%). Economia de 40h/mês do time de vendas. Score médio dos qualificados: 87. ✅" },
  ],
  hunter: [
    { role: "user", text: "Preciso abrir mercado no setor de saúde." },
    { role: "agent", text: "340 clínicas/hospitais mapeados. ICP refinado: +50 leitos, faturamento > R$ 5M. 23 primeiros contatos feitos. 5 reuniões agendadas. 🏥" },
  ],
  farmer: [
    { role: "user", text: "Como está a expansão da base atual?" },
    { role: "agent", text: "Health score da carteira: 82/100. 12 upsells identificados (R$ 234k potencial). 3 renovações antecipadas. Churn previsto: 2.1% (meta: 3%). 🌱" },
  ],
  contract_analyst: [
    { role: "user", text: "Revisa esse contrato de licenciamento?" },
    { role: "agent", text: "Analisado. 4 cláusulas de risco: multa abusiva (§3.1), renovação automática sem aviso (§8), IP cedida (§5.2), foro desfavorável (§12). Sugestões prontas. 📋" },
  ],
  compliance_officer: [
    { role: "user", text: "Estamos em compliance com a LGPD?" },
    { role: "agent", text: "Scan completo: 3 gaps identificados — consentimento de cookies incompleto, política de retenção ausente, DPO não nomeado. Plano de ação gerado. 🛡️" },
  ],
  labor_law: [
    { role: "user", text: "Calcule a rescisão do funcionário João." },
    { role: "agent", text: "Rescisão sem justa causa calculada: FGTS + multa 40% (R$ 12.340), aviso prévio (30d), férias prop. + 1/3, 13º prop. Total: R$ 18.720. eSocial gerado. ⚖️" },
  ],
  litigation: [
    { role: "user", text: "Quantos processos ativos temos?" },
    { role: "agent", text: "47 processos ativos. 3 com prazo essa semana (contestação). Risco financeiro total: R$ 890k. Petição de defesa para processo #23 já redigida. ⚖️" },
  ],
  procurement: [
    { role: "user", text: "Preciso comprar 500 notebooks para o time." },
    { role: "agent", text: "3 cotações obtidas: Dell (R$ 3.200/un), Lenovo (R$ 3.050/un), HP (R$ 3.380/un). Lenovo tem melhor TCO. Saving de 8% vs última compra. Pedido pronto. 📦" },
  ],
  supplier_mgr: [
    { role: "user", text: "Como está o score dos nossos fornecedores?" },
    { role: "agent", text: "45 fornecedores ativos. 38 com score > 80. 3 abaixo do SLA (entrega atrasada > 15%). Alerta enviado + reunião agendada com os 3. 🏭" },
  ],
  cost_analyst: [
    { role: "user", text: "Onde estamos gastando mais que o orçado?" },
    { role: "agent", text: "3 centros de custo acima do budget: TI (+18%), Marketing (+12%), Facilities (+7%). Principal driver: licenças SaaS não utilizadas (R$ 34k/mês). 💰" },
  ],
  contract_negotiator: [
    { role: "user", text: "Preciso renegociar o contrato com a AWS." },
    { role: "agent", text: "Benchmark: empresas similares pagam 22% menos. Playbook preparado: committed use discount + reserved instances. Economia projetada: R$ 180k/ano. 🤝" },
  ],
  logistics: [
    { role: "user", text: "Como otimizar as entregas de São Paulo?" },
    { role: "agent", text: "Roteirização otimizada: 23 rotas consolidadas em 15. Economia de 31% em combustível. Tempo médio de entrega: 2.1h → 1.4h. Rastreamento ativo. 🚛" },
  ],
  inventory: [
    { role: "user", text: "Tem algum produto em risco de ruptura?" },
    { role: "agent", text: "12 SKUs com estoque < 5 dias. 3 críticos (ABC classe A). Pedidos de reposição automáticos enviados. Previsão de demanda atualizada para 60 dias. 📦" },
  ],
  quality: [
    { role: "user", text: "Quando é a próxima auditoria ISO?" },
    { role: "agent", text: "Auditoria ISO 9001 em 45 dias. Checklist: 89% conforme. 4 não-conformidades abertas — 2 já com ação corretiva. Relatório pré-auditoria gerado. ✅" },
  ],
  process_analyst: [
    { role: "user", text: "O processo de onboarding está muito lento." },
    { role: "agent", text: "Mapeamento BPMN: 23 etapas, 5 gargalos identificados. Proposta Lean: eliminar 8 etapas, automatizar 4. Tempo estimado: 12 dias → 4 dias. ⚙️" },
  ],
};

// Fallback for agents without custom demo
const defaultDemo: ChatMessage[] = [
  { role: "user", text: "O que você pode fazer por mim?" },
  { role: "agent", text: "Posso automatizar suas tarefas, gerar relatórios e tomar decisões baseadas em dados. Tudo 24/7, sem pausas. 🚀" },
];

interface AgentMiniChatProps {
  agentKey: string;
  agentName: string;
}

export default function AgentMiniChat({ agentKey, agentName }: AgentMiniChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messages = agentDemos[agentKey] || defaultDemo;

  useEffect(() => {
    if (!isOpen) {
      setVisibleCount(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setVisibleCount(1);
    let count = 1;
    intervalRef.current = setInterval(() => {
      count++;
      if (count > messages.length) {
        count = 0;
        setVisibleCount(0);
        setTimeout(() => setVisibleCount(1), 800);
        return;
      }
      setVisibleCount(count);
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, messages.length]);

  return (
    <div className="mt-auto">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/25 transition-colors text-[10px]"
      >
        <span className="flex items-center gap-1.5 text-primary/70 font-medium">
          <MessageSquare className="h-3 w-3" />
          Demo ao vivo
        </span>
        {isOpen ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 p-2.5 rounded-lg bg-background/60 border border-border/40 space-y-1.5 max-h-36 overflow-y-auto">
              <AnimatePresence>
                {messages.slice(0, visibleCount).map((msg, idx) => (
                  <motion.div
                    key={`${agentKey}-${idx}-${visibleCount}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-1.5 ${msg.role === "user" ? "justify-end" : ""}`}
                  >
                    {msg.role === "agent" && (
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-2 w-2 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-2 py-1 rounded-lg text-[10px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary/10 text-foreground/80"
                        : "bg-white/[0.03] text-foreground/70 border border-white/[0.04]"
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {visibleCount > 0 && visibleCount < messages.length && (
                <div className="flex items-center gap-1 pt-0.5">
                  <div className="flex gap-0.5">
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[8px] text-muted-foreground">{agentName.split("—")[0].trim()} digitando...</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
