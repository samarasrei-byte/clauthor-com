import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantId } from "@/hooks/useTenantId";
import { toast } from "sonner";

export interface AIWorkspace {
  id: string;
  tenant_id: string;
  owner_id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

export type TaskStatus = "backlog" | "doing" | "review" | "done";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type AuthorKind = "user" | "agent" | "system";

export interface AIWorkspaceMessage {
  id: string;
  workspace_id: string;
  tenant_id: string;
  author_id: string | null;
  author_kind: AuthorKind;
  agent_key: string | null;
  agent_name: string | null;
  agent_emoji: string | null;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AIWorkspaceTask {
  id: string;
  workspace_id: string;
  tenant_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  agent_key: string | null;
  agent_name: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Hook: lista workspaces do tenant, garante um default e expõe operações.
 */
export function useAIWorkspaces() {
  const { user } = useAuth();
  const { data: tenantId } = useTenantId();
  const [workspaces, setWorkspaces] = useState<AIWorkspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id || !tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_workspaces")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[useAIWorkspaces] load error:", error);
      setLoading(false);
      return;
    }
    let list = (data ?? []) as AIWorkspace[];

    // Garante ambientes padrão (Workspace + AI Workspace 1 + AI Workspace 2)
    if (list.length === 0) {
      const seeds = [
        { name: "Workspace", emoji: "💼", description: "Ambiente geral de trabalho.", is_default: true },
        { name: "AI Workspace 1", emoji: "🧠", description: "Squad principal de agentes.", is_default: false },
        { name: "AI Workspace 2", emoji: "⚡", description: "Squad experimental.", is_default: false },
      ];
      const { data: inserted, error: insErr } = await supabase
        .from("ai_workspaces")
        .insert(seeds.map((s) => ({ ...s, tenant_id: tenantId, owner_id: user.id })))
        .select("*");
      if (insErr) {
        console.error("[useAIWorkspaces] seed error:", insErr);
        toast.error("Não consegui criar seus workspaces iniciais.");
      } else if (inserted) {
        list = inserted as AIWorkspace[];
      }
    }

    setWorkspaces(list);
    setActiveId((prev) => prev ?? list.find((w) => w.is_default)?.id ?? list[0]?.id ?? null);
    setLoading(false);
  }, [user?.id, tenantId]);

  useEffect(() => { load(); }, [load]);

  // Realtime nas mudanças de workspaces
  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel(`ai_workspaces:${tenantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_workspaces", filter: `tenant_id=eq.${tenantId}` },
        () => { load(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenantId, load]);

  const createWorkspace = useCallback(async (name: string, emoji = "🧠") => {
    if (!user?.id || !tenantId) return null;
    const { data, error } = await supabase
      .from("ai_workspaces")
      .insert({ tenant_id: tenantId, owner_id: user.id, name, emoji })
      .select("*")
      .single();
    if (error) { toast.error("Erro ao criar workspace."); return null; }
    return data as AIWorkspace;
  }, [user?.id, tenantId]);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? null,
    [workspaces, activeId],
  );

  return { workspaces, activeId, setActiveId, activeWorkspace, loading, createWorkspace };
}

/**
 * Hook: mensagens de um workspace com Realtime.
 * Unificado com `chat_messages` (mesma tabela do UnifiedInbox/SquadChat).
 * O workspace_id vive em `metadata->>workspace_id` para preservar o agrupamento
 * sem migração de schema. Assim, o mesmo histórico alimenta o Inbox e o AI Workspace.
 */
const WS_META_KEY = "workspace_id";

export function useWorkspaceMessages(workspaceId: string | null, tenantId: string | null | undefined) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIWorkspaceMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const rowToMsg = useCallback((row: any): AIWorkspaceMessage => {
    const meta = (row.metadata ?? {}) as Record<string, any>;
    return {
      id: row.id,
      workspace_id: meta[WS_META_KEY] ?? workspaceId ?? "",
      tenant_id: row.tenant_id,
      author_id: row.user_id ?? null,
      author_kind: (meta.author_kind ?? (row.role === "assistant" ? "agent" : "user")) as AuthorKind,
      agent_key: meta.agent_key ?? null,
      agent_name: row.agent_name ?? meta.agent_name ?? null,
      agent_emoji: meta.agent_emoji ?? null,
      content: row.content,
      metadata: meta,
      created_at: row.created_at,
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !tenantId) { setMessages([]); return; }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("chat_messages")
      .select("*")
      .eq("tenant_id", tenantId)
      .contains("metadata", { [WS_META_KEY]: workspaceId })
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("[useWorkspaceMessages]", error);
        else setMessages((data ?? []).map(rowToMsg));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [workspaceId, tenantId, rowToMsg]);

  useEffect(() => {
    if (!workspaceId || !tenantId) return;
    const channel = supabase
      .channel(`chat_messages_ws:${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `tenant_id=eq.${tenantId}` },
        (payload) => {
          const meta = ((payload.new as any)?.metadata ?? {}) as Record<string, any>;
          if (meta[WS_META_KEY] !== workspaceId) return;
          const row = rowToMsg(payload.new);
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceId, tenantId, rowToMsg]);

  const sendMessage = useCallback(async (content: string, agent?: { key: string; name: string; emoji: string }) => {
    if (!workspaceId || !tenantId || !user?.id || !content.trim()) return;
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      tenant_id: tenantId,
      role: agent ? "assistant" : "user",
      content: content.trim(),
      agent_name: agent?.name ?? null,
      metadata: {
        [WS_META_KEY]: workspaceId,
        author_kind: agent ? "agent" : "user",
        agent_key: agent?.key ?? null,
        agent_name: agent?.name ?? null,
        agent_emoji: agent?.emoji ?? null,
      },
    });
    if (error) { console.error(error); toast.error("Falha ao enviar mensagem."); }
  }, [workspaceId, tenantId, user?.id]);

  return { messages, loading, sendMessage };
}



