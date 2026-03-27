
-- Tabela de métricas agregadas diárias por agente
CREATE TABLE public.agent_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  user_id uuid NOT NULL,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  total_executions integer NOT NULL DEFAULT 0,
  successful_executions integer NOT NULL DEFAULT 0,
  failed_executions integer NOT NULL DEFAULT 0,
  avg_execution_time_ms integer DEFAULT 0,
  total_tokens_used integer NOT NULL DEFAULT 0,
  total_chat_messages integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, user_id, metric_date)
);

-- Índices para agent_metrics
CREATE INDEX idx_agent_metrics_user_date ON public.agent_metrics (user_id, metric_date DESC);
CREATE INDEX idx_agent_metrics_agent_date ON public.agent_metrics (agent_id, metric_date DESC);

-- RLS
ALTER TABLE public.agent_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics"
ON public.agent_metrics FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can upsert metrics"
ON public.agent_metrics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update own metrics"
ON public.agent_metrics FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all metrics"
ON public.agent_metrics FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Função que agrega métricas automaticamente ao inserir execution_logs
CREATE OR REPLACE FUNCTION public.aggregate_agent_metric()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.agent_metrics (agent_id, user_id, metric_date, total_executions, successful_executions, failed_executions, avg_execution_time_ms)
  VALUES (
    NEW.agent_id,
    NEW.user_id,
    CURRENT_DATE,
    1,
    CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status != 'success' THEN 1 ELSE 0 END,
    COALESCE(NEW.execution_time_ms, 0)
  )
  ON CONFLICT (agent_id, user_id, metric_date)
  DO UPDATE SET
    total_executions = agent_metrics.total_executions + 1,
    successful_executions = agent_metrics.successful_executions + CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
    failed_executions = agent_metrics.failed_executions + CASE WHEN NEW.status != 'success' THEN 1 ELSE 0 END,
    avg_execution_time_ms = (agent_metrics.avg_execution_time_ms * agent_metrics.total_executions + COALESCE(NEW.execution_time_ms, 0)) / (agent_metrics.total_executions + 1),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger automático
CREATE TRIGGER trg_aggregate_agent_metric
AFTER INSERT ON public.execution_logs
FOR EACH ROW
EXECUTE FUNCTION public.aggregate_agent_metric();
