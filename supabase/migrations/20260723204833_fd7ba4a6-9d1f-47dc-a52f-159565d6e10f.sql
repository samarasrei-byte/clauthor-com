
CREATE TABLE public.client_intakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  client_name TEXT,
  company_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_intakes_status ON public.client_intakes(status);
CREATE INDEX idx_client_intakes_created_at ON public.client_intakes(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_intakes TO authenticated;
GRANT ALL ON public.client_intakes TO service_role;

ALTER TABLE public.client_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage client intakes"
ON public.client_intakes FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_client_intakes_updated_at
BEFORE UPDATE ON public.client_intakes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
