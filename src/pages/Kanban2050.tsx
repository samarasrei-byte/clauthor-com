import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Search, X, Calendar, Flag, Tag as TagIcon, GripVertical,
  MoreHorizontal, LayoutGrid, Rows3, Filter, Palette, Command as CmdIcon,
  CheckCircle2, Circle, Sparkles, Pencil, Copy, Archive, ChevronDown, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Priority = "low" | "medium" | "high" | "critical";

interface ChecklistItem { id: string; text: string; done: boolean }

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  tags: string[];
  dueDate?: string; // ISO
  assignee?: string;
  cover?: string; // token color
  checklist: ChecklistItem[];
  createdAt: number;
  updatedAt: number;
}

interface Column {
  id: string;
  name: string;
  color: string; // hsl token or hex
  wip?: number; // WIP limit; 0/undefined = no limit
  taskIds: string[];
}

interface Board {
  id: string;
  name: string;
  columns: Column[];
  tasks: Record<string, Task>;
  createdAt: number;
}

interface State {
  boards: Board[];
  activeBoardId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────────────────
const LS_KEY = "clauthor.kanban2050.v1";
const uid = () => Math.random().toString(36).slice(2, 10);

const COLOR_TOKENS = [
  { name: "Slate",   value: "hsl(215 16% 47%)" },
  { name: "Red",     value: "hsl(0 72% 51%)" },
  { name: "Amber",   value: "hsl(38 92% 50%)" },
  { name: "Emerald", value: "hsl(160 84% 39%)" },
  { name: "Sky",     value: "hsl(199 89% 48%)" },
  { name: "Violet",  value: "hsl(258 90% 66%)" },
  { name: "Pink",    value: "hsl(330 81% 60%)" },
  { name: "Zinc",    value: "hsl(240 4% 46%)" },
];

const PRIORITY_META: Record<Priority, { label: string; dot: string; ring: string }> = {
  low:      { label: "Baixa",   dot: "bg-muted-foreground/60",   ring: "ring-muted-foreground/20" },
  medium:   { label: "Média",   dot: "bg-amber-500",             ring: "ring-amber-500/30" },
  high:     { label: "Alta",    dot: "bg-primary",               ring: "ring-primary/30" },
  critical: { label: "Crítica", dot: "bg-destructive",           ring: "ring-destructive/40" },
};

function defaultBoard(): Board {
  const cols: Column[] = [
    { id: uid(), name: "Backlog",     color: COLOR_TOKENS[7].value, taskIds: [] },
    { id: uid(), name: "Descoberta",  color: COLOR_TOKENS[4].value, taskIds: [] },
    { id: uid(), name: "Em execução", color: COLOR_TOKENS[2].value, wip: 5, taskIds: [] },
    { id: uid(), name: "Revisão",     color: COLOR_TOKENS[5].value, taskIds: [] },
    { id: uid(), name: "Entregue",    color: COLOR_TOKENS[3].value, taskIds: [] },
  ];
  return {
    id: uid(), name: "Meu quadro", columns: cols, tasks: {}, createdAt: Date.now(),
  };
}

function loadState(): State {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed?.boards?.length) return parsed;
    }
  } catch {}
  const b = defaultBoard();
  return { boards: [b], activeBoardId: b.id };
}

function saveState(s: State) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmtDate = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const isOverdue = (iso?: string) =>
  !!iso && new Date(iso).getTime() < Date.now() - 864e5;

