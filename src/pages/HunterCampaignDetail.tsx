import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Target, ArrowLeft, Loader2, Send, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const LEAD_STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-500/20 text-blue-400",
  convite_enviado: "bg-yellow-500/20 text-yellow-400",
  conectado: "bg-green-500/20 text-green-400",
  mensagem1_enviada: "bg-purple-500/20 text-purple-400",
  mensagem2_enviada: "bg-indigo-500/20 text-indigo-400",
  respondeu: "bg-emerald-500/20 text-emerald-400",
  nao_interessado: "bg-red-500/20 text-red-400",
};

const HunterCampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const [campRes, leadsRes, msgsRes] = await Promise.all([
        supabase.from("hunter_campaigns").select("*").eq("id", id).single(),
        supabase.from("hunter_leads").select("*").eq("campaign_id", id).order("created_at", { ascending: false }),
        supabase.from("hunter_messages").select("*").eq("campaign_id", id).order("created_at", { ascending: false }),
      ]);
      setCampaign(campRes.data);
      setLeads(leadsRes.data || []);
      setMessages(msgsRes.data || []);
      setLoading(false);
    })();
  }, [user, id]);

  const approveBatch = async () => {
    const pending = messages.filter(m => m.status === "pendente");
    if (pending.length === 0) return toast.info("Nenhuma mensagem pendente");

    try {
      const { error } = await supabase.functions.invoke("hunter-enviar-convites", {
        body: { campaign_id: id },
      });
      if (error) throw error;
      toast.success(`${pending.length} mensagens aprovadas para envio`);
    } catch {
      toast.error("Erro ao enviar lote");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Campanha não encontrada</p>
        <Button variant="link" onClick={() => navigate("/hunter-campaigns")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/hunter-campaigns")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Target className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">{campaign.nome}</h1>
          <p className="text-sm text-muted-foreground">{campaign.publico_alvo}</p>
        </div>
        <Badge className={campaign.status === "ativo" ? "bg-green-500/20 text-green-400" : ""}>{campaign.status}</Badge>
      </div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="fila">Fila de Envio ({messages.filter(m => m.status === "pendente").length})</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <Card>
            <CardContent className="p-0">
              {leads.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Buscando leads... isso pode levar alguns minutos.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map(lead => (
                      <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/hunter-lead/${lead.id}`)}>
                        <TableCell className="font-medium text-foreground">{lead.nome_completo}</TableCell>
                        <TableCell className="text-muted-foreground">{lead.cargo}</TableCell>
                        <TableCell className="text-muted-foreground">{lead.empresa}</TableCell>
                        <TableCell>
                          <Badge className={LEAD_STATUS_COLORS[lead.status] || ""}>{lead.status.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {lead.linkedin_url && (
                            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                              <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fila">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Fila de Envio</CardTitle>
              <Button onClick={approveBatch} className="gap-2">
                <Send className="w-4 h-4" /> Aprovar Lote
              </Button>
            </CardHeader>
            <CardContent>
              {messages.filter(m => m.status === "pendente").length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma mensagem na fila</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Conteúdo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.filter(m => m.status === "pendente").map(m => (
                      <TableRow key={m.id}>
                        <TableCell><Badge variant="outline">{m.tipo.replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell className="max-w-md truncate text-sm text-muted-foreground">{m.conteudo}</TableCell>
                        <TableCell><Badge className="bg-yellow-500/20 text-yellow-400">{m.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">Editar configurações da campanha (em breve)</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Cargo alvo:</span> <span className="text-foreground">{campaign.cargo_alvo}</span></div>
                <div><span className="text-muted-foreground">Setor:</span> <span className="text-foreground">{campaign.setor_alvo}</span></div>
                <div><span className="text-muted-foreground">Localização:</span> <span className="text-foreground">{campaign.localizacao_alvo}</span></div>
                <div><span className="text-muted-foreground">Limite diário:</span> <span className="text-foreground">{campaign.limite_diario}</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HunterCampaignDetail;
