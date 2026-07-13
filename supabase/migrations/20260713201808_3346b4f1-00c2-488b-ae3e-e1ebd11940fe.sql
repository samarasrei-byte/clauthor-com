-- 1. CREATE TABLE
CREATE TABLE public.department_roi_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id TEXT NOT NULL UNIQUE,
  minutes_saved_per_task INTEGER NOT NULL CHECK (minutes_saved_per_task > 0 AND minutes_saved_per_task <= 240),
  hourly_rate_brl NUMERIC(10,2) NOT NULL CHECK (hourly_rate_brl > 0 AND hourly_rate_brl <= 2000),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_department_roi_config_active ON public.department_roi_config(department_id) WHERE is_active = true;

-- 2. GRANT (authenticated reads for dashboard card; admin writes only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_roi_config TO authenticated;
GRANT ALL ON public.department_roi_config TO service_role;

-- 3. ENABLE RLS
ALTER TABLE public.department_roi_config ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
CREATE POLICY "Anyone authenticated can read active ROI config"
  ON public.department_roi_config
  FOR SELECT
  TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert ROI config"
  ON public.department_roi_config
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update ROI config"
  ON public.department_roi_config
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete ROI config"
  ON public.department_roi_config
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. updated_at trigger
CREATE TRIGGER update_department_roi_config_updated_at
  BEFORE UPDATE ON public.department_roi_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Seed com os 14 departamentos atuais (mesmos valores de src/config/departmentRoi.ts)
INSERT INTO public.department_roi_config (department_id, minutes_saved_per_task, hourly_rate_brl, notes) VALUES
  ('comercial',   15,  90.00, 'SDR/vendas — cadência, follow-up, qualificação'),
  ('marketing',   20,  95.00, 'Conteúdo, campanhas, análise de performance'),
  ('suporte',      8,  60.00, 'Atendimento alto volume, respostas curtas'),
  ('tecnologia',  25, 140.00, 'Dev sênior — code review, arquitetura'),
  ('financeiro',  18, 110.00, 'Análise de fluxo de caixa, conciliação'),
  ('prospeccao',  10,  75.00, 'BDR — enriquecimento e outreach frio'),
  ('criacao',     30, 100.00, 'Designer/copywriter — briefing e revisão'),
  ('rh',          15,  85.00, 'Recrutamento, onboarding, comunicação interna'),
  ('juridico',    35, 180.00, 'Análise de contratos, pareceres, due diligence'),
  ('advocacia',   35, 180.00, 'Peças processuais, atendimento cliente'),
  ('operacoes',   15,  85.00, 'Processos, workflows, coordenação'),
  ('produto',     22, 130.00, 'PM — specs, discovery, priorização'),
  ('dados',       25, 140.00, 'Analista de dados — SQL, dashboards, insights'),
  ('compliance',  28, 150.00, 'Auditoria, políticas, LGPD/GDPR');
