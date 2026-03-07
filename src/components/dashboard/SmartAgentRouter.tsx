import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Bot, ArrowRight, Zap, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { agentKeys, agentIcons, agentTags } from "@/data/libraryAgentData";
import { SLUG_TO_DEPT, DEPARTMENTS } from "@/data/departmentMap";

interface SmartAgentRouterProps {
  contractedAgentSlugs: string[];
  onSelectAgent: (slug: string) => void;
  onAskThor: (message: string) => void;
}

type Suggestion = { slug: string; score: number; reason: string };

const INTENT_MAP: Record<string, string[]> = {
  "email": ["sales", "marketing_automation", "copywriting", "sdr_outbound"],
  "venda": ["sales", "sdr_outbound", "hunter", "revenue"],
  "vendas": ["sales", "sdr_outbound", "hunter", "revenue"],
  "lead": ["sdr_inbound", "sdr_outbound", "pre_qualifier", "hunter"],
  "contrato": ["contract_analyst", "contract_negotiator", "legal"],
  "financeiro": ["ai_cfo", "revenue", "digital_accountant"],
  "suporte": ["support_channel", "support_lead", "voice_support"],
  "marketing": ["content", "marketing_automation", "seo_growth", "media_buyer"],
  "rh": ["hr", "people_analytics", "training"],
  "juridico": ["legal", "compliance_officer", "labor_law"],
  "design": ["creative_design", "creative_writer", "branding"],
  "seo": ["seo_growth", "content", "copywriting"],
  "whatsapp": ["sdr_whatsapp", "whatsapp_commerce", "omnichannel"],
  "linkedin": ["sdr_linkedin", "public_relations"],
  "instagram": ["sdr_instagram", "influencer", "content_producer"],
  "proposta": ["proposal_gen", "sales", "copywriting"],
  "reunião": ["scheduler", "concierge"],
  "relatório": ["data_analytics", "ai_cfo", "research"],
  "estoque": ["inventory", "logistics", "supply_chain"],
  "qualidade": ["quality", "process_analyst"],
  "compra": ["procurement", "cost_analyst", "supplier_mgr"],
};

function matchIntents(query: string, contractedSlugs: string[]): Suggestion[] {
  const q = query.toLowerCase().trim();
  const scores: Record<string, number> = {};
  const reasons: Record<string, string> = {};

  // Keyword matching
  for (const [keyword, slugs] of Object.entries(INTENT_MAP)) {
    if (q.includes(keyword)) {
      for (const slug of slugs) {
        scores[slug] = (scores[slug] || 0) + 3;
        reasons[slug] = `Relevante para "${keyword}"`;
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

  // Boost contracted agents
  for (const slug of contractedSlugs) {
    if (scores[slug]) scores[slug] += 5;
  }

  return Object.entries(scores)
    .map(([slug, score]) => ({ slug, score, reason: reasons[slug] || "" }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

export default function SmartAgentRouter({ contractedAgentSlugs, onSelectAgent, onAskThor }: SmartAgentRouterProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      setSuggestions(matchIntents(query, contractedAgentSlugs));
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm">
            {t("router.title", { defaultValue: "O que você precisa resolver?" })}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("router.subtitle", { defaultValue: "Descreva e encontramos o agente ideal automaticamente" })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("router.placeholder", { defaultValue: "Ex: preciso prospectar leads no LinkedIn..." })}
          className="w-full h-11 px-4 pr-12 text-sm rounded-xl bg-background/60 border border-border/40 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

      {/* Smart suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
              {t("router.suggestions", { defaultValue: "Agentes recomendados" })}
            </p>
            {suggestions.map((s, i) => {
              const Icon = agentIcons[s.slug] || Bot;
              const isContracted = contractedAgentSlugs.includes(s.slug);
              const deptId = SLUG_TO_DEPT[s.slug];
              const dept = deptId ? DEPARTMENTS[deptId] : null;

              return (
                <motion.button
                  key={s.slug}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelectAgent(s.slug)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/30 transition-colors group text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate capitalize">{s.slug.replace(/_/g, " ")}</span>
                      {isContracted && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-500">
                          Contratado
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      {dept?.label || ""} · {s.reason}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick actions when no query */}
      {query.length < 2 && (
        <div className="flex flex-wrap gap-1.5">
          {["Prospectar leads", "Enviar email", "Criar relatório", "Suporte ao cliente", "Análise financeira"].map((label) => (
            <button
              key={label}
              onClick={() => setQuery(label)}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
