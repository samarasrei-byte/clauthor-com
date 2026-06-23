import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

/**
 * Discreet bottom-left toast that surfaces the latest agent_task in realtime.
 * Auto-dismisses after 6s. Stacked queue keeps at most 1 visible to avoid overload.
 */
const LiveTasksTicker = () => {
  const { user } = useAuth();
  const [current, setCurrent] = useState<TaskRow | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!user || muted) return;
    const channel = supabase
      .channel(`tasks-live-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_tasks", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as TaskRow | undefined;
          if (!row?.title) return;
          setCurrent(row);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, muted]);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), 6000);
    return () => clearTimeout(t);
  }, [current]);

  if (muted) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 pointer-events-none">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id + current.status}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center gap-2 max-w-[300px] bg-background/90 backdrop-blur-xl border border-border/30 rounded-full pl-2.5 pr-1.5 py-1.5 shadow-lg"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                current.status === "completed" ? "bg-emerald-400" :
                current.status === "failed" ? "bg-red-400" : "bg-primary"
              )} />
              <span className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                current.status === "completed" ? "bg-emerald-500" :
                current.status === "failed" ? "bg-red-500" : "bg-primary"
              )} />
            </span>
            <Activity className="h-3 w-3 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <span className="text-[11px] text-foreground/90 truncate flex-1">{current.title}</span>
            <button
              onClick={() => setMuted(true)}
              aria-label="Silenciar"
              className="p-1 rounded-full hover:bg-muted/40 text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveTasksTicker;
