import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Mic, MicOff, HelpCircle, X, MousePointerClick, AtSign, MessageSquare, Sparkles } from "lucide-react";

interface TableAgent {
  id: string;
  name: string;
  tier: string;
  initials: string;
  colorClass: string;
  isSpeaking: boolean;
  isSilent: boolean;
}

interface MeetingTableProps {
  agents: TableAgent[];
  onMention: (name: string) => void;
  canSend: boolean;
}

const SEAT_POSITIONS = [
  { top: "2%", left: "50%", transform: "translateX(-50%)" },
  { top: "14%", right: "4%" },
  { top: "46%", right: "-2%", transform: "translateY(-50%)" },
  { bottom: "14%", right: "4%" },
  { bottom: "2%", left: "50%", transform: "translateX(-50%)" },
  { bottom: "14%", left: "4%" },
  { top: "46%", left: "-2%", transform: "translateY(-50%)" },
  { top: "14%", left: "4%" },
];

const tierGlow: Record<string, string> = {
  basic: "shadow-[0_0_12px_hsl(var(--muted-foreground)/0.15)]",
  intermediate: "shadow-[0_0_16px_hsl(210_100%_60%/0.25)]",
  advanced: "shadow-[0_0_16px_hsl(160_84%_50%/0.25)]",
  enterprise: "shadow-[0_0_20px_hsl(var(--primary)/0.35)]",
};

