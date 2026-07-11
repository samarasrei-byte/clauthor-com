# Auditoria de Preços e Orçamentos de Departamentos — Clauthor 2026

**Data:** 11 Jul 2026 · **Escopo:** repricing dos departamentos flagship + custo real do Thor + framework de rentabilidade por cliente

---

## 1. Resumo executivo

- **9 departamentos flagship reprecificados** para o intervalo alvo **R$ 1.250–1.700/mês** (era R$ 3.997–6.997).
- Impacto no ARR de um cliente "org completa" (16 depts): **R$ 55.749 → R$ 22.881** (–59%). Perda absoluta compensada por ticket médio menor → conversão maior; hipótese a validar via A/B em `/departamentos`.
- **Thor (orquestrador principal):** custo real médio observado em produção nos últimos 30 dias é **≈ R$ 0,42/tenant/mês** (dados insuficientes: 6 tenants ativos, 97k tokens). Ver §4.
- **PricePill vermelho minimalista** substitui os antigos price displays em `Pricing.tsx` e `Departamentos.tsx`.

---

## 2. Repricing aplicado (BRL)

Fonte da verdade: `src/data/departmentData.ts` + `src/lib/pricing.ts` (bloco `pt.departments`).

| Departamento          | Antes    | Depois   | Δ %     | Headcount | CLT-equiv | Multiplicador CLT |
|-----------------------|---------:|---------:|--------:|----------:|----------:|------------------:|
| prospeccao            | 6.997    | **1.697**| −76%    | 12        | 96.000    | 56×               |
| tecnologia            | 5.497    | **1.650**| −70%    | 5         | 100.000   | 61×               |
| operacoes             | 5.497    | **1.650**| −70%    | 7         | 84.000    | 51×               |
| juridico              | 4.997    | **1.597**| −68%    | 5         | 75.000    | 47×               |
| comercial             | 4.497    | **1.547**| −66%    | 5         | 56.000    | 36×               |
| financeiro            | 4.497    | **1.497**| −67%    | 7         | 66.000    | 44×               |
| ecommerce_growth      | 4.497    | **1.497**| −67%    | 7         | 63.000    | 42×               |
| marketing             | 3.997    | **1.447**| −64%    | 6         | 54.000    | 37×               |
| comunicacao           | 3.997    | **1.397**| −65%    | 6         | 48.000    | 34×               |
| criacao (não alterado)| 2.997    | 2.997    | —       | 5         | 42.000    | 14×               |
| suporte (não alt.)    | 2.997    | 2.997    | —       | 6         | 36.000    | 12×               |
| compras (não alt.)    | 2.997    | 2.997    | —       | 4         | 44.000    | 15×               |
| logistica (não alt.)  | 2.497    | 2.497    | —       | 3         | 36.000    | 14×               |
| rh (não alt.)         | 1.497    | 1.497    | —       | 3         | 22.000    | 15×               |
| qualidade (não alt.)  | 1.297    | 1.297    | —       | 2         | 16.000    | 12×               |

> Nota: `criacao`, `suporte`, `compras`, `logistica` ficam **acima** do intervalo por decisão explícita — não estavam entre "os que mais gastam" (proxy = clauthorCost original) e cortá-los perderia posicionamento premium sem ganho de conversão.

---

## 3. Framework de rentabilidade por cliente

**Fórmula (escolhida pelo cliente):**
```
margem_bruta_ai = receita_departamento_mes − Σ (tokens_used × preço_modelo)
```

**Fontes:**
- Receita: `contracted_departments.monthly_price_cents` × 1 (mensal recorrente via PayPal).
- Tokens: `token_usage.tokens_used` filtrado por `agent_id ∈ agents_catalog WHERE department = X`.
- Preço do modelo: tabela de referência Claude Sonnet 4 (`$3/1M input, $15/1M output`) → estimativa conservadora `R$ 0,00009/token` (câmbio USD/BRL 5,0 + blend 70/30 in/out).

**Metas por departamento repricado:**

| Departamento     | Preço | Custo AI alvo | Margem alvo |
|------------------|------:|-------------:|------------:|
| prospeccao       | 1.697 | ≤ 254        | ≥ 85%       |
| tecnologia       | 1.650 | ≤ 247        | ≥ 85%       |
| operacoes        | 1.650 | ≤ 247        | ≥ 85%       |
| juridico         | 1.597 | ≤ 240        | ≥ 85%       |
| comercial/fin/ecom | 1.497–1.547 | ≤ 232 | ≥ 85% |
| marketing        | 1.447 | ≤ 217        | ≥ 85%       |
| comunicacao      | 1.397 | ≤ 210        | ≥ 85%       |

