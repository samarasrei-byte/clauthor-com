import { motion } from "framer-motion";
import { Volume2, Mic, MicOff } from "lucide-react";

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
  { top: "4%", left: "50%", transform: "translateX(-50%)" },
  { top: "18%", right: "6%" },
  { top: "50%", right: "0%", transform: "translateY(-50%)" },
  { bottom: "18%", right: "6%" },
  { bottom: "4%", left: "50%", transform: "translateX(-50%)" },
  { bottom: "18%", left: "6%" },
  { top: "50%", left: "0%", transform: "translateY(-50%)" },
  { top: "18%", left: "6%" },
];

const MeetingTable = ({ agents, onMention, canSend }: MeetingTableProps) => {
  return (
    <div className="relative w-full aspect-square max-w-[420px] mx-auto">
      {/* Outer glow ring */}
      <div className="absolute inset-6 rounded-full border border-primary/[0.06]" />
      
      {/* The Table — Premium oval with depth */}
      <div className="absolute inset-[18%] rounded-full bg-gradient-to-br from-card/80 via-card/60 to-card/40 border border-border/30 shadow-[0_0_60px_-10px_hsl(var(--primary)/0.15),inset_0_1px_0_0_hsl(0_0%_100%/0.05)]">
        {/* Inner table detail — wood grain effect */}
        <div className="absolute inset-4 rounded-full border border-border/10 bg-gradient-to-br from-transparent via-primary/[0.02] to-transparent" />
        
        {/* Center hologram */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 20px 0 hsl(var(--primary) / 0.1)",
                "0 0 40px 5px hsl(var(--primary) / 0.15)",
                "0 0 20px 0 hsl(var(--primary) / 0.1)",
              ],
            }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="w-8 h-8 rounded-full border border-dashed border-primary/30 flex items-center justify-center"
              >
                <div className="w-2 h-2 rounded-full bg-primary/60" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Agent seats around the table */}
      {agents.map((agent, i) => {
        const pos = SEAT_POSITIONS[i % SEAT_POSITIONS.length];
        return (
          <motion.button
            key={agent.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
            style={pos as React.CSSProperties}
            className="absolute group"
            onClick={() => canSend && onMention(agent.name)}
            title={`@${agent.name}`}
          >
            <div className="relative">
              {/* Speaking ring animation */}
              {agent.isSpeaking && (
                <motion.div
                  className="absolute -inset-2 rounded-full border-2 border-primary/40"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}

              {/* Avatar */}
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${agent.colorClass} flex items-center justify-center border-2 transition-all duration-300 ${
                  agent.isSpeaking
                    ? "border-primary shadow-[0_0_20px_-2px_hsl(var(--primary)/0.5)] scale-110"
                    : agent.isSilent
                      ? "border-border/20 opacity-40 grayscale"
                      : "border-background/80 group-hover:border-primary/50 group-hover:scale-105 group-hover:shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)]"
                }`}
              >
                <span className="text-xs font-bold text-white drop-shadow-sm">{agent.initials}</span>
              </div>

              {/* Status indicator */}
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center ${
                agent.isSpeaking ? "bg-primary" : agent.isSilent ? "bg-muted" : "bg-accent-emerald"
              }`}>
                {agent.isSpeaking ? (
                  <Volume2 className="h-2 w-2 text-primary-foreground" />
                ) : agent.isSilent ? (
                  <MicOff className="h-2 w-2 text-muted-foreground" />
                ) : (
                  <Mic className="h-2 w-2 text-white" />
                )}
              </div>
            </div>

            {/* Name label */}
            <div className={`mt-1.5 text-center transition-all duration-200 ${
              agent.isSpeaking ? "opacity-100" : "opacity-70 group-hover:opacity-100"
            }`}>
              <p className={`text-[9px] font-bold leading-tight truncate max-w-[64px] ${
                agent.isSpeaking ? "text-primary" : "text-foreground"
              }`}>
                {agent.name.split(" ")[0]}
              </p>
              {agent.isSpeaking && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[7px] text-primary font-medium"
                >
                  falando
                </motion.p>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default MeetingTable;
