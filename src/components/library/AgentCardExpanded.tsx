import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, Zap, Eye, Star, TrendingUp, Loader2, 
  CheckCircle, XCircle, Lightbulb, BookOpen, Layers, 
  HelpCircle, Play, ArrowRight, Sparkles, Shield,
  BarChart3, Clock, Cpu, Target, type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { getAgentDescription, type AgentDescription } from "@/data/agentDescriptions";
import { getPriceDisplay } from "@/lib/pricing";

interface AgentCardExpandedProps {
  slug: string;
  name: string;
  icon: React.ElementType;
  tier: string;
  priceTier: string;
  capabilities: string[];
  triggers: string[];
  social: { companies: number; rating: number; savings: string };
  colors: { gradient: string; border: string; text: string; bg: string };
  lang: string;
  isAdmin: boolean;
  isHiring: boolean;
  onHire: () => void;
  onPreview: () => void;
  onNavigate: () => void;
  tierColor: string;
}

const IMPACT_CONFIG = {
  low: { label: "Baixo", color: "text-muted-foreground", bg: "bg-muted/20", ring: "ring-muted/30" },
  medium: { label: "Médio", color: "text-amber-400", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
  high: { label: "Alto", color: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
};

const COMPLEXITY_CONFIG = {
  beginner: { label: "Iniciante", color: "text-emerald-400", icon: CheckCircle },
  intermediate: { label: "Intermediário", color: "text-amber-400", icon: Layers },
  advanced: { label: "Avançado", color: "text-rose-400", icon: Cpu },
};

const SECTION_ICONS: { key: string; icon: LucideIcon; label: string }[] = [
  { key: "whatItDoes", icon: BookOpen, label: "O que faz" },
  { key: "howItWorks", icon: Cpu, label: "Como funciona" },
  { key: "whenToUse", icon: CheckCircle, label: "Quando usar" },
  { key: "whenNotToUse", icon: XCircle, label: "Quando NÃO usar" },
  { key: "expectedResults", icon: BarChart3, label: "Resultados esperados" },
  { key: "exampleInPractice", icon: Play, label: "Exemplo na prática" },
  { key: "dataInputs", icon: Layers, label: "Dados necessários" },
  { key: "output", icon: Target, label: "O que você recebe" },
];

export default function AgentCardExpanded({
  slug, name, icon: Icon, tier, priceTier, capabilities, triggers,
  social, colors, lang, isAdmin, isHiring, onHire, onPreview, onNavigate, tierColor,
}: AgentCardExpandedProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const desc = getAgentDescription(slug);
  const priceDisplay = getPriceDisplay(lang, priceTier as any);
  const impact = desc ? IMPACT_CONFIG[desc.impactLevel] : IMPACT_CONFIG.medium;
  const complexity = desc ? COMPLEXITY_CONFIG[desc.sections.complexityLevel] : COMPLEXITY_CONFIG.intermediate;

  const toggleSection = (key: string) => {
    setOpenSection(prev => prev === key ? null : key);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <div className={`group relative flex flex-col rounded-2xl overflow-hidden ring-1 ring-border/30 bg-card/30 backdrop-blur-sm transition-all duration-300 ${
        isExpanded ? "ring-primary/40 shadow-xl shadow-primary/5" : "hover:ring-primary/20 hover:bg-card/50 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/5"
      }`}>
        
        {/* ═══ LAYER 1: Instant Understanding (3s) ═══ */}
        <div className="p-5">
          {/* Labels */}
          {desc && desc.labels.length > 0 && (
            <div className="flex gap-1.5 mb-3">
              {desc.labels.map(label => (
                <span key={label} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border}/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}>
              <Icon className={`h-5 w-5 ${colors.text}`} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-tight mb-1">{name}</h4>
              {/* One-liner - outcome focused */}
              {desc && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {desc.oneLiner}
                </p>
              )}
            </div>
          </div>

          {/* Category + Impact + Rating row */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {desc && (
              <Badge variant="outline" className="text-[9px] px-2 py-0.5 h-5 border-border/50 text-muted-foreground">
                {desc.category}
              </Badge>
            )}
            <Badge variant="outline" className={`text-[9px] px-2 py-0.5 h-5 ${tierColor}`}>
              {tier}
            </Badge>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${impact.bg} ${impact.color} ring-1 ${impact.ring}`}>
              Impacto {impact.label}
            </span>
            <span className="flex items-center gap-0.5 ml-auto">
              <Star className="h-3 w-3 fill-amber-400/60 text-amber-400/60" />
              <span className="text-[10px] text-muted-foreground font-medium">{social.rating}</span>
            </span>
          </div>

          {/* Expected Outcome - the hook */}
          {desc && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 ring-1 ring-emerald-500/15 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-medium text-emerald-400">{desc.expectedOutcome}</span>
            </div>
          )}

          {/* ═══ LAYER 2: Practical Understanding (10s) ═══ */}
          {/* Capabilities */}
          <div className="flex flex-wrap gap-1 mb-3">
            {capabilities.slice(0, 4).map((cap, i) => (
              <span key={i} className="text-[9px] px-2 py-0.5 rounded-md bg-muted/20 ring-1 ring-border/20 text-foreground/60 font-medium flex items-center gap-1">
                <span className={`w-1 h-1 rounded-full shrink-0 ${
                  i % 3 === 0 ? 'bg-emerald-400' : i % 3 === 1 ? 'bg-blue-400' : 'bg-primary/70'
                }`} />
                {cap}
              </span>
            ))}
          </div>

          {/* Triggers */}
          <div className="flex items-center gap-1.5 mb-4">
            <Zap className="h-2.5 w-2.5 text-amber-400/50 shrink-0" />
            <span className="text-[9px] text-muted-foreground/50 truncate">
              Ativado por: {triggers.slice(0, 3).map(t => t.replace(/_/g, " ")).join(" · ")}
            </span>
          </div>

          {/* Price + Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/15">
            <div>
              <span className="font-bold text-sm">{priceDisplay}</span>
              <span className="text-[9px] text-muted-foreground/40 ml-1">/mês</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Expand for deep info */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 rounded-lg text-[9px] gap-1"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              >
                <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                {isExpanded ? "Fechar" : "Detalhes"}
              </Button>

              {isAdmin ? (
                <Button
                  size="sm"
                  className="h-7 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider gap-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={onNavigate}
                >
                  <Zap className="h-3 w-3" />
                  Acessar
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-7 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider gap-1"
                  disabled={isHiring}
                  onClick={onHire}
                >
                  {isHiring ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Contratar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ═══ LAYER 3: Deep Understanding (Expandable) ═══ */}
        <AnimatePresence>
          {isExpanded && desc && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-1 border-t border-border/15 pt-4">
                {/* Complexity indicator */}
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-muted/10 ring-1 ring-border/10">
                  <complexity.icon className={`h-3.5 w-3.5 ${complexity.color}`} />
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Nível: <span className={complexity.color}>{complexity.label}</span>
                  </span>
                  <span className="text-[9px] text-muted-foreground/40 ml-auto flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    Setup ~5min
                  </span>
                </div>

                {/* Accordion sections */}
                {SECTION_ICONS.map(({ key, icon: SIcon, label }) => {
                  const content = desc.sections[key as keyof typeof desc.sections];
                  if (typeof content !== "string") return null;
                  const isOpen = openSection === key;

                  return (
                    <div key={key} className="rounded-xl overflow-hidden ring-1 ring-border/10">
                      <button
                        onClick={() => toggleSection(key)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/10 transition-colors"
                      >
                        <SIcon className={`h-3.5 w-3.5 shrink-0 ${isOpen ? colors.text : "text-muted-foreground/50"}`} />
                        <span className={`text-[11px] font-medium flex-1 ${isOpen ? "text-foreground" : "text-muted-foreground"}`}>
                          {label}
                        </span>
                        <ChevronDown className={`h-3 w-3 text-muted-foreground/30 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pl-9">
                              <p className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line">
                                {content}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* FAQ Section */}
                <div className="rounded-xl overflow-hidden ring-1 ring-border/10 mt-2">
                  <button
                    onClick={() => toggleSection("faq")}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/10 transition-colors"
                  >
                    <HelpCircle className={`h-3.5 w-3.5 shrink-0 ${openSection === "faq" ? colors.text : "text-muted-foreground/50"}`} />
                    <span className={`text-[11px] font-medium flex-1 ${openSection === "faq" ? "text-foreground" : "text-muted-foreground"}`}>
                      Perguntas Frequentes
                    </span>
                    <ChevronDown className={`h-3 w-3 text-muted-foreground/30 transition-transform duration-200 ${openSection === "faq" ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openSection === "faq" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pl-9 space-y-3">
                          {desc.faq.map((item, i) => (
                            <div key={i}>
                              <p className="text-[11px] font-semibold text-foreground/80 mb-0.5">{item.q}</p>
                              <p className="text-[10px] leading-relaxed text-muted-foreground">{item.a}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom CTA */}
                <div className="flex items-center gap-2 pt-3 mt-2">
                  <Link to={`/agente/${slug}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full h-8 text-[10px] gap-1 rounded-xl border-border/30">
                      <Eye className="h-3 w-3" />
                      Ver página completa
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-[10px] gap-1 rounded-xl"
                    onClick={onPreview}
                  >
                    <Play className="h-3 w-3" />
                    Demo ao vivo
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
