
CREATE TABLE public.department_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_name text NOT NULL,
  reason text,
  email text,
  votes integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.department_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit suggestions (public form)
CREATE POLICY "Anyone can submit suggestions"
ON public.department_suggestions
FOR INSERT
WITH CHECK (true);

-- Anyone can view suggestions (to show vote counts)
CREATE POLICY "Anyone can view suggestions"
ON public.department_suggestions
FOR SELECT
USING (true);

-- Admins can manage all
CREATE POLICY "Admins can manage suggestions"
ON public.department_suggestions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
