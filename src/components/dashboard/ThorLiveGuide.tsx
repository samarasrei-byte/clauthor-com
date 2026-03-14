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

// ─── Premium Waveform Visualizer (Siri-level) ───
const WAVE_BARS = 32;

type WaveMode = "speaking" | "listening" | "idle";

const WaveformVisualizer = ({ mode }: { mode: WaveMode }) => {
  const seeds = useRef(
    Array.from({ length: WAVE_BARS }, () => Math.random())
  ).current;

  return (
    <div className="relative w-full h-12 flex items-center justify-center">
      {/* Glow backdrop */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{
          background: mode === "speaking"
            ? "radial-gradient(ellipse at center, hsl(var(--primary) / 0.12) 0%, transparent 70%)"
            : mode === "listening"
            ? "radial-gradient(ellipse at center, hsl(var(--primary) / 0.06) 0%, transparent 70%)"
            : "radial-gradient(ellipse at center, hsl(var(--primary) / 0.03) 0%, transparent 70%)",
        }}
        transition={{ duration: 0.6 }}
      />

      {/* Bars */}
      <div className="flex items-center gap-[1.5px] h-full z-10">
        {seeds.map((seed, i) => {
          const center = Math.abs(i - WAVE_BARS / 2) / (WAVE_BARS / 2);
          const envelope = 1 - center * center; // parabolic envelope
          const peakH = 40 * envelope;
          const idleH = 3 + envelope * 5; // breathing idle height

          const speakingAnim = {
            height: [idleH, peakH * (0.4 + seed * 0.6), idleH * 1.5, peakH * (0.2 + seed * 0.4), idleH],
            opacity: [0.4, 0.95, 0.5, 0.85, 0.4],
          };

          const listeningAnim = {
            height: [idleH, idleH + envelope * 8, idleH, idleH + envelope * 5, idleH],
            opacity: [0.3, 0.6, 0.35, 0.55, 0.3],
          };

          const idleAnim = {
            height: [idleH * 0.8, idleH * 1.2, idleH * 0.8],
            opacity: [0.15, 0.25, 0.15],
          };

          const anim = mode === "speaking" ? speakingAnim
            : mode === "listening" ? listeningAnim
            : idleAnim;

          const dur = mode === "speaking" ? 0.6 + seed * 0.6
            : mode === "listening" ? 2 + seed * 1.5
            : 3 + seed * 2;

          return (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: 2.5,
                background: mode === "speaking"
                  ? `linear-gradient(to top, hsl(var(--primary) / 0.6), hsl(var(--primary)))`
                  : `hsl(var(--primary) / ${mode === "listening" ? 0.5 : 0.2})`,
                boxShadow: mode === "speaking" && envelope > 0.5
                  ? "0 0 6px hsl(var(--primary) / 0.3)"
                  : "none",
              }}
              animate={anim}
              transition={{
                duration: dur,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.025,
              }}
            />
          );
        })}
      </div>
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
            <WaveformVisualizer mode={isPaused ? "idle" : isTyping ? "speaking" : "listening"} />
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
