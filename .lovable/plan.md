# Hunter Engagement Actions — Real Execution + Painel do Cliente

## Objetivo

Sair do mock: executar de verdade Like/Comment no LinkedIn via PhantomBuster, persistir envios ao CRM, ter trilha de auditoria completa e o cliente **ver o progresso ao vivo** em duas telas do painel.

---

## 1. Schema (migrations)

**`hunter_leads` — colunas novas** (não recriar tabela):
- `linkedin_url text`, `linkedin_urn text` — chaves de deduplicação
- `sent_to_crm jsonb default '{}'` — mapa `{ hubspot: {id, at}, pipedrive: {...} }` para bloquear reenvio
- `liked_at timestamptz`, `commented_at timestamptz`
- índice único parcial `(campaign_id, linkedin_urn) where linkedin_urn is not null`

**Nova tabela `hunter_action_jobs`** (uma linha por tentativa de ação):
- `id uuid pk`, `user_id uuid`, `tenant_id uuid`, `lead_id uuid fk hunter_leads`
- `action text check in ('like','comment','crm_push')`, `provider text` (phantombuster/hubspot/pipedrive/salesforce/zoho/rdstation)
- `status text check in ('queued','running','success','failed','skipped_duplicate')`
- `attempt int default 1`, `max_attempts int default 3`
- `payload jsonb`, `result jsonb`, `error text`
- `queued_at`, `started_at`, `finished_at`, `next_retry_at timestamptz`
- RLS: dono via `user_id = auth.uid()`; GRANT authenticated + service_role.
- Realtime: `alter publication supabase_realtime add table hunter_action_jobs`.

**`hunter_logs`** já existe — usar para eventos textuais agregados (`"3 likes concluídos em 12s"`).

---

## 2. Edge Functions

### `hunter-action-dispatch` (POST, JWT)
Body: `{ leadIds: string[], action: 'like'|'comment'|'crm_push', params?: { comment?, crmProvider? } }`.
- Valida ownership dos leads.
- Deduplica: se `action='crm_push'` e `lead.sent_to_crm[provider]` existe → cria job com status `skipped_duplicate` e retorna.
- Cria 1 job por lead com `status='queued'`.
- Dispara worker (chama `hunter-action-worker` async via `fetch` sem await, ou envia evento Inngest se conectado).

### `hunter-action-worker` (POST, service_role)
Body: `{ jobId }`.
- Marca `running`, `started_at`.
- **Like/Comment**: chama PhantomBuster gateway (`standard_connectors` já usado no projeto Hunter) com o agente "LinkedIn Auto Liker/Commenter", passando `linkedin_url` do lead e a sessão da `hunter_linkedin_session`.
- **crm_push**: roteia por provider — HubSpot/Pipedrive via connector gateway existente; Salesforce/Zoho via App User Connector; RD Station via API key. Escreve `sent_to_crm[provider] = {id, at}` no lead.
- Grava `result` ou `error`; se falhar e `attempt < max_attempts`, agenda `next_retry_at = now() + 2^attempt min` e recoloca em `queued`.
- Insere linha em `hunter_logs`.

### `hunter-action-retry-cron` (pg_cron a cada 1 min)
Pega jobs `queued` com `next_retry_at <= now()` e reenvia ao worker.

---

## 3. Frontend

### `HunterPostEngagers.tsx` (wizard, ações já existem em mock)
- Substituir os `toast + updateEngager` por `supabase.functions.invoke('hunter-action-dispatch', ...)`.
- Após o dispatch, abrir subscription realtime em `hunter_action_jobs` filtrada pelos `jobIds` retornados; atualizar cada card com badge de estado (Queued → Running → Success/Failed) e barra de retry.
- Botão "Enviar ao CRM" desabilita e mostra "Já em HubSpot" quando `sent_to_crm[hubspot]` existe (lido do lead).

### Novo painel `/dashboard/hunter/atividade` (`HunterActivityCenter.tsx`)
Visão do cliente para acompanhar tudo:
- **Header KPI**: jobs hoje, sucesso %, falhas, em retry.
- **Timeline realtime**: lista de `hunter_action_jobs` (subscribe), agrupada por lead, com ícone da ação, provider, latência, tentativa X/3, botão "Repetir agora" (reenfileira) e "Ver payload" (drawer com `payload`+`result`).
- **Filtros**: ação, status, período, campanha.
- **Export CSV**.

### Link cruzado
- Card no dashboard principal ("Hunter · últimas ações") já existente ganha link "Ver tudo" → `/dashboard/hunter/atividade`.
- Toast de sucesso do wizard leva pra esse painel.

---

## 4. Como o cliente visualiza (resposta direta)

Em **duas superfícies**, atualizadas ao vivo via Supabase Realtime:

1. **Dentro do wizard de Post Engagers**: cada card de engajador mostra o estado da ação naquele lead — "Curtindo…", "Curtido ✓", "Comentando (tentativa 2/3)", "Enviado ao HubSpot ✓". O cliente vê o que ele acabou de disparar sem sair da tela.
2. **Painel `/dashboard/hunter/atividade`**: linha do tempo global de TODAS as ações (like/comment/CRM) de todas as campanhas, com filtros, retries manuais, payload/resultado inspecionáveis e KPIs no topo. É a "caixa preta" auditável — o que rodou, quando, resultado, erro, quantas tentativas.

Notificações no sino (`notifications`) disparam quando um lote termina ou quando um job falha depois dos 3 retries.

---

## Arquivos afetados

- **Migrations**: `hunter_leads` alter + `hunter_action_jobs` create + policies + realtime + cron.
- **Edge Functions (novas)**: `hunter-action-dispatch`, `hunter-action-worker`, `hunter-action-retry-cron`.
- **Frontend**:
  - `src/pages/HunterPostEngagers.tsx` (troca mock por dispatch + realtime)
  - `src/pages/HunterActivityCenter.tsx` (novo)
  - `src/hooks/useHunterActionJobs.ts` (subscribe + retry action)
  - `src/App.tsx` (rota)
  - `src/components/dashboard/DashboardSidebar.tsx` (link em "Hunter")

## Fora do escopo desta iteração
- OAuth de Salesforce/Zoho (assumir App User Connector já linkado; se não, worker retorna `error='connector_not_linked'` e o painel oferece CTA para conectar).
- UI de configuração de PhantomBuster (já existe em `hunter_config`).
