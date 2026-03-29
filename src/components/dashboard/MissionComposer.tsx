import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Workflow, Plus, Play, Trash2, Bot, ArrowRight, 
  Zap, GripVertical, CheckCircle2, X, Sparkles, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface MissionNode {
  id: string;
  agentName: string;
  agentId?: string;
  task: string;
  status: "idle" | "running" | "done" | "error";
  dependsOn?: string;
}

const DEMO_AGENTS = [
  "SDR Outbound", "Copywriter IA", "Analista de Dados", 
  "Customer Success", "Social Media", "SEO Strategist",
  "Email Marketer", "Sales Closer"
];

const MissionComposer = () => {
  const { user } = useAuth();
  const [missionName, setMissionName] = useState("");
  const [nodes, setNodes] = useState<MissionNode[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const { data: agents = [] } = useQuery({
    queryKey: ["composer-agents", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("id, name").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const availableAgents = agents.length > 0 
    ? agents.map((a: any) => a.name) 
    : DEMO_AGENTS;

  const addNode = useCallback((agentName: string) => {
    const agent = agents.find((a: any) => a.name === agentName);
    setNodes(prev => [...prev, {
      id: crypto.randomUUID(),
      agentName,
      agentId: agent?.id,
      task: "",
      status: "idle",
      dependsOn: prev.length > 0 ? prev[prev.length - 1].id : undefined,
    }]);
  }, [agents]);

  const updateNodeTask = (id: string, task: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, task } : n));
  };

  const removeNode = (id: string) => {
    setNodes(prev => {
      const filtered = prev.filter(n => n.id !== id);
      return filtered.map(n => n.dependsOn === id ? { ...n, dependsOn: undefined } : n);
    });
  };

  const simulateExecution = async () => {
    if (nodes.length === 0 || nodes.some(n => !n.task.trim())) {
      toast.error("Preencha todas as tarefas antes de executar");
      return;
    }
    setIsExecuting(true);
    for (let i = 0; i < nodes.length; i++) {
      setNodes(prev => prev.map((n, idx) => idx === i ? { ...n, status: "running" } : n));
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
      setNodes(prev => prev.map((n, idx) => idx === i ? { ...n, status: "done" } : n));
    }
    setIsExecuting(false);
    toast.success(`Missão "${missionName || "Sem nome"}" concluída com sucesso!`);
  };

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setNodes(prev => {
      const newNodes = [...prev];
      const [dragged] = newNodes.splice(draggedIdx, 1);
      newNodes.splice(idx, 0, dragged);
      return newNodes;
    });
    setDraggedIdx(idx);
  };
  const handleDragEnd = () => setDraggedIdx(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            Mission Composer
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Monte missões visuais arrastando agentes. Crie workflows complexos sem código.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
          <Sparkles className="h-3 w-3 mr-1" /> VISUAL BUILDER
        </Badge>
      </div>

      {/* Mission name */}
      <Card className="p-4 bg-card/50 backdrop-blur border-border/30">
        <Input
          placeholder="Nome da missão... ex: 'Campanha de Outbound Q1'"
          value={missionName}
          onChange={e => setMissionName(e.target.value)}
          className="text-sm bg-transparent border-border/30"
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Agent palette */}
        <Card className="p-4 bg-card/50 backdrop-blur border-border/30 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            Agentes Disponíveis
          </h3>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {availableAgents.map((name: string) => (
              <button
                key={name}
                onClick={() => addNode(name)}
                className="w-full text-left p-2 rounded-lg border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all text-xs flex items-center gap-2 group"
              >
                <Bot className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="truncate">{name}</span>
                <Plus className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
              </button>
            ))}
          </div>
        </Card>

        {/* Mission canvas */}
        <Card className="lg:col-span-3 p-5 bg-card/50 backdrop-blur border-border/30 min-h-[400px]">
          {nodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-50">
              <Workflow className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Canvas vazio</p>
                <p className="text-xs text-muted-foreground">Clique em um agente à esquerda para adicionar ao fluxo</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {nodes.map((node, idx) => (
                  <motion.div
                    key={node.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    transition={{ type: "spring", damping: 20 }}
                    draggable={!isExecuting}
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className="relative"
                  >
                    {/* Connection line */}
                    {idx > 0 && (
                      <div className="flex justify-center -mt-1 mb-1">
                        <div className={`w-px h-4 ${node.status === "done" ? "bg-emerald-400" : node.status === "running" ? "bg-primary animate-pulse" : "bg-border/30"}`} />
                      </div>
                    )}

                    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      node.status === "running" ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5" :
                      node.status === "done" ? "border-emerald-500/30 bg-emerald-500/5" :
                      node.status === "error" ? "border-red-500/30 bg-red-500/5" :
                      "border-border/30 hover:border-border/50"
                    }`}>
                      {/* Drag handle */}
                      <div className="cursor-grab active:cursor-grabbing pt-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                      </div>

                      {/* Step number */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        node.status === "done" ? "bg-emerald-500/20 text-emerald-400" :
                        node.status === "running" ? "bg-primary/20 text-primary animate-pulse" :
                        "bg-muted/30 text-muted-foreground"
                      }`}>
                        {node.status === "done" ? <CheckCircle2 className="h-4 w-4" /> :
                         node.status === "running" ? <Zap className="h-4 w-4" /> :
                         idx + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Bot className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-semibold">{node.agentName}</span>
                          <Badge variant="outline" className="text-[8px] border-border/30">Step {idx + 1}</Badge>
                        </div>
                        <Textarea
                          placeholder={`O que ${node.agentName} deve fazer?`}
                          value={node.task}
                          onChange={e => updateNodeTask(node.id, e.target.value)}
                          disabled={isExecuting}
                          className="text-xs min-h-[50px] bg-transparent border-border/20 resize-none"
                          rows={2}
                        />
                      </div>

                      {/* Remove */}
                      {!isExecuting && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => removeNode(node.id)}>
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Execute button */}
              <div className="flex justify-end gap-2 pt-4">
                {!isExecuting && nodes.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setNodes([])}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar
                  </Button>
                )}
                <Button 
                  size="sm" 
                  className="gap-2 text-xs"
                  onClick={simulateExecution}
                  disabled={isExecuting || nodes.length === 0}
                >
                  {isExecuting ? (
                    <><Zap className="h-3.5 w-3.5 animate-pulse" /> Executando...</>
                  ) : (
                    <><Play className="h-3.5 w-3.5" /> Executar Missão ({nodes.length} steps)</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MissionComposer;
