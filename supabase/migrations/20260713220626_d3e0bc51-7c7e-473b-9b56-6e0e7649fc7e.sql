
CREATE OR REPLACE FUNCTION public.record_thor_token_touchpoint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ctx text;
BEGIN
  -- Only user-facing token threshold notifications
  IF NEW.type IN ('token_limit_80','token_limit_90','token_limit_100') THEN
    v_ctx := 'token_alert_' || split_part(NEW.type, '_', 3);
    INSERT INTO public.thor_touchpoints (user_id, context, seen_at, metadata)
    VALUES (NEW.user_id, v_ctx, NEW.created_at, COALESCE(NEW.metadata, '{}'::jsonb))
    ON CONFLICT (user_id, context) DO UPDATE
      SET seen_at = EXCLUDED.seen_at,
          metadata = EXCLUDED.metadata,
          dismissed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_thor_token_touchpoint ON public.notifications;
CREATE TRIGGER trg_record_thor_token_touchpoint
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.record_thor_token_touchpoint();
