# CLAUTHOR

**Contrate um departamento inteiro de IA em minutos.**
20 departamentos. Squads customizáveis. +200 especialistas de IA orquestrados por um único comando.

- 🌐 Produção: <https://clauthor.com>
- 📚 Docs: <https://docs.clauthor.com>
- 💬 Suporte: <mailto:support@clauthor.com>

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 5 + TypeScript 5 + Tailwind v3 + shadcn/ui |
| Backend | Lovable Cloud (Supabase gerenciado) — Postgres + Edge Functions Deno |
| IA | Lovable AI Gateway (OpenAI GPT-5.5, Gemini, GPT-4o STT, etc.) |
| Pagamentos | PayPal (assinaturas + one-time) |
| Comunicação | WhatsApp Business Cloud API, Meta Ads, LinkedIn, Email |
| Assinatura de docs | ClickSign, DocuSign |
| Prospecção | Hunter (LinkedIn multi-tenant), PhantomBuster |
| MCP | Servidor MCP nativo para Claude Desktop / Cursor |

## Arquitetura

- **Pipeline hierárquico de 10 camadas** com 20 departamentos e ~225 agentes
- **Memória hierárquica em 4 camadas** (episódica, semântica, procedural) via pgvector
- **Multi-tenant** com RLS em 100% das 109 tabelas públicas
- **Smart Approvals Center** para governança de ações de alto risco
- **Faturamento híbrido**: Starter Plan + Outcome-Based Pricing

## Desenvolvimento local

Este é um projeto Lovable. A forma recomendada de editar é pelo editor Lovable — o preview roda automaticamente no sandbox.

Para rodar manualmente:

```bash
bun install
bun run dev        # Vite em http://localhost:8080
bun run build      # build de produção
bun run test       # vitest
bun run test:e2e   # playwright
```

Copie `.env.example` para `.env` e preencha com valores do seu projeto Cloud (a Lovable já faz isso automaticamente ao conectar Cloud).

## Deploy

- **Frontend**: publicado via botão *Publish* no editor Lovable. Muda vão pra live após clicar em *Update* no diálogo de publish.
- **Edge Functions & migrations**: deploy automático a cada mudança no branch principal.
- **Domínio**: `clauthor.com` (canônico, sem `www`) — configurado em Project Settings → Domains.

## Segurança

- RLS habilitado em 100% das tabelas públicas
- Roles gerenciadas em tabela dedicada `user_roles` + `has_role()` SECURITY DEFINER
- Nunca há `service_role` no cliente
- Secrets injetados em runtime via `Deno.env.get` (nunca commitados)
- HMAC verification em webhooks (WhatsApp, DocuSign, ClickSign, PayPal)
- Auditoria contínua via `security-audit` edge function

## Licença

Proprietário © CLAUTHOR — Todos os direitos reservados.
