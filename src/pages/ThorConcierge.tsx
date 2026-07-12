/**
 * Thor Concierge — Fluxo de 3 turnos que captura contexto do visitante
 * (empresa, dor, ICP) e dispara `/experience?ctx=<id>` com Mesa Redonda
 * personalizada.
 *
 * Design: fullscreen dark, uma pergunta por vez, sem hype.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackKpi } from "@/lib/kpiTracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Step = "empresa" | "dor" | "icp" | "finalizing";

interface CompanyData {
  empresa: string;
  industry: string;
  description?: string;
}

interface Lead {
  name: string;
  role: string;
  signal: string;
}

const STEP_INDEX: Record<Step, number> = {
  empresa: 1,
  dor: 2,
  icp: 3,
  finalizing: 3,
};

export default function ThorConcierge() {
  const navigate = useNavigate();
  const sessionIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  const [step, setStep] = useState<Step>("empresa");
  const [loading, setLoading] = useState(false);

  const [empresaInput, setEmpresaInput] = useState("");
  const [company, setCompany] = useState<CompanyData | null>(null);

  const [dor, setDor] = useState("");
  const [icp, setIcp] = useState("");

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    trackKpi("thor_guide_section_play", {
      source: "landing",
      section: "thor_concierge_started",
    });
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const invoke = useCallback(
    async <T,>(action: string, payload: Record<string, unknown>): Promise<T> => {
      const { data, error } = await supabase.functions.invoke("thor-concierge", {
        body: { action, ...payload },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as T;
    },
    [],
  );

  const submitEmpresa = async () => {
    const value = empresaInput.trim();
    if (value.length < 2) {
      toast.error("Me diga o site ou o nome da sua empresa.");
      return;
    }
    setLoading(true);
    try {
      const isUrl = /\./.test(value) && !value.includes(" ");
      const scan = await invoke<CompanyData>("scan_company", isUrl ? { url: value } : { text: value });
      setCompany(scan);
      trackKpi("thor_guide_section_play", {
        source: "landing",
        section: "thor_turn_company_done",
        has_site_summary: Boolean(scan.description),
      });
      setStep("dor");
    } catch (err) {
      console.error(err);
      setCompany({ empresa: value, industry: "Outro" });
      setStep("dor");
    } finally {
      setLoading(false);
    }
  };

  const submitDor = () => {
    if (dor.trim().length < 4) {
      toast.error("Descreva a dor em poucas palavras.");
      return;
    }
    trackKpi("thor_guide_section_play", {
      source: "landing",
      section: "thor_turn_pain_done",
      pain: dor.slice(0, 120),
    });
    setStep("icp");
  };

  const submitIcp = async () => {
    if (icp.trim().length < 4) {
      toast.error("Me diga quem é o cliente ideal.");
      return;
    }
    setLoading(true);
    setStep("finalizing");
    try {
      const [{ leads }, _] = await Promise.all([
        invoke<{ leads: Lead[] }>("sample_leads", {
          icp,
          industry: company?.industry,
          empresa: company?.empresa,
        }),
        Promise.resolve(),
      ]);

      const { ctx_id, dept_id } = await invoke<{ ctx_id: string; dept_id: string }>("finalize", {
        session_id: sessionIdRef.current,
        empresa: company?.empresa,
        empresa_url: /\./.test(empresaInput) ? empresaInput.trim() : undefined,
        industry: company?.industry,
        dor,
        icp,
        leads,
      });

      trackKpi("first_wow_approved", {
        source: "landing",
        section: "thor_concierge_completed",
        department_id: dept_id,
      });

      navigate(`/experience?ctx=${encodeURIComponent(ctx_id)}`);
    } catch (err) {
      console.error(err);
      toast.error("Não consegui finalizar agora. Tente novamente.");
      setLoading(false);
      setStep("icp");
    }
  };

  const progress = useMemo(() => (STEP_INDEX[step] / 3) * 100, [step]);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Progress + brand */}
      <header className="border-b border-border/40 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">Thor</span>
            <span>· concierge</span>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {STEP_INDEX[step]}/3
          </span>
        </div>
        <div className="h-0.5 bg-border/40">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl space-y-10">
          {step === "empresa" && (
            <ThorTurn
              question="Vamos começar pelo básico."
              subtitle="Qual o site ou o nome da sua empresa?"
              hint="Ex.: acme.com.br  ·  ou  ·  Clínica Odonto Recife"
            >
              <div className="flex gap-2">
                <Input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={empresaInput}
                  onChange={(e) => setEmpresaInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && submitEmpresa()}
                  placeholder="seusite.com.br"
                  className="h-14 text-lg bg-card border-border focus-visible:ring-primary"
                  disabled={loading}
                  autoComplete="off"
                />
                <SubmitButton onClick={submitEmpresa} loading={loading} />
              </div>
            </ThorTurn>
          )}

          {step === "dor" && (
            <ThorTurn
              question={`Prazer, ${company?.empresa ?? "amigo"}.`}
              subtitle="Qual a dor que mais te tira o sono hoje?"
              hint="Vendas travadas, atendimento saturado, marketing sem retorno..."
            >
              <div className="flex flex-col gap-3">
                <Textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={dor}
                  onChange={(e) => setDor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitDor();
                  }}
                  placeholder="Ex.: meu time comercial responde lead em 3 dias e a taxa de conversão está em 4%."
                  className="min-h-32 text-base bg-card border-border focus-visible:ring-primary resize-none"
                  rows={4}
                />
                <div className="flex justify-end">
                  <SubmitButton onClick={submitDor} loading={false} label="Continuar" />
                </div>
              </div>
            </ThorTurn>
          )}

          {step === "icp" && (
            <ThorTurn
              question="Entendi."
              subtitle="Descreva o cliente ideal — quem seria o lead perfeito?"
              hint="Setor, porte, cargo do decisor, dor que ele tem."
            >
              <div className="flex flex-col gap-3">
                <Textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={icp}
                  onChange={(e) => setIcp(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitIcp();
                  }}
                  placeholder="Ex.: Diretor comercial de SaaS B2B com 20-100 funcionários que sofre com ciclo de venda longo."
                  className="min-h-32 text-base bg-card border-border focus-visible:ring-primary resize-none"
                  rows={4}
                  disabled={loading}
                />
                <div className="flex justify-end">
                  <SubmitButton
                    onClick={submitIcp}
                    loading={loading}
                    label="Ver Mesa Redonda"
                  />
                </div>
              </div>
            </ThorTurn>
          )}

          {step === "finalizing" && (
            <div className="flex flex-col items-center gap-6 py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="space-y-1">
                <p className="text-lg font-medium">Montando sua Mesa Redonda...</p>
                <p className="text-sm text-muted-foreground">
                  Sincronizando agentes com o contexto de {company?.empresa}.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */

interface ThorTurnProps {
  question: string;
  subtitle: string;
  hint?: string;
  children: React.ReactNode;
}

function ThorTurn({ question, subtitle, hint, children }: ThorTurnProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-primary/80 font-medium">
          Thor
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          {question}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">{subtitle}</p>
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

interface SubmitButtonProps {
  onClick: () => void;
  loading: boolean;
  label?: string;
}

function SubmitButton({ onClick, loading, label }: SubmitButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      size="lg"
      className="h-14 px-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {label ?? "Continuar"}
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </Button>
  );
}
