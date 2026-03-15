import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Rocket, Eye, CheckCircle, XCircle, Brain, Sparkles, Clock,
  AlertTriangle, Activity, Zap, Target, ChevronRight, Wand2,
  ThumbsUp, ThumbsDown, MessageSquare, Bot
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ─── Types ───
interface AgentNode {
  id: string;
  name: string;
  status: "working" | "waiting" | "delegating" | "error" | "idle";
  currentTask?: string;
  progress?: number;
  delegatedBy?: string;
}

interface ValidationItem {
  id: string;
  agentName: string;
  taskTitle: string;
  outputType: "text" | "image" | "report" | "data";
  preview: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

interface RunningTask {
  id: string;
  agentName: string;
  description: string;
  progress: number;
  dependencies: string[];
  delegatedBy: string;
}

interface LearningPreference {
  category: string;
  value: string;
  confidence: number;
  learnedFrom: number;
}

// ─── Status colors ───
const statusConfig: Record<AgentNode["status"], { color: string; label: string; pulse: boolean }> = {
  working: { color: "bg-emerald-500", label: "Working", pulse: true },
  waiting: { color: "bg-amber-400", label: "Waiting", pulse: false },
  delegating: { color: "bg-blue-500", label: "Delegating", pulse: true },
  error: { color: "bg-destructive", label: "Error", pulse: true },
  idle: { color: "bg-muted-foreground/30", label: "Idle", pulse: false },
};

// ─── Mock data (will be replaced by real data) ───
const mockAgents: AgentNode[] = [
  { id: "thor", name: "Thor", status: "delegating", currentTask: "Orchestrating TikTok campaign", progress: 100, delegatedBy: "User" },
  { id: "art", name: "ArtAgent", status: "working", currentTask: "Creating campaign banner", progress: 72, delegatedBy: "Thor" },
  { id: "video", name: "VideoAgent", status: "working", currentTask: "Producing TikTok video", progress: 45, delegatedBy: "Thor" },
  { id: "script", name: "ScriptAgent", status: "waiting", currentTask: "Awaiting video narration approval", progress: 100, delegatedBy: "VideoAgent" },
  { id: "data", name: "DataAgent", status: "idle", delegatedBy: "Thor" },
  { id: "sdr", name: "SDR Outbound", status: "working", currentTask: "Prospecting leads", progress: 60, delegatedBy: "Thor" },
];

const mockValidation: ValidationItem[] = [
  { id: "v1", agentName: "ArtAgent", taskTitle: "Campaign banner creation", outputType: "image", preview: "Minimalist banner with vibrant gradient overlay and bold typography", createdAt: new Date(Date.now() - 300000).toISOString(), status: "pending" },
  { id: "v2", agentName: "ScriptAgent", taskTitle: "Video narration script", outputType: "text", preview: "\"In a world driven by AI, your business deserves agents that think, act, and evolve...\"", createdAt: new Date(Date.now() - 600000).toISOString(), status: "pending" },
  { id: "v3", agentName: "DataAgent", taskTitle: "Market analysis report", outputType: "report", preview: "Competitive landscape analysis with 12 key insights identified", createdAt: new Date(Date.now() - 900000).toISOString(), status: "approved" },
];

const mockTasks: RunningTask[] = [
  { id: "t1", agentName: "VideoAgent", description: "Creating TikTok campaign video", progress: 45, dependencies: ["ScriptAgent", "ArtAgent"], delegatedBy: "Thor" },
  { id: "t2", agentName: "ArtAgent", description: "Designing campaign banner set", progress: 72, dependencies: [], delegatedBy: "Thor" },
  { id: "t3", agentName: "SDR Outbound", description: "Prospecting qualified leads", progress: 60, dependencies: ["DataAgent"], delegatedBy: "Thor" },
];

const mockPreferences: LearningPreference[] = [
  { category: "Visual Style", value: "Minimalist + vibrant colors", confidence: 87, learnedFrom: 18 },
  { category: "Video Style", value: "Fast paced + short format", confidence: 73, learnedFrom: 9 },
  { category: "Copy Style", value: "Short and direct", confidence: 91, learnedFrom: 24 },
  { category: "Response Tone", value: "Professional yet friendly", confidence: 82, learnedFrom: 15 },
];

const mockTimeline = [
  { time: "09:21", event: "Thor initiated TikTok campaign", type: "info" as const },
  { time: "09:22", event: "ScriptAgent assigned script creation", type: "info" as const },
  { time: "09:25", event: "Script approved automatically", type: "success" as const },
  { time: "09:27", event: "VideoAgent started production", type: "info" as const },
  { time: "09:30", event: "ArtAgent started banner design", type: "info" as const },
  { time: "09:35", event: "Awaiting human validation", type: "warning" as const },
];

// ─── Sub-components ───

const AgentNodeCard = ({ agent, isSelected, onClick }: { agent: AgentNode; isSelected: boolean; onClick: () => void }) => {
  const cfg = statusConfig[agent.status];
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 min-w-[100px]",
        isSelected ? "border-primary/40 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.1)]" : "border-border/20 bg-card/40 hover:border-border/40"
      )}
    >
      {/* Status indicator */}
      <div className="relative">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center border-2",
          agent.status === "working" ? "border-emerald-500/40" :
          agent.status === "delegating" ? "border-blue-500/40" :
          agent.status === "error" ? "border-destructive/40" :
          agent.status === "waiting" ? "border-amber-400/40" : "border-muted/40"
        )}>
          <Bot className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <span className={cn(
          "absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
          cfg.color, cfg.pulse && "animate-pulse"
        )} />
      </div>
      <span className="text-[11px] font-semibold truncate max-w-[90px]">{agent.name}</span>
      <span className="text-[9px] text-muted-foreground">{cfg.label}</span>
    </motion.button>
  );
};

