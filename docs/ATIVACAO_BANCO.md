# Ativação do Banco de Dados e Login

## Situação atual

O código de autenticação está **100% implementado e pronto para produção**.
O que falta é vincular o banco de dados ao projeto para que o login, cadastro e recuperação de senha funcionem com usuários reais.

---

## Como ativar em 3 passos

### Passo 1 — Vincular o Supabase

1. Acesse o painel da **Ueda Codex**.
2. Clique em **Mais → Banco de dados**.
3. Clique em **Vincular Supabase** e siga as instruções.
4. Após vincular, as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` serão preenchidas automaticamente.

### Passo 2 — Aplicar as migrations

As migrations já estão versionadas em `supabase/migrations/`.
Após vincular o banco, elas serão aplicadas automaticamente pelo deploy.

Caso precise rodar manualmente:
```bash
supabase db push
```

### Passo 3 — Publicar o projeto

1. No painel da Ueda Codex, clique em **Publicar**.
2. O frontend será publicado com as variáveis corretas.
3. Acesse `/auth` no domínio publicado e crie sua conta.

---

## O que já está implementado

| Funcionalidade | Status |
|---|---|
| Login com e-mail e senha | ✅ Implementado |
| Cadastro de conta | ✅ Implementado |
| Login com Google (OAuth) | ✅ Implementado |
| Persistência de sessão | ✅ Implementado |
| Proteção de rotas privadas | ✅ Implementado |
| Logout | ✅ Implementado |
| Recuperação de senha por e-mail | ✅ Implementado |
| Redefinição de senha | ✅ Implementado |
| Mensagens de erro seguras | ✅ Implementado |
| Perfil criado automaticamente no cadastro | ✅ Migration |
| Role `customer` atribuída no cadastro | ✅ Migration |
| Créditos iniciais criados no cadastro | ✅ Migration |
| RLS em 100% das tabelas | ✅ Migration |

---

## Variáveis de ambiente necessárias

```env
# Públicas (preenchidas automaticamente ao vincular o Supabase)
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# URL do app (para links de e-mail)
APP_URL=https://clauthor.com
```

As demais chaves (PayPal, WhatsApp, etc.) ficam nos secrets das Edge Functions — nunca no frontend.

---

## Fluxo do usuário após ativar

```
/auth               → Cadastro ou login
/welcome            → Boas-vindas (após primeiro cadastro)
/dashboard          → Painel principal
/reset-password     → Redefinir senha (via link no e-mail)
```

---

## Verificação pós-ativação

Após vincular o banco, execute este checklist:

- [ ] Criar conta em `/auth`
- [ ] Confirmar e-mail (se confirmação estiver ativa no Supabase)
- [ ] Entrar com e-mail e senha
- [ ] Atualizar a página e confirmar que a sessão persiste
- [ ] Sair e confirmar que o painel bloqueia o acesso
- [ ] Solicitar recuperação de senha e trocar pelo link recebido
- [ ] Verificar que o perfil foi criado na tabela `profiles`
- [ ] Verificar que a role `customer` foi atribuída em `user_roles`
