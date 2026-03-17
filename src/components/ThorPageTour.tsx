import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, RotateCcw, Volume2, VolumeX, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import thorPhoto from "@/assets/kaelis-ai.png";

export interface PageTourStep {
  route?: string;
  speech: string;
  label: string;
  pageTitle?: string;
}

interface ThorPageTourProps {
  steps: PageTourStep[];
  storageKey: string;
  onComplete?: () => void;
}

const THOR_VOICE_ID = "onwK4e9ZLuTAKqWW03F9";
const TYPING_SPEED = 18;

const ThorPageTour = ({ steps, storageKey, onComplete }: ThorPageTourProps) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showEntrance, setShowEntrance] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  const { speak, stop: stopTTS, isSpeaking } = useElevenLabsTTS({
    onStart: () => {},
    onEnd: () => {},
  });

  // Auto-start on first visit
  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen && location.pathname === "/") {
      const timer = setTimeout(() => {
        setShowEntrance(true);
        setTimeout(() => {
          setShowEntrance(false);
          setIsActive(true);
        }, 2200);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [storageKey, location.pathname]);

  // Typing animation
  const typeText = useCallback((text: string) => {
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    stepRef.current += 1;
    const thisStep = stepRef.current;

    const tick = () => {
      if (stepRef.current !== thisStep) return;
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        typingRef.current = setTimeout(tick, TYPING_SPEED);
      } else {
        setIsTyping(false);
      }
    };
    tick();
  }, []);

  // Navigate & play step
  const playStep = useCallback((stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return;

    const targetRoute = step.route || "/";
    const needsNav = location.pathname !== targetRoute;

    if (needsNav) {
      setIsTransitioning(true);
      navigate(targetRoute);
      // Wait for page to render
      setTimeout(() => {
        setIsTransitioning(false);
        typeText(step.speech);
        if (voiceEnabled) speak(step.speech, THOR_VOICE_ID);
      }, 800);
    } else {
      typeText(step.speech);
      if (voiceEnabled) speak(step.speech, THOR_VOICE_ID);
    }
  }, [steps, location.pathname, navigate, typeText, voiceEnabled, speak]);

  // Play current step on change
  useEffect(() => {
    if (!isActive) return;
    playStep(currentStep);
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, [isActive, currentStep]);

  const goNext = () => {
    stopTTS();
    if (currentStep < steps.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      closeTour();
    }
  };

  const goPrev = () => {
    stopTTS();
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  };

  const closeTour = () => {
    stopTTS();
    if (typingRef.current) clearTimeout(typingRef.current);
    setIsActive(false);
    localStorage.setItem(storageKey, "1");
    navigate("/");
    onComplete?.();
  };

  const restartTour = () => {
    navigate("/");
    setCurrentStep(0);
    setTimeout(() => {
      setShowEntrance(true);
      setTimeout(() => {
        setShowEntrance(false);
        setIsActive(true);
      }, 2200);
    }, 300);
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // ── Cinematic Entrance ──
  if (showEntrance) {
    return (
      <AnimatePresence>
        <motion.div
          key="thor-entrance"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Radial glow */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
            }}
            animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 0.6] }}
            transition={{ duration: 2, ease: "easeOut" }}
          />

          {/* Thor avatar */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6"
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", damping: 15, stiffness: 100 }}
          >
            <motion.div
              className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/50 shadow-2xl shadow-primary/30"
              animate={{ boxShadow: ["0 0 30px hsl(var(--primary) / 0.3)", "0 0 60px hsl(var(--primary) / 0.5)", "0 0 30px hsl(var(--primary) / 0.3)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">THOR</h2>
              <p className="text-sm text-primary font-medium mt-1">CEO & Orchestrator</p>
              <motion.p
                className="text-xs text-muted-foreground mt-3 max-w-[280px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                Preparando seu tour personalizado...
              </motion.p>
            </motion.div>

            {/* Loading dots */}
            <motion.div
              className="flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Restart button when tour inactive ──
  if (!isActive) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        onClick={restartTour}
        className="fixed bottom-24 right-4 z-[60] w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform group"
        title="Tour com Thor"
      >
        <img src={thorPhoto} alt="Thor" className="w-10 h-10 rounded-full object-cover border-2 border-primary-foreground/30" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-emerald border-2 border-background animate-pulse" />
      </motion.button>
    );
  }

  // ── Active Tour UI ──
  return (
    <>
      {/* Page transition overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="page-transition"
            className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-md flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <MapPin className="w-8 h-8 text-primary animate-bounce" />
              <p className="text-sm font-medium text-muted-foreground">
                Navegando para <span className="text-primary">{step?.pageTitle || step?.label}</span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top navigation bar showing route */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[85] h-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/50"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </motion.div>

      {/* Thor Dialog - bottom center */}
      <motion.div
        key={`tour-dialog-${currentStep}`}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[85] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-[460px] max-w-[94vw] bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Route indicator chips */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-1 overflow-x-auto scrollbar-hide">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => { stopTTS(); setCurrentStep(i); }}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  i === currentStep
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : i < currentStep
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex items-start gap-3 p-4">
            {/* Thor avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/40 shadow-lg shadow-primary/10">
                <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
              </div>
              {isSpeaking && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/60"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-accent-emerald rounded-full border-2 border-card" />
            </div>

            {/* Speech content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-display font-bold text-sm text-foreground">THOR</span>
                {step?.pageTitle && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono uppercase tracking-wider">
                    {step.pageTitle}
                  </span>
                )}
              </div>

              <div className="bg-muted/30 rounded-xl p-3 min-h-[56px] max-h-[120px] overflow-y-auto">
                <p className="text-[13px] text-foreground/90 leading-relaxed">
                  {displayedText}
                  {isTyping && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 align-text-bottom"
                    />
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation footer */}
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-mono">
                {currentStep + 1}/{steps.length}
              </span>
              <button
                onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) stopTTS(); }}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={closeTour}
                className="h-7 px-2 text-[11px] text-muted-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Pular
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={goPrev}
                disabled={currentStep === 0}
                className="h-7 px-2 text-[11px]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                onClick={goNext}
                className="h-7 px-4 text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {currentStep === steps.length - 1 ? "Concluir" : "Próximo"}
                {currentStep < steps.length - 1 && <ChevronRight className="w-3.5 h-3.5 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ThorPageTour;
