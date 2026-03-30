-- Fix department_suggestions: don't expose NULL user_id rows to everyone
DROP POLICY IF EXISTS "Users can view own suggestions" ON public.department_suggestions;

CREATE POLICY "Users can view own suggestions"
  ON public.department_suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);