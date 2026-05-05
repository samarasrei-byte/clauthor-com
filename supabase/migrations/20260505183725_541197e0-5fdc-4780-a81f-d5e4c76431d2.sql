INSERT INTO public.agents_catalog (slug, name, department, squad, tier, monthly_price_cents, tagline, description, responsibilities, is_active)
VALUES (
  'mcp_orquestrador_juridico',
  'Orquestrador MCP Jurídico',
  'advocacia',
  'mcp_juridico',
  'premium',
  199700,
  'Master Control Program: interpreta, valida segurança e orquestra os 6 subagentes especializados.',
  'Sistema operacional jurídico baseado em arquitetura MCP. Não executa diretamente — interpreta a solicitação, valida obrigatoriamente com o Agente de Segurança e aciona os subagentes corretos (Processual, Prazos, Redator, Estratégico, Financeiro), consolidando uma resposta única no formato auditável.',
  '["Classificar intenção de cada solicitação jurídica", "Validar segurança e LGPD antes de qualquer execução", "Acionar um ou múltiplos subagentes especializados conforme o contexto", "Consolidar respostas em formato auditável com nível de confiança", "Bloquear operações de risco e exigir validação humana quando necessário"]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tagline = EXCLUDED.tagline,
  responsibilities = EXCLUDED.responsibilities,
  is_active = true,
  updated_at = now();