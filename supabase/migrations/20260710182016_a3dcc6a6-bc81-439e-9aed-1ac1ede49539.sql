
-- 1. Endurecer policy de INSERT em tenant_members
DROP POLICY IF EXISTS "Tenant admins can add members" ON public.tenant_members;

CREATE POLICY "Tenant admins can add members"
ON public.tenant_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_tenant_admin(auth.uid(), tenant_id)
  AND role IN ('member','admin')  -- ninguém consegue se auto-promover a owner via API; owner só via trigger SECURITY DEFINER
);

-- 2. Índices de performance — agent_tasks
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status_category_created
  ON public.agent_tasks (status, category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status_due_date
  ON public.agent_tasks (status, due_date)
  WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_category_created
  ON public.agent_tasks (user_id, category, created_at DESC);

-- 3. Índices de performance — notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_created
  ON public.notifications (user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_metadata_gin
  ON public.notifications USING gin (metadata jsonb_path_ops);

-- 4. Índice parcial — agents (só as ativas, reduz tamanho do índice)
CREATE INDEX IF NOT EXISTS idx_agents_status_active
  ON public.agents (status, user_id)
  WHERE status = 'active';

-- 5. Índice — user_credits (query cara: WHERE total_credits > $1)
CREATE INDEX IF NOT EXISTS idx_user_credits_user_totals
  ON public.user_credits (user_id)
  WHERE total_credits > 0;
