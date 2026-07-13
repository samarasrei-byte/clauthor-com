import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantId } from "@/hooks/useTenantId";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  agentId?: string | null;
  agentName?: string;
  userMessage?: string;
  assistantMessage: string;
  messageId?: string;
}

/**
 * 👍/👎 + comentário em qualquer resposta de agente.
 * Alimenta o agent_memory como aprendizado procedural quando negativo.
 */
export default function AgentFeedback({ agentId, agentName, userMessage, assistantMessage, messageId }: Props) {
  const { user } = useAuth();
  const { data: tenantId } = useTenantId();
  const [rating, setRating] = useState<-1 | 1 | null>(null);
  const [comment, setComment] = useState("");
  const [showBox, setShowBox] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (r: -1 | 1) => {
    if (!user?.id || !tenantId) return;
    setRating(r);
    if (r === -1 && !showBox) {
      setShowBox(true);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("agent_feedback").insert({
      tenant_id: tenantId,
      user_id: user.id,
      agent_id: agentId ?? null,
      agent_name: agentName ?? null,
      message_id: messageId ?? null,
      rating: r,
      comment: comment || null,
      user_message: userMessage?.slice(0, 2000) ?? null,
      assistant_message: assistantMessage.slice(0, 4000),
    });
    setSaving(false);
    if (error) {
      toast.error("Não foi possível registrar o feedback");
      return;
    }
    toast.success(r === 1 ? "Obrigado pelo feedback!" : "Anotado · vamos melhorar.");
    setShowBox(false);
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className={`h-7 px-2 ${rating === 1 ? "text-emerald-500" : "text-muted-foreground"}`}
          onClick={() => submit(1)}
          disabled={saving}
          aria-label="Resposta útil"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`h-7 px-2 ${rating === -1 ? "text-destructive" : "text-muted-foreground"}`}
          onClick={() => submit(-1)}
          disabled={saving}
          aria-label="Resposta ruim"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </Button>
      </div>
      {showBox && (
        <div className="mt-2 space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="O que faltou nesta resposta? (opcional)"
            className="text-xs min-h-16"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => submit(-1)} disabled={saving}>
              Enviar feedback
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowBox(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
