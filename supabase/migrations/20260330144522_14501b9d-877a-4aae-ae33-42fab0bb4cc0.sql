
-- 1. Recreate agent_credentials_safe view with security_invoker so RLS applies
DROP VIEW IF EXISTS public.agent_credentials_safe;
CREATE VIEW public.agent_credentials_safe
  WITH (security_invoker = true)
AS
SELECT
  id,
  agent_id,
  user_id,
  integration_name,
  credential_key,
  CASE WHEN is_secret THEN '••••••••' ELSE credential_value END AS credential_value,
  is_secret,
  expires_at,
  last_accessed_at,
  access_count,
  created_at,
  updated_at
FROM public.agent_credentials;

-- 2. Add restrictive baseline policy on platform_credentials (deny non-admins)
CREATE POLICY "Deny all for non-admins"
  ON public.platform_credentials
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Ensure agent_memory.tenant_id cannot be NULL (it's already NOT NULL per schema, but add a CHECK as defense-in-depth)
ALTER TABLE public.agent_memory ADD CONSTRAINT agent_memory_tenant_id_not_empty CHECK (tenant_id IS NOT NULL);

-- 4. Fix user_roles: ensure only admins can insert (replace existing permissive insert policy with tighter one)
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
