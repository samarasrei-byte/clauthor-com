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

## Opacidade mínima (WCAG AA)

Para garantir contraste de texto ≥4.5:1 sobre `bg-background` (light/dark) e `surface-1/2`, aplique estes limites mínimos de opacidade em qualquer classe de cor de texto:

| Contexto | Classe mínima | Racional |
|---|---|---|
| Corpo, botões, labels ativos | `text-foreground` / `text-white` (100%) | Contraste ~13:1 |
| Texto secundário, subtítulos, timestamps | `text-muted-foreground` (100%) ou `text-white/70` | ≥5.5:1 sobre dark |
| Terciário (metadados, hints, prefixos `›`) | `text-white/65` · `text-muted-foreground/65` | ≥4.5:1 · AA para 14px+ |
| **Nunca abaixo de** | `/60` para texto pequeno · `/50` só para display ≥24px bold | `<4.5:1` reprova AA |
| Placeholders de input | `placeholder:text-muted-foreground/60` | ≥3:1 (SC 1.4.11 UI) |
| Ícones decorativos (não semânticos) | `opacity-40` OK | Não são texto |
| Estado disabled | `disabled:opacity-60` (não texto/40) | Legibilidade + affordance |

### Regra prática

- **Proibido em texto**: `text-*/30`, `text-*/40`, `placeholder:*/20-40`.
- **Permitido apenas em texto ≥ 24px semibold sobre fundo com alto contraste**: `text-*/50`.
- **Preferido**: use tokens semânticos cheios (`text-muted-foreground`) e reserve opacidade só para hierarquia de terceiro nível.

### Auditoria

Rode antes de merge:

```bash
rg "text-(white|foreground|muted-foreground)/(30|40|50)\b" src/components/dashboard/ src/pages/
```

Zero matches = pronto para deploy.
