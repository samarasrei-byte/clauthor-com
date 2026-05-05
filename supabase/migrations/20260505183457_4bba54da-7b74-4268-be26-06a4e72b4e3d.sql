-- Reativa o operacional
UPDATE public.agents_catalog
SET is_active = true, updated_at = now()
WHERE slug = 'assistente_juridico_operacional';

-- Insere os 6 novos agentes MCP
INSERT INTO public.agents_catalog (slug, name, department, squad, tier, monthly_price_cents, tagline, description, responsibilities, is_active)
VALUES
(
  'mcp_seguranca_juridico',
  'Agente MCP de Segurança & LGPD',
  'advocacia',
  'mcp_juridico',
  'premium',
  149700,
  'Bloqueia riscos antes de qualquer ação. LGPD, sigilo e permissões.',
  'Validação obrigatória de segurança em arquitetura MCP. Classifica dados sensíveis, valida acessos, garante conformidade LGPD e sigilo profissional OAB. Prioridade máxima — todo agente passa por ele antes de executar.',
  '["Validar permissões e acessos antes de cada ação", "Classificar dados sensíveis (PII, dados de cliente, segredo de justiça)", "Bloquear operações de risco automaticamente", "Auditoria LGPD contínua e geração de RIPD", "Garantir sigilo profissional conforme OAB"]'::jsonb,
  true
),
(
  'mcp_processual_juridico',
  'Agente MCP Processual',
  'advocacia',
  'mcp_juridico',
  'advanced',
  129700,
  'Organiza processos, classifica documentos e mapeia a fase processual.',
  'Especialista em organização jurídica. Classifica documentos por tipo, monta linha do tempo do processo, identifica fase processual atual e sugere próximos passos com base no rito.',
  '["Classificar documentos automaticamente (petição, decisão, despacho, sentença)", "Construir linha do tempo do processo", "Identificar fase processual e rito aplicável", "Sugerir próximos passos com base no andamento", "Detectar inconsistências documentais"]'::jsonb,
  true
),
(
  'mcp_prazos_juridico',
  'Agente MCP de Prazos',
  'advocacia',
  'mcp_juridico',
  'advanced',
  129700,
  'Controle crítico de prazos com cálculo automático e alerta de risco.',
  'Identifica prazos em intimações e publicações, calcula datas considerando feriados forenses e suspensões, classifica nível de risco (crítico, alto, médio) e nunca assume sem base documental.',
  '["Identificar prazos em intimações e publicações automaticamente", "Calcular datas considerando feriados e suspensões", "Classificar prazo por nível de risco", "Alertar com antecedência configurável", "Recusar inferências sem base documental clara"]'::jsonb,
  true
),
(
  'mcp_redator_juridico',
  'Agente MCP Redator Jurídico',
  'advocacia',
  'mcp_juridico',
  'advanced',
  129700,
  'Cria, revisa e padroniza peças jurídicas com linguagem técnica precisa.',
  'Produção jurídica assistida. Gera minutas de peças, contratos e pareceres a partir de templates do escritório, revisa textos para clareza e técnica, e padroniza linguagem mantendo a identidade do escritório.',
  '["Gerar minutas de peças, contratos e pareceres", "Revisar textos quanto à técnica e clareza", "Padronizar linguagem segundo manual do escritório", "Aplicar jurisprudência relevante quando solicitado", "Validar citações e fundamentação"]'::jsonb,
  true
),
(
  'mcp_estrategico_juridico',
  'Agente MCP Estratégico',
  'advocacia',
  'mcp_juridico',
  'premium',
  149700,
  'Inteligência jurídica: teses, probabilidade de êxito e análise de risco.',
  'Apoio à decisão estratégica. Sugere teses aplicáveis ao caso, estima probabilidade de êxito com base em jurisprudência, mapeia riscos da estratégia adotada e propõe alternativas táticas.',
  '["Sugerir teses jurídicas aplicáveis ao caso", "Estimar probabilidade de êxito com base em jurisprudência", "Analisar riscos da estratégia escolhida", "Propor alternativas táticas e linhas de defesa", "Avaliar custo-benefício de recursos e medidas"]'::jsonb,
  true
),
(
  'mcp_financeiro_juridico',
  'Agente MCP Financeiro Jurídico',
  'advocacia',
  'mcp_juridico',
  'advanced',
  129700,
  'Gestão de honorários, relatórios e comunicação financeira com cliente.',
  'Controle financeiro jurídico. Acompanha honorários contratados versus recebidos, gera relatórios para cliente e sócios, e mantém comunicação clara sobre status de pagamento e custas processuais.',
  '["Controlar honorários contratados, faturados e recebidos", "Gerar relatórios financeiros para cliente e sócios", "Comunicar cliente sobre custas e status de pagamento", "Calcular honorários de êxito automaticamente", "Integrar com sistema de cobrança do escritório"]'::jsonb,
  true
);