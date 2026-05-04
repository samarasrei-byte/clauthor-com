import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import HunterStepper from "@/components/hunter/HunterStepper";

const HunterICP = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [form, setForm] = useState({ cargo_alvo: "", localizacao_alvo: "", setor_alvo: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
      if (data) {
        setCampaign(data);
        setForm({
          cargo_alvo: data.cargo_alvo || "",
          localizacao_alvo: data.localizacao_alvo || "",
          setor_alvo: data.setor_alvo || "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!form.cargo_alvo.trim()) {
      toast.error("Cargo alvo é obrigatório");
      return;
    }
    setSaving(true);
    const payload = {
      user_id: user!.id,
      nome: campaign?.nome || `Hunter ${form.cargo_alvo}`.slice(0, 60),
      publico_alvo: `${form.cargo_alvo} em ${form.setor_alvo} (${form.localizacao_alvo})`,
      cargo_alvo: form.cargo_alvo,
      localizacao_alvo: form.localizacao_alvo,
      setor_alvo: form.setor_alvo,
      status: campaign?.status || "rascunho",
    };
    const { data, error } = campaign
      ? await supabase.from("hunter_campaigns").update(payload).eq("id", campaign.id).select().single()
      : await supabase.from("hunter_campaigns").insert(payload).select().single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCampaign(data);
    toast.success("ICP salvo");
    navigate("/hunter-mensagem");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <HunterStepper current={2} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Passo 2 - Definir ICP (cliente ideal)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cargo alvo *</Label>
            <Input
              value={form.cargo_alvo}
              onChange={(e) => setForm({ ...form, cargo_alvo: e.target.value })}
              placeholder="Ex: Diretor de Marketing, Head de Vendas"
            />
          </div>
          <div className="space-y-2">
            <Label>Cidade / Localização</Label>
            <Input
              value={form.localizacao_alvo}
              onChange={(e) => setForm({ ...form, localizacao_alvo: e.target.value })}
              placeholder="Ex: São Paulo, Brasil"
            />
          </div>
          <div className="space-y-2">
            <Label>Setor</Label>
            <Input
              value={form.setor_alvo}
              onChange={(e) => setForm({ ...form, setor_alvo: e.target.value })}
              placeholder="Ex: SaaS B2B, E-commerce, Fintech"
            />
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => navigate("/hunter-linkedin")} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Próximo: mensagem <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HunterICP;
