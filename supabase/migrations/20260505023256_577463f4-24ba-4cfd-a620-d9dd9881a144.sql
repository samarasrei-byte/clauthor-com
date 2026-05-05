-- Audit fix: unify Advocacia squad naming and elevate Compliance to premium tier
-- Standardize all 8 legal agents under squad='juridica_squad' and align tiers/prices

UPDATE public.agents_catalog
SET squad = 'juridica_squad',
    updated_at = now()
WHERE department = 'advocacia';

-- Compliance LGPD/PLD is the premium tier of the Compliance plan
UPDATE public.agents_catalog
SET tier = 'premium',
    monthly_price_cents = 149700,
    updated_at = now()
WHERE slug = 'compliance_lgpd_juridico';

-- Ensure all 8 required slugs are active
UPDATE public.agents_catalog
SET is_active = true,
    updated_at = now()
WHERE slug IN (
  'captacao_juridica',
  'diagnostico_juridico',
  'risco_contratual',
  'fechamento_juridico',
  'recuperacao_leads_juridico',
  'producao_juridica',
  'compliance_lgpd_juridico',
  'assistente_juridico_operacional'
);