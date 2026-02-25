
-- Fix permissive INSERT policy on department_suggestions
DROP POLICY IF EXISTS "Authenticated can submit suggestions" ON public.department_suggestions;
CREATE POLICY "Authenticated can submit suggestions"
  ON public.department_suggestions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
