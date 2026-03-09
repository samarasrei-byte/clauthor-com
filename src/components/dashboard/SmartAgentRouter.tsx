import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Sparkles, Bot, ArrowRight, Zap, Brain,
  CheckCircle2, Users, GitBranch, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { agentKeys, agentIcons, agentTags } from "@/data/libraryAgentData";
import { SLUG_TO_DEPT, DEPARTMENTS } from "@/data/departmentMap";

interface SmartAgentRouterProps {
  contractedAgentSlugs: string[];
  onSelectAgent: (slug: string) => void;
  onAskThor: (message: string) => void;
}

type Suggestion = { slug: string; score: number; reason: string };

// Extended intent map — covers more natural language patterns
const INTENT_MAP: Record<string, string[]> = {
  "email": ["sales", "marketing_automation", "copywriting", "sdr_outbound"],
  "venda": ["sales", "sdr_outbound", "hunter", "revenue"],
  "vendas": ["sales", "sdr_outbound", "hunter", "revenue"],
  "lead": ["sdr_inbound", "sdr_outbound", "pre_qualifier", "hunter"],
  "prospectar": ["sdr_outbound", "hunter", "sdr_inbound"],
  "prospects": ["sdr_outbound", "hunter", "pre_qualifier"],
  "contrato": ["contract_analyst", "contract_negotiator", "legal"],
  "financeiro": ["ai_cfo", "revenue", "digital_accountant"],
  "finanças": ["ai_cfo", "revenue", "digital_accountant"],
  "caixa": ["ai_cfo", "revenue", "digital_accountant"],
  "suporte": ["support_channel", "support_lead", "voice_support"],
  "atendimento": ["support_channel", "support_lead", "omnichannel"],
  "cliente": ["support_channel", "sdr_inbound", "pre_qualifier"],
  "marketing": ["content", "marketing_automation", "seo_growth", "media_buyer"],
  "campanha": ["marketing_automation", "content", "copywriting", "media_buyer"],
  "rh": ["hr", "people_analytics", "training"],
  "funcionario": ["hr", "people_analytics", "training"],
  "juridico": ["legal", "compliance_officer", "labor_law"],
  "design": ["creative_design", "creative_writer", "branding"],
  "logo": ["creative_design", "branding"],
  "seo": ["seo_growth", "content", "copywriting"],
  "google": ["seo_growth", "media_buyer"],
  "whatsapp": ["sdr_outbound", "omnichannel", "support_channel"],
  "linkedin": ["sdr_outbound", "public_relations"],
  "instagram": ["content", "influencer", "sdr_outbound"],
  "redes sociais": ["content", "sdr_outbound", "marketing_automation"],
  "proposta": ["proposal_gen", "sales", "copywriting"],
  "reunião": ["scheduler", "concierge"],
  "agendar": ["scheduler", "concierge"],
  "relatório": ["data_analytics", "ai_cfo", "research"],
  "análise": ["data_analytics", "research", "ai_cfo"],
  "dados": ["data_analytics", "research"],
  "estoque": ["inventory", "logistics", "supply_chain"],
  "logística": ["logistics", "supply_chain", "inventory"],
  "qualidade": ["quality", "process_analyst"],
  "compra": ["procurement", "cost_analyst", "supplier_mgr"],
  "lançar": ["marketing_automation", "content", "sales", "copywriting"],
  "produto": ["sales", "content", "marketing_automation"],
  "automatizar": ["marketing_automation", "support_channel", "sdr_outbound"],
  "automação": ["marketing_automation", "support_channel"],
  "crescer": ["seo_growth", "sdr_outbound", "marketing_automation", "revenue"],
  "receita": ["revenue", "ai_cfo", "sales"],
  "copa": ["content", "marketing_automation", "copywriting"],
  "texto": ["copywriting", "content", "creative_writer"],
  "copy": ["copywriting", "content", "creative_writer"],
  "conteúdo": ["content", "copywriting", "creative_writer"],
};

