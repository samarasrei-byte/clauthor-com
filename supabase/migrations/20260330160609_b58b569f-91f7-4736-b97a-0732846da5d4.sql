-- Fix department_suggestions: replace email with user_id tracking to prevent email enumeration
DROP POLICY IF EXISTS "Users can only view own suggestions" ON public.department_suggestions;
DROP POLICY IF EXISTS "Authenticated can submit suggestions" ON public.department_suggestions;

ALTER TABLE public.department_suggestions ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE POLICY "Authenticated can submit suggestions"
  ON public.department_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own suggestions"
  ON public.department_suggestions
  FOR SELECT
  TO authenticated
  USING ((user_id IS NULL) OR (auth.uid() = user_id));