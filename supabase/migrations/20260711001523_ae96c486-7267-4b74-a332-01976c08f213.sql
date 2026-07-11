
CREATE OR REPLACE FUNCTION public.get_wow_variant_significance(_since timestamp with time zone DEFAULT (now() - '90 days'::interval))
 RETURNS TABLE(
   variant text,
   assigned bigint,
   approved bigint,
   conversion_rate numeric,
   chi_square numeric,
   p_lt_0_05 boolean,
   winner text
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  a_form bigint := 0;   -- form assigned
  b_form bigint := 0;   -- form approved (successes)
  a_voice bigint := 0;
  b_voice bigint := 0;
  n bigint;
  x2 numeric := 0;
  num numeric;
  den numeric;
  winner_v text := 'inconclusive';
  sig boolean := false;
  form_cr numeric := 0;
  voice_cr numeric := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  -- Unique users assigned per variant
  SELECT count(DISTINCT user_id) INTO a_form
  FROM public.kpi_events
  WHERE event = 'wow_variant_assigned'
    AND created_at >= _since
    AND (payload->>'variant') = 'form';

  SELECT count(DISTINCT user_id) INTO a_voice
  FROM public.kpi_events
  WHERE event = 'wow_variant_assigned'
    AND created_at >= _since
    AND (payload->>'variant') = 'voice';

  -- Unique users approved per variant
  SELECT count(DISTINCT user_id) INTO b_form
  FROM public.kpi_events
  WHERE event = 'first_wow_approved'
    AND created_at >= _since
    AND (payload->>'variant') = 'form';

  SELECT count(DISTINCT user_id) INTO b_voice
  FROM public.kpi_events
  WHERE event = 'first_wow_approved'
    AND created_at >= _since
    AND (payload->>'variant') = 'voice';

  n := a_form + a_voice;

  -- Chi-square with Yates continuity correction for 2x2
  -- Table: [b_form, a_form - b_form; b_voice, a_voice - b_voice]
  IF a_form > 0 AND a_voice > 0 AND n > 0 THEN
    num := n * (abs(b_form::numeric * (a_voice - b_voice) - b_voice::numeric * (a_form - b_form)) - n::numeric / 2.0) ^ 2;
    den := (a_form)::numeric * (a_voice)::numeric * (b_form + b_voice)::numeric * ((a_form - b_form) + (a_voice - b_voice))::numeric;
    IF den > 0 THEN
      x2 := num / den;
    END IF;
    sig := x2 > 3.841;  -- df=1, p<0.05

    form_cr := b_form::numeric / a_form;
    voice_cr := b_voice::numeric / a_voice;

    IF sig THEN
      winner_v := CASE WHEN voice_cr > form_cr THEN 'voice' ELSE 'form' END;
    END IF;
  END IF;

  variant := 'form'; assigned := a_form; approved := b_form;
  conversion_rate := CASE WHEN a_form > 0 THEN (b_form::numeric / a_form) ELSE 0 END;
  chi_square := round(x2, 3); p_lt_0_05 := sig; winner := winner_v;
  RETURN NEXT;

  variant := 'voice'; assigned := a_voice; approved := b_voice;
  conversion_rate := CASE WHEN a_voice > 0 THEN (b_voice::numeric / a_voice) ELSE 0 END;
  chi_square := round(x2, 3); p_lt_0_05 := sig; winner := winner_v;
  RETURN NEXT;
END;
$function$;
