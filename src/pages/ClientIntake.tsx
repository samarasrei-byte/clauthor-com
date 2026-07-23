import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Send, CheckCircle2, Sparkles, Linkedin, MessageCircle,
  Mail, Instagram, Facebook, Music2, Users, Database, Target,
  Clock, Zap, TrendingUp, Save,
} from "lucide-react";
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
  quickAnswers?: string[]; // sugestões clicáveis pra number/text
  optional?: boolean;
  showIf?: (answers: Record<string, unknown>) => boolean;
}

const hasChannel = (a: Record<string, unknown>, ch: string) => {
  const list = a.channels;
  return Array.isArray(list) && (list as string[]).includes(ch);
};

const QUESTIONS: Question[] = [
  { key: "client_name", prompt: "Oi! Eu sou o Thor, seu copiloto do Clauthor ⚡\n\nAntes de começar, como posso te chamar?", type: "text", placeholder: "Seu nome completo" },
  { key: "company_name", prompt: "Prazer, {client_name}! 👋\n\nQual é o nome da sua empresa?", type: "text", placeholder: "Nome da empresa" },
  { key: "contact_email", prompt: "Perfeito. Qual o melhor e-mail pra gente te mandar o resumo?", type: "email", placeholder: "voce@empresa.com" },
  { key: "contact_phone", prompt: "E um WhatsApp pra falarmos com você? (com DDD)", type: "phone", placeholder: "(11) 99999-9999" },
  { key: "industry", prompt: "Em qual setor a {company_name} atua?", type: "text", placeholder: "Ex: Advocacia, SaaS, Varejo…", quickAnswers: ["SaaS", "Advocacia", "Serviços", "Varejo", "Indústria"] },
  { key: "channels", prompt: "Agora o legal: **em quais canais** você quer prospectar?\n(pode marcar vários)", type: "multi", options: ["LinkedIn", "WhatsApp", "E-mail", "Instagram", "Facebook", "TikTok"] },
  { key: "volume_linkedin", prompt: "🔵 **LinkedIn** — qual volume diário?", type: "number", placeholder: "Ex: 50", quickAnswers: ["30", "50", "100", "200"], showIf: (a) => hasChannel(a, "LinkedIn") },
  { key: "volume_whatsapp", prompt: "🟢 **WhatsApp** — mensagens por dia?", type: "number", placeholder: "Ex: 100", quickAnswers: ["50", "100", "300", "500"], showIf: (a) => hasChannel(a, "WhatsApp") },
  { key: "volume_email", prompt: "✉️ **E-mail** — disparos por dia?", type: "number", placeholder: "Ex: 200", quickAnswers: ["100", "300", "500", "1000"], showIf: (a) => hasChannel(a, "E-mail") },
  { key: "volume_instagram", prompt: "📸 **Instagram** — DMs por dia?", type: "number", placeholder: "Ex: 30", quickAnswers: ["20", "50", "100"], showIf: (a) => hasChannel(a, "Instagram") },
  { key: "volume_facebook", prompt: "📘 **Facebook** — DMs por dia?", type: "number", placeholder: "Ex: 30", quickAnswers: ["20", "50", "100"], showIf: (a) => hasChannel(a, "Facebook") },
  { key: "volume_tiktok", prompt: "🎵 **TikTok** — interações por dia?", type: "number", placeholder: "Ex: 20", quickAnswers: ["10", "30", "50"], showIf: (a) => hasChannel(a, "TikTok") },
  { key: "has_list", prompt: "Você já tem uma **lista própria** de leads?", type: "choice", options: ["Sim, tenho", "Não, preciso construir"] },
  { key: "list_size", prompt: "Ótimo! Quantos leads tem na sua lista hoje?", type: "number", placeholder: "Ex: 1500", quickAnswers: ["500", "1000", "5000", "10000+"], showIf: (a) => a.has_list === "Sim, tenho" },
  { key: "team_size", prompt: "Qual o tamanho do seu **time comercial** hoje?", type: "choice", options: ["Só eu", "2 a 5", "6 a 15", "16 a 50", "Mais de 50"] },
  { key: "crm_choice", prompt: "Qual CRM você quer usar no Clauthor?", type: "choice", options: ["CRM da G8 (nativo)", "Pipedrive", "HubSpot", "Salesforce", "RD Station", "Outro / Não tenho"] },
  { key: "crm_current", prompt: "Você já usa algum CRM hoje? Qual?", type: "text", placeholder: "Ex: Pipedrive, planilha, nenhum…", optional: true },
  { key: "goals", prompt: "🎯 Qual sua **meta principal pros próximos 90 dias**?", type: "longtext", placeholder: "Ex: dobrar reuniões qualificadas, entrar em novo mercado…" },
  { key: "notes", prompt: "Por último: alguma observação, integração especial ou algo importante?", type: "longtext", placeholder: "Fique à vontade (opcional)", optional: true },
];

