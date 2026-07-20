import { Card } from "@/components/ui/card";
import { Plug, Zap, Key, Bot, Clock } from "lucide-react";
import {
  STATUS_META,
  getIntegrationsForDepartment,
  summarizeIntegrations,
  type IntegrationStatus,
} from "@/data/integrationMatrix";

const STATUS_ICON: Record<IntegrationStatus, typeof Zap> = {
  oauth: Zap,
  api_key: Key,
  scraping: Bot,
  roadmap: Clock,
};

interface Props {
  departmentId: string;
  /** Quando true, renderiza no formato compacto (usado no checkout). */
  compact?: boolean;
}

/**
 * Mostra a matriz de integrações de um departamento com transparência total:
 * o cliente vê ANTES de pagar exatamente o que ele vai precisar conectar
 * (1-clique, colar API, automático) e o que ainda está no roadmap.
 */
export default function IntegrationMatrix({ departmentId, compact = false }: Props) {
  const items = getIntegrationsForDepartment(departmentId);
  if (items.length === 0) return null;

  const counts = summarizeIntegrations(items);

  return (
    <Card className="p-6 bg-white/[0.02] border-white/10 rounded-2xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/40 font-medium">
            <Plug className="w-4 h-4" /> Integrações necessárias
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">
            O que os agentes precisam para operar
          </h3>
          <p className="text-sm text-white/50 mt-1 max-w-xl">
            Transparência antes da compra · você vê exatamente o que vai conectar.
            A maioria é 1-clique; nenhuma integração exige código.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          {(Object.keys(counts) as IntegrationStatus[])
            .filter((k) => counts[k] > 0)
            .map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/10 bg-white/[0.03]"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[k].dot}`} />
                <span className="text-white/70">
                  {counts[k]} {STATUS_META[k].label.toLowerCase()}
                </span>
              </span>
            ))}
        </div>
      </div>

      <ul className={`mt-5 grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        {items.map((item) => {
          const meta = STATUS_META[item.status];
          const Icon = STATUS_ICON[item.status];
          return (
            <li
              key={item.name}
              className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.015]"
            >
              <div className="mt-0.5 w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center shrink-0">
                <Icon className={`w-4 h-4 ${meta.tone}`} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white truncate">{item.name}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider ${meta.tone}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
                <p className="text-xs text-white/55 mt-0.5 leading-relaxed">{item.purpose}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px] text-white/50">
        {(Object.keys(STATUS_META) as IntegrationStatus[]).map((k) => (
          <div key={k} className="flex items-start gap-2">
            <span className={`mt-1 w-1.5 h-1.5 rounded-full ${STATUS_META[k].dot} shrink-0`} />
            <div>
              <div className={`font-medium ${STATUS_META[k].tone}`}>{STATUS_META[k].label}</div>
              <div>{STATUS_META[k].description}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
