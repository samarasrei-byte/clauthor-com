
-- 1. agents_catalog: catalog of all 201 agents with config schema
CREATE TABLE IF NOT EXISTS public.agents_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  department text NOT NULL DEFAULT 'general',
  squad text NOT NULL DEFAULT 'general',
  tier text NOT NULL DEFAULT 'basic',
  monthly_price_cents integer NOT NULL DEFAULT 99700,
  tagline text DEFAULT '',
  description text DEFAULT '',
  config_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  output_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  how_it_works jsonb NOT NULL DEFAULT '[]'::jsonb,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agents_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view catalog"
  ON public.agents_catalog FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage catalog"
  ON public.agents_catalog FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_agents_catalog_updated
  BEFORE UPDATE ON public.agents_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_agents_catalog_slug ON public.agents_catalog(slug);
CREATE INDEX idx_agents_catalog_dept ON public.agents_catalog(department, squad);

-- 2. user_agents: per-user agent activation + config
CREATE TABLE IF NOT EXISTS public.user_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_slug text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  activated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_slug)
);

ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own user_agents"
  ON public.user_agents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own user_agents"
  ON public.user_agents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own user_agents"
  ON public.user_agents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own user_agents"
  ON public.user_agents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all user_agents"
  ON public.user_agents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_user_agents_updated
  BEFORE UPDATE ON public.user_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_agents_user ON public.user_agents(user_id);

-- 3. Seed admin agents function (idempotent)
CREATE OR REPLACE FUNCTION public.seed_admin_agents(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer := 0;
BEGIN
  -- Only proceed if user is admin
  IF NOT public.has_role(_user_id, 'admin'::app_role) THEN
    RETURN 0;
  END IF;

  INSERT INTO public.user_agents (user_id, agent_slug, active)
  SELECT _user_id, slug, true
  FROM public.agents_catalog
  WHERE is_active = true
  ON CONFLICT (user_id, agent_slug) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;
