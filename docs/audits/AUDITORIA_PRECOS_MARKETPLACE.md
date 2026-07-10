# Auditoria de Preços — Marketplace de Agentes Clauthor
**Data:** 08/07/2026 · **Escopo:** `src/lib/pricing.ts` + `src/data/libraryAgentData.ts` (`agentPriceTiers`)

---

## 1. Estrutura atual (por agente/mês)

| Tier | USD (en/es) | BRL (pt) | EUR | Nº de agentes |
|---|---|---|---|---|
| starter | $59 | R$345 | €49 | ~11 |
| entry | $139 | R$697 | €119 | ~9 |
| mid | $197 | R$997 | €179 | ~45 |
| high | $297 | R$1.297 | €269 | ~5 |
| premium | $497 | R$2.497 | €449 | ~5 |

Departamentos (após ajuste Parte 6): Tech $299 · Sales/Finance $199 · Marketing $149 · Support $79.

---

## 2. Custos reais por execução (LLM base)

Modelagem com Claude Sonnet 4 ($3/M input · $15/M output) — hipótese conservadora de 4k input + 1k output por ação = **$0,027/ação**.

| Volume mensal | Custo LLM | Break-even |
|---|---|---|
| 500 ações | $13,5 | $22 (60% margem) |
| 2.000 ações | $54 | $90 (60% margem) |
| 5.000 ações | $135 | $225 (60% margem) |
| 12.000 ações | **$324** | $540 (60% margem) |

> Se o agente rodar via Lovable AI Gateway com Gemini 2.5 Flash ($0.075/M input · $0.30/M output), o custo cai para ~$0,0003/ação — margem >99%. **O problema aparece quando o agente é forçado a usar modelos premium (Claude/GPT-5) e/ou APIs externas pagas.**

---

## 3. Custos de APIs externas (impacto por agente)

| Agente(s) | Integração | Custo típico | Impacto no tier |
|---|---|---|---|
| `voice_ai`, `voice_support` | ElevenLabs TTS/STT | $0,18–0,30/min → 200 min = **$36–60** | premium $497 → margem cai de 95% para **~80%** ✅ |
| `hunter_linkedin`, `sdr_linkedin` | PhantomBuster/Unipile | $69–299/mês (fixo) | mid $197 → **margem 0–65%** ⚠️ |
| `whatsapp_commerce`, `omnichannel` | WhatsApp Cloud API | $0,005–0,08/conv × 5k = $25–400 | mid $197 → margem variável ⚠️ |
| `paid_traffic`, `seo_growth` | Meta/Google Ads API + SEMrush | SEMrush $140/mo + gateway calls | mid $197 → **margem -20% a 30%** 🔴 |
| `research` | Firecrawl + Perplexity | $50–100/mo em uso médio | mid $197 → margem 50–75% ✅ |
| `content`, `creative_design` | GPT-image + Runway/Kling | $0,04/img × 500 = $20 | entry $139 → margem 85% ✅ |
| `legal`, `lex_guardian` | DJEN + OCR + ClickSign | ClickSign $99/mo + storage | mid $197 → margem 40% ⚠️ |
| `computer` | Browser Use / Anthropic Computer Use | $0,10–0,50/tarefa × 200 = $20–100 | high $297 → margem 65–95% ✅ |
| `security`, `ai_cfo`, `ceo` | Sem API externa cara | ~só LLM | premium $497 → margem 95%+ ✅ |

---

## 4. Diagnóstico

### 🔴 Underpriced (risco de margem negativa)
1. **`hunter_linkedin` / `sdr_linkedin` / `sdr_outbound` (mid $197)** — PhantomBuster/Unipile fixos comem >35% da receita antes do LLM. **Recomendado: subir para `high` ($297)** ou criar tier "hunter" com add-on de conta LinkedIn.
2. **`paid_traffic` (mid $197)** — SEMrush + Meta/Google APIs + LLM premium. **Recomendado: `high` ($297)**.
3. **`voice_ai` / `voice_support` (premium $497 e mid $197)** — voice_support em `mid` com ElevenLabs é insustentável em uso médio. **Recomendado: mover `voice_support` para `high` ($297)**.
4. **`legal` / `contract_analyst` / `lex_guardian` (mid $197)** — DJEN + ClickSign + OCR. **`legal` já está `high` ✅**, mas `contract_analyst` e `lex_guardian` deveriam subir para `high`.

