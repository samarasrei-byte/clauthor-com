import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowRight, ArrowLeft, Check, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["Público-Alvo", "Conectar LinkedIn", "Templates"];

const DEFAULT_TEMPLATES = [
  { tipo: "nota_conexao", nome: "Nota de Conexão Padrão", conteudo: "{{icebreaker}} Posso te adicionar?" },
  { tipo: "mensagem1", nome: "Mensagem 1 Padrão", conteudo: "Oi {{nome}}, obrigado por conectar! Trabalho ajudando {{cargo}}s a conseguir mais clientes. Faria sentido pra {{empresa}} agora?" },
  { tipo: "mensagem2", nome: "Mensagem 2 Padrão", conteudo: "Oi {{nome}}, só checando se minha mensagem chegou. Teria 15 minutos essa semana pra uma conversa rápida?" },
  { tipo: "break_up", nome: "Break Up Padrão", conteudo: "{{nome}}, vou encerrar os contatos por aqui. Quando fizer sentido, é só me chamar. Sucesso com a {{empresa}}!" },
];

const HunterNovaCampanha = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showCookie, setShowCookie] = useState(false);
  const [cookieValid, setCookieValid] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    publico_alvo: "",
    cargo_alvo: "",
    setor_alvo: "",
    localizacao_alvo: "",
    linkedin_cookie: "",
    limite_diario: 20,
  });

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const verifyCookie = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("hunter-verificar-cookie", {
        body: { linkedin_cookie: form.linkedin_cookie },
      });
      if (error) throw error;
      setCookieValid(data?.valid === true);
      if (data?.valid) toast.success("Cookie válido!");
      else toast.error(data?.error || "Cookie inválido");
    } catch {
      setCookieValid(false);
      toast.error("Erro ao verificar cookie");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Create campaign
      const { data: campaign, error } = await supabase
        .from("hunter_campaigns")
        .insert({
          user_id: user.id,
          nome: form.nome.trim(),
          publico_alvo: form.publico_alvo.trim(),
          cargo_alvo: form.cargo_alvo.trim(),
          setor_alvo: form.setor_alvo.trim(),
          localizacao_alvo: form.localizacao_alvo.trim(),
          linkedin_cookie_encrypted: form.linkedin_cookie, // Will be encrypted by edge function
          limite_diario: form.limite_diario,
          status: "ativo",
        })
        .select("id")
        .single();

      if (error) throw error;

      // Create default templates if none exist
      const { data: existing } = await supabase
        .from("hunter_templates")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("hunter_templates").insert(
          DEFAULT_TEMPLATES.map(t => ({ ...t, user_id: user.id }))
        );
      }

      toast.success("Campanha criada! Buscando leads...");

      // Trigger lead search
      supabase.functions.invoke("hunter-buscar-leads", {
        body: { campaign_id: campaign.id },
      });

      navigate(`/hunter-campaign/${campaign.id}`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar campanha");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Target className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Nova Campanha</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <Badge variant={i <= step ? "default" : "outline"} className={i < step ? "bg-green-500" : ""}>
              {i < step ? <Check className="w-3 h-3" /> : i + 1}
            </Badge>
            <span className={`text-sm ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            {i < STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Nome da Campanha</Label>
                <Input value={form.nome} onChange={e => update("nome", e.target.value)} placeholder="Ex: CTOs de Fintechs SP" />
              </div>
              <div className="space-y-2">
                <Label>Descreva seu público ideal</Label>
                <Textarea rows={4} value={form.publico_alvo} onChange={e => update("publico_alvo", e.target.value)} placeholder="Ex: CTOs e VPs de Tecnologia em fintechs de São Paulo, empresas com 50-500 funcionários..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cargo Alvo</Label>
                  <Input value={form.cargo_alvo} onChange={e => update("cargo_alvo", e.target.value)} placeholder="CTO" />
                </div>
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <Input value={form.setor_alvo} onChange={e => update("setor_alvo", e.target.value)} placeholder="Fintech" />
                </div>
                <div className="space-y-2">
                  <Label>Localização</Label>
                  <Input value={form.localizacao_alvo} onChange={e => update("localizacao_alvo", e.target.value)} placeholder="São Paulo" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Limite diário de convites: {form.limite_diario}</Label>
                <Slider min={5} max={25} step={1} value={[form.limite_diario]} onValueChange={v => update("limite_diario", v[0])} />
                <p className="text-xs text-muted-foreground">Recomendado: 15-20 para não ser bloqueado pelo LinkedIn</p>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Como obter seu cookie do LinkedIn:</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3"><Badge variant="outline">1</Badge> Abra o LinkedIn no Chrome e faça login</li>
                  <li className="flex gap-3"><Badge variant="outline">2</Badge> Pressione <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">F12</kbd></li>
                  <li className="flex gap-3"><Badge variant="outline">3</Badge> Clique em <strong>Application → Cookies → linkedin.com</strong></li>
                  <li className="flex gap-3"><Badge variant="outline">4</Badge> Encontre <code className="px-1 bg-muted rounded text-xs">li_at</code> e copie o valor completo</li>
                </ol>
              </div>
              <div className="space-y-2">
                <Label>Cookie li_at</Label>
                <div className="relative">
                  <Input
                    type={showCookie ? "text" : "password"}
                    value={form.linkedin_cookie}
                    onChange={e => { update("linkedin_cookie", e.target.value); setCookieValid(null); }}
                    placeholder="AQE..."
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowCookie(!showCookie)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCookie ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={verifyCookie} disabled={verifying || !form.linkedin_cookie}>
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  Verificar Cookie
                </Button>
                {cookieValid === true && <Badge className="bg-green-500">✓ Válido</Badge>}
                {cookieValid === false && <Badge variant="destructive">✗ Inválido</Badge>}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Seu cookie é criptografado e usado apenas para enviar mensagens em seu nome
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="font-semibold text-foreground mb-4">Templates de mensagens</h3>
              <div className="space-y-4">
                {DEFAULT_TEMPLATES.map(t => (
                  <Card key={t.tipo}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{t.tipo.replace(/_/g, " ")}</Badge>
                        <span className="text-sm font-medium text-foreground">{t.nome}</span>
                      </div>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3 font-mono">{t.conteudo}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Você pode personalizar os templates depois em /hunter-templates</p>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/hunter-campaigns")}>Cancelar</Button>
            )}
            {step < 2 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 && !form.nome.trim() || step === 1 && !form.linkedin_cookie}
              >
                Próximo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
                Criar Campanha e Buscar Leads
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HunterNovaCampanha;
