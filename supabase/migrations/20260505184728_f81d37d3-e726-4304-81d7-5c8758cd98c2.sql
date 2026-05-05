-- 1. Tabela de auditoria do MCP Orquestrador
CREATE TABLE IF NOT EXISTS public.mcp_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  selected_agents JSONB NOT NULL DEFAULT '[]'::jsonb,
  triggered_agents JSONB NOT NULL DEFAULT '[]'::jsonb,
  routing JSONB DEFAULT '{}'::jsonb,
  results JSONB DEFAULT '[]'::jsonb,
  security_blocked BOOLEAN NOT NULL DEFAULT false,
  security_level TEXT,
  security_output TEXT,
  total_ms INTEGER NOT NULL DEFAULT 0,
  approval_status TEXT NOT NULL DEFAULT 'not_required',
  approval_notes TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mcp_executions_user_created
  ON public.mcp_executions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_executions_approval
  ON public.mcp_executions(user_id, approval_status)
  WHERE approval_status = 'pending';

ALTER TABLE public.mcp_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mcp executions"
  ON public.mcp_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own mcp executions"
  ON public.mcp_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own mcp executions"
  ON public.mcp_executions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all mcp executions"
  ON public.mcp_executions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_mcp_executions_updated_at
  BEFORE UPDATE ON public.mcp_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Reposiciona compliance_lgpd_juridico para eliminar duplicidade com mcp_seguranca_juridico
UPDATE public.agents_catalog
SET name = 'Oficial de Compliance Empresarial & Anti-PLD',
    tagline = 'KYC reforçado, PEP, OFAC, COAF e governança regulatória',
    description = 'Compliance regulatório empresarial: KYC reforçado PF/PJ, monitoramento PEP/OFAC/ONU, listas COAF e Provimento OAB 188. Não atua em LGPD operacional (papel do MCP Segurança).',
    updated_at = now()
WHERE slug = 'compliance_lgpd_juridico';