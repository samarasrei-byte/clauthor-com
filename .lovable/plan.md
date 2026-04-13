

# Plano: Construir o Agente LEX — Guardião de Prazos

## Visão Geral
Criar o agente LEX completo: tabelas, edge functions, páginas de cadastro e dashboard, e card no marketplace.

---

## Etapa 1 — Migração de Banco de Dados

Criar duas tabelas com RLS:

**`lex_advogados`**: id, user_id, nome, cpf, oab_numero, oab_estado, whatsapp, govbr_login, govbr_senha_encrypted, ativo (default true), created_at. RLS: usuários veem/editam os próprios; admins veem tudo.

**`lex_intimacoes`**: id, advogado_id (referencia lex_advogados), numero_processo, tribunal, tipo_ato, texto_resumo, data_publicacao, prazo_dias, data_limite, status (default 'novo'), whatsapp_enviado (default false), created_at. RLS: usuários veem intimações dos próprios advogados; admins veem tudo.

---

## Etapa 2 — Secrets

Solicitar ao usuário as seguintes chaves via `add_secret`:
- `LEX_ENCRYPTION_KEY`
- `EVOLUTION_URL`
- `EVOLUTION_INSTANCE`
- `EVOLUTION_API_KEY`

(ANTHROPIC_API_KEY e RAILWAY_LEX_URL ficam para depois, quando o serviço Railway estiver pronto.)

---

## Etapa 3 — Edge Function `lex-salvar-advogado`

- POST com body validado via Zod
- Criptografa `govbr_senha` com AES-256-GCM usando `LEX_ENCRYPTION_KEY`
- Insere na tabela `lex_advogados`
- Retorna `{ success: true, advogado_id }`
- CORS + autenticação JWT via `getClaims()`

---

## Etapa 4 — Edge Function `lex-dashboard`

- GET autenticado
- Busca intimações do advogado logado via join com `lex_advogados`
- Ordena por `data_limite ASC`
- Retorna array de intimações

---

## Etapa 5 — Página `/lex-cadastro`

Formulário com:
- Campos: Nome, CPF (máscara), OAB número, Estado OAB (select), WhatsApp (máscara), Login gov.br, Senha gov.br
- Checkbox de autorização
- Botão "Ativar Lex — R$ 197/mês"
- Chama `lex-salvar-advogado` no submit
- Mensagem de sucesso após ativação
- Rota pública dentro do `AppLayout`

---

## Etapa 6 — Página `/lex-dashboard`

Tabela com:
- Número do processo, Tribunal, Tipo do ato
- Data limite com badge colorido (vermelho ≤3d, amarelo ≤7d, verde >7d)
- Status, Resumo
- Chama edge function `lex-dashboard`
- Rota protegida dentro do `DashboardLayout`

---

## Etapa 7 — Card no Marketplace

Adicionar o agente LEX ao `libraryAgentData.ts` e/ou ao `workforceArchitecture.ts` com:
- Badges: ALTO IMPACTO, JURÍDICO
- Ícone: `Scale` (balança)
- Nome: Lex — Guardião de Prazos
- Descrição, tags, preço R$ 197/mês
- Botão ACESSAR → `/lex-cadastro`

---

## Etapa 8 — Rotas no App.tsx

- `/lex-cadastro` → rota pública com AppLayout
- `/lex-dashboard` → rota protegida com DashboardLayout

---

## Detalhes Técnicos

- Criptografia AES-256-GCM no edge function usando Web Crypto API (similar ao padrão já existente em `src/lib/crypto.ts`, mas server-side com chave fixa)
- Input validation com Zod em ambas edge functions
- Máscaras de CPF e WhatsApp no frontend com regex
- Badges de prazo calculados com `differenceInDays` da data limite vs hoje

