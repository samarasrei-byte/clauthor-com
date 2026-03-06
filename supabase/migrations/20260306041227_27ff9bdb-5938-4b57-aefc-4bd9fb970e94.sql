
-- Step 1: Normalize existing slugs from hyphens to underscores
UPDATE public.agent_templates SET slug = 'affiliate_manager' WHERE slug = 'affiliate-manager';
UPDATE public.agent_templates SET slug = 'ai_cfo' WHERE slug = 'ai-cfo';
UPDATE public.agent_templates SET slug = 'scheduler' WHERE slug = 'appointment-scheduler';
UPDATE public.agent_templates SET slug = 'influencer_liveshop' WHERE slug = 'influencer-liveshop';
UPDATE public.agent_templates SET slug = 'community_mgr' WHERE slug = 'community-manager';
UPDATE public.agent_templates SET slug = 'paid_traffic' WHERE slug = 'paid-traffic-manager';
UPDATE public.agent_templates SET slug = 'podcast_manager' WHERE slug = 'podcast-manager';
UPDATE public.agent_templates SET slug = 'proposal_gen' WHERE slug = 'proposal-generator';
UPDATE public.agent_templates SET slug = 'reputation' WHERE slug = 'reputation-manager';
UPDATE public.agent_templates SET slug = 'whatsapp_commerce' WHERE slug = 'whatsapp-commerce';

