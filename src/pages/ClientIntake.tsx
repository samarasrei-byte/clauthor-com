import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Send, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
};

type FieldType = "text" | "email" | "phone" | "number" | "choice" | "multi" | "longtext";

interface Question {
  key: string;
  prompt: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  optional?: boolean;
}

const QUESTIONS: Question[] = [
  { key: "client_name", prompt: "Oi! Eu sou o Thor, seu copiloto do Clauthor. Antes de tudo, como posso te chamar?", type: "text", placeholder: "Seu nome completo" },
  { key: "company_name", prompt: "Prazer, {client_name}! 👋 Qual é o nome da sua empresa?", type: "text", placeholder: "Nome da empresa" },
  { key: "contact_email", prompt: "Perfeito. Qual o melhor e-mail pra gente te enviar o resumo depois?", type: "email", placeholder: "voce@empresa.com" },
  { key: "contact_phone", prompt: "E um WhatsApp pra falarmos com você? (com DDD)", type: "phone", placeholder: "(11) 99999-9999" },
  { key: "industry", prompt: "Legal. Em qual setor a {company_name} atua?", type: "text", placeholder: "Ex: Advocacia, SaaS, Varejo…" },
  { key: "channels", prompt: "Quais canais você quer usar pra prospectar? (pode marcar vários)", type: "multi", options: ["LinkedIn", "WhatsApp", "E-mail", "Instagram", "Facebook", "TikTok"] },
  { key: "volume_linkedin", prompt: "Qual o volume diário desejado no LinkedIn?", type: "number", placeholder: "Ex: 50", optional: true },
  { key: "volume_whatsapp", prompt: "E no WhatsApp, quantas mensagens por dia?", type: "number", placeholder: "Ex: 100", optional: true },
  { key: "volume_email", prompt: "E-mail: quantos disparos por dia?", type: "number", placeholder: "Ex: 200", optional: true },
  { key: "volume_instagram", prompt: "E no Instagram + Facebook (Meta)?", type: "number", placeholder: "Ex: 30", optional: true },
  { key: "has_list", prompt: "Você já tem uma lista própria de leads?", type: "choice", options: ["Sim, tenho", "Não, preciso construir"] },
  { key: "list_size", prompt: "Ótimo! Quantos leads tem na sua lista hoje?", type: "number", placeholder: "Ex: 1500", optional: true },
  { key: "team_size", prompt: "Qual o tamanho do seu time comercial hoje?", type: "choice", options: ["Só eu", "2 a 5", "6 a 15", "16 a 50", "Mais de 50"] },
  { key: "crm_choice", prompt: "Sobre CRM: você quer usar qual?", type: "choice", options: ["CRM da G8 (nativo)", "Pipedrive", "HubSpot", "Salesforce", "RD Station", "Outro / Não tenho ainda"] },
  { key: "crm_current", prompt: "Você já tem algum CRM em uso hoje? Se sim, qual?", type: "text", placeholder: "Ex: Pipedrive, planilha, nenhum…", optional: true },
  { key: "goals", prompt: "Qual é sua principal meta pros próximos 90 dias?", type: "longtext", placeholder: "Ex: dobrar reuniões qualificadas, entrar em novo mercado…" },
  { key: "notes", prompt: "Por último: alguma observação, integração especial ou algo que a gente precisa saber?", type: "longtext", placeholder: "Fique à vontade (opcional)", optional: true },
];

type Msg = { role: "thor" | "user"; text: string };

