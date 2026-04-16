import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Power, ArrowLeft, Loader2, Clock, Zap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import HunterStepper from "@/components/hunter/HunterStepper";

const HunterAtivar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [active, setActive] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(20);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("hunter_campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) {
        toast.error("Configure sua mensagem primeiro");
        navigate("/hunter-mensagem");
        return;
      }
      setCampaign(data);
      setActive(data.status === "ativo");
      setDailyLimit(data.limite_diario || 20);
      setLoading(false);
    })();
  }, [user, navigate]);

  const handleToggle = async (val: boolean) => {
    setSaving(true);
    const { error } = await supabase
      .from("hunter_campaigns")
      .update({ status: val ? "ativo" : "pausado", limite_diario: dailyLimit })
      .eq("id", campaign.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setActive(val);
    toast.success(val ? "Hunter ativado — execução diária às 9h" : "Hunter pausado");
  };

  const handleLimitChange = async (val: number) => {
    setDailyLimit(val);
    await supabase.from("hunter_campaigns").update({ limite_diario: val }).eq("id", campaign.id);
  };

  const handleRunNow = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("hunter-buscar-leads", {
      body: { campaign_id: campaign.id },
    });
    setRunning(false);
    if (error || !data?.success) {
      toast.error(error?.message || "Falha ao executar");
      return;
    }
    toast.success(data.demo ? "Execução em modo demo concluída" : "Busca disparada no PhantomBuster");
    setTimeout(() => navigate("/hunter"), 1500);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <HunterStepper current={4} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="w-5 h-5 text-primary" /> Passo 4 — Ativar Hunter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-card/40">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Ativar Hunter</Label>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Execução diária automática às 9h
              </p>
            </div>
            <Switch checked={active} onCheckedChange={handleToggle} disabled={saving} />
          </div>

          <div className="space-y-3 p-4 rounded-lg border border-border/60 bg-card/40">
            <div className="flex items-center justify-between">
              <Label>Limite diário de ações</Label>
              <span className="text-lg font-mono font-bold text-primary">{dailyLimit}</span>
            </div>
            <Slider
              value={[dailyLimit]}
              min={5}
              max={50}
              step={5}
              onValueChange={(v) => handleLimitChange(v[0])}
            />
            <p className="text-xs text-muted-foreground">
              Recomendado: 20/dia. Acima de 50 pode acionar bloqueio do LinkedIn.
            </p>
          </div>

          {active && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-green-500/30 bg-green-500/5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-foreground">Hunter ativo — próxima execução amanhã às 9h</span>
            </div>
          )}

          <div className="flex justify-between pt-2 gap-3 flex-wrap">
            <Button variant="outline" onClick={() => navigate("/hunter-mensagem")} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleRunNow} disabled={running} className="gap-2">
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Executar agora
              </Button>
              <Button onClick={() => navigate("/hunter")}>Ir para o dashboard</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HunterAtivar;
