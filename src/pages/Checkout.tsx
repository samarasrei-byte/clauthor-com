import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Shield, Trash2, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PremiumCTAButton } from "@/components/ui/premium-cta-button";
import { formatBRL, getDepartmentById } from "@/data/departmentPackages";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDeptSelection } from "@/stores/deptSelection";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import ClauthorLogo from "@/components/ClauthorLogo";
import AgentsWorkingScene from "@/components/departments/AgentsWorkingScene";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const items = useDeptSelection((s) => s.items);
  const remove = useDeptSelection((s) => s.remove);
  const total = useDeptSelection((s) => s.total());

  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const empty = items.length === 0;

  const activate = async () => {
    if (empty) return;

    if (!user) {
      // Fluxo novo: usuários não cadastrados veem um preview do painel com
      // tour guiado do Thor ANTES de serem forçados a criar conta. Reduz atrito
      // e aumenta compreensão de valor. hireIntent é reconstruído no CTA final.
      navigate("/preview-dashboard");
      return;
    }

    if (!company.trim()) {
      toast.error("Informe o nome da empresa");
      return;
    }

    setLoading(true);
    try {
      await supabase
        .from("profiles")
        .update({
          company_name: company,
          onboarding_answers: {
            industry,
            goal,
            completed_at: new Date().toISOString(),
          },
        })
        .eq("user_id", user.id);

      const returnBase = `${window.location.origin}/dashboard`;
      const allSlugs = items.flatMap((i) => i.agentSlugs);
      const label = items.length === 1 ? items[0].name : `${items.length} departamentos`;

      const { data, error } = await supabase.functions.invoke("paypal-checkout", {
        body: {
          action: "create_subscription",
          agent_slug: `cart-${items.map((i) => i.id).join("_")}`,
          agent_name: label,
          amount: total,
          currency: "BRL",
          return_url: `${returnBase}?subscription=success`,
          cancel_url: `${returnBase}?subscription=cancelled`,
        },
      });

      if (error) throw error;
      if (!data?.success || !data?.subscription_id || !data?.approve_url) {
        throw new Error("PayPal não retornou aprovação. Tente de novo.");
      }

      // Intent multi-dept: `departments` array processado por usePaypalCapture.
      sessionStorage.setItem(
        "paypal_subscription",
        JSON.stringify({
          subscription_id: data.subscription_id,
          agent_slug: `cart-${items.map((i) => i.id).join("_")}`,
          agent_name: label,
          price: total,
          currency: "BRL",
          tier: "advanced",
          is_department: true,
          department_id: items[0].id,
          department_slugs: allSlugs,
          departments: items.map((i) => ({
            id: i.id,
            name: i.name,
            slugs: i.agentSlugs,
            priceMonthly: i.priceMonthly,
          })),
        }),
      );

      window.location.href = data.approve_url;
    } catch (err: any) {
      console.error("[Checkout] PayPal error", err);
      toast.error(err?.message || "Erro ao iniciar pagamento. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SEO title="Checkout · Clauthor" description="Ative seus departamentos e comece a operar hoje." />

      <header className="border-b border-white/[0.06] bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/departamentos" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Continuar montando
          </Link>
          <ClauthorLogo className="h-5 opacity-70" />
          <div className="inline-flex items-center gap-1.5 text-[11px] text-white/40">
            <Shield className="w-3 h-3" /> Checkout seguro
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs text-white/60">
            <ShoppingBag className="w-3 h-3" /> Seu carrinho
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-display font-semibold text-white">
            {empty ? "Carrinho vazio" : `${items.length} departamento${items.length > 1 ? "s" : ""} para ativar`}
          </h1>
          {!empty && (
            <p className="text-white/50 text-sm mt-1">
              Uma única assinatura, um único onboarding. Todos os agentes ativam juntos.
            </p>
          )}
        </motion.div>

        {empty ? (
          <Card className="p-10 bg-white/[0.02] border-white/10 rounded-2xl text-center space-y-4">
            <p className="text-white/60">Você ainda não escolheu departamentos.</p>
            <Button onClick={() => navigate("/departamentos")}>Ver departamentos</Button>
          </Card>
        ) : (
          <>
            {/* Items */}
            <Card className="p-2 bg-white/[0.02] border-white/10 rounded-2xl">
              <ul className="divide-y divide-white/[0.06]">
                <AnimatePresence initial={false}>
                  {items.map((i) => (
                    <motion.li
                      key={i.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between px-4 py-4"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{i.name}</div>
                        <div className="text-xs text-white/50 mt-0.5">
                          {i.agentSlugs.length} agentes · {formatBRL(i.priceMonthly)}/mês
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-sm font-medium text-white/80">
                          {formatBRL(i.priceMonthly)}
                        </div>
                        <button
                          onClick={() => remove(i.id)}
                          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
                          aria-label={`Remover ${i.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <div className="px-4 py-3 flex items-center justify-between border-t border-white/[0.06]">
                <button
                  onClick={() => navigate("/departamentos")}
                  className="text-xs text-white/50 hover:text-white transition-colors"
                >
                  + Adicionar outro departamento
                </button>
                <div className="text-sm text-white/60">
                  Subtotal <span className="text-white font-semibold ml-2">{formatBRL(total)}</span>
                </div>
              </div>
            </Card>

            {/* Included */}
            <Card className="p-6 bg-white/[0.02] border-white/10 rounded-2xl">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Incluso</div>
              <ul className="space-y-2 text-sm text-white/80">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" /> Todos os agentes ativados imediatamente após pagamento</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" /> Onboarding único aplicado a todos os departamentos</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" /> Painel de aprovações e Second Brain em tempo real</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" /> Cancele quando quiser, sem multa</li>
              </ul>
            </Card>

            {/* Onboarding */}
            <Card className="p-6 bg-white/[0.02] border-white/10 rounded-2xl space-y-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/40">Onboarding rápido</div>
                <h2 className="mt-1 text-lg font-semibold text-white">Nos conte sobre a empresa</h2>
                <p className="text-sm text-white/50 mt-1">Esse contexto vai para todos os agentes na primeira execução.</p>
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

            {/* Total + activate */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-white/10 bg-white/[0.02] sticky bottom-4">
              <div>
                <div className="text-xs text-white/40">Total mensal</div>
                <div className="text-3xl font-semibold text-white">{formatBRL(total)}</div>
              </div>
              <PremiumCTAButton variant="red" onClick={activate} disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecionando ao PayPal…</>
                ) : (
                  `Pagar ${formatBRL(total)}/mês com PayPal`
                )}
              </PremiumCTAButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
