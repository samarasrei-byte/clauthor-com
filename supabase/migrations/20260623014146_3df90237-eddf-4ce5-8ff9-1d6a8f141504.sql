CREATE TABLE IF NOT EXISTS public.workforce_agents_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  department text NOT NULL,
  squad text NOT NULL,
  responsibilities text[] NOT NULL DEFAULT '{}',
  triggers text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workforce_agents_dept ON public.workforce_agents_catalog(department);
CREATE INDEX IF NOT EXISTS idx_workforce_agents_slug ON public.workforce_agents_catalog(slug);

GRANT SELECT ON public.workforce_agents_catalog TO anon, authenticated;
GRANT ALL ON public.workforce_agents_catalog TO service_role;

ALTER TABLE public.workforce_agents_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workforce_catalog_public_read" ON public.workforce_agents_catalog;
CREATE POLICY "workforce_catalog_public_read"
  ON public.workforce_agents_catalog FOR SELECT
  TO anon, authenticated
  USING (true);