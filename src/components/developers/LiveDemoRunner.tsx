import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * LiveDemoRunner — hits the public `dev-live-demo` edge function and streams
 * a real multi-agent orchestration narrative (via Lovable AI Gateway).
 * No auth. Rate limited by IP at the edge.
 */

const AGENT_COLORS: Record<string, string> = {
  "growth.strategist": "text-emerald-400",
  "copy.senior": "text-cyan-400",
  "design.motion": "text-violet-400",
  "media.buyer": "text-amber-400",
  "analyst.roas": "text-rose-400",
  "sdr.inbound": "text-cyan-400",
  "sales.closer": "text-emerald-400",
  "cs.retention": "text-violet-400",
  "ops.chief": "text-amber-400",
  "finance.forecast": "text-rose-400",
};
const colorFor = (slug: string) => AGENT_COLORS[slug] ?? "text-primary";

const SUGGESTIONS = [
  "Lançar campanha Black Friday em 5 canais",
  "Qualificar 50 leads inbound do LinkedIn",
  "Auditar segurança da minha API pública",
  "Fechar o mês fiscal e emitir NFs",
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type Line =
  | { t: "cmd"; text: string }
  | { t: "sys"; text: string }
  | { t: "agent"; slug: string; text: string }
  | { t: "ok"; text: string; meta?: string }
  | { t: "warn"; text: string }
  | { t: "done"; text: string; meta?: string };

function parseLine(raw: string): Line | null {
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith("CMD ")) return { t: "cmd", text: s.slice(4).trim() };
  if (s.startsWith("SYS ")) return { t: "sys", text: s.slice(4).trim() };
  if (s.startsWith("AGT ")) {
    const rest = s.slice(4);
    const [slug, ...tail] = rest.split("|");
    return { t: "agent", slug: slug.trim(), text: tail.join("|").trim() };
  }
  if (s.startsWith("OK ")) {
    const [text, meta] = s.slice(3).split("|").map((x) => x.trim());
    return { t: "ok", text, meta };
  }
  if (s.startsWith("WARN ")) return { t: "warn", text: s.slice(5).trim() };
  if (s.startsWith("DONE ")) {
    const [text, meta] = s.slice(5).split("|").map((x) => x.trim());
    return { t: "done", text, meta };
  }
  return null;
}

export default function LiveDemoRunner() {
  const [outcome, setOutcome] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bufferRef = useRef("");

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRunning(false);
  };

  const flushBuffer = () => {
    // Whenever we see \n in the accumulated raw text, try to parse a line.
    const parts = bufferRef.current.split("\n");
    bufferRef.current = parts.pop() ?? "";
    for (const p of parts) {
      const parsed = parseLine(p);
      if (parsed) setLines((prev) => [...prev, parsed]);
    }
  };

  const run = async (text: string) => {
    const q = text.trim();
    if (!q || running) return;
    setError(null);
    setLines([]);
    bufferRef.current = "";
    setRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/dev-live-demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: q }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`Erro ${res.status}. Tente novamente em alguns segundos.`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuf = "";
      // Show the shell prompt immediately
      setLines([{ t: "cmd", text: `$ clauthor run "${q}"` }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuf += decoder.decode(value, { stream: true });
        const events = sseBuf.split("\n\n");
        sseBuf = events.pop() ?? "";
        for (const e of events) {
          const dataLine = e.split("\n").find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          try {
            const j = JSON.parse(dataLine.slice(5).trim());
            if (j.type === "delta" && typeof j.text === "string") {
              bufferRef.current += j.text;
              flushBuffer();
            } else if (j.type === "done") {
              // final flush of any trailing content
              bufferRef.current += "\n";
              flushBuffer();
            } else if (j.type === "error") {
              throw new Error(j.message ?? "Erro no stream.");
            }
          } catch (_) {
            /* ignore */
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0f] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#07070c]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-3 text-[11px] text-foreground/40 font-mono">
          POST /functions/v1/dev-live-demo
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono">
          {running ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-primary">STREAMING</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400/80">READY</span>
            </>
          )}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(outcome);
          }}
          className="flex items-center gap-2"
        >
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#07070c] border border-white/[0.08] focus-within:border-primary/40 transition-colors">
            <span className="text-primary font-mono text-sm">›</span>
            <input
              type="text"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder='descreva um outcome — ex: "lançar campanha black friday em 5 canais"'
              className="flex-1 bg-transparent outline-none font-mono text-sm text-foreground placeholder:text-foreground/30"
              maxLength={400}
              disabled={running}
            />
          </div>
          {running ? (
            <Button type="button" variant="outline" onClick={stop} className="font-mono border-white/10">
              <Square className="h-3.5 w-3.5 mr-2" /> stop
            </Button>
          ) : (
            <Button type="submit" disabled={!outcome.trim()} className="font-mono">
              <Play className="h-3.5 w-3.5 mr-2" /> run
            </Button>
          )}
        </form>

        {lines.length === 0 && !running && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setOutcome(s);
                  run(s);
                }}
                className="text-[11px] font-mono px-2.5 py-1 rounded-md border border-white/[0.08] text-foreground/60 hover:text-primary hover:border-primary/30 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-[280px] max-h-[380px] overflow-y-auto font-mono text-[13px] leading-6 space-y-1">
          {error && (
            <div className="text-rose-400 text-sm">✗ {error}</div>
          )}
          {lines.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2"
            >
              {l.t === "cmd" && <span className="text-primary">{l.text}</span>}
              {l.t === "sys" && <span className="text-foreground/50">→ {l.text}</span>}
              {l.t === "agent" && (
                <>
                  <span className={cn("shrink-0 font-bold", colorFor(l.slug))}>▸ {l.slug}</span>
                  <span className="text-foreground/70">{l.text}</span>
                </>
              )}
              {l.t === "ok" && (
                <>
                  <span className="shrink-0 text-emerald-400">✓</span>
                  <span className="text-foreground/80">{l.text}</span>
                  {l.meta && <span className="ml-auto text-[11px] text-foreground/40">{l.meta}</span>}
                </>
              )}
              {l.t === "warn" && (
                <>
                  <span className="shrink-0 text-amber-400">⚠</span>
                  <span className="text-amber-200/80">{l.text}</span>
                </>
              )}
              {l.t === "done" && (
                <>
                  <span className="shrink-0 text-primary">◆</span>
                  <span className="text-foreground/90 font-semibold">{l.text}</span>
                  {l.meta && <span className="ml-auto text-[11px] text-primary/80 font-bold">{l.meta}</span>}
                </>
              )}
            </motion.div>
          ))}
          {running && (
            <div className="flex items-center gap-2 text-foreground/40 text-xs pt-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              orquestrador processando...
            </div>
          )}
        </div>

        <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest border-t border-white/[0.05] pt-3">
          demo público · lovable ai gateway · gemini-2.5-flash · sem cadastro
        </div>
      </div>
    </div>
  );
}
