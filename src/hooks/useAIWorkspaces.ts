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
 */
export function useWorkspaceMessages(workspaceId: string | null, tenantId: string | null | undefined) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIWorkspaceMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workspaceId) { setMessages([]); return; }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("ai_workspace_messages")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("[useWorkspaceMessages]", error);
        else setMessages((data ?? []) as AIWorkspaceMessage[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    const channel = supabase
      .channel(`workspace_messages:${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ai_workspace_messages", filter: `workspace_id=eq.${workspaceId}` },
        (payload) => {
          const row = payload.new as AIWorkspaceMessage;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceId]);

  const sendMessage = useCallback(async (content: string, agent?: { key: string; name: string; emoji: string }) => {
    if (!workspaceId || !tenantId || !content.trim()) return;
    const payload = {
      workspace_id: workspaceId,
      tenant_id: tenantId,
      author_id: user?.id ?? null,
      author_kind: agent ? "agent" : "user",
      agent_key: agent?.key ?? null,
      agent_name: agent?.name ?? null,
      agent_emoji: agent?.emoji ?? null,
      content: content.trim(),
    };
    const { error } = await supabase.from("ai_workspace_messages").insert(payload);
    if (error) { console.error(error); toast.error("Falha ao enviar mensagem."); }
  }, [workspaceId, tenantId, user?.id]);

  return { messages, loading, sendMessage };
}

/**
 * Hook: tarefas Kanban do workspace com Realtime.
 */
export function useWorkspaceTasks(workspaceId: string | null, tenantId: string | null | undefined) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AIWorkspaceTask[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workspaceId) { setTasks([]); return; }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("ai_workspace_tasks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("[useWorkspaceTasks]", error);
        else setTasks((data ?? []) as AIWorkspaceTask[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    const channel = supabase
      .channel(`workspace_tasks:${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_workspace_tasks", filter: `workspace_id=eq.${workspaceId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as AIWorkspaceTask;
            setTasks((prev) => (prev.some((t) => t.id === row.id) ? prev : [row, ...prev]));
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as AIWorkspaceTask;
            setTasks((prev) => prev.map((t) => (t.id === row.id ? row : t)));
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as AIWorkspaceTask;
            setTasks((prev) => prev.filter((t) => t.id !== oldRow.id));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceId]);

  const createTask = useCallback(async (input: {
    title: string; agent_key?: string; agent_name?: string; status?: TaskStatus; priority?: TaskPriority;
  }) => {
    if (!workspaceId || !tenantId || !input.title.trim()) return;
    const { error } = await supabase.from("ai_workspace_tasks").insert({
      workspace_id: workspaceId,
      tenant_id: tenantId,
      created_by: user?.id ?? null,
      title: input.title.trim(),
      agent_key: input.agent_key ?? null,
      agent_name: input.agent_name ?? null,
      status: input.status ?? "backlog",
      priority: input.priority ?? "normal",
    });
    if (error) { console.error(error); toast.error("Falha ao criar tarefa."); }
  }, [workspaceId, tenantId, user?.id]);

  const updateTaskStatus = useCallback(async (id: string, status: TaskStatus) => {
    // Otimista
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    const { error } = await supabase.from("ai_workspace_tasks").update({ status }).eq("id", id);
    if (error) { console.error(error); toast.error("Falha ao atualizar tarefa."); }
  }, []);

  return { tasks, loading, createTask, updateTaskStatus };
}