export default function ClientIntake() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [multi, setMulti] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const current = QUESTIONS[step];

  const interpolate = (t: string) =>
    t.replace(/\{(\w+)\}/g, (_, k) => String((answers as Record<string, unknown>)[k] ?? ""));

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${FN_BASE}/intake-fetch`, {
          method: "POST", headers: HEADERS, body: JSON.stringify({ token }),
        });
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        const existing = (data.answers ?? {}) as Record<string, unknown>;
        setAnswers({
          ...existing,
          client_name: existing.client_name ?? data.client_name ?? "",
          company_name: existing.company_name ?? data.company_name ?? "",
          contact_email: existing.contact_email ?? data.contact_email ?? "",
          contact_phone: existing.contact_phone ?? data.contact_phone ?? "",
        });
        if (data.status === "completed") { setDone(true); return; }
        // resume at first missing
        const idx = QUESTIONS.findIndex((q) => !existing[q.key] && !q.optional);
        const startIdx = idx === -1 ? QUESTIONS.length - 1 : idx;
        setStep(startIdx);
        setMessages([{ role: "thor", text: QUESTIONS[startIdx].prompt }]);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const persist = async (patch: Record<string, unknown>, complete = false) => {
    const nextAnswers = { ...answers, ...patch };
    setAnswers(nextAnswers);
    try {
      await fetch(`${FN_BASE}/intake-save`, {
        method: "POST", headers: HEADERS,
        body: JSON.stringify({
          token,
          answers: nextAnswers,
          client_name: nextAnswers.client_name,
          company_name: nextAnswers.company_name,
          contact_email: nextAnswers.contact_email,
          contact_phone: nextAnswers.contact_phone,
          notes: nextAnswers.notes,
          complete,
        }),
      });
    } catch (e) {
      toast.error("Falha ao salvar. Tente novamente.");
      throw e;
    }
  };

  const submitAnswer = async (rawValue: string | string[]) => {
    if (!current) return;
    const value = Array.isArray(rawValue) ? rawValue.join(", ") : rawValue;
    if (!current.optional && !value.trim()) {
      toast.error("Preciso da sua resposta pra seguir 🙂");
      return;
    }
    setSubmitting(true);
    setMessages((m) => [...m, { role: "user", text: value || "(pulado)" }]);
    const patch = { [current.key]: Array.isArray(rawValue) ? rawValue : value };
    try {
      const isLast = step >= QUESTIONS.length - 1;
      await persist(patch, isLast);
      setInput("");
      setMulti([]);
      if (isLast) {
        setDone(true);
        setMessages((m) => [...m, {
          role: "thor",
          text: `Prontinho, ${interpolate("{client_name}")}! Recebi tudo. O time do Clauthor + G8 vai revisar e te chamar em breve. 🚀`,
        }]);
      } else {
        const next = QUESTIONS[step + 1];
        setStep(step + 1);
        // interpolate using merged answers
        const merged = { ...answers, ...patch } as Record<string, unknown>;
        const rendered = next.prompt.replace(/\{(\w+)\}/g, (_, k) => String(merged[k] ?? ""));
        setTimeout(() => setMessages((m) => [...m, { role: "thor", text: rendered }]), 350);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const progress = useMemo(() => Math.round(((done ? QUESTIONS.length : step) / QUESTIONS.length) * 100), [step, done]);

  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (notFound) {
    return (
      <div className="min-h-dvh grid place-items-center bg-background text-center p-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Link inválido</h1>
          <p className="text-muted-foreground">Este onboarding não foi encontrado ou expirou. Peça um novo link ao seu contato.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Onboarding do Cliente · Clauthor × G8</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="h-dvh overflow-hidden bg-gradient-to-b from-background to-muted/30 flex flex-col">
        {/* Header co-branded */}
        <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">C</div>
                <span className="font-semibold tracking-tight">Clauthor</span>
              </div>
              <span className="text-muted-foreground/60">×</span>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-foreground text-background grid place-items-center font-bold text-sm">G8</div>
                <span className="font-semibold tracking-tight">G8</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Onboarding guiado pelo Thor
            </div>
          </div>
          <div className="h-1 bg-muted">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </header>

        {/* Chat */}
        <main className="flex-1 min-h-0 max-w-3xl w-full mx-auto px-4 flex flex-col">
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 py-4 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm text-foreground",
                )}>
                  {m.text}
                </div>
              </div>
            ))}
            {submitting && !done && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            {done && (
              <div className="flex justify-center pt-6">
                <div className="text-center">
                  <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Suas respostas foram enviadas com sucesso.</p>
                </div>
              </div>
            )}
          </div>


          {/* Composer */}
          {!done && current && (
            <Card className="p-3 mb-4 border-border/60 shadow-md shrink-0 sticky bottom-4">
              {current.type === "choice" && (
                <div className="flex flex-wrap gap-2">
                  {current.options!.map((opt) => (
                    <Button key={opt} variant="outline" size="sm" disabled={submitting}
                      onClick={() => submitAnswer(opt)}>
                      {opt}
                    </Button>
                  ))}
                </div>
              )}
              {current.type === "multi" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {current.options!.map((opt) => {
                      const active = multi.includes(opt);
                      return (
                        <Button key={opt} type="button" variant={active ? "default" : "outline"} size="sm"
                          onClick={() => setMulti((prev) => active ? prev.filter((x) => x !== opt) : [...prev, opt])}>
                          {opt}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" disabled={submitting || multi.length === 0} onClick={() => submitAnswer(multi)}>
                      Continuar <Send className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
              {(current.type === "text" || current.type === "email" || current.type === "phone" || current.type === "number") && (
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); submitAnswer(input); }}>
                  <Input
                    autoFocus
                    type={current.type === "number" ? "number" : current.type === "email" ? "email" : "text"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={current.placeholder}
                    disabled={submitting}
                  />
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                  {current.optional && (
                    <Button type="button" variant="ghost" onClick={() => submitAnswer("")} disabled={submitting}>
                      Pular
                    </Button>
                  )}
                </form>
              )}
              {current.type === "longtext" && (
                <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); submitAnswer(input); }}>
                  <Textarea
                    autoFocus
                    rows={3}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={current.placeholder}
                    disabled={submitting}
                  />
                  <div className="flex justify-end gap-2">
                    {current.optional && (
                      <Button type="button" variant="ghost" onClick={() => submitAnswer("")} disabled={submitting}>
                        Pular
                      </Button>
                    )}
                    <Button type="submit" disabled={submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enviar <Send className="w-3.5 h-3.5 ml-2" /></>}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          )}
        </main>

        <footer className="text-center text-xs text-muted-foreground py-4">
          Powered by Clauthor · G8 · Suas respostas ficam seguras
        </footer>
      </div>
    </>
  );
}
