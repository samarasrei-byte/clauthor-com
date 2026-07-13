/**
 * Fallback outputs pré-gerados por categoria · usados quando a Edge Function
 * falha, dá timeout ou o usuário está offline. Garante que ninguém saia do
 * InstantWow sem ver um "uau".
 */
import type { PainCategory } from "@/lib/wow-router";

export const WOW_FALLBACKS: Record<PainCategory, (company: string) => string> = {
  vendas_b2b: (company) => `**Assunto:** ${company}, 3 minutos podem mudar seu Q1

Oi [Nome],

Notei que a ${company} está crescendo · parabéns. Trabalho com times comerciais parecidos e um padrão se repete: leads bons somem no meio do funil por falta de cadência.

Nas últimas 4 semanas, ajudei 3 empresas do seu porte a recuperar 22% do pipeline "esquecido" com uma sequência simples de 5 toques.

Faz sentido 15min essa semana? Se sim, respondo com 2 horários.

Abraço,
[Seu nome]`,
  juridico: (company) => `**MINUTA · ACORDO DE CONFIDENCIALIDADE (NDA)**

**Partes:** ${company} ("Divulgadora") e [INSERIR CONTRAPARTE] ("Receptora").

**1. Objeto.** Proteger informações confidenciais compartilhadas para fins de [INSERIR FINALIDADE].

**2. Confidencialidade.** A Receptora se compromete a manter sigilo absoluto e não divulgar informações a terceiros sem consentimento escrito.

**3. Prazo.** 24 meses a partir da assinatura, prorrogável.

**4. Multa.** Descumprimento gera multa de R$ [INSERIR VALOR] + perdas e danos.

**5. Foro.** Comarca de [INSERIR CIDADE].

_[INSERIR CIDADE], [INSERIR DATA]_
_Documento gerado para revisão do advogado._`,
  marketing: (company) => `**3 Headlines para ${company}:**

1. O jeito antigo de vender já não funciona · descubra o que mudou em 2026.
2. ${company}: chega de posts que ninguém vê. Sua audiência está pronta.
3. 15 minutos por dia. 3x mais leads qualificados. Sem ads.

**Post LinkedIn:**

Ninguém compra mais pelo feed. E mesmo assim, sua empresa continua postando.

Eu passei 6 meses estudando o que faz um post B2B converter em 2026, e o padrão é claro: quem escreve pra 1 pessoa específica vende. Quem escreve pra "o mercado" some.

Na ${company}, começamos essa mudança e o engajamento dobrou em 21 dias · sem aumentar budget.

Se você trabalha com marketing B2B e quer entender o método, comenta "quero" que te mando o passo-a-passo. 👇`,
  operacoes: (company) => `**Objetivo:** Reduzir retrabalho operacional em ${company} em 30 dias.

**Passo 1:** Mapeie os 3 processos que mais consomem tempo da equipe (usar planilha de tracking de 1 semana).

**Passo 2:** Para cada processo, identifique o gargalo (aprovação, dado faltante, handoff manual).

**Passo 3:** Elimine 1 etapa desnecessária ou automatize com ferramenta simples (Zapier/Make/n8n).

**Passo 4:** Documente o novo fluxo em Loom (5min) + Notion.

**Passo 5:** Rode piloto por 2 semanas, meça tempo economizado, expanda.

**Métrica de sucesso:** −20% de tempo gasto nos processos-alvo em 30 dias.`,
  financeiro: (company) => `**Diagnóstico:** Empresas do porte de ${company} costumam ter caixa apertado não por falta de receita, mas por descasamento entre entradas e saídas. O sintoma mais comum: DRE positiva + conta no vermelho.

**3 Recomendações:**

- **Fluxo de caixa semanal (13 semanas):** projete entradas e saídas por semana, atualize toda segunda. Identifica crises 8 semanas antes.
- **Renegocie prazos:** clientes pra 15 dias, fornecedores pra 45 dias. Ganho de 30 dias de caixa sem novo empréstimo.
- **Corte 20% do que não escala:** SaaS não usado, freelas recorrentes sem KPI, benefícios genéricos.

**Alerta de risco:** se runway < 4 meses, congele qualquer contratação e priorize colecionar recebíveis.`,
  outro: (company) => `**Plano de ação para ${company}:**

**Ponto 1: Diagnóstico honesto** · liste em 1 página o que está funcionando e o que não está. Sem eufemismo.

**Ponto 2: Corte 1 iniciativa hoje** · a que consome mais tempo e entrega menos. Foco é subtração.

**Ponto 3: Escolha 1 KPI-farol** · a métrica que, se subir, tudo melhora (ex: receita recorrente, NPS, tempo de ciclo).

**Ponto 4: Ritual semanal de 30min** · mesma hora, todo início de semana, revisar o KPI-farol e 3 blockers.

**Ponto 5: Aprenda em público** · poste 1 insight por semana no LinkedIn. Marketing e recrutamento saem de graça.`,
};
