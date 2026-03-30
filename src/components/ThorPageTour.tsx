import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, RotateCcw, Volume2, VolumeX, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import thorPhoto from "@/assets/kaelis-ai.webp";

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

import { DEFAULT_VOICE_ID as THOR_VOICE_ID } from "@/components/thor/ThorVoice";
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
        transition={{ delay: 0.5, type: "spring", damping: 14, stiffness: 120 }}
        onClick={restartTour}
        className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-[60] group cursor-pointer"
        title="Tour com Thor"
      >
        {/* Outer rotating glow ring */}
        <motion.span
          className="absolute inset-[-4px] rounded-full overflow-hidden"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <span
            className="absolute inset-0"
            style={{
              background: "conic-gradient(from 0deg, transparent 40%, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.2), transparent 80%)",
            }}
          />
        </motion.span>

        {/* Glass border ring */}
        <span className="absolute inset-[-1px] rounded-full bg-gradient-to-b from-primary/30 via-primary/10 to-primary/30" />

        {/* Inner container */}
        <span className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-background/90 backdrop-blur-2xl overflow-hidden">
          {/* Photo */}
          <img
            src={thorPhoto}
            alt="Thor"
            className="w-full h-full object-cover rounded-full"
          />

          {/* Subtle inner vignette */}
          <span className="absolute inset-0 rounded-full shadow-[inset_0_0_12px_hsl(var(--primary)/0.15)]" />

          {/* Bottom gradient for depth */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-t from-background/40 via-transparent to-transparent" />
        </span>

        {/* Pulse behind on hover */}
        <motion.span
          className="absolute inset-[-6px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.3), 0 0 80px hsl(var(--primary) / 0.1)" }}
        />

        {/* Online indicator */}
        <span className="absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-background z-10">
          <span className="block w-full h-full rounded-full bg-accent-emerald" />
          <span className="absolute inset-0 rounded-full bg-accent-emerald animate-ping opacity-60" />
        </span>

        {/* Tooltip on hover */}
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-wider uppercase text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap bg-background/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-border/30">
          THOR · Tour
        </span>
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

      {/* Thor Dialog - centered */}
      <motion.div
        key={`tour-dialog-${currentStep}`}
        initial={{ opacity: 0, y: 30, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[85] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-[480px] max-w-[94vw]">
          {/* Outer glow ring */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-primary/30 via-primary/10 to-transparent opacity-60" />
          
          {/* Subtle scan-line texture */}
          <div
            className="absolute inset-0 rounded-2xl opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground)) 2px, hsl(var(--foreground)) 3px)",
            }}
          />

          <div className="relative bg-card/90 backdrop-blur-2xl border border-border/20 rounded-2xl overflow-hidden">
            {/* Top accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {/* Progress track */}
            <div className="h-[2px] bg-muted/30">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/60"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Route chips */}
            <div className="flex items-center gap-1.5 px-4 pt-3 pb-1 overflow-x-auto scrollbar-hide">
              {steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { stopTTS(); setCurrentStep(i); }}
                  className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[9px] font-mono uppercase tracking-widest transition-all duration-300 ${
                    i === currentStep
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : i < currentStep
                      ? "text-primary/50 border border-transparent"
                      : "text-muted-foreground/40 border border-transparent"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex items-start gap-4 p-5 pt-3">
              {/* Thor avatar column */}
              <div className="relative flex-shrink-0 flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-primary/20 shadow-lg shadow-primary/5">
                    <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
                  </div>
                  {/* Breathing ring */}
                  {isSpeaking && (
                    <motion.div
                      className="absolute -inset-1 rounded-xl border border-primary/40"
                      animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.06, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  {/* Status dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent-emerald border-2 border-card" />
                </div>
              </div>

              {/* Text area */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-display font-bold text-sm text-foreground tracking-wide">THOR</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-mono uppercase tracking-widest border border-primary/10">
                    CEO · Orchestrator
                  </span>
                </div>

                {step?.pageTitle && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1 h-1 rounded-full bg-primary/60" />
                    <span className="text-[10px] text-muted-foreground font-mono tracking-wider">
                      {step.pageTitle}
                    </span>
                  </div>
                )}

                <div className="relative rounded-lg p-3 min-h-[60px] max-h-[130px] overflow-y-auto bg-muted/20 border border-border/10">
                  <p className="text-[13px] text-foreground/85 leading-[1.7] font-light">
                    {displayedText}
                    {isTyping && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="inline-block w-[2px] h-3.5 bg-primary ml-0.5 align-text-bottom rounded-full"
                      />
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 pb-4 pt-0">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground/50 font-mono tabular-nums">
                  {String(currentStep + 1).padStart(2, "0")}/{String(steps.length).padStart(2, "0")}
                </span>
                <button
                  onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) stopTTS(); }}
                  className="p-1 rounded-md hover:bg-muted/30 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={closeTour}
                  className="h-7 px-2.5 rounded-md text-[10px] text-muted-foreground/40 hover:text-foreground hover:bg-muted/20 transition-all font-mono uppercase tracking-wider"
                >
                  Pular
                </button>
                <button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all disabled:opacity-20"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={goNext}
                  className="h-7 px-4 rounded-md text-[11px] font-medium bg-primary/90 hover:bg-primary text-primary-foreground transition-all flex items-center gap-1"
                >
                  {currentStep === steps.length - 1 ? "Concluir" : "Próximo"}
                  {currentStep < steps.length - 1 && <ChevronRight className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Bottom accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ThorPageTour;
