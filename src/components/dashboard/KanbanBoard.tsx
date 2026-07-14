import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, Circle, Plus, Bot, Calendar, Flag, Loader2, Trash2, Zap, Activity, ChevronRight, Layers, Target, Eye, Filter, LayoutGrid, List, Search, X } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TaskStatus = "open" | "in_progress" | "done" | "atrasada";
type TaskPriority = "low" | "medium" | "high" | "critical";
type ViewMode = "board" | "timeline" | "squad" | "focus";

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

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; pulse: string; bg: string }> = {
  open: { label: "Aguardando", icon: Circle, color: "text-muted-foreground", pulse: "bg-muted-foreground", bg: "from-muted/20 to-transparent" },
  in_progress: { label: "Executando", icon: Activity, color: "text-accent-amber", pulse: "bg-accent-amber", bg: "from-accent-amber/10 to-transparent" },
  done: { label: "Entregue", icon: CheckCircle2, color: "text-accent-emerald", pulse: "bg-accent-emerald", bg: "from-accent-emerald/10 to-transparent" },
  atrasada: { label: "Atrasada", icon: AlertCircle, color: "text-destructive", pulse: "bg-destructive", bg: "from-destructive/10 to-transparent" },
};

const PRIORITY_CONFIG: Record<string, { label: string; weight: number; color: string; ring: string }> = {
  low: { label: "Baixa", weight: 1, color: "text-muted-foreground", ring: "ring-muted-foreground/20" },
  medium: { label: "Média", weight: 2, color: "text-accent-amber", ring: "ring-accent-amber/30" },
  high: { label: "Alta", weight: 3, color: "text-primary", ring: "ring-primary/30" },
  critical: { label: "Crítica", weight: 4, color: "text-destructive", ring: "ring-destructive/40" },
};

