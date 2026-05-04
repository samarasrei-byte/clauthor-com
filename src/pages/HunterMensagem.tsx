import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import HunterStepper from "@/components/hunter/HunterStepper";

const VARIABLES = ["primeiro_nome", "cargo", "empresa"];
const SAMPLE = { primeiro_nome: "Ana", cargo: "Diretora de Marketing", empresa: "Acme Corp" };

const HunterMensagem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [template, setTemplate] = useState("");
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
      if (!data) {
        toast.error("Defina seu ICP primeiro");
        navigate("/hunter-icp");
        return;
      }
      setCampaign(data);
      setTemplate(data.message_template || "Olá {{primeiro_nome}}, vi seu trabalho como {{cargo}} na {{empresa}} e gostaria de conectar.");
      setLoading(false);
    })();
  }, [user, navigate]);

  const preview = useMemo(() => {
    let p = template;
    VARIABLES.forEach(v => {
      p = p.split(`{{${v}}}`).join((SAMPLE as any)[v]);
    });
    return p;
  }, [template]);

  const insertVar = (v: string) => setTemplate(t => `${t}{{${v}}}`);

  const handleSave = async () => {
    if (!template.trim()) {
      toast.error("Mensagem é obrigatória");
      return;
    }
    if (template.length > 280) {
      toast.error("Mensagem deve ter até 280 caracteres (limite do LinkedIn)");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("hunter_campaigns")
      .update({ message_template: template })
      .eq("id", campaign.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Mensagem salva");
    navigate("/hunter-ativar");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <HunterStepper current={3} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Passo 3 - Mensagem (icebreaker)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Variáveis disponíveis (clique para inserir)</Label>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map(v => (
                <Badge key={v} variant="secondary" className="cursor-pointer hover:bg-primary/20" onClick={() => insertVar(v)}>
                  {`{{${v}}}`}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Template da mensagem (máx 280 caracteres)</Label>
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={4}
              maxLength={280}
              placeholder="Olá {{primeiro_nome}}, vi seu trabalho como {{cargo}} na {{empresa}}..."
            />
            <p className="text-xs text-muted-foreground text-right">{template.length}/280</p>
          </div>

          <div className="space-y-2">
            <Label>Preview ao vivo</Label>
            <div className="p-4 rounded-lg bg-muted/40 border border-border/60 text-sm text-foreground whitespace-pre-wrap">
              {preview}
            </div>
            <p className="text-xs text-muted-foreground">
              Exemplo usando: {SAMPLE.primeiro_nome} · {SAMPLE.cargo} · {SAMPLE.empresa}
            </p>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => navigate("/hunter-icp")} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Próximo: ativar <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HunterMensagem;
