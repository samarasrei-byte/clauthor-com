import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const OPENING = "Qual é a sua dor?";
const PLACEHOLDER = "Ex: meu time de vendas não bate meta, gasto muito com suporte, não consigo escalar marketing...";

const SalesChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setStreaming(true);

    // Add empty assistant slot for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-chatbot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ messages: nextMessages }),
        },
      );

      if (!res.ok) {
        if (res.status === 429) toast.error("Muitas mensagens. Aguarde alguns segundos.");
        else if (res.status === 402) toast.error("Créditos esgotados. Tente novamente mais tarde.");
        else toast.error("Erro ao processar. Tente novamente.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("no stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assembled += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assembled };
                return copy;
              });
            }
          } catch {
            /* incomplete chunk */
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão. Tente novamente.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const hasConversation = messages.length > 0;
  const showCTAs = messages.some((m) => m.role === "assistant" && m.content.length > 40) && !streaming;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl overflow-hidden shadow-xl shadow-primary/5">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-foreground">Consultor Clauthor</p>
            <p className="font-mono text-[10px] text-emerald-500/80 uppercase tracking-wider">
              Online agora
            </p>
          </div>
        </div>

        {/* Chat area */}
        <div
          ref={scrollRef}
          className="h-[340px] sm:h-[380px] overflow-y-auto px-5 py-5 space-y-4 scroll-smooth"
        >
          {/* Opening */}
          <div className="flex items-start gap-2.5 max-w-[92%]">
            <div className="shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
              <Bot className="h-3.5 w-3.5 text-primary/70" />
            </div>
            <div className="rounded-xl rounded-tl-sm bg-muted/40 border border-border/50 px-4 py-2.5">
              <p className="text-sm leading-relaxed text-foreground/90 font-medium">{OPENING}</p>
              {!hasConversation && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Me conte em uma frase o que está travando seu negócio.
                </p>
              )}
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {msg.role === "user" ? (
                  <div className="flex items-start gap-2.5 max-w-[85%] ml-auto flex-row-reverse">
                    <div className="rounded-xl rounded-tr-sm bg-primary/15 border border-primary/25 px-4 py-2.5">
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 max-w-[92%]">
                    <div className="shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary/70" />
                    </div>
                    <div className="rounded-xl rounded-tl-sm bg-muted/40 border border-border/50 px-4 py-2.5">
                      {msg.content ? (
                        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      ) : (
                        <div className="flex gap-1.5 py-1">
                          {[0, 1, 2].map((j) => (
                            <motion.div
                              key={j}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }}
                              className="w-1.5 h-1.5 rounded-full bg-primary/50"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {showCTAs && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-2 pt-2"
            >
              <Link
                to="/thor"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 hover:opacity-90 transition-opacity"
              >
                Conversar com o Thor
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/departamentos"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium px-4 py-2.5 hover:border-foreground/40 transition-colors"
              >
                Ver departamentos
              </Link>
            </motion.div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border/60 p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              maxLength={1500}
              placeholder={PLACEHOLDER}
              disabled={loading}
              className="flex-1 resize-none rounded-lg bg-background border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 disabled:opacity-60 max-h-32"
              aria-label="Descreva sua dor"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="shrink-0 w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              aria-label="Enviar"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-2 px-1">
            Sem cadastro. Sem cartão. Resposta em segundos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesChatbot;
