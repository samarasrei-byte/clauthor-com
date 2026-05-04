import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import thorPhoto from "@/assets/kaelis-ai.webp";

const SESSION_KEY = "clauthor_exit_intent_shown";

const ExitIntentCapture = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !triggered.current) {
        triggered.current = true;
        sessionStorage.setItem(SESSION_KEY, "1");
        setShow(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from("waitlist").insert({
        email: email.trim(),
        whatsapp: "",
        name: "Exit Intent Capture",
        company: "30% OFF",
        status: "exit_intent",
      });
      setSubmitted(true);
      toast.success("Acesso garantido! Verifique seu email.");
    } catch {
      toast.error("Erro ao registrar. Tente novamente.");
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {show && !submitted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-md w-full rounded-2xl border border-primary/20 bg-card p-8 shadow-2xl"
          >
            <button
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-accent-violet/20">
                <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-display font-bold text-sm">Thor</p>
                <p className="font-mono text-[10px] text-muted-foreground">AI Assistant</p>
              </div>
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed mb-6">
              Antes de ir - posso te mostrar um resultado real em <span className="text-primary font-bold">60 segundos</span>.
              Deixe seu email e ganhe <span className="text-primary font-bold">30% OFF</span> exclusivo no lançamento.
            </p>

            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="flex-1 h-11 px-4 rounded-xl border border-border bg-muted/20 text-sm font-mono focus:outline-none focus:border-primary/30 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <Button
                onClick={handleSubmit}
                disabled={submitting || !email.trim()}
                className="h-11 px-5 rounded-xl gap-2"
              >
                <Rocket className="h-3.5 w-3.5" />
                Garantir
              </Button>
            </div>

            <p className="font-mono text-[9px] text-muted-foreground/50 text-center mt-3">
              Sem spam. Cancelamento a qualquer momento.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentCapture;