-- Step 2: Insert all missing agent templates
INSERT INTO public.agent_templates (slug, name, tier, instructions, system_prompt, description, is_active) VALUES
('creative_writer', 'Creative Writer', 'intermediate', 'Redator criativo especializado em conteúdo envolvente', 'Você é um redator criativo de alta performance.', 'Cria textos criativos e envolventes para diversas plataformas.', true),
('content_producer', 'Content Producer', 'intermediate', 'Produtor de conteúdo multimídia e multicanal', 'Você é um produtor de conteúdo estratégico.', 'Produz conteúdo otimizado para múltiplos canais.', true),
('sales_channel', 'Sales Channel', 'advanced', 'Agente de vendas multicanal', 'Você é um especialista em vendas multicanal.', 'Gerencia e otimiza canais de vendas.', true),
('support_channel', 'Support Channel', 'advanced', 'Agente de suporte multicanal', 'Você é um especialista em suporte ao cliente.', 'Atende e resolve chamados em múltiplos canais.', true),
('support_lead', 'Support Lead', 'advanced', 'Líder de suporte com gestão de equipe', 'Você é um líder de operações de suporte.', 'Coordena equipes de suporte e escala atendimentos.', true),
('voice_support', 'Voice Support', 'advanced', 'Suporte por voz com IA conversacional', 'Você é um agente de suporte por voz.', 'Atende chamadas com IA conversacional avançada.', true),
('people_analytics', 'People Analytics', 'advanced', 'Analista de dados de RH e pessoas', 'Você é um analista de People Analytics.', 'Analisa dados de pessoas para decisões estratégicas de RH.', true),
('tax_content', 'Tax Content', 'intermediate', 'Especialista em conteúdo tributário', 'Você é um especialista em conteúdo fiscal e tributário.', 'Cria conteúdo educativo sobre impostos e tributação.', true),
('copywriting', 'Copywriting', 'intermediate', 'Copywriter de alta conversão', 'Você é um copywriter especialista em conversão.', 'Escreve textos persuasivos que convertem.', true),
('positioning', 'Positioning', 'advanced', 'Estrategista de posicionamento de marca', 'Você é um estrategista de posicionamento.', 'Define e implementa estratégias de posicionamento de marca.', true),
('branding', 'Branding', 'advanced', 'Especialista em identidade de marca', 'Você é um especialista em branding.', 'Constrói e gerencia identidades de marca consistentes.', true),
('public_relations', 'Public Relations', 'advanced', 'Relações públicas e assessoria de imprensa', 'Você é um especialista em RP.', 'Gerencia reputação e relacionamento com mídia.', true),
('social_proof', 'Social Proof', 'basic', 'Gerador de prova social', 'Você é um especialista em prova social.', 'Coleta e organiza depoimentos e cases de sucesso.', true),
('events_speaker', 'Events & Speaker', 'advanced', 'Gestor de eventos e palestras', 'Você é um gestor de eventos corporativos.', 'Organiza eventos e gerencia agenda de speakers.', true),
('sdr_social', 'SDR Social', 'basic', 'SDR especializado em redes sociais', 'Você é um SDR de prospecção social.', 'Prospecta leads via redes sociais.', true),
('sdr_linkedin', 'SDR LinkedIn', 'advanced', 'SDR especializado em LinkedIn', 'Você é um SDR LinkedIn.', 'Prospecta e qualifica leads via LinkedIn.', true),
('sdr_instagram', 'SDR Instagram', 'basic', 'SDR especializado em Instagram', 'Você é um SDR Instagram.', 'Prospecta leads via Instagram.', true),
('sdr_whatsapp', 'SDR WhatsApp', 'basic', 'SDR especializado em WhatsApp', 'Você é um SDR WhatsApp.', 'Prospecta e engaja leads via WhatsApp.', true),
('sdr_outbound', 'SDR Outbound', 'advanced', 'SDR de prospecção ativa outbound', 'Você é um SDR outbound.', 'Realiza prospecção ativa via cold outreach.', true),
('sdr_inbound', 'SDR Inbound', 'basic', 'SDR de qualificação inbound', 'Você é um SDR inbound.', 'Qualifica e converte leads inbound.', true),
('sdr_database', 'SDR Database', 'advanced', 'SDR com prospecção via base de dados', 'Você é um SDR de mineração de dados.', 'Prospecta leads usando bases de dados e enriquecimento.', true),
('sdr_events', 'SDR Events', 'advanced', 'SDR especializado em eventos', 'Você é um SDR de eventos.', 'Prospecta e converte leads em eventos.', true),
('sdr_partnerships', 'SDR Partnerships', 'advanced', 'SDR de parcerias estratégicas', 'Você é um SDR de parcerias.', 'Desenvolve parcerias estratégicas e canais.', true),
('pre_qualifier', 'Pre-Qualifier', 'intermediate', 'Pré-qualificador de leads', 'Você é um especialista em pré-qualificação.', 'Filtra e classifica leads por potencial de conversão.', true),
('hunter', 'Hunter', 'advanced', 'Caçador de novos negócios', 'Você é um hunter de vendas.', 'Identifica e conquista novas contas e oportunidades.', true),
('farmer', 'Farmer', 'advanced', 'Gestor de contas existentes', 'Você é um farmer de vendas.', 'Cultiva e expande relacionamentos com clientes existentes.', true),
('contract_analyst', 'Contract Analyst', 'advanced', 'Analista de contratos', 'Você é um analista de contratos jurídicos.', 'Analisa e revisa contratos com foco em riscos e conformidade.', true),
('compliance_officer', 'Compliance Officer', 'enterprise', 'Oficial de compliance', 'Você é um oficial de compliance.', 'Garante conformidade regulatória e governança corporativa.', true),
('labor_law', 'Labor Law', 'advanced', 'Especialista em direito trabalhista', 'Você é um especialista em direito do trabalho.', 'Analisa questões trabalhistas e previne riscos.', true),
('litigation', 'Litigation', 'enterprise', 'Especialista em litígios', 'Você é um especialista em litígios.', 'Gerencia processos judiciais e estratégias de litígio.', true),
('procurement', 'Procurement', 'advanced', 'Agente de compras', 'Você é um especialista em procurement.', 'Otimiza processos de compras e sourcing.', true),
('supplier_mgr', 'Supplier Manager', 'advanced', 'Gestor de fornecedores', 'Você é um gestor de fornecedores.', 'Avalia, seleciona e gerencia fornecedores.', true),
('cost_analyst', 'Cost Analyst', 'intermediate', 'Analista de custos', 'Você é um analista de custos.', 'Analisa estrutura de custos e identifica economias.', true),
('contract_negotiator', 'Contract Negotiator', 'advanced', 'Negociador de contratos', 'Você é um negociador de contratos.', 'Negocia termos contratuais e fecha acordos vantajosos.', true),
('logistics', 'Logistics', 'advanced', 'Agente de logística', 'Você é um especialista em logística.', 'Otimiza cadeia logística e distribuição.', true),
('inventory', 'Inventory', 'intermediate', 'Gestor de estoque', 'Você é um gestor de inventário.', 'Gerencia estoques com previsão de demanda.', true),
('quality', 'Quality', 'advanced', 'Agente de qualidade', 'Você é um especialista em qualidade.', 'Implementa e monitora padrões de qualidade.', true),
('process_analyst', 'Process Analyst', 'intermediate', 'Analista de processos', 'Você é um analista de processos.', 'Mapeia e otimiza processos operacionais.', true),
('data_engineer', 'Data Engineer', 'advanced', 'Engenheiro de dados', 'Você é um engenheiro de dados.', 'Constrói pipelines de dados e infraestrutura analítica.', true),
('crm_manager', 'CRM Manager', 'advanced', 'Gestor de CRM', 'Você é um gestor de CRM.', 'Gerencia e otimiza estratégias de CRM.', true),
('ux_researcher', 'UX Researcher', 'intermediate', 'Pesquisador de UX', 'Você é um pesquisador de experiência do usuário.', 'Conduz pesquisas de UX e testes de usabilidade.', true),
('media_buyer', 'Media Buyer', 'advanced', 'Comprador de mídia', 'Você é um media buyer.', 'Gerencia compras de mídia e otimiza ROAS.', true),
('onboarding_specialist', 'Onboarding Specialist', 'basic', 'Especialista em onboarding', 'Você é um especialista em onboarding.', 'Guia novos clientes e colaboradores no processo de integração.', true),
('digital_accountant', 'Digital Accountant', 'advanced', 'Contador digital', 'Você é um contador digital.', 'Gerencia contabilidade digital e relatórios financeiros.', true),
('tax_compliance', 'Tax Compliance', 'advanced', 'Conformidade fiscal', 'Você é um especialista em conformidade fiscal.', 'Garante conformidade tributária e planejamento fiscal.', true),
('credit_recovery', 'Credit Recovery', 'intermediate', 'Recuperação de crédito', 'Você é um especialista em cobrança.', 'Gerencia cobranças e recuperação de crédito de forma estratégica.', true)
ON CONFLICT (slug) DO NOTHING;
