-- Defense-in-depth: revoke column-level SELECT on the sensitive credential value.
-- Owners can still see metadata; only service_role (edge functions) reads the raw cipher.
REVOKE SELECT ON public.agent_credentials FROM authenticated;

GRANT SELECT (
  id, agent_id, user_id, integration_name, credential_key,
  is_secret, created_at, updated_at, expires_at,
  last_accessed_at, access_count
) ON public.agent_credentials TO authenticated;

-- INSERT/UPDATE/DELETE remain (RLS still enforces ownership).
GRANT INSERT, UPDATE, DELETE ON public.agent_credentials TO authenticated;