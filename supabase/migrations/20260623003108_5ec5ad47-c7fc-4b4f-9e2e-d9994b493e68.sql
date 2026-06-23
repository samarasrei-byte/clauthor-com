-- 1) Revoke public/anon execute on all SECURITY DEFINER functions in public schema
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',
      r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- 2) Re-grant EXECUTE to authenticated ONLY for functions the app calls directly via supabase-js RPC
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_coupon_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_knowledge(uuid, text, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_admin_agents(uuid) TO authenticated;

-- 3) Ensure search_path is set on every public function (idempotent re-alter)
DO $$
DECLARE
  r RECORD;
  has_sp BOOLEAN;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, p.oid, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM unnest(coalesce(
        (SELECT proconfig FROM pg_proc WHERE oid = r.oid), ARRAY[]::text[]
      )) cfg WHERE cfg LIKE 'search_path=%'
    ) INTO has_sp;
    IF NOT has_sp THEN
      EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public',
        r.nspname, r.proname, r.args);
    END IF;
  END LOOP;
END $$;

-- 4) For any public table with RLS enabled but no policy, add a deny-all-by-default note via a no-op restrictive policy.
-- We add a policy that denies all access so the table behavior is explicit (still effectively locked, but linter-clean).
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
      AND NOT EXISTS (
        SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
      )
  LOOP
    EXECUTE format(
      'CREATE POLICY "deny_all_default" ON public.%I AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false)',
      r.relname
    );
  END LOOP;
END $$;