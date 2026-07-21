import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Phone, Video, MoreVertical, Search, Send, Paperclip, Smile, Mic, Check, CheckCheck, Image as ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PLATFORM_THEMES, PlatformKey } from "./platformThemes";
import { format } from "date-fns";

export interface SkinMessage {
  id: string;
  content: string;
  role: "user" | "assistant" | "contact";
  created_at: string;
  status?: "sent" | "delivered" | "read";
}

interface Props {
  platform: PlatformKey;
  contactName: string;
  contactSubtitle?: string;
  avatarUrl?: string;
  messages: SkinMessage[];
  onBack?: () => void;
  onSend?: (text: string) => void;
  disabled?: boolean;
}

/**
 * Native-look chat skin. Renders header, message list and input styled to mimic
 * each real platform. Data comes from `messages`. `role === "user"` = outgoing (right).
 */
export default function PlatformChatSkin({
  platform,
  contactName,
  contactSubtitle,
  avatarUrl,
  messages,
  onBack,
  onSend,
  disabled,
}: Props) {
  const theme = PLATFORM_THEMES[platform];
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const handleSend = () => {
    const t = draft.trim();
    if (!t || disabled) return;
    onSend?.(t);
    setDraft("");
  };

  const initials = contactName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={cn("h-full flex flex-col overflow-hidden", theme.font)}>
      {/* Header */}
      <div className={cn("flex items-center gap-3 px-3 py-2.5 shrink-0", theme.header)}>
        {onBack && (
          <button
            onClick={onBack}
            className={cn("p-1 rounded hover:bg-black/5", theme.headerText)}
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
          style={{ background: theme.brandColor }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={contactName} className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold truncate", theme.headerText)}>{contactName}</p>
          {contactSubtitle && (
            <p className={cn("text-[11px] opacity-70 truncate", theme.headerText)}>{contactSubtitle}</p>
          )}
        </div>
        <div className={cn("flex items-center gap-3", theme.headerText)}>
          {platform === "whatsapp" && <Video className="h-5 w-5 opacity-80" />}
          {platform === "whatsapp" && <Phone className="h-5 w-5 opacity-80" />}
          {(platform === "instagram" || platform === "linkedin") && <Phone className="h-5 w-5 opacity-80" />}
          {platform === "email" && <Search className="h-5 w-5 opacity-80" />}
          <MoreVertical className="h-5 w-5 opacity-80" />
        </div>
      </div>

      {/* Messages */}
      <div className={cn("flex-1 min-h-0", theme.chatBg)}>
        <ScrollArea className="h-full" ref={scrollRef as any}>
          <div className="px-3 py-4 space-y-1.5 max-w-3xl mx-auto">
            {messages.length === 0 && (
              <div className={cn("text-center text-xs py-16 opacity-60", theme.headerText)}>
                Nenhuma mensagem ainda · comece a conversa
              </div>
            )}
            {messages.map((msg, i) => {
              const outgoing = msg.role === "user";
              const prev = messages[i - 1];
              const showTime = !prev || new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60_000;
              return (
                <div key={msg.id}>
                  {showTime && (
                    <div className="flex justify-center my-2">
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full",
                          platform === "whatsapp" && "bg-[#182229] text-[#8696A0]",
                          platform === "instagram" && "text-white/50",
                          platform === "linkedin" && "text-[#00000099]",
                          platform === "facebook" && "text-[#65676B]",
                          platform === "tiktok" && "text-white/50",
                          platform === "email" && "text-[#5F6368]",
                          platform === "dashboard" && "text-muted-foreground bg-muted/30",
                        )}
                      >
                        {format(new Date(msg.created_at), "HH:mm")}
                      </span>
                    </div>
                  )}
                  <div className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[78%] px-3 py-2 text-[13px] leading-relaxed shadow-sm",
                        outgoing ? theme.outgoing : theme.incoming,
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <div className={cn(
                        "flex items-center justify-end gap-1 mt-1 text-[10px]",
                        outgoing ? "opacity-70" : "opacity-50",
                      )}>
                        <span>{format(new Date(msg.created_at), "HH:mm")}</span>
                        {outgoing && msg.status === "read" && <CheckCheck className="h-3 w-3 text-[#53BDEB]" />}
                        {outgoing && msg.status === "delivered" && <CheckCheck className="h-3 w-3" />}
                        {outgoing && msg.status === "sent" && <Check className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className={cn("shrink-0 px-2 py-2 flex items-center gap-2", theme.inputWrap)}>
        {platform !== "email" && (
          <button className={cn("p-2 opacity-70 hover:opacity-100", theme.headerText)} aria-label="Emoji">
            <Smile className="h-5 w-5" />
          </button>
        )}
        <button className={cn("p-2 opacity-70 hover:opacity-100", theme.headerText)} aria-label="Anexo">
          {platform === "instagram" ? <ImageIcon className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder={
            platform === "email"
              ? "Escreva uma resposta..."
              : platform === "linkedin"
              ? "Escreva uma mensagem..."
              : "Mensagem"
          }
          disabled={disabled}
          className={cn(
            "flex-1 h-10 text-[13px] outline-none border-0",
            theme.inputField,
          )}
        />
        {draft.trim() ? (
          <button
            onClick={handleSend}
            disabled={disabled}
            className={cn(
              "h-10 px-4 flex items-center gap-1.5 text-[13px] font-medium transition-all disabled:opacity-40",
              theme.sendButton,
            )}
          >
            {platform === "instagram" || platform === "facebook" ? "Enviar" : <Send className="h-4 w-4" />}
          </button>
        ) : (
          <button className={cn("p-2 opacity-70 hover:opacity-100", theme.headerText)} aria-label="Áudio">
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
