-- =========================================================
-- VideoStudio: schema, RLS, quotas e triggers
-- =========================================================

-- 1) Tabela principal de jobs de geração
CREATE TABLE public.video_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('veo3','replicate','lovable')),
  model TEXT,
  prompt TEXT NOT NULL,
  input_image_url TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9','9:16','1:1','4:3','3:4','21:9')),
  duration_s INTEGER NOT NULL DEFAULT 5 CHECK (duration_s BETWEEN 3 AND 30),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','uploading','processing','completed','failed','canceled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  provider_job_id TEXT,
  storage_path TEXT,
  output_url TEXT,
  thumbnail_url TEXT,
  cost_credits NUMERIC(10,4) DEFAULT 0,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_generations TO authenticated;
GRANT ALL ON public.video_generations TO service_role;

ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tenant videos"
  ON public.video_generations FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Users insert own videos"
  ON public.video_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Users update own videos"
  ON public.video_generations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own videos"
  ON public.video_generations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on video_generations"
  ON public.video_generations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_video_generations_tenant ON public.video_generations(tenant_id, created_at DESC);
CREATE INDEX idx_video_generations_user ON public.video_generations(user_id, created_at DESC);
CREATE INDEX idx_video_generations_status ON public.video_generations(status) WHERE status IN ('queued','processing');
CREATE INDEX idx_video_generations_provider_job ON public.video_generations(provider, provider_job_id) WHERE provider_job_id IS NOT NULL;

CREATE TRIGGER trg_video_generations_updated_at
  BEFORE UPDATE ON public.video_generations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Passos live da timeline (estilo Cursor)
CREATE TABLE public.video_generation_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID NOT NULL REFERENCES public.video_generations(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL CHECK (step_type IN ('dispatch','upload','render','poll','download','persist','thumbnail','error','complete')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','failed')),
  message TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.video_generation_steps TO authenticated;
GRANT ALL ON public.video_generation_steps TO service_role;

ALTER TABLE public.video_generation_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view steps of own tenant videos"
  ON public.video_generation_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.video_generations vg
    WHERE vg.id = video_generation_steps.generation_id
      AND public.is_tenant_member(auth.uid(), vg.tenant_id)
  ));

CREATE POLICY "Service role full access on video_generation_steps"
  ON public.video_generation_steps FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_video_gen_steps_gen ON public.video_generation_steps(generation_id, created_at ASC);

-- 3) Operações de edição
CREATE TABLE public.video_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_generation_id UUID REFERENCES public.video_generations(id) ON DELETE SET NULL,
  operation TEXT NOT NULL CHECK (operation IN ('trim','concat','extend','remix','extract_frame','change_audio')),
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed')),
  output_url TEXT,
  storage_path TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_edits TO authenticated;
GRANT ALL ON public.video_edits TO service_role;

ALTER TABLE public.video_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tenant edits"
  ON public.video_edits FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Users insert own edits"
  ON public.video_edits FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Users update own edits"
  ON public.video_edits FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own edits"
  ON public.video_edits FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on video_edits"
  ON public.video_edits FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_video_edits_tenant ON public.video_edits(tenant_id, created_at DESC);

CREATE TRIGGER trg_video_edits_updated_at
  BEFORE UPDATE ON public.video_edits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Quotas por plano
CREATE TABLE public.video_plan_quotas (
  plan_type TEXT NOT NULL PRIMARY KEY,
  monthly_limit INTEGER NOT NULL DEFAULT 0,
  max_duration_s INTEGER NOT NULL DEFAULT 5,
  allow_veo3 BOOLEAN NOT NULL DEFAULT false,
  allow_replicate BOOLEAN NOT NULL DEFAULT false,
  allow_lovable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.video_plan_quotas TO authenticated, anon;
GRANT ALL ON public.video_plan_quotas TO service_role;

ALTER TABLE public.video_plan_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read video quotas"
  ON public.video_plan_quotas FOR SELECT
  USING (true);

INSERT INTO public.video_plan_quotas (plan_type, monthly_limit, max_duration_s, allow_veo3, allow_replicate, allow_lovable) VALUES
  ('free',       0,   5,  false, false, false),
  ('starter',    5,   5,  false, true,  true),
  ('pro',        50,  10, true,  true,  true),
  ('enterprise', 500, 30, true,  true,  true);

-- 5) Função: checar quota atual do usuário
CREATE OR REPLACE FUNCTION public.check_video_quota(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_limit INTEGER;
  v_max_duration INTEGER;
  v_allow_veo3 BOOLEAN;
  v_allow_replicate BOOLEAN;
  v_allow_lovable BOOLEAN;
  v_used INTEGER;
BEGIN
  SELECT COALESCE(plan_type, 'free') INTO v_plan
  FROM public.user_credits WHERE user_id = _user_id;

  IF v_plan IS NULL THEN v_plan := 'free'; END IF;

  SELECT monthly_limit, max_duration_s, allow_veo3, allow_replicate, allow_lovable
    INTO v_limit, v_max_duration, v_allow_veo3, v_allow_replicate, v_allow_lovable
  FROM public.video_plan_quotas WHERE plan_type = v_plan;

  IF v_limit IS NULL THEN
    v_limit := 0; v_max_duration := 5; v_allow_veo3 := false; v_allow_replicate := false; v_allow_lovable := false;
  END IF;

  SELECT COUNT(*) INTO v_used
  FROM public.video_generations
  WHERE user_id = _user_id
    AND created_at >= date_trunc('month', now())
    AND status NOT IN ('failed','canceled');

  RETURN jsonb_build_object(
    'plan', v_plan,
    'monthly_limit', v_limit,
    'used', v_used,
    'remaining', GREATEST(0, v_limit - v_used),
    'max_duration_s', v_max_duration,
    'allow_veo3', v_allow_veo3,
    'allow_replicate', v_allow_replicate,
    'allow_lovable', v_allow_lovable,
    'can_generate', (v_used < v_limit)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_video_quota(UUID) TO authenticated, service_role;

-- 6) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_generations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_generation_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_edits;

ALTER TABLE public.video_generations REPLICA IDENTITY FULL;
ALTER TABLE public.video_generation_steps REPLICA IDENTITY FULL;
ALTER TABLE public.video_edits REPLICA IDENTITY FULL;
