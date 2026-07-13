
CREATE TABLE public.thor_touchpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  context TEXT NOT NULL,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  cta_taken BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, context)
);

CREATE INDEX idx_thor_touchpoints_user ON public.thor_touchpoints(user_id, seen_at DESC);
CREATE INDEX idx_thor_touchpoints_context ON public.thor_touchpoints(context);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thor_touchpoints TO authenticated;
GRANT ALL ON public.thor_touchpoints TO service_role;

ALTER TABLE public.thor_touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own thor touchpoints"
  ON public.thor_touchpoints FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER thor_touchpoints_updated_at
  BEFORE UPDATE ON public.thor_touchpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
