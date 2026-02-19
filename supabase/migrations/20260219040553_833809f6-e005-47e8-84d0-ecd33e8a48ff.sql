
-- Update handle_new_user to auto-create tenant + membership
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
  user_email text;
  user_name text;
BEGIN
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(user_email, '@', 1));

  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, user_name);

  -- Assign customer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');

  -- Auto-create tenant for this user
  INSERT INTO public.tenants (name, slug, plan_type)
  VALUES (
    user_name || '''s Workspace',
    replace(gen_random_uuid()::text, '-', ''),
    'free'
  )
  RETURNING id INTO new_tenant_id;

  -- Make user the owner of their tenant
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (new_tenant_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;
