# Dashboard Typography · Mission Control tier

Padrão premium aplicado a todos os cards da dobra principal do painel.
Use as **utilities globais** em `src/index.css` em vez de recriar stacks Tailwind ad-hoc.

## Utilities

| Classe          | Uso                                          | Specs                                                  |
| --------------- | -------------------------------------------- | ------------------------------------------------------ |
| `.dash-eyebrow` | Kicker acima do título da seção              | 10px · 600 · tracking `0.2em` · uppercase · muted      |
| `.dash-title`   | Título de card / painel                      | Inter · 600 · tracking `-0.015em` · line-height 1.2    |
| `.dash-kpi`     | Valor numérico principal (ROI, MRR, etc.)    | Inter · 600 · `tabular-nums` · tracking `-0.02em`      |
| `.dash-label`   | Rótulos secundários / captions               | 11px · 500 · tracking `0.02em` · muted                 |

Tamanho fica a critério do card (`text-xl`, `text-3xl`, `text-5xl`) — as utilities
carregam apenas peso, tracking, line-height e cor semântica.

## Exemplo

```tsx
<div>
  <p className="dash-eyebrow">ROI do mês</p>
  <h3 className="dash-title text-lg">Missões concluídas</h3>
  <p className="dash-kpi text-4xl">R$ 128.400</p>
  <p className="dash-label">vs. R$ 92.100 no mês anterior</p>
</div>
```

## Regras

1. **Nunca** usar `font-serif` ou cursivas no painel — só Inter.
2. **KPIs sempre** com `.dash-kpi` (tabular-nums impede jitter em contadores).
3. **Eyebrows** existem para dar hierarquia — não abuse (máx. 1 por card).
4. Cores vêm de tokens semânticos (`--foreground`, `--muted-foreground`),
   nunca `text-white` / `text-black`.

## Cards já migrados

- `HeroBriefing.tsx`
- `MonthlyROICard.tsx`
- `NextStepsCard.tsx`
- `FirstDeliveryCard.tsx`
- `WowKpiCard.tsx`
- `KpiStrip.tsx`
- `AnalyticsSection.tsx`
- `DeliverablesHub.tsx`
- `AgentLiveTimeline.tsx`
- `ExecutionResultsPanel.tsx`

Novos cards do painel devem seguir o mesmo padrão.

## Breadcrumb contextual actions

O shell renderiza um slot à direita do breadcrumb (`<div id="dash-breadcrumb-actions">`).
Qualquer página do painel pode injetar botões contextuais nele via portal:

```tsx
import { BreadcrumbActions } from "@/components/dashboard/DashboardBreadcrumb";
import { Button } from "@/components/ui/button";

export default function VideoStudioPage() {
  return (
    <>
      <BreadcrumbActions>
        <Button size="sm" variant="outline">Nova cena</Button>
        <Button size="sm">Publicar</Button>
      </BreadcrumbActions>
      {/* resto da página */}
    </>
  );
}
```

Regras:
1. Máximo **2 ações** — reserve espaço para o breadcrumb em telas pequenas.
2. Use `size="sm"` sempre — o slot é 32px de altura.
3. Ação primária à direita, secundária à esquerda.
