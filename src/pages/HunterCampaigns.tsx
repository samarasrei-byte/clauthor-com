import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Users, UserCheck, MessageSquare, Pause, Play, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  nome: string;
  publico_alvo: string;
  status: string;
  total_leads: number;
  total_conectados: number;
  total_responderam: number;
  limite_diario: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  ativo: "bg-green-500/20 text-green-400 border-green-500/30",
  pausado: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  concluido: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const HunterCampaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("hunter_campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCampaigns((data as Campaign[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "ativo" ? "pausado" : "ativo";
    await supabase.from("hunter_campaigns").update({ status: next }).eq("id", id);
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: next } : c));
    toast.success(`Campanha ${next === "ativo" ? "ativada" : "pausada"}`);
  };

  const activeCampaigns = campaigns.filter(c => c.status === "ativo").length;
  const totalLeads = campaigns.reduce((s, c) => s + c.total_leads, 0);
  const totalConectados = campaigns.reduce((s, c) => s + c.total_conectados, 0);
  const totalResponderam = campaigns.reduce((s, c) => s + c.total_responderam, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Hunter</h1>
        </div>
        <Button onClick={() => navigate("/hunter-nova-campanha")} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Campanha
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Target, label: "Campanhas Ativas", value: activeCampaigns },
          { icon: Users, label: "Leads Hoje", value: totalLeads },
          { icon: UserCheck, label: "Conexões Aceitas", value: totalConectados },
          { icon: MessageSquare, label: "Responderam", value: totalResponderam },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Target className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Nenhuma campanha ainda</h2>
            <p className="text-muted-foreground">Crie sua primeira campanha de prospecção no LinkedIn</p>
            <Button onClick={() => navigate("/hunter-nova-campanha")} className="gap-2">
              <Plus className="w-4 h-4" /> Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const progress = c.total_leads > 0 ? (c.total_conectados / c.total_leads) * 100 : 0;
            return (
              <Card key={c.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{c.nome}</h3>
                      <Badge className={STATUS_COLORS[c.status] || ""}>{c.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{c.publico_alvo}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{c.total_leads} leads</span>
                      <span>{c.total_conectados} conexões</span>
                      <span>{c.total_responderam} respostas</span>
                    </div>
                    <Progress value={progress} className="h-1.5 mt-2" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/hunter-campaign/${c.id}`)}>
                      <Eye className="w-4 h-4 mr-1" /> Ver
                    </Button>
                    {(c.status === "ativo" || c.status === "pausado") && (
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(c.id, c.status)}>
                        {c.status === "ativo" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HunterCampaigns;
