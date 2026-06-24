
-- C1: Fix tenant_members self-insert escalation
DROP POLICY IF EXISTS "Users can insert themselves" ON public.tenant_members;
DROP POLICY IF EXISTS "Users can join tenants" ON public.tenant_members;

CREATE POLICY "Tenant admins can add members"
ON public.tenant_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_tenant_admin(auth.uid(), tenant_id)
  OR NOT EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = tenant_members.tenant_id)
);

-- I1: department_suggestions email must match auth.email() or be null
DROP POLICY IF EXISTS "Users can insert their own suggestions" ON public.department_suggestions;
DROP POLICY IF EXISTS "Users can create suggestions" ON public.department_suggestions;

CREATE POLICY "Users can insert their own suggestions"
ON public.department_suggestions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (email IS NULL OR email = auth.email())
);

-- I2: Revoke EXECUTE from anon on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.apply_memory_decay() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recall_episodic_memories(uuid, uuid, vector, text, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.seed_admin_agents(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_api_call(uuid, text, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_api_key(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.hash_api_key(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_agent_executions(uuid) FROM anon, PUBLIC;

-- Keep authenticated access where the app uses them
GRANT EXECUTE ON FUNCTION public.recall_episodic_memories(uuid, uuid, vector, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_admin_agents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_agent_executions(uuid) TO authenticated;
