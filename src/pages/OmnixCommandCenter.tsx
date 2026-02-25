import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOmnix } from "@/hooks/useOmnix";
import OmnixChat from "@/components/omnix/OmnixChat";
import OmnixDashboard from "@/components/omnix/OmnixDashboard";
import OmnixSettings from "@/components/omnix/OmnixSettings";

const OmnixCommandCenter = () => {
  const { messages, isLoading, isStreaming, config, updateConfig, sendMessage, stopStreaming, clearMessages } = useOmnix();
  const [showSettings, setShowSettings] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<"none" | "chat" | "dashboard">("none");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Track speaking state from chat via a simple polling approach
  // The OmnixChat component manages TTS internally, but we expose speaking state here for the dashboard
  const chatFlex = expandedPanel === "chat" ? "flex-[3]" : expandedPanel === "dashboard" ? "flex-[0] hidden lg:flex lg:flex-[1]" : "flex-[1.2]";
  const dashFlex = expandedPanel === "dashboard" ? "flex-[3]" : expandedPanel === "chat" ? "flex-[0] hidden lg:flex lg:flex-[1]" : "flex-1";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 h-11 border-b border-border/10 bg-card/20 backdrop-blur-xl flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-[0_0_12px_hsl(var(--primary)/0.3)]">
            <span className="text-[8px] font-black text-primary-foreground">{config.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="font-display font-black text-xs tracking-widest uppercase">{config.name}</h1>
            <p className="text-[9px] text-muted-foreground/50 font-mono">Central AI Agent • Real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono text-emerald-400/60">ONLINE</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50" onClick={() => setShowSettings(true)}>
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <motion.div layout className={`${chatFlex} min-w-0 border-r border-border/10 flex flex-col transition-all duration-300`}>
          <div className="shrink-0 flex items-center justify-end px-2 py-0.5">
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground/30" onClick={() => setExpandedPanel(p => p === "chat" ? "none" : "chat")}>
              {expandedPanel === "chat" ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <OmnixChat
              messages={messages}
              isLoading={isLoading}
              isStreaming={isStreaming}
              config={config}
              onSend={sendMessage}
              onStop={stopStreaming}
              onClear={clearMessages}
            />
          </div>
        </motion.div>

        {/* Dashboard panel */}
        <motion.div layout className={`${dashFlex} min-w-0 flex flex-col transition-all duration-300`}>
          <div className="shrink-0 flex items-center justify-between px-4 py-0.5">
            <span className="text-[9px] text-muted-foreground/40 font-mono uppercase tracking-widest">Live Dashboard</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground/30" onClick={() => setExpandedPanel(p => p === "dashboard" ? "none" : "dashboard")}>
              {expandedPanel === "dashboard" ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <OmnixDashboard messages={messages} isSpeaking={isSpeaking} />
          </div>
        </motion.div>
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
