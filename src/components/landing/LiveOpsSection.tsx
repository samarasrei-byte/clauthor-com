/**
 * LiveOpsSection · prova de vida da operação Clauthor.
 * Estilo Apple: preto puro, tipografia sans limpa, alto contraste.
 */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import LiveOpsCounter from "./live-ops/LiveOpsCounter";
import LiveOpsFeed from "./live-ops/LiveOpsFeed";
import LiveOpsCases from "./live-ops/LiveOpsCases";

export default function LiveOpsSection() {
  return (
    <section
      className="relative overflow-hidden bg-black text-white"
      aria-label="Prova de vida da operação Clauthor"
    >
      <div className="relative max-w-6xl mx-auto px-6 py-24 sm:py-32 space-y-20">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50 mb-6">
            A Clauthor operando agora
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.035em] leading-[1.02] text-white mb-6">
            Isso não é promessa. Está rodando enquanto você lê.
          </h2>
          <p className="text-lg text-white/60 max-w-xl leading-relaxed">
            Enquanto times humanos dormem, os agentes qualificam leads, respondem clientes, publicam
            campanhas e fecham o financeiro.
          </p>
        </div>

        {/* Camada 1 · contadores */}
        <LiveOpsCounter />

        {/* Camada 2 · feed */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">
              Feed operacional
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-[-0.02em] leading-tight">
              20 departamentos. Um único cérebro.
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Cada linha do feed ao lado é o tipo de output que sua operação começa a produzir
              a partir do dia 1.
            </p>
          </div>
          <div className="lg:col-span-3">
            <LiveOpsFeed />
          </div>
        </div>

        {/* Camada 3 · casos */}
        <div className="pt-8 border-t border-white/10">
          <div className="mb-10 max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/50 mb-3">
              Resultado auditável
            </p>
            <h3 className="font-display text-3xl sm:text-4xl font-semibold text-white tracking-[-0.025em] leading-tight">
              Números que já saíram do CRM dos nossos clientes.
            </h3>
          </div>
          <LiveOpsCases />
        </div>

        {/* CTA final */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-8 border-t border-white/10">
          <p className="text-lg text-white/70 max-w-md">
            Pronto para ver a Clauthor rodando na sua operação?
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/departamentos"
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Ver departamentos
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/thor-concierge"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 text-white px-6 py-3 text-sm font-medium hover:bg-white/5 transition-colors"
            >
              Falar com Thor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
