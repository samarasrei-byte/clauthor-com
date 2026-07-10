# Auditoria Crítica — Pré-Lançamento Clauthor

Data: 18/06/2026  
Escopo: Página `/dashboard` → Rede Neural + visão geral da plataforma  
Postura: Crítica máxima ("o mais crítico do mundo"). Bloqueadores marcados com 🔴.

---

## 1. O que foi corrigido nesta passagem

- **Rede Neural traduzida para PT-BR**: título (`REDE NEURAL`), subtítulo, KPIs (Agentes / Squads / Deptos), legenda (Departamentos), painel do agente (Depto / Online — Pronto) e nomes dos departamentos via mapa `DEPT_PT`.
- **Nomes dos agentes**: aplicado tradutor `ptAgent()` com glossário de cargos (Manager→Gerente, Specialist→Especialista, Writer→Redator, etc.) no rótulo 3D e no painel lateral. Não altera os dados-fonte (`workforceArchitecture.ts`) para não impactar Pitch, Library, Dashboard.

---

## 2. Bloqueadores de lançamento 🔴

| # | Item | Risco | Recomendação |
|---|------|-------|--------------|
| 1 | **208 agentes anunciados x execução real**: a Rede Neural mostra 208 agentes, mas apenas uma fração tem edge function / prompt ativo. | Promessa enganosa → CDC art. 37. | Marcar agentes não operacionais como "Roadmap" no card, ou reduzir contagem ao que executa. |
| 2 | **Glossário PT incompleto**: o `ptAgent()` cobre ~60 termos; nomes compostos (ex.: "RevOps Architect", "Lifecycle Marketing Lead") aparecerão parcialmente em inglês. | UX inconsistente para o público brasileiro. | Migrar `workforceArchitecture.ts` para PT na fonte (fase 2) ou expandir glossário. |
| 3 | **Sem i18n real** na página (strings hard-coded). | Não escalável para inglês/espanhol prometidos no site. | Mover textos para `i18n/locales/*.json` antes do lançamento internacional. |
| 4 | **Performance 3D**: 208 nós + 56 squads + 300 partículas + autoRotate em `Canvas` sem `frameloop="demand"`. Em notebooks fracos derruba FPS < 20. | Usuário em demo trava. | Adicionar `<PerformanceMonitor>` do drei e degradar para 2D quando FPS < 30. |
| 5 | **Sem fallback acessível**: a topologia é 100% canvas WebGL, sem versão tabular para leitores de tela. | WCAG 2.1 AA reprovado. | Adicionar `<table>` visível por `prefers-reduced-motion` ou toggle "Ver lista". |

## 3. Riscos Altos 🟠

- **Vazamento visual de departamento "Advocacia"** misturado com vertical SaaS — confunde o ICP. Considerar esconder verticais nichadas atrás de toggle.
- **`agent.slug` exposto no painel** (ex.: `content_strategist`). Útil para dev, ruim para cliente final. Esconder ou rotular como "ID interno".
- **`Math.random()` no `useMemo` de layout** sem seed → toda re-renderização reposiciona agentes verticalmente (`dy`). Causa "tremida" perceptível.
- **Sem telemetria**: nenhum `track()` em clique de departamento/agente. Impossível medir engajamento da feature mais cara da home logada.
- **Botão "Novo Agente" e "Biblioteca"** no header da Rede Neural não estão `aria-label` definidos.

## 4. Riscos Médios 🟡

- O badge "PRO" em "FERRAMENTAS AVANÇADAS" não tem tooltip explicando o que destrava — fricção pré-compra.
- `DEPT_COLORS` tem chaves obsoletas (`hr`, `legal`, `executive`) que nunca casam com `dept.id` atual → tudo cai no cinza `#888`. Os agentes "cinzas" no print são bug, não design.
- Painel do agente mostra "Online — Pronto" mesmo para agentes sem credencial conectada. Falso-positivo.
- A contagem `56 Squads` no header não bate com `WORKFORCE.reduce(... squads.length)` em ambientes onde o usuário tem squads custom (sobrepõe sem somar).

## 5. Conformidade / Jurídico

- **LGPD**: a tela não trata PII, ok. Mas se o cliente clicar em "Advocacia" e cair em fluxo com dado de cliente, faltam selos de "Dados criptografados" reaproveitando o componente já existente em `/advocacia`.
- **Marca**: usar "Workforce de IA" como subtítulo é seguro; evitar "AI employees" em qualquer copy futura (risco trabalhista interpretativo).
- **Termos**: link para `/terms` e `/privacy` não está acessível dentro do dashboard logado — adicionar no footer do `AppLayout`.

## 6. Recomendação final

**NÃO LANÇAR** até resolver os itens 1, 4 e 5 do bloco 🔴. Os demais podem virar issues pós-launch desde que o item 1 (alinhamento entre "208 agentes" anunciados e operacionais) seja resolvido — é o único de risco reputacional/jurídico.

Tempo estimado para destravar bloqueadores: **6–10h de engenharia + 2h de copy/legal review.**
