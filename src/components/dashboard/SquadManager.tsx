import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Bot, Trash2, Sparkles, ChevronRight, Search, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SquadManagerProps {
  onNavigate?: (id: string) => void;
}

const SquadManager = ({ onNavigate }: SquadManagerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [search, setSearch] = useState("");

  // Fetch tenant
  const { data: tenantId } = useQuery({
    queryKey: ["tenant-id", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.tenant_id || null;
    },
  });

  // Fetch squads
  const { data: squads = [], isLoading } = useQuery({
    queryKey: ["squads", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("squads")
        .select("*, squad_agents(agent_id, agents(id, name, status, tier))")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all user agents for adding
  const { data: agents = [] } = useQuery({
    queryKey: ["agents-for-squad", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("agents")
        .select("id, name, status, tier")
        .eq("user_id", user!.id)
        .order("name");
      return data || [];
    },
  });

  // Create squad
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Sem tenant");
      const { error } = await supabase.from("squads").insert({
        name: newName,
        description: newDesc || null,
        tenant_id: tenantId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squads"] });
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      toast.success("Squad criado com sucesso!");
    },
    onError: () => toast.error("Erro ao criar squad"),
  });

  // Add agent to squad
  const addAgentMutation = useMutation({
    mutationFn: async ({ squadId, agentId }: { squadId: string; agentId: string }) => {
      if (!tenantId) throw new Error("Sem tenant");
      const { error } = await supabase.from("squad_agents").insert({
        squad_id: squadId,
        agent_id: agentId,
        tenant_id: tenantId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squads"] });
      toast.success("Agente adicionado ao squad");
    },
    onError: () => toast.error("Erro ao adicionar agente"),
  });

  // Remove agent from squad
  const removeAgentMutation = useMutation({
    mutationFn: async ({ squadId, agentId }: { squadId: string; agentId: string }) => {
      const { error } = await supabase
        .from("squad_agents")
        .delete()
        .eq("squad_id", squadId)
        .eq("agent_id", agentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squads"] });
      toast.success("Agente removido do squad");
    },
  });

  // Delete squad
  const deleteMutation = useMutation({
    mutationFn: async (squadId: string) => {
      await supabase.from("squad_agents").delete().eq("squad_id", squadId);
      const { error } = await supabase.from("squads").delete().eq("id", squadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squads"] });
      toast.success("Squad removido");
    },
  });

  const filtered = useMemo(() => {
    if (!search) return squads;
    const q = search.toLowerCase();
    return squads.filter((s: any) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
  }, [squads, search]);

  const tierColors: Record<string, string> = {
    basic: "bg-muted text-muted-foreground",
    intermediate: "bg-accent/15 text-accent-foreground",
    advanced: "bg-accent-emerald/15 text-accent-emerald",
    enterprise: "bg-primary/15 text-primary",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Layers3 className="h-5 w-5 text-primary" strokeWidth={1.5} />
            Squads
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monte equipes de agentes que trabalham juntos em objetivos específicos
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl h-9 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Novo Squad
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar squads..."
          className="pl-9 h-9 rounded-xl text-xs bg-muted/30 border-border/20"
        />
      </div>

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary/50" />
          </div>
          <h3 className="font-display font-bold text-foreground mb-1">Nenhum squad ainda</h3>
          <p className="text-sm text-muted-foreground max-w-[300px] mb-4">
            Crie seu primeiro squad para organizar agentes em equipes especializadas
          </p>
          <Button onClick={() => setCreateOpen(true)} variant="outline" className="gap-2 rounded-xl text-xs">
            <Plus className="h-3.5 w-3.5" />
            Criar primeiro squad
          </Button>
        </motion.div>
      )}

      {/* Squad grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((squad: any, i: number) => {
            const squadAgents = squad.squad_agents?.map((sa: any) => sa.agents).filter(Boolean) || [];
            return (
              <motion.div
                key={squad.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-card/60 border border-border/20 rounded-xl p-4 hover:border-primary/20 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-foreground">{squad.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {squadAgents.length} agente{squadAgents.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(squad.id)}
                    className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Description */}
                {squad.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{squad.description}</p>
                )}

                {/* Agent avatars */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {squadAgents.slice(0, 6).map((agent: any) => (
                    <Badge
                      key={agent.id}
                      variant="outline"
                      className={`text-[9px] gap-1 ${tierColors[agent.tier] || "bg-muted text-muted-foreground"}`}
                    >
                      <Bot className="h-2.5 w-2.5" />
                      {agent.name}
                    </Badge>
                  ))}
                  {squadAgents.length > 6 && (
                    <Badge variant="outline" className="text-[9px]">
                      +{squadAgents.length - 6}
                    </Badge>
                  )}
                  {squadAgents.length === 0 && (
                    <span className="text-[10px] text-muted-foreground/50 italic">Sem agentes</span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border/10">
                  <span className="text-[9px] text-muted-foreground/50 font-mono">
                    {new Date(squad.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <button
                    onClick={() => onNavigate?.("equipe")}
                    className="text-[10px] text-primary flex items-center gap-0.5 hover:underline"
                  >
                    Chat do Squad
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-primary" />
              Novo Squad
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome do Squad</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Squad de Vendas"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Descrição (opcional)</label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Objetivo e foco deste squad..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
              className="gap-2 rounded-xl text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Criar Squad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SquadManager;
