import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus, Filter, Calendar, BarChart3, Clock, CheckCircle2,
  Circle, ArrowRight, AlertTriangle, X, ChevronDown, Flame,
  Target, Zap, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { WORKFORCE } from "@/data/workforceArchitecture";

// ── Column config ──
const COLUMNS = [
  { id: "backlog", label: "Backlog", icon: Circle, color: "text-muted-foreground", bg: "bg-muted/20" },
  { id: "open", label: "To Do", icon: Target, color: "text-blue-400", bg: "bg-blue-500/5" },
  { id: "in_progress", label: "In Progress", icon: Flame, color: "text-amber-400", bg: "bg-amber-500/5" },
  { id: "review", label: "Review", icon: AlertTriangle, color: "text-purple-400", bg: "bg-purple-500/5" },
  { id: "done", label: "Done", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/5" },
];

const PRIORITIES = [
  { value: "critical", label: "Critical", color: "bg-red-500", icon: Zap },
  { value: "high", label: "High", color: "bg-orange-500", icon: AlertTriangle },
  { value: "medium", label: "Medium", color: "bg-amber-500", icon: ArrowRight },
  { value: "low", label: "Low", color: "bg-blue-500", icon: Circle },
];

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  agent_id: string | null;
  tenant_id: string;
  user_id: string;
}

