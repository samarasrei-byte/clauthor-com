import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, ExternalLink, CalendarCheck, XCircle, Linkedin } from "lucide-react";
import { toast } from "sonner";

const HunterLeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const [leadRes, msgsRes] = await Promise.all([
        supabase.from("hunter_leads").select("*").eq("id", id).single(),
        supabase.from("hunter_messages").select("*").eq("lead_id", id).order("created_at", { ascending: true }),
      ]);
      setLead(leadRes.data);
      setNotas(leadRes.data?.notas || "");
      setMessages(msgsRes.data || []);
      setLoading(false);
    })();
  }, [user, id]);

  const updateStatus = async (status: string) => {
    await supabase.from("hunter_leads").update({ status }).eq("id", id);
    setLead((p: any) => ({ ...p, status }));
    toast.success(`Lead marcado como: ${status.replace(/_/g, " ")}`);
  };

  const saveNotas = async () => {
    await supabase.from("hunter_leads").update({ notas }).eq("id", id);
    toast.success("Notas salvas");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!lead) {
    return <div className="p-6 text-center text-muted-foreground">Lead não encontrado</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{lead.nome_completo}</h1>
          <p className="text-sm text-muted-foreground">{lead.cargo} · {lead.empresa}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Informações</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Cargo</span><span className="text-foreground">{lead.cargo}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Empresa</span><span className="text-foreground">{lead.empresa}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge>{lead.status.replace(/_/g, " ")}</Badge></div>
            {lead.linkedin_url && (
              <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                <Linkedin className="w-4 h-4" /> Ver no LinkedIn <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Ações</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full gap-2" onClick={() => updateStatus("reuniao_marcada")}>
              <CalendarCheck className="w-4 h-4" /> Reunião Marcada
            </Button>
            <Button variant="destructive" className="w-full gap-2" onClick={() => updateStatus("nao_interessado")}>
              <XCircle className="w-4 h-4" /> Não Interessado
            </Button>
          </CardContent>
        </Card>
      </div>

      {lead.icebreaker && (
        <Card>
          <CardHeader><CardTitle className="text-base">Icebreaker (IA)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded italic">"{lead.icebreaker}"</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Timeline de Interações</CardTitle></CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma interação registrada</p>
          ) : (
            <div className="space-y-3">
              {messages.map(m => (
                <div key={m.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{m.tipo.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <p className="text-muted-foreground mt-1">{m.conteudo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={4} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Anotações sobre este lead..." />
          <Button variant="outline" onClick={saveNotas}>Salvar Notas</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HunterLeadDetail;
