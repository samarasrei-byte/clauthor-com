
-- Seed Knowledge Base with foundational documents for RAG
INSERT INTO public.knowledge_documents (user_id, tenant_id, title, content, category) VALUES

-- VENDAS
('33e6c20f-b234-4265-ac4e-06188254c15e', '68e47737-4e56-4197-a92e-8a23a2e07b17',
'Playbook de Vendas - Clauthor AI',
'## Playbook de Vendas Clauthor

### Proposta de Valor
A Clauthor substitui departamentos inteiros por agentes de IA especializados que trabalham 24/7 por uma fração do custo de um colaborador CLT.

### Objeções Comuns e Respostas

**"Por que não usar o ChatGPT/Claude direto?"**
R: ChatGPT e Claude são ferramentas individuais de chat. Não têm automação, pipeline de vendas, multi-agente, integração com CRM, ou segurança enterprise. A Clauthor é um departamento completo com 83 agentes especializados que se comunicam entre si, executam tarefas, e geram relatórios automaticamente.

**"É caro demais"**
R: Um SDR humano custa R$4.500/mês + encargos (FGTS, 13º, férias = ~R$6.750 custo total). Nosso agente de vendas custa R$997/mês e trabalha 24h sem folga. Em 1 ano, a economia é de R$69.000 por vaga substituída.

**"E se a IA errar?"**
R: O sistema opera com 3 níveis de autonomia. Ações críticas (emails em massa, exclusão de dados) sempre passam por aprovação humana. Ações rotineiras (responder chat, analisar leads) são executadas automaticamente com logs de auditoria completos.

### Comparativo de Custos
| Item | CLT (mês) | Clauthor (mês) | Economia |
|------|-----------|----------------|----------|
| SDR | R$6.750 | R$297 | 95,6% |
| Analista Marketing | R$5.500 | R$997 | 81,9% |
| Atendimento | R$4.000 | R$297 | 92,6% |
| Desenvolvedor | R$9.000 | R$2.997 | 66,7% |

### Processo de Vendas
1. Lead entra via WhatsApp, site ou LinkedIn
2. Agente SDR qualifica automaticamente em 30s
3. Score > 70: agenda reunião automaticamente
4. Score 40-70: nurturing via email sequence
5. Score < 40: arquivo com follow-up em 30 dias',
'vendas'),

-- SUPORTE
('33e6c20f-b234-4265-ac4e-06188254c15e', '68e47737-4e56-4197-a92e-8a23a2e07b17',
'FAQ Técnico - Plataforma Clauthor',
'## FAQ Técnico

### Geral

**Como funciona a plataforma?**
A Clauthor é uma plataforma de agentes de IA especializados por departamento. Cada agente possui conhecimento específico, ferramentas integradas e opera dentro de regras de segurança rigorosas. Os agentes podem se comunicar entre si (protocolo A2A) para resolver tarefas complexas.

**Quais integrações estão disponíveis?**
WhatsApp Business, Instagram DM, E-mail (SMTP/SendGrid), Meta Ads, Google Ads, LinkedIn, Telegram, ERP (via API), CRM (nativo), Slack, Google Calendar, PayPal.

**Como funciona a segurança?**
- Criptografia AES-256-GCM para credenciais
- Row Level Security (RLS) em 100% das tabelas
- Isolamento multi-tenant completo
- Safety Layer anti-injection em todos os prompts
- 3 níveis de autonomia com aprovação humana para ações críticas
- Logs de auditoria completos

**Quais modelos de IA são usados?**
Roteamento inteligente: Gemini Flash para tarefas simples, Gemini Pro / GPT-5 para tarefas complexas. O sistema escolhe automaticamente o melhor modelo baseado na complexidade da tarefa.

**Existe limite de uso?**
Sim, cada plano tem uma quota de tokens mensais. O plano Free inclui 10.000 tokens. Planos pagos incluem de 500K a tokens ilimitados. O sistema alerta automaticamente em 80%, 90% e 100% do uso.

### Troubleshooting

**Agente não responde**
1. Verifique se o agente está com status "active"
2. Confira se há créditos disponíveis
3. Verifique os logs de execução no dashboard

**Integração não funciona**
1. Acesse Credenciais no dashboard
2. Verifique se a API key está correta e ativa
3. Teste a conexão pelo painel de integrações',
'suporte'),

-- ONBOARDING
('33e6c20f-b234-4265-ac4e-06188254c15e', '68e47737-4e56-4197-a92e-8a23a2e07b17',
'Guia de Onboarding - Novos Clientes',
'## Guia de Onboarding

### Passo 1: Configuração Inicial
1. Crie sua conta em clauthor.com
2. Complete o wizard de onboarding (empresa, setor, tamanho)
3. Seu workspace é criado automaticamente com 10.000 tokens grátis

### Passo 2: Primeiro Agente
1. Acesse o Marketplace e escolha um agente
2. Recomendamos começar pelo "Atendimento WhatsApp" (R$297/mês)
3. Configure as instruções personalizadas para seu negócio
4. Adicione documentos à Knowledge Base (FAQs, políticas, catálogo)

### Passo 3: Integrações
1. Conecte WhatsApp Business via painel de Integrações
2. Configure SendGrid para emails automáticos
3. Adicione credenciais de APIs necessárias (Meta Ads, Google, etc.)

### Passo 4: Treinamento
1. Alimente a Knowledge Base com documentos do seu negócio
2. Teste conversas no chat de cada agente
3. Ajuste o tom e as instruções conforme necessário
4. Use o feedback de chat para melhorar as respostas

### Passo 5: Escala
1. Adicione mais agentes conforme a necessidade
2. Monte squads (equipes de agentes) por departamento
3. Configure a Torre de Controle para visão geral
4. Ative o THOR (Orquestrador) para coordenação automática',
'onboarding'),

