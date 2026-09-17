import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowRight, Menu, MessageSquarePlus, PanelLeftClose, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import ClauthorLogo from "@/components/ClauthorLogo";
import { useAuth } from "@/hooks/useAuth";

const ThorConciergeChat = lazy(() => import("@/components/landing/ThorConciergeChat"));

const STARTERS = [
  "Quero gerar mais leads qualificados",
  "Preciso melhorar meu atendimento",
  "Quero automatizar tarefas repetitivas",
  "Ainda não sei por onde começar",
];

const CHAT_HISTORY = [
  "Diagnóstico da minha empresa",
  "Como automatizar o atendimento",
  "Estratégia para gerar leads",
];

const ChatSkeleton = () => (
  <div className="h-[520px] w-full animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" aria-label="Carregando conversa" />
);

const Index = () => {
  const { user } = useAuth();
  const [seedPrompt, setSeedPrompt] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = "Clauthor | Converse com o Thor";
    const description = "Converse com o Thor para entender qual solução de IA faz sentido para sua empresa.";
    const meta = document.querySelector('meta[name="description"]') ?? document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", description);
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  const startConversation = (prompt: string) => {
    setSeedPrompt(prompt);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-dvh bg-[#080808] text-[#f4f4f4]">
      <div className="flex min-h-dvh">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/[0.07] bg-[#111111] p-3 transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Conversas"
        >
          <div className="flex items-center justify-between px-2 py-2">
            <Link to="/" aria-label="Página inicial">
              <ClauthorLogo size="md" />
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-white/55 hover:bg-white/[0.06] hover:text-white lg:hidden"
              aria-label="Fechar menu"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-3 text-left text-sm text-white/85 transition-colors hover:bg-white/[0.06]"
          >
            <MessageSquarePlus className="h-4 w-4" />
            Nova conversa
          </button>

          <div className="mt-7 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/35">
            Conversas recentes
          </div>
          <nav className="mt-2 space-y-1" aria-label="Histórico de exemplo">
            {CHAT_HISTORY.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => startConversation(item)}
                className="block w-full truncate rounded-lg px-3 py-2.5 text-left text-[13px] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white/90"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/[0.07] pt-3">
            <Link
              to={user ? "/dashboard" : "/auth"}
              className="flex min-h-11 items-center justify-between rounded-xl px-3 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <span>{user ? "Abrir meu painel" : "Entrar na Clauthor"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="relative flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-white/60 hover:bg-white/[0.06] hover:text-white lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-sm text-white/55 lg:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Thor disponível
            </div>
            <div className="ml-auto flex items-center gap-2">
              {!user && (
                <Link to="/auth" className="rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/[0.06] hover:text-white">
                  Entrar
                </Link>
              )}
              <Link
                to={user ? "/dashboard" : "/auth"}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/90"
              >
                {user ? "Abrir painel" : "Criar conta"}
              </Link>
            </div>
          </header>

          <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-8 pt-8 sm:px-6 sm:pt-12" aria-labelledby="chat-title">
            <div className="mb-7 text-center sm:mb-9">
              <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.055]">
                <Sparkles className="h-5 w-5 text-[#ef3340]" />
              </div>
              <h1 id="chat-title" className="text-balance text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
                Como posso ajudar sua empresa hoje?
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/45 sm:text-[15px]">
                Conte seu objetivo ou problema. O Thor analisa o contexto e indica o próximo passo.
              </p>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STARTERS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => startConversation(prompt)}
                  className="group flex min-h-[46px] items-center justify-between rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 text-left text-[13px] text-white/65 transition-all hover:border-white/20 hover:bg-white/[0.055] hover:text-white"
                >
                  <span>{prompt}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1">
              <Suspense fallback={<ChatSkeleton />}>
                <ThorConciergeChat
                  source="landing"
                  minHeight="min-h-[280px] sm:min-h-[340px]"
                  seedPrompt={seedPrompt}
                  className="border-white/[0.09] bg-[#111111] shadow-[0_24px_80px_rgba(0,0,0,0.35)] [&>header]:bg-transparent [&>footer]:bg-transparent"
                />
              </Suspense>
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-white/30">
              Resposta automática. Confirme informações importantes antes de tomar uma decisão.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
