-- FIX: Create secure view for agent_credentials that hides credential_value
CREATE OR REPLACE VIEW public.agent_credentials_safe
WITH (security_invoker = on) AS
SELECT 
  id, agent_id, user_id, integration_name, credential_key,
  '••••••••' AS credential_value,
  is_secret, expires_at, last_accessed_at, access_count,
  created_at, updated_at
FROM public.agent_credentials;

GRANT SELECT ON public.agent_credentials_safe TO authenticated;