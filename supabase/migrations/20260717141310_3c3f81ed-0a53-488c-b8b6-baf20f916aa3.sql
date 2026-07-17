
CREATE TABLE public.department_activation_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contracted_department_id uuid NOT NULL REFERENCES public.contracted_departments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  step text NOT NULL CHECK (step IN ('checkout','subscription','provisioning','deploy','first_execution')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed')),
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contracted_department_id, step)
);

CREATE INDEX idx_das_user ON public.department_activation_steps(user_id);
CREATE INDEX idx_das_dept ON public.department_activation_steps(contracted_department_id);
CREATE INDEX idx_das_failed ON public.department_activation_steps(user_id) WHERE status = 'failed';

GRANT SELECT, UPDATE ON public.department_activation_steps TO authenticated;
GRANT ALL ON public.department_activation_steps TO service_role;

ALTER TABLE public.department_activation_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.department_activation_steps
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "own_update" ON public.department_activation_steps
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER das_updated_at
  BEFORE UPDATE ON public.department_activation_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.department_activation_steps;
ALTER TABLE public.department_activation_steps REPLICA IDENTITY FULL;

-- Trigger: on first agent_activity_log for a user, mark first_execution as done
-- for their most recent active department.
CREATE OR REPLACE FUNCTION public.mark_first_execution_done()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dept_id uuid;
BEGIN
  SELECT cd.id INTO v_dept_id
  FROM public.contracted_departments cd
  WHERE cd.user_id = NEW.user_id
    AND (NEW.agent_id IS NULL OR NEW.agent_id::text = ANY(cd.agent_ids))
  ORDER BY cd.created_at DESC
  LIMIT 1;

  IF v_dept_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.department_activation_steps
    (contracted_department_id, user_id, step, status, started_at, completed_at)
  VALUES
    (v_dept_id, NEW.user_id, 'first_execution', 'done', now(), now())
  ON CONFLICT (contracted_department_id, step) DO UPDATE
    SET status = 'done',
        completed_at = COALESCE(department_activation_steps.completed_at, now()),
        error_message = NULL
    WHERE department_activation_steps.status <> 'done';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_first_execution_done ON public.agent_activity_log;
CREATE TRIGGER trg_mark_first_execution_done
  AFTER INSERT ON public.agent_activity_log
  FOR EACH ROW EXECUTE FUNCTION public.mark_first_execution_done();
