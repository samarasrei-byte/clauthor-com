import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import thorPhoto from "@/assets/kaelis-ai.webp";

export interface TourStep {
  /** CSS selector to highlight (optional - if absent, Thor speaks centrally) */
  selector?: string;
  /** Thor's spoken text */
  speech: string;
  /** Short label shown as subtitle */
  label: string;
}

interface ThorGuidedTourProps {
  steps: TourStep[];
  storageKey: string;
  onComplete?: () => void;
}

import { DEFAULT_VOICE_ID as THOR_VOICE_ID } from "@/components/thor/ThorVoice";

const ThorGuidedTour = ({ steps, storageKey, onComplete }: ThorGuidedTourProps) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(0);

  const { speak, stop: stopTTS, isSpeaking } = useElevenLabsTTS({
    onStart: () => {},
    onEnd: () => {},
  });

  // Auto-start on first visit
  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      const timer = setTimeout(() => setIsActive(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

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
        typingRef.current = setTimeout(tick, 22);
      } else {
        setIsTyping(false);
      }
    };
    tick();
  }, []);

  // Highlight target element
  const updateHighlight = useCallback((selector?: string) => {
    if (!selector) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setHighlightRect(null);
    }
  }, []);

  // Play current step
  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;
    const step = steps[currentStep];

    // Type the text
    typeText(step.speech);

    // Highlight element
    setTimeout(() => updateHighlight(step.selector), 400);

    // Speak with TTS
    if (voiceEnabled) {
      speak(step.speech, THOR_VOICE_ID);
    }

    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, [isActive, currentStep, voiceEnabled]);

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
    onComplete?.();
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  if (!isActive) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        onClick={restartTour}
        className="fixed bottom-24 right-4 z-[60] w-12 h-12 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform"
        title="Iniciar tour com Thor"
      >
        <RotateCcw className="w-5 h-5 text-primary-foreground" />
      </motion.button>
    );
  }

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Position Thor's dialog near the highlighted element or center
  const dialogPosition = highlightRect
    ? {
        top: highlightRect.bottom + 16 > window.innerHeight - 260
          ? Math.max(16, highlightRect.top - 260)
          : highlightRect.bottom + 16,
        left: Math.min(
          Math.max(16, highlightRect.left),
          window.innerWidth - 420
        ),
      }
    : { top: "50%", left: "50%" };

  const isCenter = !highlightRect;

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        <motion.div
          key="tour-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] pointer-events-auto"
          onClick={closeTour}
        >
          {/* Semi-transparent backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

          {/* Spotlight cutout for highlighted element */}
          {highlightRect && (
            <div
              className="absolute rounded-xl ring-4 ring-primary/60 ring-offset-2 ring-offset-transparent"
              style={{
                top: highlightRect.top - 8,
                left: highlightRect.left - 8,
                width: highlightRect.width + 16,
                height: highlightRect.height + 16,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.6), 0 0 40px rgba(var(--primary),0.3)",
                background: "transparent",
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Thor Dialog Card */}
      <motion.div
        key={`tour-step-${currentStep}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed z-[80] pointer-events-auto"
        style={
          isCenter
            ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
            : { top: dialogPosition.top, left: dialogPosition.left }
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-[380px] max-w-[90vw] bg-card/95 backdrop-blur-xl border border-border/30 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/70"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 p-4 pb-2">
            {/* Thor avatar with pulsing ring */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg shadow-primary/20">
                <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
              </div>
              {isSpeaking && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-accent-emerald rounded-full border-2 border-card" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-foreground">THOR</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                  CEO & Orchestrator
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{step.label}</p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) stopTTS(); }}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={closeTour}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Speech bubble */}
          <div className="px-4 pb-3">
            <div className="bg-muted/40 rounded-xl p-3 min-h-[60px]">
              <p className="text-sm text-foreground/90 leading-relaxed">
                {displayedText}
                {isTyping && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-text-bottom"
                  />
                )}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-4 pb-4">
            <span className="text-[11px] text-muted-foreground font-medium">
              {currentStep + 1} / {steps.length}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={goPrev}
                disabled={currentStep === 0}
                className="h-8 px-3 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Voltar
              </Button>
              <Button
                size="sm"
                onClick={goNext}
                className="h-8 px-4 text-xs bg-primary hover:bg-primary/90"
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

export default ThorGuidedTour;
export { ThorGuidedTour };
