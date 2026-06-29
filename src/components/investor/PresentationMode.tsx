import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, Gauge, Maximize2, Minimize2, RotateCcw } from "lucide-react";

interface Props {
  active: boolean;
  onExit: () => void;
}

const SPEEDS = [0.5, 1, 1.5, 2, 3];

const PresentationMode = ({ active, onExit }: Props) => {
  const [playing, setPlaying] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(1); // 1x
  const [fs, setFs] = useState(false);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  // Auto-scroll loop (pixels per second based on speed)
  useEffect(() => {
    if (!active || !playing) return;
    const step = (t: number) => {
      if (!last.current) last.current = t;
      const dt = (t - last.current) / 1000;
      last.current = t;
      const pxPerSec = 45 * SPEEDS[speedIdx]; // cinematic pace
      window.scrollBy({ top: pxPerSec * dt, behavior: "auto" });
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= max - 2) {
        setPlaying(false);
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = 0;
    };
  }, [active, playing, speedIdx]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
      else if (e.key === " ") { e.preventDefault(); setPlaying(p => !p); }
      else if (e.key === "ArrowRight") setSpeedIdx(i => Math.min(SPEEDS.length - 1, i + 1));
      else if (e.key === "ArrowLeft") setSpeedIdx(i => Math.max(0, i - 1));
      else if (e.key.toLowerCase() === "f") toggleFs();
      else if (e.key.toLowerCase() === "r") window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onExit]);

  // Track fullscreen state
  useEffect(() => {
    const h = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const toggleFs = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  // Hide overlay UI elements while presenting
  useEffect(() => {
    if (active) document.body.classList.add("presentation-mode");
    else document.body.classList.remove("presentation-mode");
    return () => document.body.classList.remove("presentation-mode");
  }, [active]);

  // Scroll progress
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) return;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Cinematic vignette */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[60]"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, hsl(var(--background)/0.55) 100%)",
            }}
          />

          {/* Top progress bar */}
          <div className="fixed top-0 inset-x-0 h-[3px] z-[70] bg-foreground/10">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60"
              style={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          {/* Floating HUD controls */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70]"
          >
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/80 backdrop-blur-xl px-2 py-2 shadow-2xl shadow-primary/10">
              <button
                onClick={() => setPlaying(p => !p)}
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition"
                aria-label={playing ? "Pausar" : "Reproduzir"}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="h-10 w-10 rounded-full hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                aria-label="Reiniciar"
                title="Reiniciar (R)"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={() => setSpeedIdx(i => (i + 1) % SPEEDS.length)}
                className="h-10 px-3 rounded-full hover:bg-muted/60 flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition"
                title="Velocidade (← →)"
              >
                <Gauge className="h-3.5 w-3.5" />
                {SPEEDS[speedIdx]}x
              </button>

              <div className="h-6 w-px bg-border mx-1" />

              <button
                onClick={toggleFs}
                className="h-10 w-10 rounded-full hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                aria-label="Tela cheia"
                title="Tela cheia (F)"
              >
                {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              <button
                onClick={onExit}
                className="h-10 w-10 rounded-full hover:bg-destructive/15 flex items-center justify-center text-muted-foreground hover:text-destructive transition"
                aria-label="Sair (Esc)"
                title="Sair (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
              Modo Apresentação · Espaço pausa · Esc sai
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PresentationMode;
