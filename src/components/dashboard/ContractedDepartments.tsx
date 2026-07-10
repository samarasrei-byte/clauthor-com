import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Sparkles, ArrowRight, Target, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEPARTMENT_PACKAGES } from "@/data/departmentPackages";

interface ContractedDept {
  id: string;
  department_id: string;
  department_name: string;
  monthly_price_cents: number;
  currency: string;
  agent_count: number;
  agent_ids: string[];
  pain_point: string | null;
  company_snapshot: { name?: string | null; contact_name?: string | null; email?: string | null };
  onboarding_snapshot: Record<string, any>;
  status: string;
  created_at: string;
}

interface Props {
  onSelectAgent?: (agentId: string) => void;
  onExplore?: () => void;
}

const ContractedDepartments = ({ onSelectAgent, onExplore }: Props) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ContractedDept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("contracted_departments")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setItems((data as any) || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading || items.length === 0) return null;

  const formatPrice = (cents: number, currency: string) => {
    const value = cents / 100;
    return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
      aria-label="Departamentos contratados"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h2 className="font-display font-semibold text-sm">
            Seus departamentos ({items.length})
          </h2>
        </div>
        {onExplore && (
          <Button variant="ghost" size="sm" onClick={onExplore} className="text-xs gap-1 h-7">
            Contratar mais <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((dept, i) => {
          const pkg = DEPARTMENT_PACKAGES.find((p) => p.id === dept.department_id);
          const Icon = pkg?.icon || Briefcase;
          const company = dept.company_snapshot?.name;
          const contact = dept.company_snapshot?.contact_name;
          const pain = dept.pain_point || dept.onboarding_snapshot?.pain;

          return (
            <motion.article
              key={dept.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-4 space-y-3 border border-border/40 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sm leading-tight">
                      {dept.department_name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Contratado em {new Date(dept.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short",
                      })}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0 bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20">
                  Ativo
                </Badge>
              </div>

              {pain && (
                <div className="rounded-lg border border-border/30 bg-background/40 p-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    <Target className="h-3 w-3" /> Dor identificada
                  </div>
                  <p className="text-xs text-foreground/80 line-clamp-2">{pain}</p>
                </div>
              )}

              {(company || contact) && (
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  {company && (
                    <span className="flex items-center gap-1 truncate">
                      <Building2 className="h-3 w-3 shrink-0" /> {company}
                    </span>
                  )}
                  {contact && (
                    <span className="flex items-center gap-1 truncate">
                      <Sparkles className="h-3 w-3 shrink-0" /> {contact}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{dept.agent_count}</span>
                  <span className="text-muted-foreground">
                    {dept.agent_count === 1 ? "agente" : "agentes"}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  {formatPrice(dept.monthly_price_cents, dept.currency)}
                  <span className="text-muted-foreground/60">/mês</span>
                </div>
              </div>

              {dept.agent_ids.length > 0 && onSelectAgent && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8 gap-1.5"
                  onClick={() => onSelectAgent(dept.agent_ids[0])}
                >
                  Abrir departamento <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
};

export default ContractedDepartments;
