-- Fix 1: Create a secure view without email for department_suggestions
DROP POLICY IF EXISTS "Authenticated can view suggestions without email" ON public.department_suggestions;

CREATE POLICY "Users can only view own suggestions"
ON public.department_suggestions
FOR SELECT
TO authenticated
USING (email IS NULL OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Fix 2: Add RLS policies to agent_credentials_safe view
-- The view uses security_invoker=true, so it inherits caller's RLS
-- But we need explicit policies. Since it's a view on agent_credentials which has RLS,
-- the underlying table RLS already applies with security_invoker=true.
-- Let's verify by also creating a policy on the base view for safety.
-- Actually views with security_invoker inherit the base table policies, so this is already secure.
-- The scanner flags it because no explicit policy is on the view itself.
-- We can acknowledge this - the security_invoker setting makes the base table RLS apply.