/**
 * Hook: tarefas Kanban unificadas — lê/escreve `agent_tasks` (mesma fonte
 * do módulo Execução › Tarefas). Antes usava `ai_workspace_tasks` (duplicidade).
 * O workspace_id é armazenado em `agent_tasks.category` como `ws:<uuid>` para
 * preservar o agrupamento por ambiente sem migração de schema.
 */
const WS_CATEGORY_PREFIX = "ws:";

// Vocabulário compartilhado. Mapeia para/de as convenções antigas do Kanban.
const IN_STATUSES: TaskStatus[] = ["backlog", "doing", "review", "done"];

function normalizeStatus(raw: string | null | undefined): TaskStatus {
  const v = (raw ?? "").toLowerCase();
  if (v === "open" || v === "backlog") return "backlog";
  if (v === "in_progress" || v === "doing") return "doing";
  if (v === "review") return "review";
  if (v === "done" || v === "completed") return "done";
  return "backlog";
}

export function useWorkspaceTasks(workspaceId: string | null, tenantId: string | null | undefined) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AIWorkspaceTask[]>([]);
  const [loading, setLoading] = useState(false);

  const rowToTask = useCallback((row: any): AIWorkspaceTask => ({
    id: row.id,
    workspace_id: workspaceId ?? "",
    tenant_id: row.tenant_id,
    created_by: row.user_id ?? null,
    title: row.title,
    description: row.description ?? null,
    agent_key: null,
    agent_name: null,
    status: normalizeStatus(row.status),
    priority: (row.priority ?? "normal") as TaskPriority,
    metadata: {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  }), [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !user?.id) { setTasks([]); return; }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("agent_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("category", `${WS_CATEGORY_PREFIX}${workspaceId}`)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("[useWorkspaceTasks]", error);
        else setTasks((data ?? []).map(rowToTask));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [workspaceId, user?.id, rowToTask]);

  // Realtime em agent_tasks filtrado pela categoria do workspace
  useEffect(() => {
    if (!workspaceId || !user?.id) return;
    const channel = supabase
      .channel(`agent_tasks_ws:${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_tasks", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const cat = (payload.new as any)?.category ?? (payload.old as any)?.category;
          if (cat !== `${WS_CATEGORY_PREFIX}${workspaceId}`) return;
          if (payload.eventType === "INSERT") {
            const row = rowToTask(payload.new);
            setTasks((prev) => (prev.some((t) => t.id === row.id) ? prev : [row, ...prev]));
          } else if (payload.eventType === "UPDATE") {
            const row = rowToTask(payload.new);
            setTasks((prev) => prev.map((t) => (t.id === row.id ? row : t)));
          } else if (payload.eventType === "DELETE") {
            const id = (payload.old as any).id;
            setTasks((prev) => prev.filter((t) => t.id !== id));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceId, user?.id, rowToTask]);

  const createTask = useCallback(async (input: {
    title: string; agent_key?: string; agent_name?: string; status?: TaskStatus; priority?: TaskPriority;
  }) => {
    if (!workspaceId || !tenantId || !user?.id || !input.title.trim()) return;
    const { error } = await supabase.from("agent_tasks").insert({
      user_id: user.id,
      tenant_id: tenantId,
      title: input.title.trim(),
      status: input.status ?? "backlog",
      priority: input.priority ?? "normal",
      category: `${WS_CATEGORY_PREFIX}${workspaceId}`,
    });
    if (error) { console.error(error); toast.error("Falha ao criar tarefa."); }
  }, [workspaceId, tenantId, user?.id]);

  const updateTaskStatus = useCallback(async (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    const { error } = await supabase.from("agent_tasks").update({ status }).eq("id", id);
    if (error) { console.error(error); toast.error("Falha ao atualizar tarefa."); }
  }, []);

  return { tasks, loading, createTask, updateTaskStatus };
}

// Marker de vocabulário — usado por outros módulos que precisem filtrar tasks.
export const WORKSPACE_TASK_CATEGORY_PREFIX = WS_CATEGORY_PREFIX;
export const WORKSPACE_TASK_STATUSES = IN_STATUSES;
