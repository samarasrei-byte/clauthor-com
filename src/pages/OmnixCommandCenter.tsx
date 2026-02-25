import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOmnix } from "@/hooks/useOmnix";
import OmnixChat from "@/components/omnix/OmnixChat";
import OmnixDashboard from "@/components/omnix/OmnixDashboard";
import OmnixSettings from "@/components/omnix/OmnixSettings";

const OmnixCommandCenter = () => {
  const { messages, isLoading, isStreaming, config, updateConfig, sendMessage, stopStreaming, clearMessages } = useOmnix();
  const [showSettings, setShowSettings] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* KPIs bar on top */}
      <div className="shrink-0 border-b border-border/10">
        <OmnixDashboard messages={messages} isSpeaking={isSpeaking} compact />
      </div>

      {/* Full-screen chat below */}
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
        
        {/* Settings button floating */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 text-muted-foreground/40 hover:text-foreground z-10"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Settings modal */}
      <AnimatePresence>
        {showSettings && (
          <OmnixSettings config={config} onUpdate={updateConfig} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OmnixCommandCenter;
