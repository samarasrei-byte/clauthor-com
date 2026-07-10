import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Brain, ChevronRight, Pause, Play, X, MessageSquare, Volume2, VolumeX } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { DEFAULT_VOICE_ID as THOR_VOICE_ID } from "@/components/thor/ThorVoice";
import { trackKpi } from "@/lib/kpiTracker";

const MUTE_STORAGE_KEY = "thor_guide_muted";


// ─── Section guide data (pre-written, no AI needed) ───
interface GuideStep {
  section: string;
  title: string;
  message: string;
}

// Cobertura de todas as seções principais do painel. Cada clique no menu
// lateral dispara a explicação correspondente com voz do Thor.
const GUIDE_STEPS: GuideStep[] = [
  {
    section: "overview",
    title: "Command Center",
    message: "Este é o seu Command Center — o hub central onde você monitora tudo: desempenho dos agentes, tarefas pendentes e ações rápidas do seu time de IA.",
  },
  {
    section: "workspace",
    title: "Workspace",
    message: "Aqui é o seu Workspace — o espaço onde você sobe seus conteúdos, materiais de referência e gera roteiros e briefings para os agentes trabalharem em cima.",
  },
  {
    section: "intelligence-hub",
    title: "Inteligência",
    message: "No Intelligence Hub você vê os insights consolidados: métricas, tendências e recomendações que os agentes geram a partir da sua operação.",
  },
  {
    section: "agents",
    title: "Meus Agentes",
    message: "Aqui estão todos os agentes trabalhando para você. Cada um é especialista em uma função — pense neles como funcionários digitais que nunca dormem.",
  },
  {
    section: "neural-network",
    title: "Rede Neural",
    message: "Esta é a Rede Neural do CLAUTHOR. Aqui você visualiza os departamentos ativos, como os agentes se comunicam entre si e como as decisões fluem pela sua operação.",
  },
  {
    section: "omnix",
    title: "Thor",
    message: "Aqui é onde eu moro. Delegue tarefas, faça perguntas estratégicas ou me deixe orquestrar toda a sua equipe de IA. Sou seu co-piloto direto.",
  },
  {
    section: "chat",
    title: "Chat do Agente",
    message: "Este é o chat direto com o agente selecionado. Converse, peça entregas, revise materiais — tudo em linguagem natural.",
  },
  {
    section: "library",
    title: "Biblioteca",
    message: "Seu marketplace de agentes e departamentos. Navegue, compare e contrate os que resolvem suas dores em um clique.",
  },
  {
    section: "integrations",
    title: "Integrações",
    message: "Conecte WhatsApp, e-mail, CRM e mais. Cada integração multiplica o poder dos seus agentes ligando eles às ferramentas que você já usa.",
  },
  {
    section: "system",
    title: "Sistema",
    message: "Nas configurações de sistema você ajusta preferências da conta, idioma, notificações e permissões do seu workspace.",
  },
];

// Explicação genérica para departamentos (dept-*) sem duplicar entrada por depto.
const DEPT_MESSAGE = "Este é um departamento do seu time. Aqui você vê os agentes que compõem o squad, o que eles entregam e como você pode ativar ou pausar cada um.";

// ─── Neural Radial Waveform Visualizer ───
type WaveMode = "speaking" | "listening" | "idle";

const RING_SEGMENTS = 64;
const PARTICLE_COUNT = 12;
const SVG_SIZE = 200;
const CENTER = SVG_SIZE / 2;
const BASE_RADIUS = 38;

