CREATE TABLE public.workforce_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  scale text NOT NULL CHECK (scale IN ('agent','squad','department','org')),
  objective text,
  blueprint jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','deployed','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workforce_blueprints TO authenticated;
GRANT ALL ON public.workforce_blueprints TO service_role;

ALTER TABLE public.workforce_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own blueprints"
  ON public.workforce_blueprints
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_workforce_blueprints_updated_at
  BEFORE UPDATE ON public.workforce_blueprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_workforce_blueprints_user ON public.workforce_blueprints(user_id, created_at DESC);