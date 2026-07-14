/**
 * LiveOpsSection · prova de vida da operação Clauthor.
 *
 * Três camadas de prova, do mais abstrato ao mais concreto:
 *  1. Contadores subindo em tempo real (escala)
 *  2. Feed de outputs dos agentes (atividade)
 *  3. Casos reais com métrica auditável (resultado)
 */
import LiveOpsCounter from "./live-ops/LiveOpsCounter";
import LiveOpsFeed from "./live-ops/LiveOpsFeed";
import LiveOpsCases from "./live-ops/LiveOpsCases";

export default function LiveOpsSection() {
  return (
    <section
      className="relative overflow-hidden bg-foreground text-background"
      aria-label="Prova de vida da operação Clauthor"
    >
      {/* Glow de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-primary/[0.06] blur-[140px]"
      />

      <div className="relative max-w-6xl mx-auto px-6 py-24 sm:py-32 space-y-16">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary/85 mb-4">
            A Clauthor operando agora
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-white mb-6">
            Isso não é promessa.{" "}
            <span className="font-serif italic text-white/60">Está rodando enquanto você lê.</span>
          </h2>
          <p className="text-lg text-white/60 max-w-xl">
            Enquanto times humanos dormem, os agentes qualificam leads, respondem clientes, publicam
            campanhas e fecham o financeiro. Aqui vai o que está acontecendo agora.
          </p>
        </div>

        {/* Camada 1 · contadores */}
        <LiveOpsCounter />

        {/* Camada 2 · feed */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-primary/85">
              Feed operacional
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight">
              20 departamentos.{" "}
              <span className="font-serif italic text-white/60">Um único cérebro.</span>
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Cada linha do feed ao lado é o tipo de output que sua operação começa a produzir
              a partir do dia 1. Anonimizado para preservar privacidade, o padrão é real.
            </p>
          </div>
          <div className="lg:col-span-3">
            <LiveOpsFeed />
          </div>
        </div>

        {/* Camada 3 · casos */}
        <div className="pt-8 border-t border-white/10">
          <div className="mb-10 max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.22em] text-primary/85 mb-3">
              Resultado auditável
            </p>
            <h3 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-tight">
              Números que já saíram do CRM dos nossos clientes.
            </h3>
          </div>
          <LiveOpsCases />
        </div>
      </div>
    </section>
  );
}