const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LinkedIn: Linkedin, WhatsApp: MessageCircle, "E-mail": Mail,
  Instagram: Instagram, Facebook: Facebook, TikTok: Music2,
};

type Msg = { role: "thor" | "user"; text: string };

export default function ClientIntake() {
  const { token } = useParams<{ token: string }>();
  const DRAFT_KEY = `intake_draft_${token ?? "anon"}`;
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [multi, setMulti] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const current = QUESTIONS[step];

  const interp = (t: string, ctx: Record<string, unknown> = answers) =>
    t.replace(/\{(\w+)\}/g, (_, k) => String(ctx[k] ?? ""));

  const nextIndex = (from: number, ctx: Record<string, unknown>) => {
    for (let i = from; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      if (!q.showIf || q.showIf(ctx)) return i;
    }
    return -1;
  };

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

        // Merge local draft (offline resume)
        let localDraft: Record<string, unknown> = {};
        let draftInput = "";
        let draftMulti: string[] = [];
        try {
          const raw = localStorage.getItem(DRAFT_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            localDraft = parsed.answers ?? {};
            draftInput = parsed.input ?? "";
            draftMulti = Array.isArray(parsed.multi) ? parsed.multi : [];
          }
        } catch { /* noop */ }

        const seed = {
          ...localDraft,
          ...existing,
          client_name: existing.client_name ?? localDraft.client_name ?? data.client_name ?? "",
          company_name: existing.company_name ?? localDraft.company_name ?? data.company_name ?? "",
          contact_email: existing.contact_email ?? localDraft.contact_email ?? data.contact_email ?? "",
          contact_phone: existing.contact_phone ?? localDraft.contact_phone ?? data.contact_phone ?? "",
        };
        setAnswers(seed);
        if (data.status === "completed") { setDone(true); return; }
        let idx = 0;
        for (let i = 0; i < QUESTIONS.length; i++) {
          const q = QUESTIONS[i];
          if (q.showIf && !q.showIf(seed)) continue;
          if (!seed[q.key] && !q.optional) { idx = i; break; }
          idx = i;
        }
        setStep(idx);
        setInput(draftInput);
        setMulti(draftMulti);
        setResumed(Object.keys(localDraft).length > 0 || Object.keys(existing).length > 0);
        setMessages([{ role: "thor", text: interp(QUESTIONS[idx].prompt, seed) }]);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Autosave local draft (answers + partial input/multi) — resume-safe
  useEffect(() => {
    if (loading || done) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, input, multi, step, ts: Date.now() }));
      setLastSavedAt(Date.now());
    } catch { /* quota noop */ }
  }, [answers, input, multi, step, loading, done, DRAFT_KEY]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
  }, [messages, submitting]);

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
      setLastSavedAt(Date.now());
      if (complete) {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
      }
    } catch (e) {
      toast.error("Falha ao salvar no servidor — mantive um rascunho local.");
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
      const merged = { ...answers, ...patch } as Record<string, unknown>;
      const nxt = nextIndex(step + 1, merged);
      const isLast = nxt === -1;
      await persist(patch, isLast);
      setInput("");
      setMulti([]);
      if (isLast) {
        setDone(true);
        setMessages((m) => [...m, {
          role: "thor",
          text: `Prontinho, ${interp("{client_name}", merged)}! 🎉\n\nRecebi tudo. O time do Clauthor + G8 vai revisar e te chamar em breve. 🚀`,
        }]);
      } else {
        setStep(nxt);
        const rendered = interp(QUESTIONS[nxt].prompt, merged);
        setTimeout(() => setMessages((m) => [...m, { role: "thor", text: rendered }]), 400);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Progress based on visible steps only
  const { visibleTotal, visibleDone } = useMemo(() => {
    const total = QUESTIONS.filter((q) => !q.showIf || q.showIf(answers)).length;
    const doneCount = QUESTIONS.slice(0, step).filter((q) => !q.showIf || q.showIf(answers)).length + (done ? 1 : 0);
    return { visibleTotal: total, visibleDone: doneCount };
  }, [answers, step, done]);
  const progress = Math.min(100, Math.round((visibleDone / Math.max(1, visibleTotal)) * 100));
  const etaMinutes = Math.max(1, Math.ceil((visibleTotal - visibleDone) * 0.25)); // ~15s/pergunta

  const selectedChannels = Array.isArray(answers.channels) ? (answers.channels as string[]) : [];

  // Preview de automação · volumes por canal em tempo real
  const CH_KEY: Record<string, string> = {
    LinkedIn: "volume_linkedin", WhatsApp: "volume_whatsapp", "E-mail": "volume_email",
    Instagram: "volume_instagram", Facebook: "volume_facebook", TikTok: "volume_tiktok",
  };
  const channelVolumes = selectedChannels.map((c) => {
    const raw = answers[CH_KEY[c]];
    const n = typeof raw === "string" ? parseInt(raw, 10) : typeof raw === "number" ? raw : 0;
    return { channel: c, daily: Number.isFinite(n) ? n : 0 };
  });
  const dailyTotal = channelVolumes.reduce((s, x) => s + x.daily, 0);
  const monthlyTotal = dailyTotal * 22; // dias úteis
  const impactReplies = Math.round(monthlyTotal * 0.08); // taxa média de resposta 8%

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

  const renderText = (text: string) => {
    // simple **bold** + line breaks
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
      <>
        {parts.map((p, i) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
          ) : (
            <span key={i} className="whitespace-pre-wrap">{p}</span>
          )
        )}
      </>
    );
  };

  return (
    <>
      <Helmet>
        <title>Onboarding do Cliente · Clauthor × G8</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="h-dvh overflow-hidden bg-gradient-to-b from-background via-background to-muted/40 flex flex-col">
        {/* Header co-branded */}
        <header className="border-b border-border/60 bg-background/85 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold shadow-sm">C</div>
                <span className="font-semibold tracking-tight hidden xs:inline">Clauthor</span>
              </div>
              <span className="text-muted-foreground/60">×</span>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-foreground text-background grid place-items-center font-bold text-sm shadow-sm">G8</div>
                <span className="font-semibold tracking-tight hidden xs:inline">G8</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Thor</span>
              <span className="tabular-nums">{visibleDone}/{visibleTotal}</span>
              {!done && (
                <span className="hidden sm:inline-flex items-center gap-1 pl-2 border-l border-border/60 tabular-nums">
                  <Clock className="w-3 h-3" /> ~{etaMinutes} min
                </span>
              )}
            </div>
          </div>
          <div className="h-1 bg-muted overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </header>

        {/* Banner de retomada */}
        {resumed && !done && (
          <div className="border-b border-primary/20 bg-primary/5">
            <div className="max-w-3xl mx-auto px-4 py-1.5 flex items-center gap-2 text-[11px] text-primary">
              <Save className="w-3 h-3" />
              <span>Retomamos de onde você parou.</span>
              {lastSavedAt && (
                <span className="text-primary/70 ml-auto tabular-nums">
                  Salvo {new Date(lastSavedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Live summary chips + Preview de automação */}
        {(selectedChannels.length > 0 || answers.team_size || answers.crm_choice) && (
          <div className="border-b border-border/40 bg-muted/30">
            <div className="max-w-3xl mx-auto px-4 py-2 space-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedChannels.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Target className="w-3.5 h-3.5 text-muted-foreground" />
                    {selectedChannels.map((c) => {
                      const Icon = CHANNEL_ICONS[c];
                      const vol = channelVolumes.find((v) => v.channel === c)?.daily ?? 0;
                      return (
                        <Badge key={c} variant="secondary" className="gap-1 font-normal tabular-nums">
                          {Icon && <Icon className="w-3 h-3" />} {c}
                          {vol > 0 && <span className="text-primary font-semibold ml-0.5">· {vol}/dia</span>}
                        </Badge>
                      );
                    })}
                  </div>
                )}
                {answers.team_size ? (
                  <Badge variant="outline" className="gap-1 font-normal">
                    <Users className="w-3 h-3" /> Time: {String(answers.team_size)}
                  </Badge>
                ) : null}
                {answers.crm_choice ? (
                  <Badge variant="outline" className="gap-1 font-normal">
                    <Database className="w-3 h-3" /> {String(answers.crm_choice)}
                  </Badge>
                ) : null}
              </div>

              {dailyTotal > 0 && (
                <div className="rounded-lg border border-primary/20 bg-background/60 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    <Zap className="w-3 h-3" /> Cenário previsto
                  </div>
                  <div className="flex items-center gap-1 tabular-nums">
                    <span className="text-muted-foreground">Diário:</span>
                    <span className="font-semibold text-foreground">{dailyTotal.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-1 tabular-nums">
                    <span className="text-muted-foreground">Mensal:</span>
                    <span className="font-semibold text-foreground">{monthlyTotal.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-1 tabular-nums ml-auto">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-muted-foreground">Respostas est.:</span>
                    <span className="font-semibold text-primary">~{impactReplies.toLocaleString("pt-BR")}/mês</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat */}
        <main className="flex-1 min-h-0 max-w-3xl w-full mx-auto px-3 sm:px-4 flex flex-col">
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 py-4 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "thor" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center text-xs font-bold shrink-0 shadow-sm mt-0.5">
                    T
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm text-foreground",
                )}>
                  {renderText(m.text)}
                </div>
              </div>
            ))}
            {submitting && !done && (
              <div className="flex gap-2 justify-start animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center text-xs font-bold shrink-0 shadow-sm">T</div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
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
            <Card className="p-3 mb-3 sm:mb-4 border-border/60 shadow-lg shrink-0 sticky bottom-2 bg-background/95 backdrop-blur">
              {current.type === "choice" && (
                <div className="flex flex-wrap gap-2">
                  {current.options!.map((opt) => (
                    <Button key={opt} variant="outline" size="sm" disabled={submitting}
                      className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                      onClick={() => submitAnswer(opt)}>
                      {opt}
                    </Button>
                  ))}
                </div>
              )}
              {current.type === "multi" && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap gap-2">
                    {current.options!.map((opt) => {
                      const Icon = CHANNEL_ICONS[opt];
                      const active = multi.includes(opt);
                      return (
                        <Button key={opt} type="button" variant={active ? "default" : "outline"} size="sm"
                          className="gap-1.5 transition-all"
                          onClick={() => setMulti((prev) => active ? prev.filter((x) => x !== opt) : [...prev, opt])}>
                          {Icon && <Icon className="w-3.5 h-3.5" />}
                          {opt}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{multi.length} selecionado{multi.length !== 1 ? "s" : ""}</span>
                    <Button size="sm" disabled={submitting || multi.length === 0} onClick={() => submitAnswer(multi)}>
                      Continuar <Send className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
              {(current.type === "text" || current.type === "email" || current.type === "phone" || current.type === "number") && (
                <div className="space-y-2">
                  {current.quickAnswers && current.quickAnswers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {current.quickAnswers.map((q) => (
                        <Button key={q} type="button" variant="outline" size="sm"
                          className="h-7 text-xs" disabled={submitting}
                          onClick={() => submitAnswer(q)}>
                          {q}
                        </Button>
                      ))}
                    </div>
                  )}
                  <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); submitAnswer(input); }}>
                    <Input
                      autoFocus
                      inputMode={current.type === "number" ? "numeric" : current.type === "phone" ? "tel" : "text"}
                      type={current.type === "number" ? "number" : current.type === "email" ? "email" : "text"}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={current.placeholder}
                      disabled={submitting}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={submitting} size="icon">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                    {current.optional && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => submitAnswer("")} disabled={submitting}>
                        Pular
                      </Button>
                    )}
                  </form>
                </div>
              )}
              {current.type === "longtext" && (
                <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); submitAnswer(input); }}>
                  <Textarea
                    autoFocus
                    rows={3}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        submitAnswer(input);
                      }
                    }}
                    placeholder={current.placeholder}
                    disabled={submitting}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground hidden sm:inline">⌘/Ctrl + Enter para enviar</span>
                    <div className="flex gap-2 ml-auto">
                      {current.optional && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => submitAnswer("")} disabled={submitting}>
                          Pular
                        </Button>
                      )}
                      <Button type="submit" disabled={submitting} size="sm">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enviar <Send className="w-3.5 h-3.5 ml-2" /></>}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </Card>
          )}
        </main>

        <footer className="text-center text-[11px] text-muted-foreground py-2 sm:py-3 px-4">
          Powered by Clauthor · G8 · Suas respostas ficam seguras
        </footer>
      </div>
    </>
  );
}
