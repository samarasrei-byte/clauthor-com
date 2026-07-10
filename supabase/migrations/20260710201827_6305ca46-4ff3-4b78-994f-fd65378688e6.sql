CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Paywall: usuário começa sem créditos.
  -- Créditos são atribuídos após contratação de um departamento.
  INSERT INTO public.user_credits (user_id, total_credits, plan_type)
  VALUES (NEW.id, 0, 'free');
  RETURN NEW;
END;
$function$;