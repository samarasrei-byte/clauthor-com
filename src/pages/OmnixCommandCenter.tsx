import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOmnix } from "@/hooks/useOmnix";
import OmnixChat from "@/components/omnix/OmnixChat";
import OmnixSettings from "@/components/omnix/OmnixSettings";

interface OmnixCommandCenterProps {
  postPaymentContext?: { agentName: string; isDepartment: boolean; agentCount: number } | null;
  onPostPaymentHandled?: () => void;
}

const OmnixCommandCenter = ({ postPaymentContext, onPostPaymentHandled }: OmnixCommandCenterProps) => {
  const { messages, isLoading, isStreaming, config, updateConfig, sendMessage, stopStreaming, clearMessages } = useOmnix();
  const [showSettings, setShowSettings] = useState(false);
  const postPaymentSent = useRef(false);

  // Auto-send contextual welcome message after payment
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
          voiceFirst
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

      <AnimatePresence>
        {showSettings && (
          <OmnixSettings config={config} onUpdate={updateConfig} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OmnixCommandCenter;
