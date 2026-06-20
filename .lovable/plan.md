## Redesign do Onboarding de Criação — "Digital Workforce OS"

Transformar `/create-agent` em um sistema operacional de força de trabalho digital, não um criador de chatbot.

---

### 1. Nova rota e arquitetura

- **Nova página**: `src/pages/CreateWorkforce.tsx` (substitui `CreateAgent.tsx` na rota `/create-agent`, mantendo a antiga em `/create-agent/classic` como fallback admin).
- **Layout full-screen** sem Navbar — modo "cockpit" inspirado em Linear/Vercel: sidebar esquerda com etapas verticais, canvas central, painel direito de "Live Preview" da organização sendo montada.
- **State machine** via `useReducer` em `src/lib/workforce/builderState.ts` (etapas, hierarquia, autonomia, integrações).

### 2. Fluxo consultivo (8 etapas, navegáveis)

```
1. Objetivo de negócio   →  textarea + sugestões (Thor consultor)
2. Escala                →  Agente | Squad | Departamento | Organização
3. Função/Cargo          →  busca semântica em 201+ templates
4. Nível de autonomia    →  Assistente → Operador → Especialista → Coordenador → Executivo
5. Stack de capacidades  →  4 abas: Ferramentas | Integrações | Conhecimento | Canais | Memória
6. Hierarquia & Supervisão → drag-and-drop org chart (IA→IA→Humano)
7. Governança            →  aprovações, limites, escalonamento, auditoria
8. Blueprint Preview     →  estrutura, fluxos, custos, KPIs, deploy
```

Sidebar mostra progresso e permite saltar para qualquer etapa concluída.

### 3. Biblioteca de 201+ agentes

- `src/data/workforceCatalog.ts` — catálogo expandido (reaproveita `agentLibraryBridge` + `departmentData` + novos templates por departamento brasileiro):
  - Vendas, Marketing, RH, Financeiro, Jurídico, Atendimento, Operações, TI/DevOps, Produto, Dados, Compliance, Sucesso do Cliente, Suprimentos, Logística, Executivo (C-Level virtuais).
- Cada template: `{ id, role, department, tier, suggestedTools, suggestedIntegrations, suggestedChannels, defaultKPIs, baselineCost }`.
- Busca com filtro por departamento, nível e tag de resultado ("gerar leads", "reduzir churn"...).

### 4. Níveis de autonomia (semântica clara)

| Nível | Descrição | Aprovação humana |
|---|---|---|
| Assistente | Responde e sugere | Sempre |
| Operador | Executa tarefas simples | Antes de ações externas |
| Especialista | Domínio profundo, decide dentro do escopo | Apenas ações sensíveis |
| Coordenador | Delega para outros agentes | Em mudanças estruturais |
| Executivo | Define metas, supervisiona squads | Apenas governance |

Configuração granular por categoria de ação (enviar email, gastar crédito, contatar cliente, etc.).

### 5. Stack de capacidades (5 abas separadas)

- **Ferramentas**: skills internas (gerar texto, analisar PDF, classificar).
- **Integrações**: conectores (HubSpot, Slack, WhatsApp, Sheets...) com sugestão automática.
- **Conhecimento**: upload de docs, URLs, base RAG — preview de chunks.
- **Canais**: por onde o agente é acionado (Inbox, WhatsApp, API, Web, Email).
- **Memória**: curta (sessão), longa (vetorial), compartilhada (squad).

Cada aba mostra **"Sugerido pela IA"** no topo com base na função+autonomia escolhidas.

### 6. Hierarquia & Supervisão

- Org chart visual (react-flow-style, mas leve com SVG + framer-motion) em `src/components/workforce/OrgChartBuilder.tsx`.
- Permite: agente reporta a → agente coordenador → humano supervisor.
- Loops de supervisão IA→IA com limite anti-recursão (já existe em `_shared/autonomy-engine.ts`).
- Squads agrupam agentes; departamentos agrupam squads.

### 7. Consultor IA (Thor Architect)

- Edge function nova: `supabase/functions/workforce-architect/index.ts`
- Input: objetivo de negócio + contexto da empresa.
- Output (structured via AI SDK + Gemini 3 Flash): blueprint completo sugerido em JSON.
- Botão "**Deixar a IA arquitetar**" em qualquer etapa → preenche tudo automaticamente, usuário só revisa.

### 8. Blueprint Preview (etapa final)

Cartão único premium com:
- **Estrutura organizacional** (mini org chart).
- **Fluxos** principais (lista de gatilhos → ações).
- **Stack** (ferramentas, integrações, canais, conhecimento).
- **Custos estimados** (créditos/mês baseado em volume previsto).
- **KPIs** com metas iniciais.
- **Nível de autonomia** consolidado.
- Ações: **Implantar agora** | **Salvar rascunho** | **Compartilhar blueprint**.

### 9. Persistência

Nova tabela `workforce_blueprints` (cliente pode salvar/versionar) — schema:
```
id, user_id, name, scale (agent|squad|department|org),
objective, blueprint jsonb, status (draft|deployed), created_at
```
Tabelas existentes `agents`, `squads`, `agent_tools` recebem os agentes individuais ao implantar.

### 10. Visual / Identidade

- Tipografia: Inter (já no projeto), display em peso 700 com tracking ajustado.
- Paleta: dark glass + accent ruby (já é core), sutil gradient mesh no background.
- Microanimações: framer-motion em transições de etapa (slide+fade), spring leve em cards de template.
- Inspiração: Linear (densidade), Stripe (clareza), Notion (modularidade), Vercel (preview cards), OpenAI/Claude (consultivo).

---

### Escopo desta entrega

Vou implementar tudo em **4 sub-deliveries paralelos**:

1. **Estrutura & dados**: tipos, catálogo 201+, state machine, rota.
2. **UI cockpit**: layout, sidebar de etapas, navegação, preview lateral.
3. **Etapas 1–4** (Objetivo, Escala, Função, Autonomia) com biblioteca + busca.
4. **Etapas 5–8** (Stack, Hierarquia, Governança, Blueprint) + edge function consultor + persistência.

Cliente vê só "Assistente/Equipe/Departamento" (sem jargão). Admin vê tudo + "Organização".

---

### Detalhes técnicos (para revisão)

- Sem novas dependências pesadas — uso framer-motion, lucide, shadcn existentes.
- Edge function `workforce-architect` usa Lovable AI Gateway (`google/gemini-3-flash-preview`) com `Output.object` para blueprint estruturado.
- Migration: tabela `workforce_blueprints` com RLS por `user_id` + GRANTs padrão.
- i18n: strings em pt.json sob `workforce.*`.
- Rota antiga `CreateAgent.tsx` preservada em `/create-agent/classic` para não quebrar admin.

**Pronto para construir?** Posso começar pelos 4 sub-deliveries em paralelo. Confirma para eu executar.