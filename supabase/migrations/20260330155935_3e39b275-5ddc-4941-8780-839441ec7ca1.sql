
-- 1. Drop overly broad storage SELECT policy that lets ANY authenticated user read ALL files
DROP POLICY IF EXISTS "Users can view own knowledge files" ON storage.objects;

-- 2. Add restrictive INSERT policy on user_roles for ALL roles (not just authenticated)
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO public
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Add restrictive UPDATE/DELETE policies on user_roles to prevent non-admin modifications
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));
