import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Users, UserCheck, MessageSquare, Linkedin, Settings, ExternalLink, Loader2, Inbox } from "lucide-react";

interface HotLead {
  id: string;
  nome_completo: string;
  cargo: string;
  empresa: string;
  linkedin_url: string;
  status: string;
  updated_at: string;
}

const HunterDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ enviados: 0, aceitos: 0, responderam: 0 });
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
  const [hasSession, setHasSession] = useState(false);
  const [unreadInbox, setUnreadInbox] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [{ data: session }, { data: leads }, { data: convs }] = await Promise.all([
        supabase.from("hunter_linkedin_session").select("user_id").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("hunter_leads")
          .select("*")
          .eq("user_id", user.id)
          .gte("updated_at", sevenDaysAgo)
          .order("updated_at", { ascending: false }),
        supabase
          .from("hunter_conversations")
          .select("unread_count")
          .eq("user_id", user.id),
      ]);

      setHasSession(!!session);
      const all = leads || [];
      setStats({
        enviados: all.filter(l => ["enviado", "conectado", "respondeu"].includes(l.status)).length,
        aceitos: all.filter(l => ["conectado", "respondeu"].includes(l.status)).length,
        responderam: all.filter(l => l.status === "respondeu").length,
      });
      setHotLeads(all.filter(l => l.status === "respondeu").slice(0, 20) as HotLead[]);
      setUnreadInbox((convs || []).reduce((s, c: any) => s + (c.unread_count || 0), 0));
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Target className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Hunter</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="default" className="gap-2 relative">
            <Link to="/hunter-inbox">
              <Inbox className="w-4 h-4" /> Inbox
              {unreadInbox > 0 && (
                <Badge variant="destructive" className="ml-1 rounded-full h-5 min-w-5 px-1.5 text-[10px]">
                  {unreadInbox}
                </Badge>
              )}
            </Link>
          </Button>
          {!hasSession && (
            <Button asChild variant="outline" className="gap-2">
              <Link to="/hunter-linkedin"><Linkedin className="w-4 h-4" /> Conectar LinkedIn</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="gap-2">
            <Link to="/hunter-ativar"><Settings className="w-4 h-4" /> Configurar</Link>
          </Button>
        </div>
      </div>

      {!hasSession && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-foreground">Comece configurando seu Hunter em 4 passos</p>
              <p className="text-sm text-muted-foreground">LinkedIn → ICP → Mensagem → Ativar</p>
            </div>
            <Button asChild><Link to="/hunter-linkedin">Começar agora</Link></Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Convites enviados (7d)", value: stats.enviados, color: "text-blue-400" },
          { icon: UserCheck, label: "Conexões aceitas", value: stats.aceitos, color: "text-green-400" },
          { icon: MessageSquare, label: "Responderam", value: stats.responderam, color: "text-primary" },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-5 flex items-center gap-4">
              <Icon className={`w-8 h-8 ${color}`} />
              <div>
                <p className="text-3xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔥 Leads quentes <Badge variant="secondary">{hotLeads.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hotLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ainda não há respostas. Quando alguém responder seu icebreaker, aparece aqui.
            </p>
          ) : (
            <div className="space-y-2">
              {hotLeads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{lead.nome_completo}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.cargo} · {lead.empresa}</p>
                  </div>
                  {lead.linkedin_url && (
                    <Button asChild variant="ghost" size="sm">
                      <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="gap-1">
                        Abrir <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HunterDashboard;
