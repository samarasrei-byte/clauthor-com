import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bot, ArrowLeft, Construction, Play, Pause, Save, Loader2, Activity, FileText, Settings as SettingsIcon, History, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import SchemaFieldRenderer, { type SchemaField } from "@/components/workspace/SchemaFieldRenderer";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const AgentWorkspace = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<Record<string, any>>({});
  const [activeStatus, setActiveStatus] = useState(true);

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent-catalog", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents_catalog")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: userAgent } = useQuery({
    queryKey: ["user-agent", user?.id, slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_agents")
        .select("*")
        .eq("user_id", user!.id)
        .eq("agent_slug", slug!)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!slug,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["agent-logs", user?.id, slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("execution_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user && !!slug,
  });

  useEffect(() => {
    if (userAgent?.config) setConfig(userAgent.config as Record<string, any>);
    if (userAgent) setActiveStatus(userAgent.active);
  }, [userAgent]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_agents")
        .upsert({
          user_id: user!.id,
          agent_slug: slug!,
          config,
          active: activeStatus,
        }, { onConflict: "user_id,agent_slug" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuração salva");
      queryClient.invalidateQueries({ queryKey: ["user-agent"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  const toggleActive = async () => {
    const newStatus = !activeStatus;
    setActiveStatus(newStatus);
    await supabase
      .from("user_agents")
      .upsert({ user_id: user!.id, agent_slug: slug!, active: newStatus, config }, { onConflict: "user_id,agent_slug" });
    toast.success(newStatus ? "Agente ativado" : "Agente pausado");
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <Bot className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Agente não encontrado</h1>
        <p className="text-muted-foreground">O agente "{slug}" não existe no catálogo.</p>
        <Link to="/agents"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button></Link>
      </div>
    );
  }

  const schema = (agent.config_schema as any[] as SchemaField[]) || [];
  const hasSchema = Array.isArray(schema) && schema.length > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/20 text-primary/80">
              {agent.department} · {agent.squad}
            </Badge>
            {isAdmin && <Badge className="bg-primary/15 text-primary border-0">ADMIN</Badge>}
            <Badge variant={activeStatus ? "default" : "secondary"}>
              {activeStatus ? "Ativo" : "Pausado"}
            </Badge>
          </div>
          <h1 className="font-display text-3xl font-bold">{agent.name}</h1>
          {agent.tagline && <p className="text-muted-foreground">{agent.tagline}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleActive}>
            {activeStatus ? <><Pause className="h-4 w-4 mr-2" />Pausar</> : <><Play className="h-4 w-4 mr-2" />Ativar</>}
          </Button>
          <Link to="/agents"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Meus Agentes</Button></Link>
        </div>
      </div>

      {/* HUNTER SHORTCUT */}
      {slug === "hunter_linkedin" && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Hunter possui interface dedicada</p>
            <p className="text-xs text-muted-foreground">Use o painel completo para criar campanhas e gerenciar leads.</p>
          </div>
          <Link to="/hunter-campaigns"><Button>Abrir Hunter</Button></Link>
        </div>
      )}

      {/* TABS */}
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="config"><SettingsIcon className="h-3.5 w-3.5 mr-1.5" />Configuração</TabsTrigger>
          <TabsTrigger value="executions"><Activity className="h-3.5 w-3.5 mr-1.5" />Execuções</TabsTrigger>
          <TabsTrigger value="logs"><FileText className="h-3.5 w-3.5 mr-1.5" />Logs</TabsTrigger>
          <TabsTrigger value="info"><Database className="h-3.5 w-3.5 mr-1.5" />Sobre</TabsTrigger>
        </TabsList>

        {/* CONFIGURAÇÃO */}
        <TabsContent value="config" className="space-y-4">
          <div className="rounded-xl border border-border bg-card/40 p-6">
            {hasSchema ? (
              <>
                <div className="space-y-5">
                  {schema.map((field) => (
                    <SchemaFieldRenderer
                      key={field.key}
                      field={field}
                      value={config[field.key]}
                      onChange={(v) => setConfig((prev) => ({ ...prev, [field.key]: v }))}
                    />
                  ))}
                </div>
                <div className="flex justify-end pt-6 mt-6 border-t border-border">
                  <Button onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending}>
                    {saveConfig.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Configuração
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 space-y-3">
                <Construction className="h-10 w-10 mx-auto text-primary/60" />
                <h3 className="font-display text-lg font-bold">Configuração em breve</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  O schema deste agente ainda não foi definido. Entre em contato para configuração personalizada.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* EXECUÇÕES */}
        <TabsContent value="executions">
          <div className="rounded-xl border border-border bg-card/40 p-6 text-center space-y-4">
            <Button size="lg" onClick={() => toast.info("Execução manual em breve")}>
              <Play className="h-4 w-4 mr-2" />Executar agora
            </Button>
            <p className="text-xs text-muted-foreground">
              {logs.length} execução(ões) registradas
            </p>
          </div>
        </TabsContent>

        {/* LOGS */}
        <TabsContent value="logs">
          <div className="rounded-xl border border-border bg-card/40 p-4 space-y-2 max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum log ainda.</p>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-background/40 text-sm">
                  <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-[10px]">
                    {log.status}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-mono text-xs">{log.action}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* SOBRE */}
        <TabsContent value="info" className="space-y-4">
          {Array.isArray(agent.responsibilities) && agent.responsibilities.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card/30 p-6">
              <h3 className="font-display text-sm font-bold mb-3 uppercase tracking-wider text-muted-foreground">Responsabilidades</h3>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                {(agent.responsibilities as string[]).map((r, i) => (
                  <li key={i} className="text-foreground/80">• {r}</li>
                ))}
              </ul>
            </div>
          )}
          {agent.description && (
            <div className="rounded-xl border border-border/60 bg-card/30 p-6">
              <h3 className="font-display text-sm font-bold mb-3 uppercase tracking-wider text-muted-foreground">Descrição</h3>
              <p className="text-sm text-muted-foreground">{agent.description}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentWorkspace;
