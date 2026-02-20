import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "./useCredits";

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

interface ChatResponse {
  message: string;
  tokens_used: number;
  remaining_credits: number;
  credit_warning?: boolean;
  history_trimmed?: boolean;
  messages_sent?: number;
  messages_original?: number;
  tool_results?: ToolResult[];
}

export function useAgentChat(agentId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { refetch: refetchCredits } = useCredits();

  const sendMessage = async (content: string, actionType = "chat") => {
    if (!content.trim()) return;

    const userMessage: Message = { role: "user", content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error("Você precisa estar logado para usar o chat.");
        setIsLoading(false);
        return;
      }

      // Send only role+content to the API (no tool_results in history)
      const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }));

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
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          toast.error("Créditos esgotados! Faça upgrade do seu plano.");
        } else if (response.status === 429) {
          toast.error("Limite de requisições atingido. Tente novamente em alguns segundos.");
        } else {
          toast.error(data.error || "Erro ao processar sua mensagem.");
        }
        setIsLoading(false);
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        tool_results: data.tool_results,
      };

      setMessages([...updatedMessages, assistantMessage]);
      
      if (data.credit_warning) {
        toast.warning("⚠️ Seus créditos estão em 80%+. Considere fazer upgrade do plano.", {
          duration: 5000,
        });
      }

      // Show tool execution toast
      if (data.tool_results && data.tool_results.length > 0) {
        const toolNames = data.tool_results.map((t: ToolResult) => {
          const names: Record<string, string> = {
            send_email: "📧 Email enviado",
            create_task: "✅ Tarefa criada",
            generate_report: "📊 Relatório gerado",
            search_leads: "🔍 Leads encontrados",
            schedule_meeting: "📅 Reunião agendada",
            analyze_data: "📈 Análise concluída",
          };
          return names[t.tool_name] || t.tool_name;
        });
        toast.success(toolNames.join(" • "), { duration: 4000 });
      }

      refetchCredits();

      return data as ChatResponse;
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