const ConnectionLine = () => (
  <div className="flex items-center">
    <div className="w-6 h-px bg-border/30" />
    <ChevronRight className="h-3 w-3 text-muted-foreground/30 -mx-1" />
  </div>
);

// ─── Main Component ───
const MissionControl = ({ onNavigate }: { onNavigate?: (id: string) => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationResponse, setSimulationResponse] = useState<string | null>(null);

  // Real agents
  const { data: realAgents = [] } = useQuery({
    queryKey: ["mission-agents", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("id, name, status, total_executions, description").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Real pending actions
  const { data: pendingActions = [] } = useQuery({
    queryKey: ["mission-pending", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("pending_actions").select("*").eq("user_id", user!.id).eq("status", "pending").order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  // Real tasks
  const { data: realTasks = [] } = useQuery({
    queryKey: ["mission-tasks", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agent_tasks").select("*, agent:agents(name)").eq("user_id", user!.id).in("status", ["open", "in_progress"]).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  // Real execution logs for timeline
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["mission-timeline", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("execution_logs").select("*, agent:agents(name)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  // Build agent nodes from real data (with fallback to demo if no agents)
  const agentNodes: AgentNode[] = useMemo(() => {
    if (realAgents.length === 0) return mockAgents;
    return realAgents.map(a => ({
      id: a.id,
      name: a.name,
      status: a.status === "active" ? ("working" as const) : ("idle" as const),
      currentTask: realTasks.find(t => t.agent_id === a.id)?.title,
      progress: a.status === "active" ? 100 : 0,
      delegatedBy: "Thor",
    }));
  }, [realAgents, realTasks]);

  // Build validation items from pending_actions
  const validationItems: ValidationItem[] = useMemo(() => {
    if (pendingActions.length === 0) return mockValidation;
    return pendingActions.map((pa: any) => ({
      id: pa.id,
      agentName: pa.title?.split(":")[0] || "Agent",
      taskTitle: pa.title,
      outputType: "text" as const,
      preview: pa.description || "Pending validation",
      createdAt: pa.created_at,
      status: "pending" as const,
    }));
  }, [pendingActions]);

  // Build running tasks from real tasks
  const runningTasks: RunningTask[] = useMemo(() => {
    if (realTasks.length === 0) return mockTasks;
    return realTasks.map((t: any) => ({
      id: t.id,
      agentName: t.agent?.name || "Unassigned",
      description: t.title,
      progress: t.status === "in_progress" ? 50 : 10,
      dependencies: [],
      delegatedBy: "Thor",
    }));
  }, [realTasks]);

  // Build timeline from real logs
  const timelineEntries = useMemo(() => {
    if (recentLogs.length === 0) return mockTimeline;
    return recentLogs.slice(0, 6).map((log: any) => ({
      time: new Date(log.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      event: `${log.agent?.name || "Agent"}: ${log.action}`,
      type: log.status === "success" ? ("success" as const) : log.status === "error" ? ("warning" as const) : ("info" as const),
    }));
  }, [recentLogs]);

  const selectedAgentData = agentNodes.find(a => a.id === selectedAgent);
  const pendingValidations = validationItems.filter(v => v.status === "pending");
  const overallConfidence = Math.round(mockPreferences.reduce((a, p) => a + p.confidence, 0) / mockPreferences.length);

  const handleSimulate = () => {
    setShowSimulation(true);
    setTimeout(() => {
      setSimulationResponse(
        "I would reject the current banner because it doesn't match your minimalistic style preference learned from 18 previous approvals. Instead, I'd request ArtAgent to produce a cleaner version with more negative space and a single accent color."
      );
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Mission Control</h2>
            <p className="text-xs text-muted-foreground">AI Operations Command Center</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {agentNodes.filter(a => a.status === "working").length} active
          </Badge>
          <Badge variant="secondary" className="gap-1.5 text-[10px]">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            {pendingValidations.length} awaiting
          </Badge>
          <Button size="sm" variant="outline" className="gap-1.5 text-[10px]" onClick={handleSimulate}>
            <Wand2 className="h-3 w-3" />
            Simulate Thor Decision
          </Button>
        </div>
      </div>

      {/* Decision Simulation Modal */}
      <AnimatePresence>
        {showSimulation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Thor Decision Simulation</span>
              </div>
              <Button size="sm" variant="ghost" className="text-[10px] h-6" onClick={() => { setShowSimulation(false); setSimulationResponse(null); }}>
                Close
              </Button>
            </div>
            <p className="text-xs text-muted-foreground italic">"If I was not here, what would Thor decide?"</p>
            {simulationResponse ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-background/60 border border-border/20">
                <p className="text-sm leading-relaxed">{simulationResponse}</p>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 py-3">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground">Thor is analyzing preferences…</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 1. AGENT NETWORK MAP ═══ */}
      <Card className="border-border/20 bg-card/40 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Agent Network Map</CardTitle>
            <Badge variant="secondary" className="text-[9px] ml-auto">{agentNodes.length} agents</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 justify-center py-4">
            {/* User node */}
            <div className="flex flex-col items-center gap-1.5 px-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-semibold text-primary">You</span>
            </div>
            <ConnectionLine />
            {agentNodes.map((agent, i) => (
              <div key={agent.id} className="flex items-center gap-2">
                <AgentNodeCard
                  agent={agent}
                  isSelected={selectedAgent === agent.id}
                  onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                />
                {i < 2 && <ConnectionLine />}
              </div>
            ))}
          </div>

          {/* Selected agent detail */}
          <AnimatePresence>
            {selectedAgentData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 rounded-xl border border-border/10 bg-background/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Agent</span>
                    <p className="text-sm font-semibold mt-0.5">{selectedAgentData.name}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Current Task</span>
                    <p className="text-xs mt-0.5">{selectedAgentData.currentTask || "No active task"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Progress</span>
                    <div className="mt-1.5">
                      <Progress value={selectedAgentData.progress || 0} className="h-1.5" />
                      <span className="text-[10px] text-muted-foreground">{selectedAgentData.progress || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Delegated by</span>
                    <p className="text-xs mt-0.5">{selectedAgentData.delegatedBy}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* ═══ 2 & 3: VALIDATION QUEUE + TASK EXECUTION ═══ */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Validation Queue */}
        <Card className="border-border/20 bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-amber-400" />
              <CardTitle className="text-sm">Validation Queue</CardTitle>
              <Badge variant="secondary" className="text-[9px] ml-auto">{pendingValidations.length} pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {validationItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                className={cn(
                  "p-4 rounded-xl border transition-colors",
                  item.status === "pending" ? "border-amber-400/20 bg-amber-500/[0.03]" :
                  item.status === "approved" ? "border-emerald-500/20 bg-emerald-500/[0.03] opacity-60" :
                  "border-border/10 bg-background/20"
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold">{item.agentName}</span>
                      <Badge variant="outline" className="text-[8px] h-4">{item.outputType}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{item.taskTitle}</p>
                  </div>
                  {item.status === "approved" && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                </div>
                <div className="p-3 rounded-lg bg-background/40 border border-border/10 mb-3">
                  <p className="text-xs leading-relaxed text-foreground/80">{item.preview}</p>
                </div>
                {item.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-7 text-[10px] gap-1 flex-1">
                      <ThumbsUp className="h-3 w-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 flex-1">
                      <ThumbsDown className="h-3 w-3" /> Adjust
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1">
                      <Brain className="h-3 w-3" /> Teach
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Task Execution Panel */}
        <Card className="border-border/20 bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Task Execution</CardTitle>
              <Badge variant="secondary" className="text-[9px] ml-auto">{runningTasks.length} running</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {runningTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                className="p-4 rounded-xl border border-border/10 bg-background/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold">{task.agentName}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">by {task.delegatedBy}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{task.description}</p>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] text-muted-foreground">Progress</span>
                    <span className="text-[10px] font-mono font-semibold">{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-1.5" />
                </div>
                {task.dependencies.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] text-muted-foreground">Depends on:</span>
                    {task.dependencies.map(dep => (
                      <Badge key={dep} variant="outline" className="text-[8px] h-4">{dep}</Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ═══ 4: THOR LEARNING PANEL + TIMELINE ═══ */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Learning Panel */}
        <Card className="lg:col-span-3 border-border/20 bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Thor Preference Learning</CardTitle>
              <Badge variant="secondary" className="text-[9px] ml-auto gap-1">
                <Target className="h-2.5 w-2.5" />
                {overallConfidence}% confidence
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {mockPreferences.map((pref) => (
                <div key={pref.category} className="p-3 rounded-xl border border-border/10 bg-background/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{pref.category}</span>
                    <span className="text-[9px] text-muted-foreground">from {pref.learnedFrom} decisions</span>
                  </div>
                  <p className="text-xs font-medium mb-2">{pref.value}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={pref.confidence} className="h-1 flex-1" />
                    <span className="text-[10px] font-mono text-muted-foreground">{pref.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
            {overallConfidence >= 80 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-semibold">High confidence detected</p>
                    <p className="text-[10px] text-muted-foreground">Thor can make autonomous decisions based on learned preferences</p>
                  </div>
                </div>
                <Button size="sm" className="text-[10px] h-7 gap-1">
                  <Zap className="h-3 w-3" />
                  Enable Autonomous
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="lg:col-span-2 border-border/20 bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Activity Timeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {timelineEntries.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 relative">
                  {/* Vertical line */}
                  {i < timelineEntries.length - 1 && (
                    <div className="absolute left-[7px] top-[22px] w-px h-[calc(100%-10px)] bg-border/20" />
                  )}
                  <div className={cn(
                    "w-[14px] h-[14px] rounded-full shrink-0 mt-0.5 border-2 border-background z-10",
                    entry.type === "success" ? "bg-emerald-500" :
                    entry.type === "warning" ? "bg-amber-400" : "bg-primary/40"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-tight">{entry.event}</p>
                    <span className="text-[10px] text-muted-foreground font-mono">{entry.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MissionControl;