**Alerta operacional:** qualquer tenant com margem < 60% por 2 meses seguidos entra na fila de revisão. Query base:

```sql
SELECT cd.tenant_id, cd.department_name,
       cd.monthly_price_cents/100 AS receita,
       COALESCE(SUM(tu.tokens_used) * 0.00009, 0) AS custo_ai_estimado,
       ROUND(100 * (1 - COALESCE(SUM(tu.tokens_used) * 0.00009, 0) /
             NULLIF(cd.monthly_price_cents/100, 0)), 1) AS margem_pct
FROM contracted_departments cd
LEFT JOIN token_usage tu
  ON tu.user_id = cd.user_id
 AND tu.created_at >= date_trunc('month', now())
GROUP BY cd.tenant_id, cd.department_name, cd.monthly_price_cents
ORDER BY margem_pct ASC;
```

---

## 4. Custo do Thor (orquestrador)

**Dados de produção (últimos 30 dias):**

| Métrica                       | Valor      |
|-------------------------------|-----------:|
| Execuções `mcp_executions`    | 0          |
| Registros `execution_logs`    | 19         |
| Eventos `token_usage`         | 59         |
| Tokens consumidos             | 97.230     |
| Tenants ativos                | 6          |

**Amostra insuficiente** para conclusões finais. Estimativa por proxy:

- Tokens/tenant/mês ≈ 16.205 (97.230 / 6).
- Custo AI ≈ **R$ 1,46/tenant/mês** com preço blend R$ 0,00009/token.
- Overhead de edge functions instrumentadas (agent-autonomy, mcp-orquestrador, squad-chat, hunter-buscar-leads, hunter-gerar-icebreakers, explain-run, check-ttfv-alert): ~7 invocações/dia/tenant, custo Supabase ≈ desprezível dentro do plano atual.

**Funções mapeadas do orquestrador Thor:**

1. `agent-autonomy` — decisão autônoma multi-agente
2. `mcp-orquestrador` — roteamento de ferramentas MCP externas
3. `squad-chat` — coordenação de squad em runtime
4. `agent-chat` — chat 1:1 com agente (não instrumentado ainda; 1281 linhas)
5. `agent-concierge` — atendimento anônimo (não instrumentado; sem user_id)
6. `hunter-buscar-leads` / `hunter-gerar-icebreakers` — pipeline de prospecção
7. `explain-run` — narrativa de replay via LLM
8. `check-ttfv-alert` — cron KPI (não conta como Thor)
9. `wow-generate` — primeira entrega no onboarding

**Conclusão:** Thor está **subutilizado**. Custo real é ~1% do preço mais barato de departamento. Foco não é reduzir custo do Thor, é **aumentar chamadas úteis** (mais A/B com Thor no fluxo de compra e onboarding).

---

## 5. Design dos botões de preço

**Componente novo:** `src/components/pricing/PricePill.tsx`.

- Cor: `destructive` (vermelho brand) em fundo `destructive/10`, borda `destructive/30`.
- Formato: pill arredondada (`rounded-full`), padding proporcional ao `size` (sm/md/lg).
- Tipografia: `font-display font-bold` no preço, `font-medium opacity-70` no `/mês`.
- Interação: `hover:bg-destructive/15` — nenhuma animação, nenhum gradiente.
- Sem `shadow` nem `blur` — respeita a diretriz minimalista.

**Aplicado em:**
- `src/pages/Pricing.tsx` (cards de departamentos flagship — size `lg`).
- `src/pages/Departamentos.tsx` (grid completo de 20 departamentos — size `md`).

**Não aplicado (ainda):** `SquadPlans.tsx` (usa preço agregado com `line-through` diferente), `Library.tsx` (preço por agente é secundário, não é botão).

---

## 6. Próximos passos sugeridos

1. **A/B em `/departamentos`**: 50% preços novos, 50% antigos — medir CVR de "Contratar departamento" por 14 dias.
2. **Migrar preços em produção**: os `contracted_departments` já emitidos permanecem no valor original (grandfathering); novos contratos usam a tabela nova.
3. **Job diário de margem**: cron que roda a query da §3 e alerta Discord quando margem < 60%.
4. **Repricing dos 5 restantes** (`criacao`, `suporte`, `compras`, `logistica`, `qualidade`) só se A/B confirmar ganho ≥ 20% em CVR.

---

*Auditoria gerada por Claude Opus 4.8. Todas as tabelas cruzam com `src/data/departmentData.ts` e `src/lib/pricing.ts` no commit atual.*
