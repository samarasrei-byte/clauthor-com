# Central de Aprovações Inteligentes + Módulo Arquivos

Feature grande. Vou dividir em 3 fases entregáveis. Confirme antes de implementar.

## Escopo

**Novo no menu principal:** `Arquivos` e `Aprovações` (Dashboard, Agentes, Projetos, Tarefas, Configurações já existem).

## Fase 1 — Backend (migração única)

**Tabelas novas (`public`, RLS multi-tenant via `is_tenant_member`):**

- `files` — uploads gerais
  - `tenant_id, user_id, name, type` (video|audio|image|pdf|doc|brandbook|logo|marketing), `bucket_path, size_bytes, mime, folder, tags[]`
- `approvals` — entregas em revisão
  - `tenant_id, project_id (nullable), agent_id, task_id (nullable), title, delivery_type` (creative|video|article|post|email|landing|report|automation), `status` (pending|approved|rejected|in_revision), `current_version_id, preview_url, content jsonb, created_by`
- `approval_versions` — histórico
  - `approval_id, version_number, content jsonb, preview_url, generated_by_agent, created_at`
- `approval_comments` — feedback
  - `approval_id, version_id, user_id, body, is_rejection_reason bool`
- `approval_actions` — auditoria (approve/reject/request_changes/new_version)
- `project_approval_settings` — por projeto: `mode` (required|optional|auto)

**Bucket Storage novo:** `approval-files` (privado) — uploads de mídia.
RLS em `storage.objects` por `tenant_id` no path.

**Edge function:** `approval-request-revision` — recebe rejeição+feedback, marca `in_revision`, dispara o agente responsável (via `agent_tasks`) para gerar nova versão; ao concluir cria `approval_versions` e volta para `pending`.

## Fase 2 — Página `/arquivos`

- Grid com filtros por tipo (vídeo/áudio/imagem/pdf/doc/brandbook/logo/marketing) e busca
- Upload drag-and-drop (multi), preview por tipo (thumbnail img/vídeo, ícone para pdf/doc)
- Pastas + tags, ações: renomear, mover, excluir, copiar URL

## Fase 3 — Página `/aprovacoes` (Central)

**Layout SaaS estilo ClickUp/Monday:**

- Sidebar com contadores por status
- Header com métricas: Geradas | Aprovadas | Pendentes | Taxa aprovação % | Tempo médio | Nº revisões
- Tabs: Aguardando | Em Ajuste | Aprovado | Reprovado
- Cards/lista alternável com:
  - Preview visual (img/video/iframe para landing/email)
  - Título, agente, tipo, data, versão atual (vN)
  - Botões: **Aprovar**, **Solicitar Ajustes**, **Reprovar**, **Nova Versão**
- Drawer de detalhe: histórico de versões (timeline), diff visual, comentários threaded, motivo de reprovação

**Configuração por projeto:** seção em `/projetos/[id]/settings` com toggle `required | optional | auto`.

## Stack

React + shadcn (Card, Drawer, Tabs, Badge, Tooltip), Framer Motion para transições, TanStack Query para dados, react-dropzone para upload, design tokens semânticos (sem cores hard-coded), dark mode nativo.

## Entregáveis estimados

- 1 migração (6 tabelas + RLS + grants + bucket policies)
- 1 edge function (`approval-request-revision`)
- 2 páginas + 8-10 componentes (`FileGrid`, `FileUploader`, `ApprovalCard`, `ApprovalDrawer`, `VersionTimeline`, `FeedbackForm`, `ApprovalMetrics`, `ProjectApprovalSettings`)
- Update do menu lateral (`AppSidebar` ou equivalente)

## Confirmar antes de começar

1. **Agente "responsável" pela regeração**: usar o `agent_id` que originou a entrega, ou permitir reatribuir?
2. **Preview de landing/email**: iframe sandbox do HTML salvo em `content.html`, OK?
3. Posso começar pela **Fase 1 (migração)** já?
