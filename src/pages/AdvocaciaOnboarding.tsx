import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, MessageSquare, Database, FileSignature, Scale, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ClauthorLogo from "@/components/ClauthorLogo";

type Status = "pending" | "in_progress" | "ready";

interface OnboardingState {
  whatsapp_status: Status;
  whatsapp_number: string | null;
  crm_status: Status;
  crm_provider: string | null;
  clicksign_status: Status;
  clicksign_token: string | null;
  oab_number: string | null;
  office_name: string | null;
}

const initial: OnboardingState = {
  whatsapp_status: "pending", whatsapp_number: null,
  crm_status: "pending", crm_provider: null,
  clicksign_status: "pending", clicksign_token: null,
  oab_number: null, office_name: null,
};

export default function AdvocaciaOnboarding() {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Configurar Squad Jurídica · Clauthor";
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("advocacia_onboarding" as any).select("*").eq("user_id", user.id).maybeSingle();
      if (data) setState({ ...initial, ...(data as any) });
      setLoading(false);
    })();
  }, [user]);

  const save = async (patch: Partial<OnboardingState>) => {
    if (!user) return;
    setSaving(true);
    const next = { ...state, ...patch };
    setState(next);
    const completed = next.whatsapp_status === "ready" && next.crm_status === "ready" && next.clicksign_status === "ready";
    const { error } = await (supabase.from("advocacia_onboarding" as any) as any).upsert({
      user_id: user.id, ...next, completed,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error("Erro ao salvar"); else toast.success("Salvo");
  };

  const steps = [
    { key: "office", label: "Dados do escritório", done: !!state.office_name && !!state.oab_number },
    { key: "whatsapp", label: "WhatsApp Business", done: state.whatsapp_status === "ready" },
    { key: "crm", label: "CRM Jurídico", done: state.crm_status === "ready" },
    { key: "clicksign", label: "Assinatura digital", done: state.clicksign_status === "ready" },
  ];
  const progress = (steps.filter(s => s.done).length / steps.length) * 100;

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const StatusBadge = ({ s }: { s: Status }) => {
    if (s === "ready") return <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Operacional</Badge>;
    if (s === "in_progress") return <Badge className="bg-amber-500/10 text-amber-500 border-0 text-xs"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Em configuração</Badge>;
    return <Badge variant="outline" className="text-xs border-border/60"><Circle className="w-3 h-3 mr-1" />Pendente</Badge>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2"><ClauthorLogo size="md" /></Link>
          <Badge variant="outline" className="border-primary/30 text-primary"><Scale className="w-3 h-3 mr-1" />Squad Jurídica</Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">Ative sua Squad Jurídica</h1>
          <p className="mt-2 text-muted-foreground">Configure os 3 canais para sua squad operar 24/7. Leva ~10 minutos.</p>
          <div className="mt-6 flex items-center gap-4">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        </motion.div>

        {/* Office */}
        <Card className="p-6 bg-card/60 border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Scale className="w-5 h-5" /></div>
              <div><h2 className="font-semibold">Dados do escritório</h2><p className="text-xs text-muted-foreground">Identidade jurídica usada pelos agentes</p></div>
            </div>
            {steps[0].done && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-xs">Nome do escritório</Label><Input value={state.office_name || ""} onChange={e => setState(s => ({ ...s, office_name: e.target.value }))} onBlur={() => save({})} placeholder="Silva & Associados" /></div>
            <div><Label className="text-xs">OAB do responsável</Label><Input value={state.oab_number || ""} onChange={e => setState(s => ({ ...s, oab_number: e.target.value }))} onBlur={() => save({})} placeholder="OAB/SP 123.456" /></div>
          </div>
        </Card>

        {/* WhatsApp */}
        <Card className="p-6 bg-card/60 border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><MessageSquare className="w-5 h-5" /></div>
              <div><h2 className="font-semibold">WhatsApp Business</h2><p className="text-xs text-muted-foreground">Canal de captação dos leads</p></div>
            </div>
            <StatusBadge s={state.whatsapp_status} />
          </div>
          <div className="space-y-3">
            <div><Label className="text-xs">Número do WhatsApp do escritório</Label><Input value={state.whatsapp_number || ""} onChange={e => setState(s => ({ ...s, whatsapp_number: e.target.value }))} placeholder="+55 11 99999-9999" /></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => save({ whatsapp_status: "in_progress" })} disabled={!state.whatsapp_number}>Iniciar conexão</Button>
              <Button size="sm" onClick={() => save({ whatsapp_status: "ready" })} disabled={state.whatsapp_status !== "in_progress"}>Marcar como ativo</Button>
            </div>
            <p className="text-xs text-muted-foreground">Após iniciar, nossa equipe envia o QR Code de conexão em até 2h úteis.</p>
          </div>
        </Card>

        {/* CRM */}
        <Card className="p-6 bg-card/60 border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Database className="w-5 h-5" /></div>
              <div><h2 className="font-semibold">CRM Jurídico</h2><p className="text-xs text-muted-foreground">Onde os leads e casos serão organizados</p></div>
            </div>
            <StatusBadge s={state.crm_status} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {["Astrea", "ADVBOX", "Projuris", "HubSpot"].map(p => (
              <Button key={p} size="sm" variant={state.crm_provider === p ? "default" : "outline"} onClick={() => save({ crm_provider: p, crm_status: "in_progress" })} className={state.crm_provider === p ? "" : "border-border/60"}>{p}</Button>
            ))}
          </div>
          <Button size="sm" onClick={() => save({ crm_status: "ready" })} disabled={!state.crm_provider}>Marcar como integrado</Button>
        </Card>

        {/* Clicksign */}
        <Card className="p-6 bg-card/60 border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><FileSignature className="w-5 h-5" /></div>
              <div><h2 className="font-semibold">Assinatura digital</h2><p className="text-xs text-muted-foreground">Clicksign ou D4Sign para contratos</p></div>
            </div>
            <StatusBadge s={state.clicksign_status} />
          </div>
          <div className="space-y-3">
            <div><Label className="text-xs">Token de API (opcional agora)</Label><Input type="password" value={state.clicksign_token || ""} onChange={e => setState(s => ({ ...s, clicksign_token: e.target.value }))} placeholder="cs_live_..." /></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild className="border-border/60"><a href="https://app.clicksign.com/users/sign_in" target="_blank" rel="noreferrer">Abrir Clicksign <ExternalLink className="w-3 h-3 ml-1" /></a></Button>
              <Button size="sm" onClick={() => save({ clicksign_status: "ready" })}>Marcar como ativo</Button>
            </div>
          </div>
        </Card>

        {progress === 100 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-6 border-2 border-primary/40 bg-primary/5 text-center">
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2" />
              <h3 className="font-display font-semibold text-lg">Squad 100% operacional</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Seus 6 agentes jurídicos estão prontos para atender.</p>
              <Button asChild className="glow"><Link to="/dashboard">Ir para o dashboard <ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
            </Card>
          </motion.div>
        )}

        {saving && <p className="text-xs text-center text-muted-foreground">Salvando...</p>}
      </main>
    </div>
  );
}
