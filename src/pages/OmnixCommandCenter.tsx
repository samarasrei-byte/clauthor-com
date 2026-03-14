import { useState, useEffect, useRef } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOmnix } from "@/hooks/useOmnix";
import OmnixChat from "@/components/omnix/OmnixChat";
import OmnixSettings from "@/components/omnix/OmnixSettings";

interface OmnixCommandCenterProps {
  postPaymentContext?: { agentName: string; isDepartment: boolean; agentCount: number } | null;
  onPostPaymentHandled?: () => void;
  initialMessage?: string | null;
  onInitialMessageHandled?: () => void;
}

const GREETING_KEY = "thor_greeted";

const OmnixCommandCenter = ({ postPaymentContext, onPostPaymentHandled, initialMessage, onInitialMessageHandled }: OmnixCommandCenterProps) => {
  const { messages, isLoading, isStreaming, config, updateConfig, sendMessage, stopStreaming, clearMessages } = useOmnix();
  const [showSettings, setShowSettings] = useState(false);
  const postPaymentSent = useRef(false);
  const lastSentMessage = useRef<string | null>(null);
  const greetingSent = useRef(false);

  // ─── Proactive greeting on first ever visit ───
  useEffect(() => {
    if (greetingSent.current || isLoading || isStreaming) return;
    if (messages.length > 0) return;
    // Don't greet if post-payment or initial message will be sent
    if (postPaymentContext || initialMessage) return;

    // Check if already greeted (persist across sessions with localStorage)
    const greeted = localStorage.getItem(GREETING_KEY);
    if (greeted) return;

    greetingSent.current = true;
    localStorage.setItem(GREETING_KEY, "1");

    // Check for hire intent from onboarding
    const hireIntent = localStorage.getItem("hireIntent");
    let greeting: string;

    if (hireIntent) {
      try {
        const intent = JSON.parse(hireIntent);
        greeting = `Acabei de chegar na plataforma. Me ajude a começar com ${intent.agentName || intent.departmentName || "os agentes"}. O que eu faço primeiro?`;
      } catch {
        greeting = "Acabei de entrar na plataforma. Me apresente o que você pode fazer e como me ajudar.";
      }
    } else {
      greeting = "Acabei de entrar na plataforma. Me apresente o que você pode fazer e como me ajudar.";
    }

    const timer = setTimeout(() => {
      sendMessage(greeting);
    }, 800);
    return () => clearTimeout(timer);
  }, [messages.length, isLoading, isStreaming, sendMessage, postPaymentContext, initialMessage]);

  // Auto-send contextual welcome message after payment (priority 1)
  useEffect(() => {
    if (!postPaymentContext || postPaymentSent.current || isLoading || isStreaming) return;
    if (messages.length > 0) return;
    postPaymentSent.current = true;

    const { agentName, isDepartment, agentCount } = postPaymentContext;
    const prompt = isDepartment
      ? `Acabei de contratar o departamento ${agentName} com ${agentCount} agentes. Me ajude a configurar tudo para começar a usar. Quais são os próximos passos?`
      : `Acabei de contratar o agente ${agentName}. Me ajude a configurar para começar a usar. Quais são os próximos passos e quais integrações eu preciso configurar?`;

    const timer = setTimeout(() => {
      sendMessage(prompt);
      onPostPaymentHandled?.();
    }, 1200);
    return () => clearTimeout(timer);
  }, [postPaymentContext, messages.length, isLoading, isStreaming, sendMessage, onPostPaymentHandled]);

  // Auto-send task message from TaskRequestPanel (priority 2)
  useEffect(() => {
    if (!initialMessage || isLoading || isStreaming) return;
    if (postPaymentContext && !postPaymentSent.current) return;
    if (lastSentMessage.current === initialMessage) return;

    lastSentMessage.current = initialMessage;

    const timer = setTimeout(() => {
      sendMessage(initialMessage);
      onInitialMessageHandled?.();
    }, 400);
    return () => clearTimeout(timer);
  }, [initialMessage, isLoading, isStreaming, sendMessage, onInitialMessageHandled, postPaymentContext]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex-1 min-h-0 relative">
        <OmnixChat
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          config={config}
          onSend={sendMessage}
          onStop={stopStreaming}
          onClear={clearMessages}
        />

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 text-muted-foreground/40 hover:text-foreground z-10"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </div>

      {showSettings && (
        <OmnixSettings config={config} onUpdate={updateConfig} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default OmnixCommandCenter;