-- MARKETING
('33e6c20f-b234-4265-ac4e-06188254c15e', '68e47737-4e56-4197-a92e-8a23a2e07b17',
'Estratégia de Conteúdo - Marketing Digital',
'## Estratégia de Conteúdo

### Pilares de Conteúdo
1. **Educacional**: Como IA pode substituir tarefas repetitivas
2. **Case Studies**: ROI real de clientes usando agentes
3. **Comparativo**: Clauthor vs contratação CLT vs freelancers
4. **Produto**: Features, updates, roadmap

### Calendário de Publicação
- LinkedIn: 3x/semana (terça, quinta, sábado)
- Instagram: 5x/semana (reels + carrosséis)
- Blog: 2x/mês (SEO long-form)
- Email: 1x/semana (newsletter com insights)
- WhatsApp: broadcasts mensais

### Métricas de Sucesso
- CAC alvo: R$150
- LTV alvo: R$12.000 (12 meses x R$997)
- Taxa de conversão site: 3-5%
- Taxa de conversão trial→pago: 15-20%

### Tom de Voz
Profissional mas acessível. Sem jargões excessivos. Focar em resultados mensuráveis e economia de tempo/dinheiro. Usar dados reais sempre que possível.',
'marketing'),

-- FINANCEIRO
('33e6c20f-b234-4265-ac4e-06188254c15e', '68e47737-4e56-4197-a92e-8a23a2e07b17',
'Política Financeira e Planos',
'## Política Financeira

### Planos Disponíveis (BRL)
- **Starter**: R$997/mês - 1-3 agentes, 500K tokens
- **Growth**: R$1.997/mês - até 10 agentes, 2M tokens, squads
- **B2B Autopilot**: R$4.000/mês - CRM completo com IA, leads 24/7

### Token Packs Adicionais
- 5M tokens: R$297
- 15M tokens: R$697
- 50M tokens: R$1.797
- 100M tokens: R$3.497

### Preços por Agente Individual
- Starter (básico): R$297/mês
- Entry (intermediário): R$597/mês
- Mid (avançado): R$997/mês
- High (especialista): R$1.797/mês
- Premium (enterprise): R$2.997/mês

### Política de Reembolso
- 7 dias de garantia para planos mensais
- Cancelamento a qualquer momento sem multa
- Créditos não utilizados não são transferíveis

### Descontos
- Anual: 20% de desconto
- Equipes (5+ agentes): 15% de desconto
- Startups: programa especial com 50% off por 6 meses',
'financeiro'),

-- RH / POLÍTICAS
('33e6c20f-b234-4265-ac4e-06188254c15e', '68e47737-4e56-4197-a92e-8a23a2e07b17',
'Políticas de Uso e Termos',
'## Políticas de Uso

### Uso Aceitável
- Os agentes devem ser usados para fins comerciais legítimos
- É proibido usar agentes para spam, phishing ou atividades ilegais
- O conteúdo gerado deve respeitar direitos autorais e leis locais

### Limites de Uso
- Cada agente opera dentro do seu escopo de departamento
- Ações de alto risco requerem aprovação humana
- Rate limiting: máximo 100 requisições/minuto por tenant

### SLA por Tier
- Basic: 99% uptime, suporte por email em 24h
- Intermediate: 99.5% uptime, suporte em 12h
- Advanced: 99.9% uptime, suporte em 4h, gerente dedicado
- Enterprise: 99.95% uptime, suporte em 1h, SLA customizado

### LGPD e Compliance
- Dados são processados e armazenados no Brasil
- Criptografia em trânsito (TLS 1.3) e em repouso (AES-256)
- Direito a portabilidade e exclusão de dados
- DPO disponível para consultas',
'rh'),

-- TECNOLOGIA
('33e6c20f-b234-4265-ac4e-06188254c15e', '68e47737-4e56-4197-a92e-8a23a2e07b17',
'Arquitetura Técnica - Visão Geral',
'## Arquitetura Técnica

### Stack
- Frontend: React + TypeScript + Tailwind CSS + Vite
- Backend: Supabase (Auth, DB, Edge Functions, Storage)
- IA: Lovable AI Gateway (Gemini/GPT-5) + OpenClaw VPS
- Segurança: AES-256-GCM, RLS, Policy Engine

### Camadas de Execução
1. **Thor (Orquestrador)**: Coordenação de alto nível entre agentes
2. **Planning Brain**: Raciocínio estratégico e decomposição de tarefas
3. **OpenClaw Engine**: Motor de execução via VPS dedicado
4. **83 Agentes Especializados**: Workers por departamento

### Roteamento de IA
- Tarefas simples (FAQ, agendamento) → OpenClaw VPS (custo fixo)
- Tarefas complexas (análise, relatórios) → Gemini Pro/GPT-5
- Fallback automático com circuit breaker (5min cooldown)

### Segurança
- 40 tabelas com Row Level Security
- 27 triggers ativos para automação
- Policy Engine com 5 portões (Tenant, Créditos, Plano, Tier, Área)
- Isolamento multi-tenant completo
- Auditoria de credenciais com logs detalhados

### Ferramentas dos Agentes
1. send_email - Envio de emails via bridge segura
2. create_task - Criação de tarefas no Kanban
3. generate_report - Relatórios automatizados
4. search_leads - Busca interna de leads
5. schedule_meeting - Agendamento de reuniões
6. analyze_data - Análise de dados
7. delegate_to_agent - Delegação A2A (recursão máx 3 níveis)',
'tecnologia');
