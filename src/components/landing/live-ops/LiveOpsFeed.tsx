/**
 * LiveOpsFeed · terminal estilizado que exibe outputs dos agentes
 * em loop. Cada linha entra por cima com fade, empurrando as antigas.
 * Máximo de 6 linhas visíveis · janela auto-limpa.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LIVE_OPS_EVENTS, type LiveOpsEvent } from "@/data/liveOpsEvents";

interface FeedItem extends LiveOpsEvent {
  id: string;
  time: string;
}

const MAX_VISIBLE = 6;
const TICK_MS = 2200;

function formatTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function buildInitial(): FeedItem[] {
  const now = new Date();
  return Array.from({ length: MAX_VISIBLE }).map((_, i) => {
    const evt = LIVE_OPS_EVENTS[i % LIVE_OPS_EVENTS.length];
    return {
      ...evt,
      id: `seed-${i}`,
      time: formatTime(new Date(now.getTime() - (MAX_VISIBLE - i) * 60_000)),
    };
  });
}

export default function LiveOpsFeed() {
  const [items, setItems] = useState<FeedItem[]>(buildInitial);

  useEffect(() => {
    let cursor = MAX_VISIBLE;
    const timer = window.setInterval(() => {
      const evt = LIVE_OPS_EVENTS[cursor % LIVE_OPS_EVENTS.length];
      cursor += 1;
      const nowStr = formatTime(new Date());
      setItems((prev) => [
        ...prev.slice(-(MAX_VISIBLE - 1)),
        { ...evt, id: `${cursor}-${evt.agent}`, time: nowStr },
      ]);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative rounded-3xl border border-white/10 bg-black/40 overflow-hidden">
      {/* Header estilo terminal */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/70" aria-hidden />
        </div>
        <span className="text-[10px] uppercase tracking-[0.22em] text-white/40 font-mono">
          clauthor · ops feed
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-primary/80 font-mono">
          streaming
        </span>
      </div>

      {/* Linhas */}
      <div
        className="px-5 py-6 min-h-[300px] font-mono text-[13px] leading-relaxed text-white/70"
        role="log"
        aria-live="polite"
        aria-label="Feed de operações em tempo real"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-wrap gap-x-2 gap-y-0.5 py-1"
            >
              <span className="text-white/30">[{item.time}]</span>
              <span className="text-primary/85">{item.dept}</span>
              <span className="text-white/30">·</span>
              <span className="text-white">{item.agent}</span>
              <span className="text-white/70">{item.action}</span>
              {item.impact && (
                <span className="text-primary/70">· {item.impact}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Gradient fade no topo */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[45px] left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent"
      />
    </div>
  );
}
