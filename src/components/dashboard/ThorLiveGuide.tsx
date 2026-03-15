import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Brain, ChevronRight, Pause, Play, X, MessageSquare,
  Sparkles, Volume2, VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Section guide data (pre-written, no AI needed) ───
interface GuideStep {
  section: string;
  title: string;
  message: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    section: "overview",
    title: "Command Center",
    message: "Welcome! This is your Command Center — the central hub where you monitor everything. You can see your agents' performance, pending tasks, and quick actions all in one place.",
  },
  {
    section: "omnix",
    title: "Thor AI Assistant",
    message: "This is where I live! You can talk to me anytime — delegate tasks, ask strategic questions, or let me orchestrate your entire AI team. I'm your co-pilot.",
  },
  {
    section: "agents",
    title: "Your Agents",
    message: "Here you'll find all the AI agents working for you. Each one is specialized in a different area — from sales prospecting to content creation. Think of them as your digital employees.",
  },
  {
    section: "library",
    title: "Agent Library",
    message: "This is the Library — your marketplace of 83+ AI agents across 15 departments. Browse, compare, and hire the ones that match your business needs.",
  },
  {
    section: "war-room",
    title: "Meeting Room",
    message: "This is the Meeting Room. Here you can talk directly with your AI agents and delegate tasks in a collaborative environment. It's like a virtual boardroom for your AI team.",
  },
  {
    section: "live-timeline",
    title: "Timeline",
    message: "This is the Timeline. It shows everything your agents are doing in real time — every task, every execution, every result. Full transparency into your AI operations.",
  },
  {
    section: "mission-control",
    title: "Mission Control",
    message: "This is Mission Control. Here you can observe all your agents working, validate outputs, and train Thor to understand your preferences. It's your AI operations command center.",
  },
  {
    section: "integrations",
    title: "Integrations",
    message: "This is the Integrations section. Here you connect external tools like WhatsApp, email, CRM systems, and more to expand the power of your AI agents.",
  },
  {
    section: "insights",
    title: "Insights",
    message: "Insights gives you deep analytics on your AI team's performance — success rates, execution trends, token usage, and AI quality metrics.",
  },
  {
    section: "control-tower",
    title: "Control Tower",
    message: "The Control Tower centralizes command over your entire agent fleet — credentials, execution feedback, and global metrics in one powerful dashboard.",
  },
  {
    section: "settings",
    title: "Settings",
    message: "Here you can manage your profile, billing, team members, and platform connections. Everything to keep your workspace configured perfectly.",
  },
  {
    section: "equipe",
    title: "Team",
    message: "The Team section lets you manage squad conversations and coordinate between multiple agents working together on complex tasks.",
  },
];

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
          cx={CENTER} cy={CENTER}
          fill="hsl(var(--primary))"
          filter="url(#neural-bloom-lg)"
          animate={{
            r: isSpeaking ? [12, 22, 14, 20, 12] : isListening ? [10, 15, 10] : [8, 10, 8],
            opacity: [0.06, 0.15 * intensity, 0.06],
          }}
          transition={{ duration: isSpeaking ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Neural ring segments — each bar radiates outward from center */}
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

        {/* Second orbital arc — counter-rotating */}
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
          cx={CENTER} cy={CENTER}
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
        {isSpeaking ? "speaking" : isListening ? "listening" : "standby"}
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
  const [isMuted, setIsMuted] = useState(false);
  const [showAskThor, setShowAskThor] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set(["overview"]));
  const [hasGreeted, setHasGreeted] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const WELCOME_MESSAGE = "Welcome! I'm Thor, your AI co-pilot inside CoAutor. I'll guide you through the platform so you can understand everything in just a few minutes. Navigate through the sidebar — I'll explain each section as you explore.";

  // Typewriter effect
  const typeText = useCallback((text: string) => {
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
  }, []);

  // Initial greeting
  useEffect(() => {
    if (!hasGreeted) {
      setHasGreeted(true);
      setCurrentMessage(WELCOME_MESSAGE);
      typeText(WELCOME_MESSAGE);
    }
  }, [hasGreeted, typeText]);

  // React to section changes
  useEffect(() => {
    if (isPaused || !hasGreeted) return;

    const step = GUIDE_STEPS.find(s => s.section === activeSection);
    if (!step) return;

    // Don't repeat the overview message right after greeting
    if (activeSection === "overview" && !visitedSections.has("overview_revisit")) {
      setVisitedSections(prev => new Set(prev).add("overview_revisit"));
      return;
    }

    // Clear any ongoing typing
    if (typingRef.current) clearTimeout(typingRef.current);

    const isFirstVisit = !visitedSections.has(activeSection);
    const message = isFirstVisit
      ? step.message
      : `You're back at ${step.title}. ${step.message.split(".")[0]}.`;

    setCurrentMessage(message);
    typeText(message);

    if (isFirstVisit) {
      setVisitedSections(prev => new Set(prev).add(activeSection));
    }
  }, [activeSection, isPaused, hasGreeted, typeText, visitedSections]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, []);

  // Find current and next step
  const currentStepIndex = GUIDE_STEPS.findIndex(s => s.section === activeSection);
  const nextStep = currentStepIndex >= 0 && currentStepIndex < GUIDE_STEPS.length - 1
    ? GUIDE_STEPS[currentStepIndex + 1]
    : null;

  const progress = visitedSections.size / GUIDE_STEPS.length;

  // ─── Minimized state ───
  if (!isExpanded) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-primary/90 backdrop-blur-xl border border-primary/30 shadow-[0_4px_24px_hsl(var(--primary)/0.3)] flex items-center justify-center hover:scale-105 transition-transform group"
      >
        <Brain className="h-6 w-6 text-primary-foreground" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-2xl border-2 border-primary/40 animate-ping opacity-30" />
        {/* Tooltip */}
        <div className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-background border border-border/20 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
          Thor is guiding you
        </div>
      </motion.button>
    );
  }

  // ─── Expanded panel ───
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border/20 bg-card/95 backdrop-blur-2xl shadow-[0_8px_40px_hsl(0_0%_0%/0.4),0_0_0_1px_hsl(0_0%_100%/0.03)_inset] overflow-hidden"
      >
        {/* Header with glow */}
        <div className="relative px-4 pt-4 pb-3">
          {/* Subtle glow behind avatar */}
          <div className="absolute top-2 left-4 w-10 h-10 bg-primary/20 rounded-full blur-xl" />
          
          <div className="flex items-center gap-3 relative">
            {/* Thor avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">Thor</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">GUIDE</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {isPaused ? "Paused" : isTyping ? "Speaking..." : "Listening"}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-muted/20 overflow-hidden">
              <motion.div
                className="h-full bg-primary/60 rounded-full"
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">
              {visitedSections.size}/{GUIDE_STEPS.length}
            </span>
          </div>
        </div>

        {/* Waveform visualizer */}
        <div className="px-4 pb-2">
          <div className="p-2 rounded-xl bg-background/30 border border-border/5">
            <NeuralWaveform mode={isPaused ? "idle" : isTyping ? "speaking" : "listening"} />
          </div>
        </div>

        {/* Message area */}
        <div className="px-4 pb-3">
          <div className="p-3 rounded-xl bg-background/40 border border-border/10 min-h-[50px]">
            <p className="text-[13px] leading-relaxed text-foreground/90">
              {displayedText}
              {isTyping && <span className="inline-block w-[2px] h-[14px] bg-primary ml-0.5 animate-pulse align-text-bottom" />}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 flex items-center gap-2">
          <Button
            size="sm"
            variant={isPaused ? "default" : "outline"}
            className="h-8 text-[11px] gap-1.5 flex-1"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>

          {nextStep && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px] gap-1.5 flex-1"
              onClick={() => onNavigate(nextStep.section)}
            >
              Next: {nextStep.title}
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-[11px] gap-1.5"
            onClick={() => {
              onNavigate("omnix");
              onDismiss();
            }}
          >
            <MessageSquare className="h-3 w-3" />
            Ask
          </Button>
        </div>

        {/* Dismiss / End tour */}
        <div className="px-4 pb-3 pt-0">
          <button
            onClick={onDismiss}
            className="w-full text-center text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1"
          >
            End tour · I'll explore on my own
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThorLiveGuide;
