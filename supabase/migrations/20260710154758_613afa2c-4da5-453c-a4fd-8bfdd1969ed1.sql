DROP POLICY IF EXISTS "Tenant admins can add members" ON public.tenant_members;

CREATE POLICY "Tenant admins can add members"
ON public.tenant_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));