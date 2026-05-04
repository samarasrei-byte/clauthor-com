import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "./useCredits";
import { logAgentActivity } from "./useAgentActivity";

export interface ToolResult {
  tool_call_id: string;
  tool_name: string;
  args: Record<string, any>;
  success: boolean;
  result: Record<string, any>;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  tool_results?: ToolResult[];
}

export function useAgentChat(agentId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { refetch: refetchCredits } = useCredits();
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, actionType = "chat") => {
    if (!content.trim()) return;

    const userMessage: Message = { role: "user", content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setIsStreaming(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error("Você precisa estar logado para usar o chat.");
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: apiMessages,
            agentId,
            actionType,
            stream: true,
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 402) {
          toast.error("Credits exhausted! Please upgrade your plan.");
        } else if (response.status === 429) {
          toast.error("Rate limit reached. Please try again in a few seconds.");
        } else {
          toast.error(data.error || "Error processing your message.");
        }
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      // SSE streaming
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let toolResults: ToolResult[] = [];
      let gotCreditWarning = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);

            // Handle our custom meta event
            if (parsed.type === "meta") {
              if (parsed.tool_results) {
                toolResults = parsed.tool_results;
                // Show tool toast
                const toolNames = parsed.tool_results.map((t: ToolResult) => {
                  const names: Record<string, string> = {
                    send_email: "📧 Email enviado",
                    create_task: "✅ Tarefa criada",
                    generate_report: "📊 Relatório gerado",
                    search_leads: "🔍 Leads encontrados",
                    schedule_meeting: "📅 Reunião agendada",
                    analyze_data: "📈 Análise concluída",
                    delegate_to_agent: "🔀 Delegação A2A",
                  };
                  return names[t.tool_name] || t.tool_name;
                });
                // Only toast for successful tools
                const successTools = toolNames.filter((_: string, i: number) => parsed.tool_results[i]?.success !== false);
                if (successTools.length > 0) {
                  toast.success(successTools.join(" • "), { duration: 4000 });
                }
                // Toast warning for blocked delegations
                const blocked = parsed.tool_results.filter((t: ToolResult) => t.tool_name === "delegate_to_agent" && !t.success);
                if (blocked.length > 0) {
                  toast.info("🔀 Um agente recomendou outro especialista - veja a sugestão no chat", { duration: 5000 });
                }
              }
              if (parsed.credit_warning) gotCreditWarning = true;
              continue;
            }

            // Standard OpenAI streaming chunk
            const deltaContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (deltaContent) {
              assistantSoFar += deltaContent;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar, tool_results: toolResults.length > 0 ? toolResults : undefined } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar, tool_results: toolResults.length > 0 ? toolResults : undefined }];
              });
            }
          } catch {
            // Incomplete JSON, put it back
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) {
              assistantSoFar += c;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {}
        }
      }

      if (gotCreditWarning) {
        toast.warning("⚠️ Credits at 80%+. Consider upgrading.", { duration: 5000 });
      }

      // Log activity
      if (agentId && assistantSoFar) {
        const tenantId = sessionData?.session?.user?.id;
        if (tenantId) {
          const desc = toolResults.length > 0
            ? toolResults.map(t => t.tool_name).join(", ")
            : content.slice(0, 100);
          logAgentActivity({
            agentId,
            tenantId,
            actionType: toolResults.length > 0 ? "task" : "chat",
            actionDescription: desc,
            modelUsed: "ai",
          });
        }
      }

      refetchCredits();
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("Chat error:", error);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, agentId, refetchCredits]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    clearMessages,
    stopStreaming,
  };
}