const NeuralWaveform = ({ mode }: { mode: WaveMode }) => {
  const seeds = useRef(
    Array.from({ length: RING_SEGMENTS }, () => [Math.random(), Math.random(), Math.random()])
  ).current;

  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      angle: Math.random() * 360,
      speed: 2 + Math.random() * 4,
      dist: 8 + Math.random() * 18,
      size: 1 + Math.random() * 1.5,
      delay: Math.random() * 3,
    }))
  ).current;

  const isSpeaking = mode === "speaking";
  const isListening = mode === "listening";
  const isIdle = mode === "idle";
  const intensity = isSpeaking ? 1.4 : isListening ? 0.9 : 0.2;

  // Generate the animated radial path segments
  const getPathForSegment = (index: number, amplitude: number) => {
    const angleStep = (2 * Math.PI) / RING_SEGMENTS;
    const angle = angleStep * index;
    const nextAngle = angleStep * (index + 1);
    const r = BASE_RADIUS + amplitude;
    const x1 = CENTER + Math.cos(angle) * r;
    const y1 = CENTER + Math.sin(angle) * r;
    const x2 = CENTER + Math.cos(nextAngle) * r;
    const y2 = CENTER + Math.sin(nextAngle) * r;
    return { x1, y1, x2, y2, angle };
  };

  return (
    <div className="relative w-full flex items-center justify-center" style={{ height: 90 }}>
      <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} width={90} height={90} className="overflow-visible">
        <defs>
          <radialGradient id="neural-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15 * intensity} />
            <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity={0.04 * intensity} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </radialGradient>
          <filter id="neural-bloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={isSpeaking ? 3 : 1.5} />
          </filter>
          <filter id="neural-bloom-lg" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={6} />
          </filter>
        </defs>

        {/* Ambient glow */}
        <motion.circle
          cx={CENTER} cy={CENTER} r={65}
          fill="url(#neural-glow)"
          animate={{
            r: isSpeaking ? [60, 72, 60] : isListening ? [58, 64, 58] : [55, 58, 55],
            opacity: isSpeaking ? [0.6, 1, 0.6] : [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Core bloom halo */}
        <motion.circle
          cx={CENTER} cy={CENTER} r={8}
          fill="hsl(var(--primary))"
          filter="url(#neural-bloom-lg)"
          animate={{
            r: isSpeaking ? [12, 22, 14, 20, 12] : isListening ? [10, 15, 10] : [8, 10, 8],
            opacity: [0.06, 0.15 * intensity, 0.06],
          }}
          transition={{ duration: isSpeaking ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Neural ring segments - each bar radiates outward from center */}
        {seeds.map(([r1, r2, r3], i) => {
          const angleStep = (2 * Math.PI) / RING_SEGMENTS;
          const angle = angleStep * i;
          const dist = Math.abs(i - RING_SEGMENTS / 2) / (RING_SEGMENTS / 2);
          const envelope = 1 - dist * 0.3; // slight variation

          const innerR = BASE_RADIUS;
          const maxOuterExtent = isSpeaking ? 24 : isListening ? 12 : 4;

          const x1 = CENTER + Math.cos(angle) * innerR;
          const y1 = CENTER + Math.sin(angle) * innerR;

          return (
            <motion.line
              key={i}
              x1={x1} y1={y1}
              stroke="hsl(var(--primary))"
              strokeWidth={isSpeaking ? 1.8 : 1.2}
              strokeLinecap="round"
              animate={{
                x2: isSpeaking
                  ? [
                      CENTER + Math.cos(angle) * (innerR + 2),
                      CENTER + Math.cos(angle) * (innerR + maxOuterExtent * (0.4 + r1 * 0.6) * envelope),
                      CENTER + Math.cos(angle) * (innerR + maxOuterExtent * 0.15 * envelope),
                      CENTER + Math.cos(angle) * (innerR + maxOuterExtent * (0.3 + r2 * 0.7) * envelope),
                      CENTER + Math.cos(angle) * (innerR + 2),
                    ]
                  : isListening
                  ? [
                      CENTER + Math.cos(angle) * (innerR + 1),
                      CENTER + Math.cos(angle) * (innerR + maxOuterExtent * (0.3 + r1 * 0.5) * envelope),
                      CENTER + Math.cos(angle) * (innerR + 1),
                    ]
                  : [
                      CENTER + Math.cos(angle) * (innerR + 1),
                      CENTER + Math.cos(angle) * (innerR + maxOuterExtent * envelope),
                      CENTER + Math.cos(angle) * (innerR + 1),
                    ],
                y2: isSpeaking
                  ? [
                      CENTER + Math.sin(angle) * (innerR + 2),
                      CENTER + Math.sin(angle) * (innerR + maxOuterExtent * (0.4 + r1 * 0.6) * envelope),
                      CENTER + Math.sin(angle) * (innerR + maxOuterExtent * 0.15 * envelope),
                      CENTER + Math.sin(angle) * (innerR + maxOuterExtent * (0.3 + r2 * 0.7) * envelope),
                      CENTER + Math.sin(angle) * (innerR + 2),
                    ]
                  : isListening
                  ? [
                      CENTER + Math.sin(angle) * (innerR + 1),
                      CENTER + Math.sin(angle) * (innerR + maxOuterExtent * (0.3 + r1 * 0.5) * envelope),
                      CENTER + Math.sin(angle) * (innerR + 1),
                    ]
                  : [
                      CENTER + Math.sin(angle) * (innerR + 1),
                      CENTER + Math.sin(angle) * (innerR + maxOuterExtent * envelope),
                      CENTER + Math.sin(angle) * (innerR + 1),
                    ],
                opacity: isSpeaking
                  ? [0.3, 0.9 * envelope, 0.4, 0.85 * envelope, 0.3]
                  : isListening
                  ? [0.2, 0.5 * envelope, 0.2]
                  : [0.08, 0.15, 0.08],
              }}
              transition={{
                duration: isSpeaking ? 0.5 + r1 * 0.5 : isListening ? 1.8 + r1 * 1.2 : 3 + r1 * 2,
                repeat: Infinity,
                delay: i * 0.012,
                ease: "easeInOut",
              }}
              style={{
                filter: isSpeaking && envelope > 0.7 ? "url(#neural-bloom)" : "none",
              }}
            />
          );
        })}

        {/* Orbital arc */}
        <motion.circle
          cx={CENTER} cy={CENTER}
          r={BASE_RADIUS - 4}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={0.8}
          strokeDasharray="6 8"
          strokeLinecap="round"
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          animate={{
            rotate: [0, 360],
            strokeOpacity: isSpeaking ? [0.2, 0.5, 0.2] : [0.08, 0.15, 0.08],
          }}
          transition={{
            rotate: { duration: 12, repeat: Infinity, ease: "linear" },
            strokeOpacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Second orbital arc - counter-rotating */}
        <motion.circle
          cx={CENTER} cy={CENTER}
          r={BASE_RADIUS + (isSpeaking ? 28 : isListening ? 16 : 8)}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={0.5}
          strokeDasharray="4 14"
          strokeLinecap="round"
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          animate={{
            rotate: [360, 0],
            strokeOpacity: [0.06, 0.2 * intensity, 0.06],
          }}
          transition={{
            rotate: { duration: 18, repeat: Infinity, ease: "linear" },
            strokeOpacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Floating particles */}
        {!isIdle && particles.map((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          const cx = CENTER + Math.cos(rad) * (BASE_RADIUS + p.dist);
          const cy = CENTER + Math.sin(rad) * (BASE_RADIUS + p.dist);
          return (
            <motion.circle
              key={`np-${i}`}
              r={p.size}
              fill="hsl(var(--primary))"
              filter="url(#neural-bloom)"
              animate={{
                cx: [cx, cx + Math.cos(rad) * 8, cx - Math.cos(rad) * 4, cx],
                cy: [cy, cy + Math.sin(rad) * 8, cy - Math.sin(rad) * 4, cy],
                opacity: [0, 0.7 * intensity, 0.2, 0],
                r: isSpeaking ? [p.size, p.size * 2, p.size] : [p.size, p.size * 1.3, p.size],
              }}
              transition={{
                duration: p.speed,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* Core nucleus */}
        <motion.circle
          cx={CENTER} cy={CENTER} r={3}
          fill="hsl(var(--primary))"
          animate={{
            r: isSpeaking ? [4, 8, 3, 7, 4] : isListening ? [3, 5, 3] : [2, 3, 2],
            opacity: [0.3, 0.8 * intensity, 0.3],
          }}
          transition={{
            duration: isSpeaking ? 0.35 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Specular highlight */}
        <ellipse
          cx={CENTER - 6} cy={CENTER - 8}
          rx={4} ry={2.5}
          fill="white"
          opacity={isSpeaking ? 0.12 : 0.04}
          style={{ filter: "blur(2px)" }}
        />
      </svg>

      {/* Mode label underneath */}
      <motion.span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isSpeaking ? "falando" : isListening ? "ouvindo" : "em espera"}
      </motion.span>
    </div>
  );
};

interface ThorLiveGuideProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onDismiss: () => void;
}

const ThorLiveGuide = ({ activeSection, onNavigate, onDismiss }: ThorLiveGuideProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [showAskThor, setShowAskThor] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set(["overview"]));
  const [hasGreeted, setHasGreeted] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMutedRef = useRef(isMuted);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Persist mute preference across sessions ("sempre mudo")
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, isMuted ? "1" : "0");
    } catch { /* ignore quota / privacy mode */ }
  }, [isMuted]);


  const { speak, stop: stopTTS, isSpeaking } = useElevenLabsTTS();

  const WELCOME_MESSAGE = "Bem-vindo! Eu sou o Thor, seu co-piloto de IA dentro do CLAUTHOR. Vou te guiar pela plataforma para que você entenda tudo em poucos minutos. Navegue pelo menu lateral — eu explico cada seção enquanto você explora.";

  // Typewriter + voice combined
  const playMessage = useCallback((text: string) => {
    if (typingRef.current) clearTimeout(typingRef.current);
    setIsTyping(true);
    setDisplayedText("");
    let i = 0;
    const type = () => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        typingRef.current = setTimeout(type, 18);
      } else {
        setIsTyping(false);
      }
    };
    type();
    // Fire TTS in parallel unless muted
    if (!isMutedRef.current) {
      stopTTS();
      speak(text, THOR_VOICE_ID).catch(() => { /* silent */ });
    }
  }, [speak, stopTTS]);

  // Initial greeting
  useEffect(() => {
    if (!hasGreeted) {
      setHasGreeted(true);
      setCurrentMessage(WELCOME_MESSAGE);
      // slight delay so mount animations settle before speaking
      const t = setTimeout(() => playMessage(WELCOME_MESSAGE), 400);
      return () => clearTimeout(t);
    }
  }, [hasGreeted, playMessage]);

  // React to section changes — fires the explanation for the section the user clicked
  useEffect(() => {
    if (isPaused || !hasGreeted) return;

    const step = GUIDE_STEPS.find(s => s.section === activeSection);
    const isDept = activeSection.startsWith("dept-");
    if (!step && !isDept) return;

    // Don't re-fire overview right after the welcome greeting
    if (activeSection === "overview" && !visitedSections.has("overview_revisit")) {
      setVisitedSections(prev => new Set(prev).add("overview_revisit"));
      return;
    }

    const title = step?.title ?? "Departamento";
    const base = step?.message ?? DEPT_MESSAGE;
    const isFirstVisit = !visitedSections.has(activeSection);
    const message = isFirstVisit ? base : `Você voltou para ${title}. ${base.split(".")[0]}.`;

    setCurrentMessage(message);
    playMessage(message);

    trackKpi("thor_guide_section_play", {
      source: "thor_guide",
      section: activeSection,
      is_first_visit: isFirstVisit,
      muted: isMutedRef.current,
    });

    if (isFirstVisit) {
      setVisitedSections(prev => new Set(prev).add(activeSection));
    }

  }, [activeSection, isPaused, hasGreeted, playMessage, visitedSections]);

  // When user mutes mid-speech, stop the audio immediately
  useEffect(() => {
    if (isMuted) stopTTS();
  }, [isMuted, stopTTS]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
      stopTTS();
    };
  }, [stopTTS]);


  // Find current and next step
  const currentStepIndex = GUIDE_STEPS.findIndex(s => s.section === activeSection);
  const nextStep = currentStepIndex >= 0 && currentStepIndex < GUIDE_STEPS.length - 1
    ? GUIDE_STEPS[currentStepIndex + 1]
    : null;

  const progress = visitedSections.size / GUIDE_STEPS.length;

  // ─── Minimized state: slim spotlight pill (bottom-center) ───
  if (!isExpanded) {
    return (
      <motion.button
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 group flex items-center gap-2.5 pl-2.5 pr-3.5 py-1.5 rounded-full bg-background/70 backdrop-blur-xl border border-border/30 shadow-[0_4px_24px_hsl(0_0%_0%/0.18)] hover:border-primary/40 transition-colors"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <span className="text-[11px] font-medium text-foreground/90">Thor</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {visitedSections.size}/{GUIDE_STEPS.length}
        </span>
        <span className="hidden sm:inline text-[10px] text-muted-foreground/70 truncate max-w-[180px]">
          · {isPaused ? "Pausado" : isTyping ? "Falando…" : "Toque para continuar"}
        </span>
        <ChevronRight className="h-3 w-3 text-muted-foreground/60 group-hover:text-primary transition-colors" />
      </motion.button>
    );
  }

  // ─── Expanded panel: compact, modern, bottom-center ───
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border/20 bg-background/85 backdrop-blur-2xl shadow-[0_12px_40px_hsl(0_0%_0%/0.25)] overflow-hidden"
      >
        {/* Header: slim — dot + label + inline waveform + controls */}
        <div className="px-3.5 pt-3 pb-2 flex items-center gap-2.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-[12px] font-semibold tracking-tight">Thor</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">GUIA</span>

          {/* Inline equalizer (replaces big waveform block) */}
          <div className="flex-1 flex items-center justify-center gap-[2px] h-3 overflow-hidden">
            {[3, 6, 4, 8, 5, 7, 4, 6, 3].map((h, i) => (
              <motion.span
                key={i}
                className="w-[2px] rounded-full bg-primary/50"
                animate={{
                  height: isPaused ? 2 : isTyping ? [h, h * 1.6, h] : [h * 0.6, h, h * 0.6],
                }}
                transition={{ duration: 0.6 + i * 0.08, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>

          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {visitedSections.size}/{GUIDE_STEPS.length}
          </span>
          <button
            onClick={() => setIsMuted(!isMuted)}
            aria-label="Som"
            className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            aria-label="Minimizar"
            className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Thin progress line */}
        <div className="h-[2px] bg-muted/20">
          <motion.div
            className="h-full bg-primary/70"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Message — clickable to replay explanation with voice */}
        <button
          type="button"
          onClick={() => currentMessage && playMessage(currentMessage)}
          className="w-full text-left px-3.5 py-3 hover:bg-muted/10 transition-colors group/msg"
          title="Clique para ouvir novamente"
        >
          <p className="text-[12.5px] leading-relaxed text-foreground/90">
            {displayedText}
            {isTyping && <span className="inline-block w-[2px] h-[12px] bg-primary ml-0.5 animate-pulse align-text-bottom" />}
          </p>
          {!isTyping && currentMessage && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-[9.5px] text-muted-foreground/50 group-hover/msg:text-primary/70 transition-colors">
              <Volume2 className="h-2.5 w-2.5" />
              {isSpeaking ? "Falando…" : "Clique para ouvir de novo"}
            </span>
          )}
        </button>


        {/* Action row — compact icon-led buttons */}
        <div className="px-2.5 pb-2.5 flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[10.5px] gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {isPaused ? "Retomar" : "Pausar"}
          </Button>

          {nextStep && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[10.5px] gap-1 text-primary hover:text-primary hover:bg-primary/10 flex-1 justify-start truncate"
              onClick={() => onNavigate(nextStep.section)}
            >
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="truncate">{nextStep.title}</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[10.5px] gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => { onNavigate("omnix"); onDismiss(); }}
          >
            <MessageSquare className="h-3 w-3" />
          </Button>

          <button
            onClick={onDismiss}
            aria-label="Encerrar tour"
            className="h-7 px-2 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Encerrar
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};


export default ThorLiveGuide;