const MeetingTable = ({ agents, onMention, canSend }: MeetingTableProps) => {
  const [showHelp, setShowHelp] = useState(false);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  return (
    <div className="relative w-full aspect-square max-w-[460px] mx-auto">
      {/* Ambient background grid — holographic feel */}
      <div className="absolute inset-0 rounded-full opacity-20">
        <div
          className="w-full h-full rounded-full"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.08) 0%, transparent 70%),
              repeating-conic-gradient(from 0deg, transparent 0deg 8deg, hsl(var(--primary) / 0.015) 8deg 10deg)`,
          }}
        />
      </div>

      {/* Outer radar rings */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={`radar-${i}`}
          className="absolute rounded-full border border-primary/[0.04]"
          style={{ inset: `${2 + i * 4}%` }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, delay: i * 0.8, repeat: Infinity }}
        />
      ))}

      {/* Rotating scanner line */}
      <motion.div
        className="absolute inset-[8%] rounded-full overflow-hidden pointer-events-none"
        style={{ WebkitMaskImage: "radial-gradient(circle, transparent 40%, black 100%)" }}
      >
        <motion.div
          className="absolute top-1/2 left-1/2 w-1/2 h-px origin-left"
          style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.4), transparent)" }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* The Table — Premium oval with depth & holographic core */}
      <div className="absolute inset-[16%] rounded-full bg-gradient-to-br from-card/90 via-card/70 to-card/50 border border-border/30 shadow-[0_0_80px_-10px_hsl(var(--primary)/0.2),inset_0_2px_0_0_hsl(0_0%_100%/0.06)]">
        {/* Inner rings */}
        <div className="absolute inset-3 rounded-full border border-border/10" />
        <div className="absolute inset-6 rounded-full border border-primary/[0.05]" />

        {/* Center holographic command node */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              boxShadow: [
                "0 0 30px 0 hsl(var(--primary) / 0.12)",
                "0 0 60px 8px hsl(var(--primary) / 0.2)",
                "0 0 30px 0 hsl(var(--primary) / 0.12)",
              ],
            }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 flex items-center justify-center relative"
          >
            {/* Spinning rings */}
            <motion.div
              className="absolute inset-[-4px] rounded-full border border-dashed border-primary/20"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-[-10px] rounded-full border border-dotted border-primary/10"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            />

            {/* Core */}
            <motion.div
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Sparkles className="h-4 w-4 text-primary/70" />
            </motion.div>

            {/* Agent count badge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-card border border-border/40 rounded-full px-2 py-0.5">
              <span className="text-[8px] font-mono font-bold text-primary">{agents.length} AGENTS</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Connection lines from seats to center */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 460 460">
        {agents.map((agent, i) => {
          const pos = SEAT_POSITIONS[i % SEAT_POSITIONS.length];
          // Approximate seat center positions
          const angles = [270, 315, 0, 45, 90, 135, 180, 225];
          const angle = (angles[i % 8] * Math.PI) / 180;
          const radius = 195;
          const cx = 230 + Math.cos(angle) * radius;
          const cy = 230 + Math.sin(angle) * radius;
          return (
            <motion.line
              key={`line-${agent.id}`}
              x1="230" y1="230" x2={cx} y2={cy}
              stroke={agent.isSpeaking ? "hsl(var(--primary))" : "hsl(var(--border))"}
              strokeWidth={agent.isSpeaking ? 1.5 : 0.5}
              strokeOpacity={agent.isSpeaking ? 0.5 : 0.1}
              strokeDasharray={agent.isSpeaking ? "0" : "4 4"}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            />
          );
        })}
      </svg>

      {/* Agent seats around the table */}
      {agents.map((agent, i) => {
        const pos = SEAT_POSITIONS[i % SEAT_POSITIONS.length];
        const isHovered = hoveredAgent === agent.id;

        return (
          <motion.button
            key={agent.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 20 }}
            style={pos as React.CSSProperties}
            className="absolute group focus:outline-none"
            onClick={() => canSend && onMention(agent.name)}
            onMouseEnter={() => setHoveredAgent(agent.id)}
            onMouseLeave={() => setHoveredAgent(null)}
            title={`Clique para @${agent.name}`}
          >
            <div className="relative">
              {/* Speaking ring animation — triple ring */}
              {agent.isSpeaking && (
                <>
                  <motion.div
                    className="absolute -inset-2 rounded-full border-2 border-primary/50"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                  <motion.div
                    className="absolute -inset-3 rounded-full border border-primary/30"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                  />
                  <motion.div
                    className="absolute -inset-4 rounded-full border border-primary/15"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ repeat: Infinity, duration: 1.8, delay: 0.4 }}
                  />
                </>
              )}

              {/* Avatar with tier-based glow */}
              <motion.div
                className={`w-14 h-14 rounded-full bg-gradient-to-br ${agent.colorClass} flex items-center justify-center border-2 transition-all duration-300 ${
                  agent.isSpeaking
                    ? `border-primary scale-115 ${tierGlow[agent.tier] || tierGlow.basic}`
                    : agent.isSilent
                      ? "border-border/20 opacity-35 grayscale"
                      : `border-background/80 group-hover:border-primary/60 group-hover:scale-110 ${isHovered ? tierGlow[agent.tier] || "" : ""}`
                }`}
                animate={agent.isSpeaking ? { scale: [1.1, 1.15, 1.1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <span className="text-sm font-bold text-white drop-shadow-md">{agent.initials}</span>
              </motion.div>

              {/* Status indicator — larger and clearer */}
              <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center ${
                agent.isSpeaking ? "bg-primary" : agent.isSilent ? "bg-muted" : "bg-accent-emerald"
              }`}>
                {agent.isSpeaking ? (
                  <Volume2 className="h-2.5 w-2.5 text-primary-foreground" />
                ) : agent.isSilent ? (
                  <MicOff className="h-2.5 w-2.5 text-muted-foreground" />
                ) : (
                  <Mic className="h-2.5 w-2.5 text-white" />
                )}
              </div>

              {/* Hover tooltip card */}
              <AnimatePresence>
                {isHovered && !agent.isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-card border border-border/50 rounded-lg px-3 py-2 shadow-xl z-20 whitespace-nowrap"
                  >
                    <p className="text-[10px] font-bold">{agent.name}</p>
                    <p className="text-[8px] text-muted-foreground mt-0.5">Clique para @mencionar</p>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-l border-t border-border/50 rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Name label */}
            <div className={`mt-2 text-center transition-all duration-200 ${
              agent.isSpeaking ? "opacity-100" : "opacity-60 group-hover:opacity-100"
            }`}>
              <p className={`text-[10px] font-bold leading-tight truncate max-w-[72px] ${
                agent.isSpeaking ? "text-primary" : "text-foreground"
              }`}>
                {agent.name.split(" ")[0]}
              </p>
              {agent.isSpeaking && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  className="flex items-center justify-center gap-0.5 mt-0.5"
                >
                  {[0, 1, 2].map(j => (
                    <motion.div
                      key={j}
                      className="w-1 h-1 rounded-full bg-primary"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: j * 0.15 }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.button>
        );
      })}

      {/* Help button — floating */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setShowHelp(true)}
        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all shadow-lg z-20"
        title="Como usar a Sala de Reunião"
      >
        <HelpCircle className="h-4 w-4" />
      </motion.button>

      {/* Help overlay */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-md rounded-full flex items-center justify-center z-30"
          >
            <div className="text-center max-w-[280px] px-4">
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-[42%] w-6 h-6 rounded-full bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>

              <h4 className="font-display font-bold text-sm mb-4 text-primary">Como usar</h4>

              <div className="space-y-3 text-left">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MousePointerClick className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold">Clique no avatar</p>
                    <p className="text-[10px] text-muted-foreground">Para @mencionar e chamar um agente específico</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <AtSign className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold">Use @nome no chat</p>
                    <p className="text-[10px] text-muted-foreground">Autocomplete aparece ao digitar @</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold">Fale com todos</p>
                    <p className="text-[10px] text-muted-foreground">O moderador IA seleciona quem deve responder</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-accent-emerald/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Mic className="h-3 w-3 text-accent-emerald" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold">Indicadores de status</p>
                    <p className="text-[10px] text-muted-foreground">
                      <span className="text-accent-emerald">●</span> Online{" "}
                      <span className="text-primary">●</span> Falando{" "}
                      <span className="text-muted-foreground">●</span> Ouvindo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MeetingTable;
