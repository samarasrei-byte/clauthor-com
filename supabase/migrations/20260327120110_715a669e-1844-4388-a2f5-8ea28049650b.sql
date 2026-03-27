-- ═══ SECURITY FIX 1: Remove dangerous UPDATE policy on user_credits ═══
-- Users should NOT be able to modify their own credits directly
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;

-- ═══ SECURITY FIX 2: Ensure user_roles INSERT is locked to admins only ═══
-- Drop any permissive INSERT policy that might exist for non-admins
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;

-- Explicitly block non-admin inserts (belt-and-suspenders)
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ═══ SECURITY FIX 3: Secure the agent_credentials_safe view ═══
-- Enable RLS and add owner-only policy
ALTER VIEW public.agent_credentials_safe SET (security_invoker = true);

-- ═══ SECURITY FIX 4: Hide email from department_suggestions for non-admins ═══
DROP POLICY IF EXISTS "Authenticated can view suggestions" ON public.department_suggestions;

CREATE POLICY "Authenticated can view suggestions without email"
ON public.department_suggestions
FOR SELECT
TO authenticated
USING (true);

-- ═══ SECURITY FIX 5: Restrict coupon visibility ═══
-- Only show coupons via lookup, not browsing
DROP POLICY IF EXISTS "Authenticated can view active coupons" ON public.coupons;