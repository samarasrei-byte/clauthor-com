import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PremiumCTAButton } from "@/components/ui/premium-cta-button";
import { getDepartmentById, formatBRL } from "@/data/departmentPackages";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import SEO from "@/components/SEO";

export default function HireAndOnboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dept = slug ? getDepartmentById(slug) : undefined;

  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  if (!dept) return <Navigate to="/departamentos" replace />;
  const Icon = dept.icon;

  const activate = async () => {
    if (!user) {
      toast.error("Faça login para ativar o departamento");
      navigate("/auth");
      return;
    }
    if (!company.trim()) {
      toast.error("Informe o nome da empresa");
      return;
    }
    setLoading(true);
    const { error } = await (supabase.from("contracted_departments" as any) as any).insert({
      user_id: user.id,
      department_id: dept.id,
      department_name: dept.name,
      monthly_price_cents: dept.priceMonthly * 100,
      currency: "BRL",
      agent_count: dept.agentSlugs.length,
      agent_ids: dept.agentSlugs,
      pain_point: dept.painPoint,
      company_snapshot: { name: company, industry, goal },
      onboarding_snapshot: { completed_at: new Date().toISOString() },
      status: "active",
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao ativar. Tente novamente.");
      return;
    }
    toast.success(`${dept.name} ativado com sucesso!`);
    navigate(`/departamento-ativo/${dept.id}`);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SEO title={`Contratar ${dept.name} · Clauthor`} description={`Ative o ${dept.name} e comece agora.`} />

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <Link to={`/departamentos/${dept.id}`} className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        {/* Confirmation */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs text-white/60">
            <Sparkles className="w-3 h-3" /> Você está contratando
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center">
              <Icon className="w-7 h-7 text-white/80" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-semibold text-white">{dept.name}</h1>
              <p className="text-white/50 text-sm mt-1">{dept.agentSlugs.length} agentes especializados · {formatBRL(dept.priceMonthly)}/mês</p>
            </div>
          </div>
        </motion.div>

        {/* Included */}
        <Card className="p-6 bg-white/[0.02] border-white/10 rounded-2xl">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Incluso na contratação</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" /> Todos os {dept.agentSlugs.length} agentes ativados imediatamente</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" /> Outcome garantido: {dept.outcome}</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" /> Painel de aprovações e Second Brain em tempo real</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" /> Preço travado: {formatBRL(dept.priceMonthly)}/mês, sem taxa oculta</li>
          </ul>
        </Card>

        {/* Onboarding form */}
        <Card className="p-6 bg-white/[0.02] border-white/10 rounded-2xl space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/40">Onboarding rápido</div>
            <h2 className="mt-1 text-lg font-semibold text-white">Nos conte sobre a empresa</h2>
            <p className="text-sm text-white/50 mt-1">Os agentes usam esse contexto desde a primeira execução.</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome da empresa *</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex: Clauthor Tech" />
            </div>
            <div>
              <Label className="text-xs">Segmento / indústria</Label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ex: SaaS B2B" />
            </div>
            <div>
              <Label className="text-xs">Principal meta nos próximos 30 dias</Label>
              <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ex: 20 reuniões qualificadas" />
            </div>
          </div>
        </Card>

        {/* Activate */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
          <div>
            <div className="text-xs text-white/40">Total mensal</div>
            <div className="text-3xl font-semibold text-white">{formatBRL(dept.priceMonthly)}</div>
          </div>
          <PremiumCTAButton variant="red" onClick={activate} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ativando…</> : "Ativar Departamento"}
          </PremiumCTAButton>
        </div>
      </div>
    </div>
  );
}
