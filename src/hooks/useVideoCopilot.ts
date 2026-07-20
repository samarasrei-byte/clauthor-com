import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UploadedMedia } from "@/hooks/useVideoUpload";

export type CopilotStep =
  | "intent"
  | "reference"
  | "scene"
  | "mood"
  | "prompt_review"
  | "ready";

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
  createdAt: number;
}

const STEP_ORDER: CopilotStep[] = ["intent", "reference", "scene", "mood", "prompt_review", "ready"];

const QUICK_REPLIES: Partial<Record<CopilotStep, string[]>> = {
  intent: ["Anúncio", "Orgânico", "Institucional", "Demo de produto"],
  reference: ["Sim, vou subir", "Não, gerar do zero"],
  mood: ["Cinematográfico", "Minimalista", "Energético", "Aconchegante"],
};

const INITIAL_MESSAGE: CopilotMessage = {
  id: "init",
  role: "assistant",
  content:
    "Oi, sou o Thor 🎬 Vamos montar seu vídeo em 4 passos rápidos.\n\nPra começar: qual o **objetivo** desse vídeo?",
  quickReplies: QUICK_REPLIES.intent,
  createdAt: Date.now(),
};

/**
 * Hook that runs the Thor Copilot state machine for the Video Studio.
 * Streams from the `video-copilot` edge function and extracts the final
 * prompt from `<<<PROMPT>>>...<<<END>>>` markers.
 */
export function useVideoCopilot() {
  const [messages, setMessages] = useState<CopilotMessage[]>([INITIAL_MESSAGE]);
  const [step, setStep] = useState<CopilotStep>("intent");
  const [attachment, setAttachment] = useState<UploadedMedia | null>(null);
  const [thinking, setThinking] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([INITIAL_MESSAGE]);
    setStep("intent");
    setAttachment(null);
    setThinking(false);
    setFinalPrompt(null);
  }, []);

  const advanceStep = useCallback((current: CopilotStep): CopilotStep => {
    const idx = STEP_ORDER.indexOf(current);
    return STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
  }, []);

  const sendUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;

      const userMsg: CopilotMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };
      const nextStep = advanceStep(step);
      const history = [...messages, userMsg];
      setMessages(history);
      setStep(nextStep);
      setThinking(true);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          toast.error("Sessão expirada · faça login novamente.");
          setThinking(false);
          return;
        }

        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-copilot`;
        abortRef.current = new AbortController();
        const res = await fetch(url, {
          method: "POST",
          signal: abortRef.current.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
          },
          body: JSON.stringify({
            step: nextStep,
            hasImage: !!attachment && attachment.kind === "image",
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "");
          console.error("[copilot] error", res.status, errText);
          toast.error("Thor está indisponível. Tente de novo.");
          setThinking(false);
          return;
        }

        // Stream SSE OpenAI-compatible
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const assistantId = crypto.randomUUID();
        let acc = "";
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "", createdAt: Date.now() },
        ]);

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const clean = line.trim();
            if (!clean.startsWith("data:")) continue;
            const payload = clean.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload);
              const delta = parsed.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                acc += delta;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
                );
              }
            } catch {
              // ignore keepalive
            }
          }
        }

        // Detect final prompt block
        const match = acc.match(/<<<PROMPT>>>([\s\S]*?)<<<END>>>/);
        if (match) {
          const promptClean = match[1].trim();
          const rest = acc.replace(/<<<PROMPT>>>[\s\S]*?<<<END>>>/, "").trim();
          setFinalPrompt(promptClean);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      rest ||
                      "Prompt pronto! Revise à direita e clique em **Gerar vídeo**.",
                  }
                : m,
            ),
          );
          setStep("ready");
        } else {
          // Attach quick-replies for the new step
          const quick = QUICK_REPLIES[nextStep];
          if (quick) {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, quickReplies: quick } : m)),
            );
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("[copilot] fatal", err);
          toast.error("Falha na conversa com o Thor.");
        }
      } finally {
        setThinking(false);
      }
    },
    [messages, step, attachment, thinking, advanceStep],
  );

  return {
    messages,
    step,
    attachment,
    setAttachment,
    thinking,
    finalPrompt,
    setFinalPrompt,
    sendUserMessage,
    reset,
  };
}
