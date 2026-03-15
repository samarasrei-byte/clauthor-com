import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Clock, AlertCircle, Circle, Plus, GripVertical,
  Calendar, User, Flag, ChevronDown, Loader2, Trash2, ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TaskStatus = "open" | "in_progress" | "done" | "atrasada";
type TaskPriority = "low" | "medium" | "high" | "critical";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  category: string | null;
  agent_id: string | null;
  created_at: string;
  agent_name?: string;
}

const COLUMNS: { id: TaskStatus; label: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  { id: "open", label: "A Fazer", icon: Circle, color: "text-muted-foreground", bgColor: "bg-muted/30" },
  { id: "in_progress", label: "Em Progresso", icon: Clock, color: "text-accent-amber", bgColor: "bg-accent-amber/5" },
  { id: "done", label: "Concluído", icon: CheckCircle2, color: "text-accent-emerald", bgColor: "bg-accent-emerald/5" },
  { id: "atrasada", label: "Atrasada", icon: AlertCircle, color: "text-destructive", bgColor: "bg-destructive/5" },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: "Baixa", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  medium: { label: "Média", color: "bg-accent-amber/10 text-accent-amber", dot: "bg-accent-amber" },
  high: { label: "Alta", color: "bg-primary/10 text-primary", dot: "bg-primary" },
  critical: { label: "Crítica", color: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

const KanbanBoard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium" as TaskPriority, due_date: "" });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["kanban-tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_tasks")
        .select("*, agent:agents(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        agent_name: t.agent?.name || null,
        // Auto-mark overdue
        status: t.status !== "done" && t.due_date && new Date(t.due_date) < new Date() ? "atrasada" : t.status,
      })) as Task[];
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("agent_tasks")
        .update({ status: newStatus })
        .eq("id", taskId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
      toast.success("Tarefa atualizada");
    },
  });

  const createTask = useMutation({
    mutationFn: async () => {
      // Get tenant_id
      const { data: tenant } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user!.id)
        .limit(1)
        .single();
      if (!tenant) throw new Error("Tenant not found");

      const { error } = await supabase.from("agent_tasks").insert({
        user_id: user!.id,
        tenant_id: tenant.tenant_id,
        title: newTask.title,
        description: newTask.description || null,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
      setCreateOpen(false);
      setNewTask({ title: "", description: "", priority: "medium", due_date: "" });
      toast.success("Tarefa criada");
    },
    onError: () => toast.error("Erro ao criar tarefa"),
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("agent_tasks").delete().eq("id", taskId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
      toast.success("Tarefa removida");
    },
  });

  const filteredTasks = useMemo(() => {
    if (filterPriority === "all") return tasks;
    return tasks.filter(t => t.priority === filterPriority);
  }, [tasks, filterPriority]);

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = { open: [], in_progress: [], done: [], atrasada: [] };
    for (const task of filteredTasks) {
      const col = map[task.status] ? task.status : "open";
      map[col].push(task);
    }
    return map;
  }, [filteredTasks]);

  const handleDragStart = (taskId: string) => setDraggedTask(taskId);
  const handleDragEnd = () => { setDraggedTask(null); setDragOverColumn(null); };
  const handleDragOver = (e: React.DragEvent, colId: string) => { e.preventDefault(); setDragOverColumn(colId); };
  const handleDrop = (colId: string) => {
    if (draggedTask) {
      updateStatus.mutate({ taskId: draggedTask, newStatus: colId === "atrasada" ? "open" : colId });
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Tarefas</h2>
          <p className="text-xs text-muted-foreground">{tasks.length} tarefas • Arraste para mudar status</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-8 text-xs w-32 bg-muted/20 border-border/20">
              <Flag className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Nova Tarefa</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Input
                  placeholder="Título da tarefa..."
                  value={newTask.title}
                  onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                  className="bg-muted/20 border-border/20"
                />
                <Textarea
                  placeholder="Descrição (opcional)..."
                  value={newTask.description}
                  onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                  className="bg-muted/20 border-border/20 min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v as TaskPriority }))}>
                    <SelectTrigger className="h-9 text-xs bg-muted/20 border-border/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))}
                    className="bg-muted/20 border-border/20 h-9 text-xs"
                  />
                </div>
                <Button
                  onClick={() => createTask.mutate()}
                  disabled={!newTask.title.trim() || createTask.isPending}
                  className="w-full"
                >
                  {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map(col => {
          const colTasks = tasksByColumn[col.id] || [];
          const isOver = dragOverColumn === col.id;
          const ColIcon = col.icon;
          return (
            <div
              key={col.id}
              onDragOver={e => handleDragOver(e, col.id)}
              onDrop={() => handleDrop(col.id)}
              className={cn(
                "rounded-xl border border-border/10 p-3 min-h-[300px] transition-all duration-200",
                col.bgColor,
                isOver && "ring-2 ring-primary/30 border-primary/20 scale-[1.01]"
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ColIcon className={cn("h-4 w-4", col.color)} />
                  <span className="text-xs font-semibold text-foreground">{col.label}</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-background/50 text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {colTasks.map(task => {
                    const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: draggedTask === task.id ? 0.5 : 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "rounded-lg border border-border/15 bg-card/80 backdrop-blur-sm p-3 cursor-grab active:cursor-grabbing",
                          "hover:border-border/30 hover:shadow-sm transition-all group"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 mt-0.5 shrink-0 group-hover:text-muted-foreground/60" />
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">{task.title}</p>
                            {task.description && (
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={cn("inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full", priority.color)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
                                {priority.label}
                              </span>
                              {task.due_date && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {new Date(task.due_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                                </span>
                              )}
                              {task.agent_name && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] text-primary/70">
                                  <User className="h-2.5 w-2.5" />
                                  {task.agent_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteTask.mutate(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground/40" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-[10px] text-muted-foreground/40">
                    Sem tarefas
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