// ─────────────────────────────────────────────────────────────────────────────
// Task Card
// ─────────────────────────────────────────────────────────────────────────────
function TaskCard({
  task, onOpen, onDragStart, onDelete,
}: {
  task: Task; onOpen: () => void; onDragStart: (e: React.DragEvent) => void; onDelete: () => void;
}) {
  const done = task.checklist.length ? task.checklist.filter(c => c.done).length : 0;
  const total = task.checklist.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const overdue = isOverdue(task.dueDate);

  return (
    <motion.div
      layout
      layoutId={task.id}
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm",
        "p-3 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        "transition-all",
      )}
    >
      {task.cover && (
        <div
          className="h-1.5 -mx-3 -mt-3 mb-2 rounded-t-xl"
          style={{ background: task.cover }}
          aria-hidden
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug line-clamp-2 flex-1">{task.title}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Ações"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={onOpen}>
              <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{task.description}</p>
      )}

      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{task.tags.length - 4}</span>
          )}
        </div>
      )}

      {total > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {done}/{total}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", PRIORITY_META[task.priority].dot)} />
          <span className="text-[10px] text-muted-foreground">{PRIORITY_META[task.priority].label}</span>
        </div>
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={cn(
              "flex items-center gap-1 text-[10px]",
              overdue ? "text-destructive" : "text-muted-foreground"
            )}>
              <Calendar className="h-3 w-3" /> {fmtDate(task.dueDate)}
            </span>
          )}
          {task.assignee && (
            <div
              className="h-5 w-5 rounded-full bg-primary/20 text-[9px] font-semibold flex items-center justify-center text-primary"
              title={task.assignee}
            >
              {task.assignee.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Editor Dialog
// ─────────────────────────────────────────────────────────────────────────────
function TaskEditor({
  open, onOpenChange, task, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task: Task | null;
  onSave: (t: Task) => void;
}) {
  const [draft, setDraft] = useState<Task | null>(task);
  useEffect(() => setDraft(task), [task]);

  if (!draft) return null;
  const set = <K extends keyof Task>(k: K, v: Task[K]) =>
    setDraft(d => (d ? { ...d, [k]: v } : d));

  const addChecklist = () => set("checklist", [...draft.checklist, { id: uid(), text: "", done: false }]);
  const updateChecklist = (id: string, patch: Partial<ChecklistItem>) =>
    set("checklist", draft.checklist.map(c => (c.id === id ? { ...c, ...patch } : c)));
  const removeChecklist = (id: string) =>
    set("checklist", draft.checklist.filter(c => c.id !== id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Detalhes da tarefa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="O que precisa ser feito?"
              className="text-base font-medium"
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={draft.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="Contexto, links, critérios de aceitação..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prioridade</Label>
              <Select value={draft.priority} onValueChange={(v) => set("priority", v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_META) as Priority[]).map(p => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", PRIORITY_META[p].dot)} />
                        {PRIORITY_META[p].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prazo</Label>
              <Input
                type="date"
                value={draft.dueDate?.slice(0, 10) ?? ""}
                onChange={(e) => set("dueDate", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Responsável</Label>
              <Input
                value={draft.assignee ?? ""}
                onChange={(e) => set("assignee", e.target.value || undefined)}
                placeholder="Nome ou @handle"
              />
            </div>
            <div>
              <Label>Cover</Label>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => set("cover", undefined)}
                  className={cn(
                    "h-6 w-6 rounded-md border border-border flex items-center justify-center",
                    !draft.cover && "ring-2 ring-primary"
                  )}
                  aria-label="Sem cover"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
                {COLOR_TOKENS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set("cover", c.value)}
                    className={cn(
                      "h-6 w-6 rounded-md border border-border/40",
                      draft.cover === c.value && "ring-2 ring-primary"
                    )}
                    style={{ background: c.value }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5"><TagIcon className="h-3.5 w-3.5" /> Tags</Label>
            <Input
              value={draft.tags.join(", ")}
              onChange={(e) => set("tags", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
              placeholder="ex.: growth, urgente, cliente-x"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Checklist</Label>
              <Button size="sm" variant="ghost" onClick={addChecklist} className="h-7 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Item
              </Button>
            </div>
            <div className="space-y-1.5">
              {draft.checklist.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Nenhum item ainda.</p>
              )}
              {draft.checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border/40 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => updateChecklist(item.id, { done: !item.done })}
                    className="shrink-0"
                    aria-label={item.done ? "Desmarcar" : "Concluir"}
                  >
                    {item.done
                      ? <CheckCircle2 className="h-4 w-4 text-primary" />
                      : <Circle className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <Input
                    value={item.text}
                    onChange={(e) => updateChecklist(item.id, { text: e.target.value })}
                    placeholder="Descreva o item..."
                    className={cn("h-7 border-0 shadow-none focus-visible:ring-0 px-1 text-sm",
                      item.done && "line-through text-muted-foreground")}
                  />
                  <button
                    type="button"
                    onClick={() => removeChecklist(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => {
              if (!draft.title.trim()) { toast.error("Título é obrigatório"); return; }
              onSave({ ...draft, updatedAt: Date.now() });
              onOpenChange(false);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column
// ─────────────────────────────────────────────────────────────────────────────
function ColumnView({
  column, tasks, onDrop, onDragStartTask, onAddTask, onOpenTask, onDeleteTask,
  onEditColumn, onDeleteColumn, onDragStartColumn, onDropColumn,
}: {
  column: Column;
  tasks: Task[];
  onDrop: (colId: string) => void;
  onDragStartTask: (id: string) => (e: React.DragEvent) => void;
  onAddTask: (colId: string) => void;
  onOpenTask: (t: Task) => void;
  onDeleteTask: (id: string) => void;
  onEditColumn: (col: Column) => void;
  onDeleteColumn: (id: string) => void;
  onDragStartColumn: (id: string) => (e: React.DragEvent) => void;
  onDropColumn: (targetId: string) => void;
}) {
  const [over, setOver] = useState(false);
  const wipExceeded = column.wip && tasks.length > column.wip;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        const type = e.dataTransfer.getData("kanban/type");
        if (type === "column") onDropColumn(column.id);
        else onDrop(column.id);
      }}
      className={cn(
        "flex flex-col w-[300px] shrink-0 rounded-2xl border transition-colors",
        "bg-gradient-to-b from-card/40 to-card/20 backdrop-blur-sm",
        over ? "border-primary/60 bg-primary/5" : "border-border/40",
      )}
    >
      <header
        draggable
        onDragStart={onDragStartColumn(column.id)}
        className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40 cursor-grab active:cursor-grabbing"
      >
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ background: column.color }}
          aria-hidden
        />
        <h3 className="text-sm font-semibold flex-1 truncate">{column.name}</h3>
        <Badge variant="secondary" className={cn(
          "h-5 px-1.5 text-[10px] tabular-nums",
          wipExceeded && "bg-destructive/15 text-destructive"
        )}>
          {tasks.length}{column.wip ? `/${column.wip}` : ""}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Menu da coluna"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEditColumn(column)}>
              <Pencil className="h-3.5 w-3.5 mr-2" /> Editar coluna
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddTask(column.id)}>
              <Plus className="h-3.5 w-3.5 mr-2" /> Adicionar tarefa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDeleteColumn(column.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-320px)]">
        <AnimatePresence>
          {tasks.map(t => (
            <TaskCard
              key={t.id}
              task={t}
              onOpen={() => onOpenTask(t)}
              onDragStart={onDragStartTask(t.id)}
              onDelete={() => onDeleteTask(t.id)}
            />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <p className="text-center text-[11px] text-muted-foreground/60 italic py-4">
            Arraste um card ou crie um novo.
          </p>
        )}
      </div>

      <div className="p-2 border-t border-border/40">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddTask(column.id)}
          className="w-full h-8 justify-start gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar tarefa
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column Editor
// ─────────────────────────────────────────────────────────────────────────────
function ColumnEditor({
  open, onOpenChange, column, onSave,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  column: Column | null; onSave: (c: Column) => void;
}) {
  const [draft, setDraft] = useState<Column | null>(column);
  useEffect(() => setDraft(column), [column]);
  if (!draft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar coluna</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {COLOR_TOKENS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setDraft({ ...draft, color: c.value })}
                  className={cn(
                    "h-7 w-7 rounded-md border border-border/40",
                    draft.color === c.value && "ring-2 ring-primary"
                  )}
                  style={{ background: c.value }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Limite WIP (0 = sem limite)</Label>
            <Input
              type="number"
              min={0}
              value={draft.wip ?? 0}
              onChange={(e) => setDraft({ ...draft, wip: Number(e.target.value) || undefined })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => { if (draft.name.trim()) { onSave(draft); onOpenChange(false); } }}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Kanban2050() {
  const [state, setState] = useState<State>(() => loadState());
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | Priority>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [view, setView] = useState<"board" | "compact">("board");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskEditorOpen, setTaskEditorOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [columnEditorOpen, setColumnEditorOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const draggedTaskId = useRef<string | null>(null);
  const draggedColumnId = useRef<string | null>(null);

  useEffect(() => saveState(state), [state]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const board = useMemo(
    () => state.boards.find(b => b.id === state.activeBoardId) ?? state.boards[0],
    [state]
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    Object.values(board.tasks).forEach(t => t.tags.forEach(x => set.add(x)));
    return Array.from(set).sort();
  }, [board]);

  const totals = useMemo(() => {
    const list = Object.values(board.tasks);
    return {
      total: list.length,
      overdue: list.filter(t => isOverdue(t.dueDate)).length,
      critical: list.filter(t => t.priority === "critical").length,
      done: board.columns.length
        ? board.columns[board.columns.length - 1].taskIds.length
        : 0,
    };
  }, [board]);

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const updateBoard = (mut: (b: Board) => Board) => {
    setState(s => ({
      ...s,
      boards: s.boards.map(b => (b.id === board.id ? mut(b) : b)),
    }));
  };

  const createTask = (colId: string, overrides: Partial<Task> = {}) => {
    const now = Date.now();
    const t: Task = {
      id: uid(),
      title: overrides.title ?? "Nova tarefa",
      priority: "medium",
      tags: [],
      checklist: [],
      createdAt: now, updatedAt: now,
      ...overrides,
    };
    updateBoard(b => ({
      ...b,
      tasks: { ...b.tasks, [t.id]: t },
      columns: b.columns.map(c => c.id === colId ? { ...c, taskIds: [t.id, ...c.taskIds] } : c),
    }));
    setEditingTask(t);
    setTaskEditorOpen(true);
  };

  const saveTask = (t: Task) => {
    updateBoard(b => ({ ...b, tasks: { ...b.tasks, [t.id]: t } }));
    toast.success("Tarefa salva");
  };

  const deleteTask = (id: string) => {
    updateBoard(b => {
      const { [id]: _, ...rest } = b.tasks;
      return {
        ...b,
        tasks: rest,
        columns: b.columns.map(c => ({ ...c, taskIds: c.taskIds.filter(x => x !== id) })),
      };
    });
    toast.success("Tarefa removida");
  };

  const moveTask = (taskId: string, targetColId: string) => {
    updateBoard(b => ({
      ...b,
      columns: b.columns.map(c => ({
        ...c,
        taskIds: c.id === targetColId
          ? [taskId, ...c.taskIds.filter(x => x !== taskId)]
          : c.taskIds.filter(x => x !== taskId),
      })),
    }));
  };

  const addColumn = () => {
    const c: Column = {
      id: uid(),
      name: "Nova coluna",
      color: COLOR_TOKENS[Math.floor(Math.random() * COLOR_TOKENS.length)].value,
      taskIds: [],
    };
    updateBoard(b => ({ ...b, columns: [...b.columns, c] }));
    setEditingColumn(c);
    setColumnEditorOpen(true);
  };

  const saveColumn = (col: Column) => {
    updateBoard(b => ({ ...b, columns: b.columns.map(c => c.id === col.id ? col : c) }));
  };

  const deleteColumn = (id: string) => {
    const col = board.columns.find(c => c.id === id);
    if (!col) return;
    if (col.taskIds.length > 0 && !confirm(`Excluir "${col.name}" e ${col.taskIds.length} tarefa(s)?`)) return;
    updateBoard(b => {
      const kept = { ...b.tasks };
      col.taskIds.forEach(tid => delete kept[tid]);
      return { ...b, tasks: kept, columns: b.columns.filter(c => c.id !== id) };
    });
  };

  const moveColumn = (targetId: string) => {
    if (!draggedColumnId.current || draggedColumnId.current === targetId) return;
    updateBoard(b => {
      const from = b.columns.findIndex(c => c.id === draggedColumnId.current);
      const to = b.columns.findIndex(c => c.id === targetId);
      if (from < 0 || to < 0) return b;
      const cols = [...b.columns];
      const [moved] = cols.splice(from, 1);
      cols.splice(to, 0, moved);
      return { ...b, columns: cols };
    });
  };

  const createBoard = () => {
    const b = defaultBoard();
    b.name = `Quadro ${state.boards.length + 1}`;
    setState(s => ({ boards: [...s.boards, b], activeBoardId: b.id }));
  };

  // ─── Filters ───────────────────────────────────────────────────────────────
  const visibleTasksByCol = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map: Record<string, Task[]> = {};
    for (const c of board.columns) {
      map[c.id] = c.taskIds
        .map(id => board.tasks[id])
        .filter(Boolean)
        .filter(t => {
          if (filterPriority !== "all" && t.priority !== filterPriority) return false;
          if (filterTag !== "all" && !t.tags.includes(filterTag)) return false;
          if (q) {
            const hay = `${t.title} ${t.description ?? ""} ${t.tags.join(" ")} ${t.assignee ?? ""}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });
    }
    return map;
  }, [board, search, filterPriority, filterTag]);

  // ─── Render ────────────────────────────────────────────────────────────────
  const firstColId = board.columns[0]?.id;

  return (
    <>
      <Helmet>
        <title>Kanban 2050 · Gestão visual de tarefas | Clauthor</title>
        <meta
          name="description"
          content="Kanban moderno com estágios customizáveis, WIP, checklists, tags, prazos e drag-and-drop. Gestão visual pensada para escalar."
        />
      </Helmet>

      <div className="h-full flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-border/40 bg-background/60 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">{board.name}</h1>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground">
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {state.boards.map(b => (
                        <DropdownMenuItem
                          key={b.id}
                          onSelect={() => setState(s => ({ ...s, activeBoardId: b.id }))}
                        >
                          {b.id === state.activeBoardId && <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-primary" />}
                          {b.id !== state.activeBoardId && <span className="w-[22px]" />}
                          {b.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={createBoard}>
                        <Plus className="h-3.5 w-3.5 mr-2" /> Novo quadro
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {totals.total} tarefas · {totals.critical} crítica(s)
                  {totals.overdue > 0 && <span className="text-destructive"> · {totals.overdue} atrasada(s)</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border/60 p-0.5 bg-muted/30">
                <button
                  onClick={() => setView("board")}
                  className={cn("h-7 px-2 rounded-md text-xs flex items-center gap-1",
                    view === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                >
                  <LayoutGrid className="h-3 w-3" /> Board
                </button>
                <button
                  onClick={() => setView("compact")}
                  className={cn("h-7 px-2 rounded-md text-xs flex items-center gap-1",
                    view === "compact" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                >
                  <Rows3 className="h-3 w-3" /> Compacto
                </button>
              </div>
              <Button size="sm" variant="outline" onClick={() => setCmdOpen(true)} className="h-8 gap-1.5 text-xs">
                <CmdIcon className="h-3.5 w-3.5" /> ⌘K
              </Button>
              <Button size="sm" onClick={() => firstColId && createTask(firstColId)} className="h-8 gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Nova tarefa
              </Button>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tarefas, tags, responsável..."
                className="h-8 pl-8 pr-8 text-xs bg-background/70"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as any)}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <div className="flex items-center gap-1.5"><Flag className="h-3 w-3" /><SelectValue /></div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda prioridade</SelectItem>
                {(Object.keys(PRIORITY_META) as Priority[]).map(p => (
                  <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <div className="flex items-center gap-1.5"><TagIcon className="h-3 w-3" /><SelectValue /></div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tags</SelectItem>
                {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || filterPriority !== "all" || filterTag !== "all") && (
              <Button
                variant="ghost" size="sm"
                onClick={() => { setSearch(""); setFilterPriority("all"); setFilterTag("all"); }}
                className="h-8 text-xs gap-1"
              >
                <X className="h-3.5 w-3.5" /> Limpar
              </Button>
            )}
          </div>
        </header>

        {/* BOARD BODY */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 sm:px-6 py-4">
          <div className="flex gap-3 h-full items-start">
            {board.columns.map(col => (
              <ColumnView
                key={col.id}
                column={col}
                tasks={visibleTasksByCol[col.id] ?? []}
                onDrop={(colId) => {
                  if (draggedTaskId.current) {
                    moveTask(draggedTaskId.current, colId);
                    draggedTaskId.current = null;
                  }
                }}
                onDragStartTask={(id) => (e) => {
                  draggedTaskId.current = id;
                  e.dataTransfer.setData("kanban/type", "task");
                  e.dataTransfer.effectAllowed = "move";
                }}
                onAddTask={(colId) => createTask(colId)}
                onOpenTask={(t) => { setEditingTask(t); setTaskEditorOpen(true); }}
                onDeleteTask={deleteTask}
                onEditColumn={(c) => { setEditingColumn(c); setColumnEditorOpen(true); }}
                onDeleteColumn={deleteColumn}
                onDragStartColumn={(id) => (e) => {
                  draggedColumnId.current = id;
                  e.dataTransfer.setData("kanban/type", "column");
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDropColumn={(targetId) => {
                  moveColumn(targetId);
                  draggedColumnId.current = null;
                }}
              />
            ))}

            <button
              onClick={addColumn}
              className={cn(
                "w-[280px] shrink-0 h-24 rounded-2xl border-2 border-dashed border-border/60",
                "text-muted-foreground hover:text-foreground hover:border-primary/50",
                "flex items-center justify-center gap-2 text-sm transition-colors bg-card/20"
              )}
            >
              <Plus className="h-4 w-4" /> Adicionar coluna
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <TaskEditor
        open={taskEditorOpen}
        onOpenChange={setTaskEditorOpen}
        task={editingTask}
        onSave={saveTask}
      />
      <ColumnEditor
        open={columnEditorOpen}
        onOpenChange={setColumnEditorOpen}
        column={editingColumn}
        onSave={saveColumn}
      />

      {/* Command Palette (Quick add) */}
      <Dialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CmdIcon className="h-4 w-4 text-primary" /> Ação rápida
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Criar tarefa em</Label>
              <Select
                defaultValue={firstColId}
                onValueChange={(colId) => {
                  if (!quickTitle.trim()) return;
                  createTask(colId, { title: quickTitle.trim() });
                  setQuickTitle("");
                  setCmdOpen(false);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Escolha uma coluna" /></SelectTrigger>
                <SelectContent>
                  {board.columns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              autoFocus
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Digite o título e escolha a coluna acima..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && quickTitle.trim() && firstColId) {
                  createTask(firstColId, { title: quickTitle.trim() });
                  setQuickTitle("");
                  setCmdOpen(false);
                }
              }}
            />
            <p className="text-[11px] text-muted-foreground">
              Dica: pressione <kbd className="rounded bg-muted px-1">Enter</kbd> para criar na primeira coluna.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
