import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OmnixConfig {
  name: string;
  tone: string;
  personality: string;
  responseStyle: string;
  language: string;
  autonomy: string;
}

export interface OmnixMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  kpis?: Array<{ label: string; value: string; trend: string; delta: string }>;
}

const DEFAULT_CONFIG: OmnixConfig = {
  name: "THOR",
  tone: "strategic",
  personality: "futuristic",
  responseStyle: "detailed",
  language: "pt-BR",
  autonomy: "analyze and suggest",
};

function normalizeOmnixConfig(saved: Partial<OmnixConfig> | null): OmnixConfig {
  const merged = { ...DEFAULT_CONFIG, ...(saved || {}) };
  const legacyName = saved?.name?.trim().toUpperCase();

  // Migrate legacy branding automatically (OMNIX -> THOR)
  if (!legacyName || legacyName === "OMNIX") {
    merged.name = "THOR";
  }

  return merged;
}

function extractKPIs(content: string) {
  // Don't use /g flag — we only need the first match and /g causes lastIndex issues on repeated calls
  const kpiRegex = /```kpi\n([\s\S]*?)```/;
  const match = kpiRegex.exec(content);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    return parsed.kpis || null;
  } catch {
    return null;
  }
}

export function useOmnix() {
  const [messages, setMessages] = useState<OmnixMessage[]>([]);
  const messagesRef = useRef<OmnixMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [config, setConfig] = useState<OmnixConfig>(() => {
    const saved = localStorage.getItem("omnix_config");
    if (!saved) return DEFAULT_CONFIG;

    try {
      return normalizeOmnixConfig(JSON.parse(saved));
    } catch {
      return DEFAULT_CONFIG;
    }
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem("omnix_config", JSON.stringify(config));
  }, [config]);

  const updateConfig = useCallback((partial: Partial<OmnixConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const sendMessage = useCallback(async (content: string, imageBase64?: string | null) => {
    if (!content.trim()) return;

    const userMsg: OmnixMessage = { role: "user", content, timestamp: new Date() };
    const updatedMessages = [...messagesRef.current, userMsg];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    setIsLoading(true);
    setIsStreaming(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.error("Você precisa estar logado.");
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }));

      const body: any = { messages: apiMessages, config };
      if (imageBase64) body.image = imageBase64;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/omnix-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        // Remove the user message that got no response
        setMessages(prev => {
          const cleaned = prev.filter((_, i) => i < prev.length - 1 || prev[prev.length - 1]?.role !== "user");
          messagesRef.current = cleaned;
          return cleaned;
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 402) toast.error("Créditos esgotados! Faça upgrade para continuar.");
        else if (response.status === 429) toast.error("Limite de requisições atingido. Tente em instantes.");
        else toast.error(data.error || "Erro ao processar sua mensagem.");
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Sem stream disponível");

      const decoder = new TextDecoder();
      let buf = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              const kpis = extractKPIs(assistantText);
              setMessages(prev => {
                const last = prev[prev.length - 1];
                let next: OmnixMessage[];
                if (last?.role === "assistant") {
                  next = prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText, kpis: kpis || m.kpis } : m);
                } else {
                  next = [...prev, { role: "assistant", content: assistantText, timestamp: new Date(), kpis: kpis || undefined }];
                }
                messagesRef.current = next;
                return next;
              });
            }
          } catch {
            // Only retry if this looks like a partial chunk (no closing brace)
            if (!jsonStr.includes("}")) {
              buf = line + "\n" + buf;
              break;
            }
            // Otherwise skip this malformed line
            console.warn("[OmnixStream] Skipping malformed SSE line");
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // Mark truncated assistant message
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.content) {
            const next = prev.map((m, i) => i === prev.length - 1 ? { ...m, content: m.content + "\n\n⏹ *Response interrupted.*" } : m);
            messagesRef.current = next;
            return next;
          }
          return prev;
        });
        return;
      }
      console.error("Omnix error:", err);
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [config]);

  const stopStreaming = useCallback(() => abortRef.current?.abort(), []);
  const clearMessages = useCallback(() => { messagesRef.current = []; setMessages([]); }, []);

  return { messages, isLoading, isStreaming, config, updateConfig, sendMessage, stopStreaming, clearMessages };
}