function matchIntents(query: string, contractedSlugs: string[]): Suggestion[] {
  const q = query.toLowerCase().trim();
  const scores: Record<string, number> = {};
  const reasons: Record<string, string> = {};

  // Multi-word phrase matching (higher weight)
  for (const [keyword, slugs] of Object.entries(INTENT_MAP)) {
    if (keyword.includes(" ") && q.includes(keyword)) {
      for (const slug of slugs) {
        scores[slug] = (scores[slug] || 0) + 5;
        reasons[slug] = `Relevante para "${keyword}"`;
      }
    }
  }

  // Single word matching
  for (const [keyword, slugs] of Object.entries(INTENT_MAP)) {
    if (!keyword.includes(" ") && q.includes(keyword)) {
      for (const slug of slugs) {
        scores[slug] = (scores[slug] || 0) + 3;
        reasons[slug] = reasons[slug] || `Relevante para "${keyword}"`;
      }
    }
  }

  // Tag matching
  for (const key of agentKeys) {
    const tags = agentTags[key] || [];
    for (const tag of tags) {
      if (q.includes(tag.toLowerCase())) {
        scores[key] = (scores[key] || 0) + 2;
        reasons[key] = reasons[key] || `Match: ${tag}`;
      }
    }
  }

  // Agent name matching (2x boost)
  for (const key of agentKeys) {
    const name = key.replace(/_/g, " ").toLowerCase();
    if (q.includes(name) || name.includes(q)) {
      scores[key] = (scores[key] || 0) + 6;
      reasons[key] = reasons[key] || `Agente especializado`;
    }
  }

  // Strong boost for contracted agents
  for (const slug of contractedSlugs) {
    if (scores[slug]) scores[slug] += 8;
  }

  return Object.entries(scores)
    .map(([slug, score]) => ({ slug, score, reason: reasons[slug] || "" }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

// Collaboration hint: which agents TYPICALLY work together
const COLLABORATION_HINTS: Record<string, string[]> = {
  "campanha": ["content", "copywriting", "media_buyer"],
  "lançar": ["marketing_automation", "copywriting", "content"],
  "vendas": ["sdr_outbound", "pre_qualifier", "sales"],
  "suporte": ["support_channel", "voice_support"],
  "financeiro": ["ai_cfo", "digital_accountant", "revenue"],
};

function getCollaborationHint(query: string): string[] {
  const q = query.toLowerCase();
  for (const [key, agents] of Object.entries(COLLABORATION_HINTS)) {
    if (q.includes(key)) return agents.slice(0, 3);
  }
  return [];
}

const QUICK_INTENTS = [
  { label: "Prospectar leads", emoji: "🎯" },
  { label: "Criar campanha", emoji: "📣" },
  { label: "Analisar dados", emoji: "📊" },
  { label: "Melhorar suporte", emoji: "🎧" },
  { label: "Relatório financeiro", emoji: "💰" },
  { label: "Automatizar processos", emoji: "⚡" },
];

export default function SmartAgentRouter({ contractedAgentSlugs, onSelectAgent, onAskThor }: SmartAgentRouterProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [collaborationHint, setCollaborationHint] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setCollaborationHint([]);
      return;
    }
    const timer = setTimeout(() => {
      setSuggestions(matchIntents(query, contractedAgentSlugs));
      setCollaborationHint(getCollaborationHint(query));
    }, 150);
    return () => clearTimeout(timer);
  }, [query, contractedAgentSlugs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (suggestions.length > 0) {
      onSelectAgent(suggestions[0].slug);
    } else {
      onAskThor(query);
    }
  };

  const contractedSuggestions = suggestions.filter(s => contractedAgentSlugs.includes(s.slug));
  const otherSuggestions = suggestions.filter(s => !contractedAgentSlugs.includes(s.slug));
  const hasCollaboration = collaborationHint.length > 1 && contractedAgentSlugs.some(s => collaborationHint.includes(s));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm">O que você precisa resolver hoje?</h3>
          <p className="text-xs text-muted-foreground">Descreva e os agentes certos serão acionados automaticamente</p>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-4">
        {/* Input */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ex: "Quero criar uma campanha para a Copa do Mundo"'
            className="w-full h-12 px-4 pr-12 text-sm rounded-xl bg-background/60 border border-border/40 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Quick intents */}
        {query.length < 2 && (
          <div className="flex flex-wrap gap-1.5">
            {QUICK_INTENTS.map(({ label, emoji }) => (
              <button
                key={label}
                onClick={() => setQuery(label)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors border border-border/10"
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {/* Collaboration hint */}
              {hasCollaboration && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10"
                >
                  <GitBranch className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Tarefa multiagente detectada.</span>{" "}
                    Os agentes irão colaborar automaticamente para entregar o resultado completo.
                  </p>
                </motion.div>
              )}

              {/* Contracted agents first */}
              {contractedSuggestions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Seus agentes contratados
                  </p>
                  {contractedSuggestions.map((s, i) => {
                    const Icon = agentIcons[s.slug] || Bot;
                    const deptId = SLUG_TO_DEPT[s.slug];
                    const dept = deptId ? DEPARTMENTS[deptId] : null;
                    return (
                      <motion.button
                        key={s.slug}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => onSelectAgent(s.slug)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/20 transition-all group text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate capitalize">{s.slug.replace(/_/g, " ")}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-500 shrink-0">
                              Ativo
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground truncate block">
                            {dept?.label || "Agente especializado"} · {s.reason}
                          </span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-emerald-400 transition-colors shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Other suggestions (not contracted) */}
              {otherSuggestions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary/60" />
                    Agentes recomendados
                  </p>
                  {otherSuggestions.map((s, i) => {
                    const Icon = agentIcons[s.slug] || Bot;
                    const deptId = SLUG_TO_DEPT[s.slug];
                    const dept = deptId ? DEPARTMENTS[deptId] : null;
                    return (
                      <motion.button
                        key={s.slug}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => onSelectAgent(s.slug)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/30 transition-colors group text-left opacity-70 hover:opacity-100"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate capitalize">{s.slug.replace(/_/g, " ")}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground truncate block">
                            {dept?.label || "Agente especializado"} · {s.reason}
                          </span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Ask Thor fallback */}
              <button
                onClick={() => onAskThor(query)}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-all"
              >
                <Rocket className="h-3.5 w-3.5 text-primary/50" />
                <span>Ou pergunte ao <strong>THOR</strong> — nosso consultor de IA</span>
                <ArrowRight className="h-3 w-3 ml-auto" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No results → Ask Thor */}
        {query.length >= 3 && suggestions.length === 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onAskThor(query)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Perguntar ao THOR</p>
              <p className="text-xs text-muted-foreground">Nosso consultor de IA vai entender e recomendar a melhor solução</p>
            </div>
            <ArrowRight className="h-4 w-4 text-primary/50 ml-auto shrink-0" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
