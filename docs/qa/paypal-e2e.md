# PayPal E2E · Checklist de Go-Live

Objetivo: validar checkout real (live) ponta a ponta antes de abrir o beta pago.

## Pré-requisitos
- Secrets `PAYPAL_CLIENT_ID` e `PAYPAL_SECRET_KEY` já configurados (produção).
- URL do webhook cadastrada no painel PayPal: `https://<project-ref>.functions.supabase.co/paypal-webhook`.
- Eventos assinados no PayPal: `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `PAYMENT.SALE.COMPLETED`, `PAYMENT.SALE.REFUNDED`.
- Conta PayPal Business real (não sandbox).

## Fluxo obrigatório (executar 1 vez, com cartão real)

1. **Login**: entrar como usuário beta (não-admin) em produção.
2. **Contratar departamento**: `/departamentos` → escolher "Comercial" → botão "Contratar".
3. **Redirect PayPal**: confirmar que abre `paypal.com` no domínio live (sem `sandbox.`).
4. **Pagamento**: completar com cartão real (valor mínimo, R$ 1.700).
5. **Retorno**: PayPal redireciona pra `/departamento-ativo/comercial`.
6. **Verificar no banco** (via read_query):
   ```sql
   select id, user_id, status, plan_id, paypal_subscription_id, created_at
   from subscriptions
   where user_id = '<user-id>'
   order by created_at desc limit 1;

   select id, user_id, agent_ids, activation_status, created_at
   from contracted_departments
   where user_id = '<user-id>'
   order by created_at desc limit 1;

   select id, amount, currency, status, provider, created_at
   from payment_history
   where user_id = '<user-id>'
   order by created_at desc limit 1;
   ```
7. **Webhook**: em `supabase functions logs paypal-webhook --limit 20`, confirmar recebimento de `BILLING.SUBSCRIPTION.ACTIVATED`.
8. **Cancelar**: no PayPal → cancelar subscription → verificar `subscriptions.status = 'cancelled'` em ≤2min.
9. **Reembolso** (opcional, se emitir): confirmar `payment_history.status = 'refunded'`.

## Critérios de aprovação
- [ ] Redirect abre em `paypal.com` (não sandbox).
- [ ] Após pagamento, usuário chega em `/departamento-ativo/:slug` com créditos aplicados.
- [ ] Row em `subscriptions` com `paypal_subscription_id` preenchido.
- [ ] Row em `contracted_departments` com `activation_status = 'active'`.
- [ ] Row em `payment_history` com `status = 'completed'`.
- [ ] Webhook confirmado nos logs em ≤60s após a compra.
- [ ] Cancelamento propaga em ≤2min.

## Falhas conhecidas para monitorar
- Se `paypal-webhook` retornar 401: `PAYPAL_WEBHOOK_ID` não configurado ou signature verification falhou — ativar temporariamente log de payload cru.
- Se `contracted_departments` não gerar row: trigger `on_subscription_activated` provavelmente não disparou — checar `subscriptions` insert path.
- Se `agent_ids` vier `[]`: mapping de plano → agentes ausente em `credit_plans.agent_slugs`.

## Rollback
Se qualquer critério falhar, desativar botão "Contratar" via feature flag antes de abrir o beta pago (setar `VITE_PAYMENTS_ENABLED=false` no `.env` local + rebuild).
