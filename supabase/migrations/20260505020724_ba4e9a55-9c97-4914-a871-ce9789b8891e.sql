INSERT INTO public.agents_catalog (slug, name, department, squad, tier, monthly_price_cents, tagline, description, responsibilities, is_active)
VALUES (
  'assistente_juridico_operacional',
  'Assistente Jurídico Operacional',
  'advocacia',
  'captacao_juridica_squad',
  'advanced',
  119700,
  'Analisa contratos, monta propostas e apoia o fechamento — sempre com revisão humana obrigatória.',
  'Assistente operacional que apoia o advogado em análise de contratos, relatórios de risco, propostas de honorários (fixo/êxito/híbrido), apoio ao fechamento, produção de minutas e checagens preliminares de KYC/LGPD/PLD. Nunca substitui o advogado: toda saída traz "Revisão humana obrigatória".',
  '["Análise rápida de contratos e identificação de cláusulas críticas","Relatórios de risco classificados (baixo/médio/alto)","Propostas de honorários personalizadas (fixo, êxito, híbrido)","Apoio ao fechamento e tratamento técnico de objeções","Minutas e rascunhos com aviso de revisão obrigatória","Apoio operacional a KYC/LGPD/PLD com encaminhamento ao Compliance"]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  squad = EXCLUDED.squad,
  tier = EXCLUDED.tier,
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  responsibilities = EXCLUDED.responsibilities,
  is_active = true,
  updated_at = now();