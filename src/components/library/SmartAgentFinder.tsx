import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, ArrowRight, Zap, Star, Bot, X, Plus, Wand2 } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

interface Recommendation {
  key: string;
  reason: string;
  match: number;
}

// We need icons/metadata from Library - pass them as props
interface AgentMeta {
  icon: React.ElementType;
  tier: string;
  socialProof: { companies: number; rating: number; savings: string };
  capabilities: string[];
  slug: string;
}

interface SmartAgentFinderProps {
  agentMeta: Record<string, AgentMeta>;
  onHire: (key: string) => void;
  onPreview: (key: string) => void;
  hiringSlug: string | null;
}

const PLACEHOLDER_EXAMPLES = [
  "Tenho uma clínica odontológica e preciso automatizar agendamentos",
  "Sou dono de um e-commerce e quero aumentar vendas pelo WhatsApp",
  "Preciso de um assistente para gerenciar meu time de marketing",
  "Minha startup precisa validar o MVP e captar investidores",
  "Quero automatizar o financeiro da minha empresa",
];

const SmartAgentFinder = ({ agentMeta, onHire, onPreview, hiringSlug }: SmartAgentFinderProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "pt";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Typing animation for placeholder
  useEffect(() => {
    const target = PLACEHOLDER_EXAMPLES[placeholderIdx];
    let charIdx = 0;
    setDisplayedPlaceholder("");

    const typeInterval = setInterval(() => {
      if (charIdx <= target.length) {
        setDisplayedPlaceholder(target.slice(0, charIdx));
        charIdx++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
        }, 3000);
      }
    }, 40);

    return () => clearInterval(typeInterval);
  }, [placeholderIdx]);

  const handleSearch = async (overrideQuery?: string) => {
    const searchQuery = overrideQuery || query;
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    setHasSearched(true);
    setResults([]);

    try {
      const response = await supabase.functions.invoke("agent-concierge", {
        body: { query: searchQuery.trim() },
      });

      if (response.error) throw response.error;
      const recs = response.data?.recommendations || [];
      // Keep all results but filter to known agents
      const filtered = recs.filter((r: Recommendation) => agentMeta[r.key]);
      setResults(filtered);
    } catch (err) {
      console.error("Concierge search failed:", err);
      // Fallback
      setResults([
        { key: "omnichannel", reason: "Agente mais versátil para atendimento", match: 75 },
        { key: "sales", reason: "Impulsione suas vendas com IA", match: 70 },
        { key: "content", reason: "Criação de conteúdo automatizada", match: 65 },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setHasSearched(false);
    setQuery("");
    inputRef.current?.focus();
  };

  const tierColors: Record<string, string> = {
    intermediate: "text-cyan-400",
    advanced: "text-cyan-300",
    enterprise: "text-primary",
  };

  return (
    <section className="relative mb-4">
      {/* Ambient glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/6 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center mx-auto mb-4 border border-primary/20"
          >
            <Sparkles className="h-7 w-7 text-primary" />
          </motion.div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
            {lang === "pt" ? "Encontre seu agente ideal" : "Find your ideal agent"}
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            {lang === "pt"
              ? "Descreva sua empresa ou necessidade e nossa IA encontra os agentes perfeitos para você"
              : "Describe your business or need and our AI finds the perfect agents for you"}
          </p>
        </div>

        {/* Search bar - the star of the show */}
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="relative group"
          >
            {/* Outer glow ring on focus */}
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-primary-glow/20 to-primary/20 opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity duration-500" />

            <div className="relative flex items-center gap-2 rounded-2xl border border-border bg-card p-2 group-focus-within:border-primary/30 transition-colors duration-300">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={displayedPlaceholder + "▍"}
                  className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none font-medium"
                  disabled={isSearching}
                />
              </div>
              <Button
                type="submit"
                disabled={!query.trim() || isSearching}
                className="shrink-0 rounded-xl h-11 px-5 neon-glow font-semibold text-sm gap-2"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {lang === "pt" ? "Buscar" : "Search"}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Quick suggestion chips */}
          {!hasSearched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-2 mt-4"
            >
              {[
                lang === "pt" ? "E-commerce" : "E-commerce",
                lang === "pt" ? "Clínica" : "Clinic",
                lang === "pt" ? "Marketing" : "Marketing",
                lang === "pt" ? "Startup" : "Startup",
                lang === "pt" ? "Financeiro" : "Finance",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => { setQuery(chip); handleSearch(chip); }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card/50 text-muted-foreground hover:border-primary/30 hover:text-primary transition-all duration-200"
                >
                  {chip}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Loading state */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-2xl mx-auto mt-6"
            >
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <motion.div
                    className="absolute -inset-2 rounded-2xl border border-primary/20"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">
                  {lang === "pt" ? "Analisando seu perfil..." : "Analyzing your profile..."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto mt-6 space-y-3"
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 inline mr-1 text-primary" />
                  {lang === "pt"
                    ? `${results.length} agentes recomendados para você`
                    : `${results.length} agents recommended for you`}
                </p>
                <button onClick={clearResults} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {lang === "pt" ? "Limpar" : "Clear"}
                </button>
              </div>

              {results.map((rec, idx) => {
                const meta = agentMeta[rec.key];
                if (!meta) return null;
                const Icon = meta.icon;
                const isHiring = hiringSlug === meta.slug;

                return (
                  <motion.div
                    key={rec.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative rounded-2xl border border-border bg-card/50 hover:border-primary/20 hover:bg-card transition-all duration-300 overflow-hidden"
                  >
                    {/* Match bar */}
                    <div className="absolute top-0 left-0 h-full w-1 rounded-l-2xl" style={{
                      background: `linear-gradient(to bottom, hsl(266 100% 58% / ${rec.match / 100}), hsl(266 100% 58% / ${rec.match / 200}))`,
                    }} />

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 pl-5">
                      {/* Top row: icon + info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary-glow/10 flex items-center justify-center border border-primary/10 shrink-0 group-hover:border-primary/20 transition-colors">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-accent-violet" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h3 className="font-display font-semibold text-sm truncate">
                              {t(`library_page.agents.${rec.key}_title`)}
                            </h3>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tierColors[meta.tier] || "text-muted-foreground"} border-current/20`}>
                              {rec.match}% match
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-1">{rec.reason}</p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                              {meta.socialProof.rating}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {meta.socialProof.companies}+ empresas
                            </span>
                            <span className="text-[10px] text-primary font-medium">
                              ~{meta.socialProof.savings}/mês economia
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions - full width on mobile */}
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto pl-13 sm:pl-0">
                        <Link to={`/agente/${rec.key}`} className="flex-1 sm:flex-none">
                          <Button variant="ghost" size="sm" className="text-xs h-9 sm:h-8 px-3 text-muted-foreground hover:text-foreground w-full sm:w-auto">
                            {lang === "pt" ? "Detalhes" : "Details"}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="text-xs h-9 sm:h-8 px-4 neon-glow gap-1.5 font-semibold flex-1 sm:flex-none"
                          onClick={() => onHire(rec.key)}
                          disabled={isHiring}
                        >
                          {isHiring ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Zap className="h-3 w-3" />
                              {lang === "pt" ? "Ativar" : "Activate"}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fallback: no results OR all below 60% match */}
        {hasSearched && !isSearching && (results.length === 0 || results.every(r => r.match < 60)) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mt-6"
          >
            <div className="relative rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary-glow/5 p-6 text-center overflow-hidden">
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
              
              <div className="relative space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary-glow/15 flex items-center justify-center mx-auto border border-primary/20">
                  <Wand2 className="h-7 w-7 text-primary" />
                </div>
                
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">
                    {lang === "pt"
                      ? "Nenhum agente ideal encontrado"
                      : "No ideal agent found"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {lang === "pt"
                      ? "Que tal criar um agente personalizado? Vamos pré-preencher o objetivo com sua busca para facilitar."
                      : "How about creating a custom agent? We'll pre-fill the objective with your search to make it easy."}
                  </p>
                </div>

                <Button
                  size="lg"
                  className="neon-glow font-semibold gap-2"
                  onClick={() => navigate(`/create-agent?objetivo=${encodeURIComponent(query)}`)}
                >
                  <Plus className="h-4 w-4" />
                  {lang === "pt" ? "Criar Agente Personalizado" : "Create Custom Agent"}
                </Button>

                {results.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {lang === "pt"
                      ? `${results.length} resultado(s) parcial(is) acima - mas nenhum com mais de 60% de match.`
                      : `${results.length} partial result(s) above - but none above 60% match.`}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};

export default SmartAgentFinder;
