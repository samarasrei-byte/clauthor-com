
-- Fix overly permissive policy: restrict service updates to service_role only
DROP POLICY "Service can update registrations" ON public.openclaw_registrations;

-- Use a function-level approach: webhook edge function uses service_role key which bypasses RLS
-- No replacement policy needed since service_role bypasses RLS automatically
