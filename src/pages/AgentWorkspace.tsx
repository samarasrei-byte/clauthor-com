import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bot, ArrowLeft, Construction } from "lucide-react";

const AgentWorkspace = () => {
  const { slug } = useParams<{ slug: string }>();

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

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <Badge variant="outline" className="border-primary/20 text-primary/80">
            {agent.department} · {agent.squad}
          </Badge>
          <h1 className="font-display text-3xl font-bold">{agent.name}</h1>
          {agent.tagline && <p className="text-muted-foreground">{agent.tagline}</p>}
        </div>
        <Link to="/agents"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Meus Agentes</Button></Link>
      </div>

      <div className="rounded-xl border border-border bg-card/40 p-8 text-center space-y-3">
        <Construction className="h-10 w-10 mx-auto text-primary/60" />
        <h2 className="font-display text-xl font-bold">Workspace em construção</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          As abas Configuração, Execuções, Resultados, Integrações, Logs e Histórico serão liberadas em breve.
          {agent.slug === "hunter_linkedin" && " Por enquanto, use a área Hunter no menu lateral."}
        </p>
        {agent.slug === "hunter_linkedin" && (
          <Link to="/hunter-campaigns"><Button>Ir para Hunter</Button></Link>
        )}
      </div>

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
    </div>
  );
};

export default AgentWorkspace;