### 🟡 Preço competitivo mas com risco
- **`omnichannel` / `whatsapp_commerce` / `support_channel` (mid $197)** — margem depende de volume. Recomendado: **quota de 3.000 conversas incluídas**, excedente cobrado como pacote (evita erosão).
- **`coding` / `computer` (high $297)** — competitivo vs. Cursor ($20) e Devin ($500), mas com Computer Use da Anthropic o custo por task é alto. Manter, monitorar uso.

### 🟢 Bem precificados
- **`ceo`, `orchestrator`, `security`, `ai_cfo` (premium $497)** — puro LLM, margem 95%+.
- **`content`, `copywriting`, `creative_writer` (entry $139)** — apenas LLM + imagem barata.
- **Starter tier ($59)** — funciona como isca de conversão; margem ok se limitado a 500 ações/mês.

### 📊 Benchmark competitivo (mesma faixa)
| Concorrente | Preço | Comparativo Clauthor |
|---|---|---|
| Zapier AI Actions | $19–$99/mo | Clauthor starter $59 ✅ |
| CrewAI Enterprise | Custom $500+ | Clauthor premium $497 ✅ |
| Relevance AI | $19–$599 | Clauthor cobre toda faixa ✅ |
| Lindy.ai | $49–$299 | Alinhado ✅ |
| 11x.ai (SDR) | **$1.500/mo** por SDR | Clauthor hunter $197 **muito abaixo** 🔴 |
| Ada (support) | $2.000+/mo | Clauthor support_lead $197 abaixo 🟡 |

**Insight:** para SDR/Sales agents com integração externa, o mercado paga 3–7× mais do que estamos cobrando.

---

## 5. Recomendações práticas (ordem de prioridade)

### P1 — Corrigir margem negativa (implementar agora)
```ts
// src/data/libraryAgentData.ts — agentPriceTiers
hunter_linkedin: "high",      // era mid
sdr_linkedin: "high",         // era mid
sdr_outbound: "high",         // era mid
paid_traffic: "high",         // era mid
voice_support: "high",        // era mid
contract_analyst: "high",     // era mid
lex_guardian: "high",         // era mid
```
Impacto: +$100/agente/mês em 7 agentes de alto custo → cobre APIs externas.

### P2 — Adicionar tier "hunter" ($397/mo)
Agentes com dependência LinkedIn/PhantomBuster ficam num tier próprio com **conta técnica inclusa** ou add-on de $69/mo para BYO conta.

### P3 — Metered billing por ação
Todo agente ≥ `mid` deve ter cota mensal declarada (ex: 3.000 ações) e cobrar excedente via tokenPacks já existentes em `regionalPricing`. Elimina risco de whale user destruir margem.

### P4 — Ajuste de departamentos (Parte 6)
Support $79 é agressivo — só sustenta com Gemini Flash Lite e cota estrita de 12k ações. Sugerido: **$99/mês** (R$500) para ficar em linha com custo de multi-agente.

### P5 — Comunicar valor, não preço
Landing/library devem exibir **ROI vs. salário CLT** (já existe em `ROICalculator.tsx`) em todos os cards `mid+`. Reduz sensibilidade a preço absoluto.

---

## 6. Modelo financeiro sugerido (unidade)

| Tier | Preço | Cota ações | Custo médio | Margem alvo |
|---|---|---|---|---|
| starter | $59 | 500 | $13 | 78% |
| entry | $139 | 1.500 | $40 | 71% |
| mid | $197 | 3.000 | $81 | **59%** ← subir cota ou preço |
| high | $297 | 5.000 | $135 | 55% |
| premium | $497 | 8.000 | $216 | 57% |
| **hunter** (novo) | **$397** | 3.000 + 500 leads | $150 (inclui PB) | 62% |

Meta corporativa: **manter margem bruta ≥ 60% em todos os tiers** (padrão SaaS Rule of 40 saudável).

---

## 7. Próximos passos (para o time)

- [ ] Aplicar reclassificações P1 em `agentPriceTiers` (14 linhas)
- [ ] Criar tier `hunter` em `PriceTier` + `regionalPricing.*` para 8 moedas
- [ ] Instrumentar contagem de ações por agente (`log-agent-activity` já existe → agregar em `agent_usage_monthly`)
- [ ] Adicionar hard-cap por tenant (bloqueio a 120% da cota) em `check_rate_limit`
- [ ] Rodar `credits--get_credit_balance` semanalmente para validar margem real vs. modelada
