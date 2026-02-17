import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "./useCredits";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  message: string;
  tokens_used: number;
  remaining_credits: number;
  credit_warning?: boolean;
  history_trimmed?: boolean;
  messages_sent?: number;
  messages_original?: number;
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

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: updatedMessages,
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
      };

      setMessages([...updatedMessages, assistantMessage]);
      
      // Credit warning alert at 80%
      if (data.credit_warning) {
        toast.warning("⚠️ Seus créditos estão em 80%+. Considere fazer upgrade do plano.", {
          duration: 5000,
        });
      }

      // Refetch credits to update UI
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
