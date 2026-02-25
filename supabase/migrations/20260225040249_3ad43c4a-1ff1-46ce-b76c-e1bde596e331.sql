
CREATE OR REPLACE FUNCTION public.increment_agent_executions(p_agent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.agents
  SET total_executions = total_executions + 1,
      updated_at = now()
  WHERE id = p_agent_id;
END;
$function$;