// ── Task Card ──
function TaskCard({
  task,
  onMove,
  onDelete,
}: {
  task: TaskRow;
  onMove: (id: string, newStatus: string) => void;
  onDelete: (id: string) => void;
}) {
  const prio = PRIORITIES.find((p) => p.value === task.priority) || PRIORITIES[2];
  const PrioIcon = prio.icon;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  const nextStatus: Record<string, string> = {
    backlog: "open",
    open: "in_progress",
    in_progress: "review",
    review: "done",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group bg-background/60 backdrop-blur-sm border border-border/10 rounded-lg p-3 cursor-pointer",
        "hover:border-primary/20 transition-all duration-200",
        isOverdue && "border-red-500/30 bg-red-500/5"
      )}
    >
      {/* Priority + Category */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full", prio.color)} />
          <PrioIcon className={cn("h-3 w-3", `text-${prio.value === 'critical' ? 'red' : prio.value === 'high' ? 'orange' : 'muted-foreground'}-400`)} />
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
            {task.priority}
          </span>
        </div>
        {task.category && (
          <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-border/20">
            {task.category}
          </Badge>
        )}
      </div>

      {/* Title */}
      <h4 className="text-xs font-medium text-foreground line-clamp-2 mb-1.5">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assigned_to && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Users className="h-2.5 w-2.5" />
              <span className="truncate max-w-[60px]">{task.assigned_to}</span>
            </div>
          )}
          {task.due_date && (
            <div className={cn("flex items-center gap-1 text-[9px]", isOverdue ? "text-red-400" : "text-muted-foreground")}>
              <Calendar className="h-2.5 w-2.5" />
              {new Date(task.due_date).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {nextStatus[task.status] && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(task.id, nextStatus[task.status]); }}
              className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              title="Move forward"
            >
              <ArrowRight className="h-2.5 w-2.5 text-primary" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="w-5 h-5 rounded bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
            title="Delete"
          >
            <X className="h-2.5 w-2.5 text-red-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Create Task Dialog ──
function CreateTaskDialog({ tenantId, userId, onCreated }: { tenantId: string; userId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");

  const allAgentNames = useMemo(() => {
    const names: string[] = [];
    WORKFORCE.forEach((d) => d.squads.forEach((s) => s.agents.forEach((a) => names.push(a.name))));
    return names.sort();
  }, []);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agent_tasks").insert({
        title,
        description: description || null,
        priority,
        status: "open",
        category: category || null,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
        tenant_id: tenantId,
        user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task created");
      setOpen(false);
      setTitle(""); setDescription(""); setPriority("medium"); setCategory(""); setAssignedTo(""); setDueDate("");
      onCreated();
    },
    onError: () => toast.error("Failed to create task"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs">
          <Plus className="h-3.5 w-3.5" /> New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/20">
        <DialogHeader>
          <DialogTitle className="text-sm">Create Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm bg-muted/30 border-border/10"
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm bg-muted/30 border-border/10 min-h-[60px]"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="text-xs h-8 bg-muted/30 border-border/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-xs h-8 bg-muted/30 border-border/10"
            />
          </div>
          <Input
            placeholder="Category (e.g. marketing, dev)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs h-8 bg-muted/30 border-border/10"
          />
          <Input
            placeholder="Assign to agent..."
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="text-xs h-8 bg-muted/30 border-border/10"
            list="agent-list"
          />
          <datalist id="agent-list">
            {allAgentNames.slice(0, 50).map((n) => <option key={n} value={n} />)}
          </datalist>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || createMutation.isPending}
            className="w-full h-8 text-xs"
          >
            {createMutation.isPending ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Burndown Chart (simple) ──
function BurndownMini({ tasks }: { tasks: TaskRow[] }) {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex items-center gap-4 bg-background/40 backdrop-blur-sm border border-border/10 rounded-lg px-4 py-2">
      <div className="text-center">
        <span className="text-lg font-bold text-foreground">{totalTasks}</span>
        <p className="text-[9px] text-muted-foreground">Total</p>
      </div>
      <div className="h-8 w-px bg-border/10" />
      <div className="text-center">
        <span className="text-lg font-bold text-amber-400">{inProgressTasks}</span>
        <p className="text-[9px] text-muted-foreground">Active</p>
      </div>
      <div className="h-8 w-px bg-border/10" />
      <div className="text-center">
        <span className="text-lg font-bold text-emerald-400">{doneTasks}</span>
        <p className="text-[9px] text-muted-foreground">Done</p>
      </div>
      <div className="h-8 w-px bg-border/10" />
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-foreground">{pct}%</span>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function ScrumBoard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch tenant_id
  const { data: tenantId } = useQuery({
    queryKey: ["user-tenant", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user!.id).limit(1).single();
      return data?.tenant_id || "";
    },
    enabled: !!user,
  });

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["scrum-tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_tasks")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TaskRow[];
    },
    enabled: !!user,
  });

  // Move task
  const moveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("agent_tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scrum-tasks"] }),
  });

  // Delete task
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agent_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scrum-tasks"] });
      toast.success("Task deleted");
    },
  });

  // Filter
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterPriority !== "all" && task.priority !== filterPriority) return false;
      if (filterCategory !== "all" && task.category !== filterCategory) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filterPriority, filterCategory, searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set(tasks.map((t) => t.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [tasks]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border/5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              SCRUM BOARD
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Sprint management — {tasks.length} tasks across {COLUMNS.length} stages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BurndownMini tasks={filteredTasks} />
            {tenantId && user && (
              <CreateTaskDialog
                tenantId={tenantId}
                userId={user.id}
                onCreated={() => queryClient.invalidateQueries({ queryKey: ["scrum-tasks"] })}
              />
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-[11px] w-48 bg-muted/20 border-border/10"
          />
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-7 text-[11px] w-28 bg-muted/20 border-border/10">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-7 text-[11px] w-28 bg-muted/20 border-border/10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Board columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full min-w-max">
          {COLUMNS.map((col) => {
            const ColIcon = col.icon;
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className={cn(
                  "w-64 shrink-0 rounded-xl border border-border/5 flex flex-col",
                  col.bg
                )}
              >
                {/* Column header */}
                <div className="px-3 py-2.5 border-b border-border/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ColIcon className={cn("h-3.5 w-3.5", col.color)} />
                    <span className="text-xs font-semibold text-foreground">{col.label}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-border/20">
                    {columnTasks.length}
                  </Badge>
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  <AnimatePresence>
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onMove={(id, status) => moveMutation.mutate({ id, status })}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    ))}
                  </AnimatePresence>
                  {columnTasks.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-[10px] text-muted-foreground/50">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
