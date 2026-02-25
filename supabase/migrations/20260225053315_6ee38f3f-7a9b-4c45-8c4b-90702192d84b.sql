
-- ==============================================
-- TOKEN MONITORING: DB Function + Trigger
-- Checks thresholds (80%, 90%, 100%) on every token_usage insert
-- Notifies: user, tenant admin, platform admins
-- ==============================================

-- Function: check token thresholds and create notifications
CREATE OR REPLACE FUNCTION public.check_token_thresholds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_credits RECORD;
  v_usage_pct INTEGER;
  v_threshold INTEGER;
  v_threshold_key TEXT;
  v_title TEXT;
  v_message TEXT;
  v_admin RECORD;
  v_tenant_id UUID;
  v_already_notified BOOLEAN;
BEGIN
  -- Get user's current credits
  SELECT * INTO v_credits
  FROM public.user_credits
  WHERE user_id = NEW.user_id;

  IF v_credits IS NULL OR v_credits.total_credits = 0 THEN
    RETURN NEW;
  END IF;

  -- Calculate usage percentage
  v_usage_pct := ROUND((v_credits.used_credits::NUMERIC / v_credits.total_credits) * 100);

  -- Determine which threshold was crossed
  IF v_usage_pct >= 100 THEN
    v_threshold := 100;
    v_threshold_key := 'token_limit_100';
    v_title := '🚫 Limite de Tokens Atingido';
    v_message := 'Você atingiu 100% do seu limite de tokens. Faça upgrade para continuar usando os agentes.';
  ELSIF v_usage_pct >= 90 THEN
    v_threshold := 90;
    v_threshold_key := 'token_limit_90';
    v_title := '⚠️ 90% dos Tokens Utilizados';
    v_message := 'Você utilizou 90% dos seus tokens. Considere fazer upgrade para evitar interrupções.';
  ELSIF v_usage_pct >= 80 THEN
    v_threshold := 80;
    v_threshold_key := 'token_limit_80';
    v_title := '📊 80% dos Tokens Utilizados';
    v_message := 'Você já utilizou 80% dos seus tokens disponíveis neste período.';
  ELSE
    RETURN NEW;
  END IF;

  -- Check if we already notified this user for this threshold in this billing period
  SELECT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = NEW.user_id
      AND type = v_threshold_key
      AND created_at >= v_credits.credits_reset_at - INTERVAL '30 days'
  ) INTO v_already_notified;

  IF v_already_notified THEN
    RETURN NEW;
  END IF;

  -- 1) Notify the user
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    v_threshold_key,
    v_title,
    v_message,
    jsonb_build_object(
      'usage_pct', v_usage_pct,
      'used_credits', v_credits.used_credits,
      'total_credits', v_credits.total_credits,
      'plan_type', v_credits.plan_type,
      'threshold', v_threshold,
      'agent_id', NEW.agent_id,
      'suggest_upgrade', true
    )
  );

  -- 2) Notify tenant admin(s)
  SELECT get_user_tenant_id(NEW.user_id) INTO v_tenant_id;
  
  IF v_tenant_id IS NOT NULL THEN
    FOR v_admin IN
      SELECT tm.user_id 
      FROM public.tenant_members tm
      WHERE tm.tenant_id = v_tenant_id 
        AND tm.role IN ('owner', 'admin')
        AND tm.user_id != NEW.user_id
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        v_admin.user_id,
        v_threshold_key || '_admin',
        '👥 ' || v_title,
        'Um membro da sua organização atingiu ' || v_threshold || '% do limite de tokens.',
        jsonb_build_object(
          'affected_user_id', NEW.user_id,
          'usage_pct', v_usage_pct,
          'threshold', v_threshold,
          'tenant_id', v_tenant_id,
          'suggest_upgrade', true
        )
      );
    END LOOP;
  END IF;

  -- 3) Notify platform admins (app_role = 'admin')
  FOR v_admin IN
    SELECT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
      AND ur.user_id != NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      v_admin.user_id,
      v_threshold_key || '_platform',
      '🏢 Alerta de Consumo: ' || v_threshold || '%',
      'Usuário atingiu ' || v_threshold || '% do limite de tokens no plano ' || v_credits.plan_type || '.',
      jsonb_build_object(
        'affected_user_id', NEW.user_id,
        'usage_pct', v_usage_pct,
        'plan_type', v_credits.plan_type,
        'threshold', v_threshold,
        'tenant_id', v_tenant_id
      )
    );
  END LOOP;

  -- 4) Log the event in execution_logs
  INSERT INTO public.execution_logs (agent_id, user_id, action, status, details)
  VALUES (
    COALESCE(NEW.agent_id, '00000000-0000-0000-0000-000000000000'),
    NEW.user_id,
    'token_threshold_alert',
    'warning',
    jsonb_build_object(
      'threshold', v_threshold,
      'usage_pct', v_usage_pct,
      'used_credits', v_credits.used_credits,
      'total_credits', v_credits.total_credits,
      'plan_type', v_credits.plan_type
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger on token_usage
DROP TRIGGER IF EXISTS trg_check_token_thresholds ON public.token_usage;
CREATE TRIGGER trg_check_token_thresholds
  AFTER INSERT ON public.token_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.check_token_thresholds();

-- Also update user_credits.used_credits automatically when token_usage is inserted
CREATE OR REPLACE FUNCTION public.increment_used_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_credits
  SET used_credits = used_credits + NEW.tokens_used,
      updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_used_credits ON public.token_usage;
CREATE TRIGGER trg_increment_used_credits
  BEFORE INSERT ON public.token_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_used_credits();
