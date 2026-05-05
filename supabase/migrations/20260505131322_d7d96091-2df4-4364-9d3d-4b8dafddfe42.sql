
-- Enable pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============= API KEYS =============
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  key_prefix text NOT NULL,         -- first 12 chars shown to user (e.g. "sk_live_a3f9")
  key_hash text NOT NULL UNIQUE,    -- sha256 hex of full key
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','paid')),
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  total_calls bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX idx_api_keys_user ON public.api_keys(user_id) WHERE is_active = true;
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash) WHERE is_active = true;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own api_keys" ON public.api_keys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users insert own api_keys" ON public.api_keys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own api_keys" ON public.api_keys
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users delete own api_keys" ON public.api_keys
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= RATE LIMIT LOG =============
CREATE TABLE public.api_rate_limits (
  id bigserial PRIMARY KEY,
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  called_at timestamptz NOT NULL DEFAULT now(),
  endpoint text,
  status_code int
);

CREATE INDEX idx_rate_limits_key_time ON public.api_rate_limits(api_key_id, called_at DESC);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
-- No client policies: only service role writes/reads

-- ============= FUNCTIONS =============
CREATE OR REPLACE FUNCTION public.hash_api_key(_key text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT encode(digest(_key, 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.verify_api_key(_key text)
RETURNS TABLE(api_key_id uuid, user_id uuid, plan text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_row record;
BEGIN
  v_hash := encode(digest(_key, 'sha256'), 'hex');
  SELECT k.id, k.user_id, k.plan INTO v_row
  FROM public.api_keys k
  WHERE k.key_hash = v_hash
    AND k.is_active = true
    AND (k.expires_at IS NULL OR k.expires_at > now())
    AND k.revoked_at IS NULL
  LIMIT 1;

  IF v_row.id IS NULL THEN RETURN; END IF;

  UPDATE public.api_keys
  SET last_used_at = now(), total_calls = total_calls + 1
  WHERE id = v_row.id;

  api_key_id := v_row.id;
  user_id := v_row.user_id;
  plan := v_row.plan;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(_api_key_id uuid, _plan text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_limit int;
  v_count int;
BEGIN
  v_limit := CASE WHEN _plan = 'paid' THEN 600 ELSE 60 END;
  SELECT count(*) INTO v_count
  FROM public.api_rate_limits
  WHERE api_key_id = _api_key_id
    AND called_at > now() - interval '1 minute';

  IF v_count >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'limit', v_limit, 'used', v_count, 'reset_in_seconds', 60);
  END IF;
  RETURN jsonb_build_object('allowed', true, 'limit', v_limit, 'used', v_count, 'remaining', v_limit - v_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_api_call(_api_key_id uuid, _endpoint text, _status int)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.api_rate_limits(api_key_id, endpoint, status_code)
  VALUES (_api_key_id, _endpoint, _status);
$$;
