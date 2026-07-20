import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Wand, RotateCcw, Bot, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import MediaDropzone from "./MediaDropzone";
import type { UploadedMedia } from "@/hooks/useVideoUpload";
import type { CopilotMessage, CopilotStep } from "@/hooks/useVideoCopilot";

interface Props {
  messages: CopilotMessage[];
  step: CopilotStep;
  attachment: UploadedMedia | null;
  onAttachmentChange: (m: UploadedMedia | null) => void;
  thinking: boolean;
  finalPrompt: string | null;
  onFinalPromptChange: (v: string | null) => void;
  onSend: (text: string) => void;
  onReset: () => void;
  onGenerate: () => void;
  canGenerate: boolean;
  submitting: boolean;
}

/**
 * Interactive Thor Copilot pane — replaces the raw textarea.
 * Notion-density chat + Salesforce-style right rail with quick replies.
 */
export default function ThorVideoCopilot({
  messages,
  step,
  attachment,
  onAttachmentChange,
  thinking,
  finalPrompt,
  onFinalPromptChange,
  onSend,
  onReset,
  onGenerate,
  canGenerate,
  submitting,
}: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!input.trim() || thinking) return;
    onSend(input);
    setInput("");
  };

  const handleQuickReply = (text: string) => {
    if (thinking) return;
    onSend(text);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot strokeWidth={1.5} className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-foreground leading-none">
              Thor · Copiloto de Vídeo
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Etapa: {stepLabel(step)}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-[11px]"
          onClick={onReset}
          disabled={thinking || submitting}
        >
          <RotateCcw strokeWidth={1.5} className="w-3 h-3" />
          Recomeçar
        </Button>
      </div>

      {/* Chat body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4 max-h-[420px] min-h-[280px]"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot strokeWidth={1.5} className="w-3 h-3 text-primary" />
                </div>
              )}
              <div className={cn("max-w-[80%] space-y-2", m.role === "user" && "items-end")}>
                <div
                  className={cn(
                    "text-[13px] leading-relaxed whitespace-pre-wrap rounded-2xl px-3.5 py-2",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted/50 text-foreground rounded-tl-sm",
                  )}
                >
                  {m.content || (thinking && m.role === "assistant" ? "…" : "")}
                </div>
                {m.role === "assistant" && m.quickReplies && m.quickReplies.length > 0 && !thinking && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        type="button"
                        onClick={() => handleQuickReply(qr)}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-background/60 hover:bg-primary/10 hover:border-primary/40 text-foreground transition-colors"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon strokeWidth={1.5} className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {thinking && (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <Loader2 strokeWidth={1.5} className="w-3.5 h-3.5 animate-spin" /> Thor está pensando…
          </div>
        )}
      </div>

      {/* Attachment dropzone (shown after reference step) */}
      {(step === "scene" || step === "mood" || step === "prompt_review" || step === "ready") && (
        <div className="px-5 pb-3">
          <MediaDropzone value={attachment} onChange={onAttachmentChange} accept="both" />
        </div>
      )}

      {/* Final prompt review card */}
      {finalPrompt && (
        <div className="px-5 pb-3">
          <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Wand strokeWidth={1.5} className="w-3.5 h-3.5 text-primary" />
              <div className="text-[11px] uppercase tracking-wider font-medium text-primary">
                Prompt Final
              </div>
            </div>
            <Textarea
              value={finalPrompt}
              onChange={(e) => onFinalPromptChange(e.target.value)}
              rows={4}
              className="resize-none text-[12px] bg-background/60 border-border/50 font-mono leading-relaxed"
            />
            <div className="flex items-center justify-between pt-1">
              <div className="text-[10px] text-muted-foreground">
                Você pode editar antes de gerar.
              </div>
              <Button
                onClick={onGenerate}
                disabled={submitting || !canGenerate}
                size="sm"
                className="h-8 gap-1.5 rounded-full"
              >
                {submitting ? (
                  <Loader2 strokeWidth={1.5} className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand strokeWidth={1.5} className="w-3.5 h-3.5" />
                )}
                Gerar vídeo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-border/50 px-3 py-2.5 flex items-end gap-2">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={
            step === "ready"
              ? "Peça ajustes ao Thor ou clique em Gerar vídeo…"
              : "Responda ao Thor…"
          }
          rows={1}
          disabled={thinking}
          className="flex-1 resize-none min-h-9 max-h-32 text-[13px] bg-background/40 border-border/60"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!input.trim() || thinking}
          className="h-9 w-9 p-0 shrink-0 rounded-lg"
        >
          <Send strokeWidth={1.5} className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function stepLabel(s: CopilotStep): string {
  switch (s) {
    case "intent":
      return "1/4 · Objetivo";
    case "reference":
      return "2/4 · Referência visual";
    case "scene":
      return "3/4 · Cena";
    case "mood":
      return "4/4 · Mood";
    case "prompt_review":
      return "Montando prompt…";
    case "ready":
      return "Prompt pronto";
  }
}
