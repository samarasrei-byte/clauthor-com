import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ChatFeedbackProps {
  userMessage: string;
  assistantMessage: string;
  agentId?: string;
}

const ChatFeedback = ({ userMessage, assistantMessage, agentId }: ChatFeedbackProps) => {
  const [rating, setRating] = useState<"positive" | "negative" | null>(null);
  const [showText, setShowText] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = async (selectedRating: "positive" | "negative", text?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const userId = session.session.user.id;

      // Get tenant_id
      const { data: tenant } = await supabase.rpc("get_user_tenant_id", { _user_id: userId });
      if (!tenant) return;

      await supabase.from("chat_feedback").insert({
        user_id: userId,
        tenant_id: tenant,
        agent_id: agentId || null,
        message_content: userMessage.slice(0, 500),
        response_content: assistantMessage.slice(0, 1000),
        rating: selectedRating,
        feedback_text: text || null,
        metadata: { timestamp: new Date().toISOString() },
      });

      setSubmitted(true);
      toast.success(selectedRating === "positive" ? "Obrigado pelo feedback positivo! 👍" : "Feedback registrado. Vamos melhorar! 🔧");
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const handleRating = (r: "positive" | "negative") => {
    setRating(r);
    if (r === "positive") {
      submitFeedback(r);
    } else {
      setShowText(true);
    }
  };

  const handleSubmitText = () => {
    if (rating) {
      submitFeedback(rating, feedbackText);
      setShowText(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mt-1.5">
        <span className="text-[10px] text-muted-foreground/50">
          {rating === "positive" ? "👍" : "👎"} Feedback registrado
        </span>
      </motion.div>
    );
  }

  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${rating === "positive" ? "text-primary" : "text-muted-foreground/40 hover:text-primary"}`}
          onClick={() => handleRating("positive")}
          title="Resposta útil"
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${rating === "negative" ? "text-destructive" : "text-muted-foreground/40 hover:text-destructive"}`}
          onClick={() => handleRating("negative")}
          title="Resposta pode melhorar"
        >
          <ThumbsDown className="h-3 w-3" />
        </Button>
      </div>

      <AnimatePresence>
        {showText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-2"
          >
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="O que poderia ser melhor? (opcional)"
              className="text-xs h-16 resize-none bg-card border-border/20"
            />
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowText(false); submitFeedback("negative"); }}>
                Pular
              </Button>
              <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSubmitText}>
                <Send className="h-3 w-3" /> Enviar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatFeedback;
