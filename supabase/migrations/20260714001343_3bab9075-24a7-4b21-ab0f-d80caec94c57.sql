
-- ── AI Workspaces (multi-ambiente por usuário/tenant) ──────────────
CREATE TABLE public.ai_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🧠',
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_workspaces_tenant ON public.ai_workspaces(tenant_id);
CREATE INDEX idx_ai_workspaces_owner ON public.ai_workspaces(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_workspaces TO authenticated;
GRANT ALL ON public.ai_workspaces TO service_role;

ALTER TABLE public.ai_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members can view"
  ON public.ai_workspaces FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "workspace members can insert"
  ON public.ai_workspaces FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) AND owner_id = auth.uid());

CREATE POLICY "owner or tenant admin can update"
  ON public.ai_workspaces FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (owner_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "owner or tenant admin can delete"
  ON public.ai_workspaces FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_ai_workspaces_updated
  BEFORE UPDATE ON public.ai_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Mensagens do chat multi-agente ─────────────────────────────────
CREATE TABLE public.ai_workspace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.ai_workspaces(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  author_id UUID,
  author_kind TEXT NOT NULL DEFAULT 'agent' CHECK (author_kind IN ('user','agent','system')),
  agent_key TEXT,
  agent_name TEXT,
  agent_emoji TEXT,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_awm_workspace_created ON public.ai_workspace_messages(workspace_id, created_at DESC);
CREATE INDEX idx_awm_tenant ON public.ai_workspace_messages(tenant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_workspace_messages TO authenticated;
GRANT ALL ON public.ai_workspace_messages TO service_role;

ALTER TABLE public.ai_workspace_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members read messages"
  ON public.ai_workspace_messages FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "tenant members write messages"
  ON public.ai_workspace_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "tenant members delete own messages"
  ON public.ai_workspace_messages FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id));

-- ── Tarefas Kanban do workspace ────────────────────────────────────
CREATE TABLE public.ai_workspace_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.ai_workspaces(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  created_by UUID,
  title TEXT NOT NULL,
  description TEXT,
  agent_key TEXT,
  agent_name TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog','doing','review','done')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_awt_workspace_status ON public.ai_workspace_tasks(workspace_id, status);
CREATE INDEX idx_awt_tenant ON public.ai_workspace_tasks(tenant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_workspace_tasks TO authenticated;
GRANT ALL ON public.ai_workspace_tasks TO service_role;

ALTER TABLE public.ai_workspace_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members read tasks"
  ON public.ai_workspace_tasks FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "tenant members insert tasks"
  ON public.ai_workspace_tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "tenant members update tasks"
  ON public.ai_workspace_tasks FOR UPDATE TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "tenant members delete tasks"
  ON public.ai_workspace_tasks FOR DELETE TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TRIGGER trg_ai_workspace_tasks_updated
  BEFORE UPDATE ON public.ai_workspace_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Realtime ───────────────────────────────────────────────────────
ALTER TABLE public.ai_workspaces REPLICA IDENTITY FULL;
ALTER TABLE public.ai_workspace_messages REPLICA IDENTITY FULL;
ALTER TABLE public.ai_workspace_tasks REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_workspace_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_workspace_tasks;