const KanbanBoard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>("focus");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterWindow, setFilterWindow] = useState<"all" | "24h" | "7d" | "30d">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium" as TaskPriority, due_date: "" });

  // Normaliza vocabulário: AI Workspace usa backlog/doing/review; Kanban clássico
  // usa open/in_progress. Ambos convivem na mesma tabela `agent_tasks`.
  const normalizeStatus = (raw: string, dueDate: string | null): string => {
    const v = (raw || "").toLowerCase();
    let mapped = v;
    if (v === "backlog") mapped = "open";
    else if (v === "doing" || v === "review") mapped = "in_progress";
    else if (v === "completed") mapped = "done";
    if (mapped !== "done" && dueDate && new Date(dueDate) < new Date()) return "atrasada";
    return mapped;
  };

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
        status: normalizeStatus(t.status, t.due_date),
      })) as Task[];
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      const { error } = await supabase.from("agent_tasks").update({ status: newStatus }).eq("id", taskId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] }); toast.success("Missão atualizada"); },
  });

  const createTask = useMutation({
    mutationFn: async () => {
      const { data: tenant } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user!.id).limit(1).single();
      if (!tenant) throw new Error("Tenant not found");
      const { error } = await supabase.from("agent_tasks").insert({
        user_id: user!.id, tenant_id: tenant.tenant_id, title: newTask.title,
        description: newTask.description || null, priority: newTask.priority,
        due_date: newTask.due_date || null, status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
      setCreateOpen(false);
      setNewTask({ title: "", description: "", priority: "medium", due_date: "" });
      toast.success("Missão criada");
    },
    onError: () => toast.error("Erro ao criar missão"),
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("agent_tasks").delete().eq("id", taskId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] }); toast.success("Missão removida"); },
  });

  const agentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) if (t.agent_name) set.add(t.agent_name);
    return Array.from(set).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    let result = tasks;
    if (filterPriority !== "all") result = result.filter(t => t.priority === filterPriority);
    if (filterStatus !== "all") result = result.filter(t => t.status === filterStatus);
    if (filterAgent !== "all") result = result.filter(t => (t.agent_name || "Sem agente") === filterAgent);
    if (filterWindow !== "all") {
      const ms = filterWindow === "24h" ? 864e5 : filterWindow === "7d" ? 7 * 864e5 : 30 * 864e5;
      const cutoff = Date.now() - ms;
      result = result.filter(t => new Date(t.created_at).getTime() >= cutoff);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.agent_name || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [tasks, filterPriority, filterStatus, filterAgent, filterWindow, searchQuery]);

  const statusGroups = useMemo(() => {
    const map: Record<string, Task[]> = { open: [], in_progress: [], done: [], atrasada: [] };
    for (const task of filtered) { (map[task.status] || map.open).push(task); }
    return map;
  }, [filtered]);

  const agentGroups = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of filtered) {
      const key = task.agent_name || "Sem agente";
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  // Stats
  const stats = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
    overdue: tasks.filter(t => t.status === "atrasada").length,
    critical: tasks.filter(t => t.priority === "critical" || t.priority === "high").length,
  }), [tasks]);

  const handleDrop = (status: string) => {
    if (draggedTask) { updateStatus.mutate({ taskId: draggedTask, newStatus: status === "atrasada" ? "open" : status }); }
    setDraggedTask(null); setDragOverStatus(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">Carregando missões...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ═══ MISSION HEADER ═══ */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Mission Board
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.total} missões · {stats.active} em execução · {stats.done} entregues
              {stats.overdue > 0 && <span className="text-destructive ml-1">· {stats.overdue} atrasadas</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-border/20 p-0.5 bg-muted/10">
              {([
                { id: "focus" as ViewMode, icon: Eye, label: "Focus" },
                { id: "board" as ViewMode, icon: LayoutGrid, label: "Board" },
                { id: "timeline" as ViewMode, icon: List, label: "Timeline" },
                { id: "squad" as ViewMode, icon: Layers, label: "Squads" },
              ]).map(v => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all",
                    view === v.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <v.icon className="h-3 w-3" />
                  {v.label}
                </button>
              ))}
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Nova Missão
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Nova Missão
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input placeholder="Objetivo da missão..." value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} className="bg-muted/20 border-border/20" />
                  <Textarea placeholder="Contexto adicional (opcional)..." value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} className="bg-muted/20 border-border/20 min-h-[80px]" />
                  <div className="flex gap-2">
                    <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v as TaskPriority }))}>
                      <SelectTrigger className="h-9 text-xs bg-muted/20 border-border/20 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Baixa</SelectItem>
                        <SelectItem value="medium">🟡 Média</SelectItem>
                        <SelectItem value="high">🟠 Alta</SelectItem>
                        <SelectItem value="critical">🔴 Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} className="bg-muted/20 border-border/20 h-9 text-xs flex-1" />
                  </div>
                  <Button onClick={() => createTask.mutate()} disabled={!newTask.title.trim() || createTask.isPending} className="w-full">
                    {createTask.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Criar Missão
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ═══ LIVE STATS STRIP ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { label: "Aguardando", value: statusGroups.open.length, icon: Circle, color: "text-muted-foreground", bg: "bg-muted/20" },
            { label: "Executando", value: statusGroups.in_progress.length, icon: Activity, color: "text-accent-amber", bg: "bg-accent-amber/10" },
            { label: "Entregues", value: statusGroups.done.length, icon: CheckCircle2, color: "text-accent-emerald", bg: "bg-accent-emerald/10" },
            { label: "Atrasadas", value: statusGroups.atrasada.length, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
          ]).map((s, i) => (
            <button
              key={s.label}
              onClick={() => setFilterStatus(filterStatus === Object.keys(STATUS_CONFIG)[i] ? "all" : Object.keys(STATUS_CONFIG)[i])}
              className={cn(
                "rounded-xl p-3 flex items-center gap-3 transition-all border",
                filterStatus === Object.keys(STATUS_CONFIG)[i]
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/10 bg-card/30 hover:border-border/20"
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", s.bg)}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <div className="text-left">
                <p className="font-display text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
              {s.label === "Executando" && s.value > 0 && (
                <div className="ml-auto w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3 w-3 text-muted-foreground/50" />
          <div className="flex gap-1">
            {(["all", "critical", "high", "medium", "low"] as const).map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                  filterPriority === p
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/10"
                )}
              >
                {p === "all" ? "Todas" : PRIORITY_CONFIG[p]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ FOCUS VIEW - Obsidian-style clean list ═══ */}
      {view === "focus" && (
        <div className="max-w-2xl mx-auto space-y-1">
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Active / In Progress */}
              {statusGroups.in_progress.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent-amber/70 mb-2 pl-1">Em execução</p>
                  {statusGroups.in_progress.sort((a, b) => (PRIORITY_CONFIG[b.priority]?.weight || 0) - (PRIORITY_CONFIG[a.priority]?.weight || 0)).map(task => (
                    <FocusRow key={task.id} task={task} onToggle={(id) => updateStatus.mutate({ taskId: id, newStatus: "done" })} onDelete={(id) => deleteTask.mutate(id)} />
                  ))}
                </div>
              )}
              {/* Overdue */}
              {statusGroups.atrasada.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-destructive/70 mb-2 pl-1">Atrasadas</p>
                  {statusGroups.atrasada.map(task => (
                    <FocusRow key={task.id} task={task} onToggle={(id) => updateStatus.mutate({ taskId: id, newStatus: "done" })} onDelete={(id) => deleteTask.mutate(id)} />
                  ))}
                </div>
              )}
              {/* Open */}
              {statusGroups.open.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/50 mb-2 pl-1">A fazer</p>
                  {statusGroups.open.sort((a, b) => (PRIORITY_CONFIG[b.priority]?.weight || 0) - (PRIORITY_CONFIG[a.priority]?.weight || 0)).map(task => (
                    <FocusRow key={task.id} task={task} onToggle={(id) => updateStatus.mutate({ taskId: id, newStatus: "in_progress" })} onDelete={(id) => deleteTask.mutate(id)} />
                  ))}
                </div>
              )}
              {/* Done */}
              {statusGroups.done.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent-emerald/50 mb-2 pl-1">Entregues</p>
                  {statusGroups.done.slice(0, 10).map(task => (
                    <FocusRow key={task.id} task={task} onToggle={() => {}} onDelete={(id) => deleteTask.mutate(id)} done />
                  ))}
                  {statusGroups.done.length > 10 && (
                    <p className="text-[10px] text-muted-foreground/30 pl-7 font-mono">+ {statusGroups.done.length - 10} concluídas</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ BOARD VIEW ═══ */}
      {view === "board" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(STATUS_CONFIG).map(([statusId, config]) => {
            const colTasks = statusGroups[statusId] || [];
            const isOver = dragOverStatus === statusId;
            return (
              <div
                key={statusId}
                onDragOver={e => { e.preventDefault(); setDragOverStatus(statusId); }}
                onDrop={() => handleDrop(statusId)}
                onDragLeave={() => setDragOverStatus(null)}
                className={cn(
                  "rounded-xl border p-3 min-h-[200px] transition-colors bg-card/20",
                  isOver ? "ring-1 ring-primary/40 border-primary/30" : "border-border/20"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <config.icon className={cn("h-4 w-4", config.color)} />
                      {statusId === "in_progress" && colTasks.length > 0 && (
                        <span className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse", config.pulse)} />
                      )}
                    </div>
                    <span className="text-xs font-semibold">{config.label}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-background/50 text-muted-foreground">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {colTasks.map(task => <TaskCard key={task.id} task={task} onDragStart={setDraggedTask} onDragEnd={() => { setDraggedTask(null); setDragOverStatus(null); }} onDelete={id => deleteTask.mutate(id)} isDragged={draggedTask === task.id} onStatusChange={(id, s) => updateStatus.mutate({ taskId: id, newStatus: s })} />)}
                  </AnimatePresence>
                  {colTasks.length === 0 && (
                    <div className="flex flex-col items-center py-8 text-muted-foreground/30">
                      <config.icon className="h-6 w-6 mb-1" />
                      <span className="text-[10px]">Sem missões</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ TIMELINE VIEW ═══ */}
      {view === "timeline" && (
        <div className="space-y-1">
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((task, i) => {
              const st = STATUS_CONFIG[task.status] || STATUS_CONFIG.open;
              const pr = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-stretch gap-3 group"
                >
                  {/* Timeline line */}
                  <div className="flex flex-col items-center w-6 shrink-0">
                    <div className={cn("w-2.5 h-2.5 rounded-full border-2 border-background mt-3.5 shrink-0 relative z-10", st.pulse)}>
                      {task.status === "in_progress" && <span className={cn("absolute inset-0 rounded-full animate-ping opacity-40", st.pulse)} />}
                    </div>
                    {i < filtered.length - 1 && <div className="flex-1 w-px bg-border/20" />}
                  </div>

                  {/* Content */}
                  <div className={cn(
                    "flex-1 rounded-xl border border-border/10 p-3 mb-1 transition-all",
                    "hover:border-border/20 hover:bg-card/40 bg-card/20"
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{task.title}</p>
                        {task.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full border", pr.ring, pr.color)}>{pr.label}</span>
                        <span className={cn("flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full border border-border/40 bg-background/40", st.color)}>
                          <st.icon className="h-2.5 w-2.5" />
                          {st.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      {task.agent_name && (
                        <span className="flex items-center gap-1 text-primary/70">
                          <Bot className="h-2.5 w-2.5" /> {task.agent_name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {new Date(task.due_date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(task.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button onClick={() => deleteTask.mutate(task.id)} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ SQUAD VIEW ═══ */}
      {view === "squad" && (
        <div className="space-y-4">
          {agentGroups.length === 0 ? (
            <EmptyState />
          ) : (
            agentGroups.map(([agentName, agentTasks]) => {
              const doneCount = agentTasks.filter(t => t.status === "done").length;
              const activeCount = agentTasks.filter(t => t.status === "in_progress").length;
              const progress = agentTasks.length > 0 ? Math.round((doneCount / agentTasks.length) * 100) : 0;
              return (
                <motion.div
                  key={agentName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/10 overflow-hidden"
                >
                  {/* Agent Header */}
                  <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center relative">
                        <Bot className="h-4 w-4 text-primary" />
                        {activeCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-amber border-2 border-background animate-pulse" />}
                      </div>
                      <div>
                        <p className="text-sm font-display font-semibold">{agentName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {agentTasks.length} missões · {doneCount} entregues · {activeCount} ativas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-bold text-primary">{progress}%</p>
                        <p className="text-[9px] text-muted-foreground">completo</p>
                      </div>
                      <div className="w-16 h-2 rounded-full bg-muted/30 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Agent Tasks */}
                  <div className="px-3 py-2 grid gap-1.5">
                    {agentTasks.sort((a, b) => (PRIORITY_CONFIG[b.priority]?.weight || 0) - (PRIORITY_CONFIG[a.priority]?.weight || 0)).map(task => {
                      const st = STATUS_CONFIG[task.status] || STATUS_CONFIG.open;
                      const pr = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                      return (
                        <div key={task.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-card/20 hover:bg-card/40 transition-colors group">
                          <div className="relative shrink-0">
                            <st.icon className={cn("h-3.5 w-3.5", st.color)} />
                            {task.status === "in_progress" && <span className={cn("absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-pulse", st.pulse)} />}
                          </div>
                          <p className="text-xs font-medium flex-1 min-w-0 truncate">{task.title}</p>
                          <span className={cn("text-[8px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", pr.color, pr.ring, "ring-1")}>{pr.label}</span>
                          {task.due_date && (
                            <span className="text-[9px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                              <Calendar className="h-2.5 w-2.5" />
                              {new Date(task.due_date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                            </span>
                          )}
                          <button onClick={() => deleteTask.mutate(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Trash2 className="h-3 w-3 text-muted-foreground/40 hover:text-destructive" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

/* ═══ TASK CARD (Board View) ═══ */
const TaskCard = ({ task, onDragStart, onDragEnd, onDelete, isDragged, onStatusChange }: {
  task: Task; onDragStart: (id: string) => void; onDragEnd: () => void;
  onDelete: (id: string) => void; isDragged: boolean;
  onStatusChange: (id: string, status: string) => void;
}) => {
  const pr = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragged ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-lg border border-border/15 bg-card/60 backdrop-blur-sm p-3 cursor-grab active:cursor-grabbing",
        "hover:border-border/30 hover:shadow-md transition-all group",
        pr.ring, "ring-1"
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-1.5">
          <p className="text-xs font-medium leading-snug line-clamp-2 flex-1">{task.title}</p>
          <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 shrink-0">
            <Trash2 className="h-3 w-3 text-muted-foreground/40 hover:text-destructive" />
          </button>
        </div>
        {task.description && <p className="text-[10px] text-muted-foreground line-clamp-1">{task.description}</p>}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full", pr.color, pr.ring, "ring-1")}>{pr.label}</span>
          {task.due_date && (
            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(task.due_date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
            </span>
          )}
          {task.agent_name && (
            <span className="flex items-center gap-0.5 text-[9px] text-primary/70">
              <Bot className="h-2.5 w-2.5" /> {task.agent_name}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ═══ FOCUS ROW - Obsidian-style checkbox row ═══ */
const FocusRow = ({ task, onToggle, onDelete, done }: {
  task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void; done?: boolean;
}) => {
  const pr = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const isOverdue = task.status === "atrasada";
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-3 py-2 px-2 rounded-lg group transition-all hover:bg-card/30",
        done && "opacity-40"
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "w-4 h-4 rounded-[4px] border-2 shrink-0 flex items-center justify-center transition-all",
          done ? "bg-accent-emerald/20 border-accent-emerald/40" : "border-border/30 hover:border-primary/50"
        )}
      >
        {done && <CheckCircle2 className="h-3 w-3 text-accent-emerald" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm leading-snug",
          done && "line-through text-muted-foreground",
          isOverdue && "text-destructive"
        )}>
          {task.title}
        </p>
        {task.description && !done && (
          <p className="text-[10px] text-muted-foreground/50 mt-0.5 line-clamp-1 font-mono">{task.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!done && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", pr.color === "text-destructive" ? "bg-destructive" : pr.color === "text-primary" ? "bg-primary" : pr.color === "text-accent-amber" ? "bg-accent-amber" : "bg-muted-foreground/30")} title={pr.label} />}
        {task.due_date && !done && (
          <span className={cn("text-[10px] font-mono", isOverdue ? "text-destructive" : "text-muted-foreground/40")}>
            {new Date(task.due_date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
          </span>
        )}
        {task.agent_name && !done && (
          <span className="text-[10px] text-primary/40 font-mono hidden sm:inline">
            {task.agent_name}
          </span>
        )}
        <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="h-3 w-3 text-muted-foreground/30 hover:text-destructive" />
        </button>
      </div>
    </motion.div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
      <Target className="h-7 w-7 text-primary/40" />
    </div>
    <h3 className="font-display font-semibold text-sm mb-1">Nenhuma missão ainda</h3>
    <p className="text-xs text-muted-foreground max-w-xs">
      Crie missões para seus agentes executarem ou peça ao THOR para delegar tarefas automaticamente.
    </p>
  </div>
);

export default KanbanBoard;
