import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useMonix } from "@/hooks/useMonix";
import MonixChat from "@/components/monix/MonixChat";
import MonixDashboard from "@/components/monix/MonixDashboard";
import MonixSettings from "@/components/monix/MonixSettings";

const MonixCommandCenter = () => {
  const { messages, isLoading, isStreaming, config, updateConfig, sendMessage, stopStreaming, clearMessages } = useMonix();
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<"none" | "chat" | "dashboard">("none");

  const chatFlex = expandedPanel === "chat" ? "flex-[3]" : expandedPanel === "dashboard" ? "flex-[0] hidden lg:flex lg:flex-[1]" : "flex-[1.2]";
  const dashFlex = expandedPanel === "dashboard" ? "flex-[3]" : expandedPanel === "chat" ? "flex-[0] hidden lg:flex lg:flex-[1]" : "flex-1";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 h-12 border-b border-border/20 bg-card/30 backdrop-blur-xl flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">{config.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-sm">{config.name} Command Center</h1>
            <p className="text-[10px] text-muted-foreground">AI Orchestrator • Real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content: split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <motion.div layout className={`${chatFlex} min-w-0 border-r border-border/20 flex flex-col transition-all duration-300`}>
          <div className="shrink-0 flex items-center justify-end px-2 py-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedPanel(p => p === "chat" ? "none" : "chat")}>
              {expandedPanel === "chat" ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <MonixChat
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
          <div className="shrink-0 flex items-center justify-between px-4 py-1">
            <span className="text-[11px] text-muted-foreground font-medium">{t("cmd.realtime_dashboard")}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedPanel(p => p === "dashboard" ? "none" : "dashboard")}>
              {expandedPanel === "dashboard" ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <MonixDashboard messages={messages} />
          </div>
        </motion.div>
      </div>

      {/* Settings modal */}
      <AnimatePresence>
        {showSettings && (
          <MonixSettings config={config} onUpdate={updateConfig} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonixCommandCenter;
