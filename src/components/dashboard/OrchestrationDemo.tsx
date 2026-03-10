import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch, Bot, Zap, CheckCircle, ArrowRight, Play,
  RotateCcw, Sparkles, Target, Clock, ArrowRightLeft,
  Mail, CheckSquare, BarChart3, Calendar, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DelegationStep {
  id: string;
  phase: "pending" | "routing" | "executing" | "complete" | "error";
  sourceAgent: string;
  targetAgent: string;
  task: string;
  tool?: string;
  toolLabel?: string;
  result?: string;
  subActions?: { tool: string; label: string; success: boolean }[];
  delayMs: number;
}

const DEMO_SCENARIO: DelegationStep[] = [
  {
    id: "d1",
    phase: "pending",
    sourceAgent: "Orchestrator",
    targetAgent: "Financial Analyst",
    task: "Generate P&L report for last quarter with projections",
    tool: "generate_report",
    toolLabel: "Report Generated",
    result: "P&L Report Q4/2025 generated with 4 sections: Revenue (+23%), Costs (-8%), EBITDA ($1.2M), Q1/2026 Forecast.",
    subActions: [
      { tool: "analyze_data", label: "Trend Analysis", success: true },
      { tool: "generate_report", label: "P&L Report", success: true },
    ],
    delayMs: 1200,
  },
  {
    id: "d2",
    phase: "pending",
    sourceAgent: "Orchestrator",
    targetAgent: "Sales Manager",
    task: "Prospect 10 qualified leads in the B2B SaaS segment",
    tool: "search_leads",
    toolLabel: "Leads Found",
    result: "12 qualified leads found. Top 3: TechCorp (score 92%), DataFlow (88%), CloudBase (85%). Estimated pipeline: $340K.",
    subActions: [
      { tool: "search_leads", label: "Lead Search", success: true },
      { tool: "create_task", label: "Follow-up Created", success: true },
      { tool: "send_email", label: "Outreach Sent", success: true },
    ],
    delayMs: 1800,
  },
  {
    id: "d3",
    phase: "pending",
    sourceAgent: "Orchestrator",
    targetAgent: "Operations Coordinator",
    task: "Schedule weekly review meeting and create follow-up tasks",
    tool: "schedule_meeting",
    toolLabel: "Meeting Scheduled",
    result: "Meeting 'Weekly Review Q1' scheduled for Fri 02/28 at 2 PM. 3 follow-up tasks created with assigned owners.",
    subActions: [
      { tool: "schedule_meeting", label: "Meeting Scheduled", success: true },
      { tool: "create_task", label: "Tasks Created (3x)", success: true },
    ],
    delayMs: 1400,
  },
];

const toolIcons: Record<string, any> = {
  generate_report: BarChart3,
  search_leads: Target,
  schedule_meeting: Calendar,
  create_task: CheckSquare,
  send_email: Mail,
  analyze_data: Zap,
};

const tierColors: Record<string, string> = {
  "Orchestrator": "from-primary to-primary/60",
  "Financial Analyst": "from-emerald-500 to-emerald-600",
  "Sales Manager": "from-amber-500 to-amber-600",
  "Operations Coordinator": "from-cyan-500 to-cyan-600",
};

const OrchestrationDemo = () => {
  const [steps, setSteps] = useState<DelegationStep[]>(DEMO_SCENARIO.map(s => ({ ...s })));
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const resetDemo = useCallback(() => {
    setSteps(DEMO_SCENARIO.map(s => ({ ...s, phase: "pending" })));
    setCurrentStep(-1);
    setOverallProgress(0);
    setIsRunning(false);
    setTotalTime(0);
  }, []);

  const runDemo = useCallback(async () => {
    setIsRunning(true);
    setCurrentStep(-1);
    setOverallProgress(0);
    setTotalTime(0);
    setSteps(DEMO_SCENARIO.map(s => ({ ...s, phase: "pending" })));

    const startTime = Date.now();
    const timer = setInterval(() => setTotalTime(Date.now() - startTime), 100);

    for (let i = 0; i < DEMO_SCENARIO.length; i++) {
      setCurrentStep(i);
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, phase: "routing" } : s));
      setOverallProgress(((i) / DEMO_SCENARIO.length) * 100 + 10);
      await new Promise(r => setTimeout(r, 600));

      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, phase: "executing" } : s));
      setOverallProgress(((i) / DEMO_SCENARIO.length) * 100 + 20);
      await new Promise(r => setTimeout(r, DEMO_SCENARIO[i].delayMs));

      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, phase: "complete" } : s));
      setOverallProgress(((i + 1) / DEMO_SCENARIO.length) * 100);
    }

    clearInterval(timer);
    setTotalTime(Date.now() - startTime);
    setIsRunning(false);
  }, []);

  const completedCount = steps.filter(s => s.phase === "complete").length;
  const totalSubActions = steps.filter(s => s.phase === "complete").reduce((acc, s) => acc + (s.subActions?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <GitBranch className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">A2A Demo</h2>
              <p className="text-sm text-muted-foreground">
                Orchestrator delegates tasks to 3 agents automatically
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isRunning ? (
              <Button onClick={runDemo} className="glow gap-2">
                <Play className="h-4 w-4" />
                {completedCount > 0 ? "Run Again" : "Start Demo"}
              </Button>
            ) : (
              <Button variant="secondary" disabled className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </Button>
            )}
            {completedCount > 0 && !isRunning && (
              <Button variant="ghost" size="icon" onClick={resetDemo}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{completedCount}/{steps.length} delegations</span>
            <span>{totalSubActions} sub-actions executed</span>
            {totalTime > 0 && <span>{(totalTime / 1000).toFixed(1)}s total</span>}
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </motion.div>

      {/* Orchestrator Node */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center">
        <div className={`glass-card rounded-2xl px-6 py-4 flex items-center gap-3 border-2 transition-colors ${isRunning ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border"}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-bold text-sm">Orchestrator</p>
            <p className="text-[10px] text-muted-foreground">Central A2A Coordinator</p>
          </div>
          {isRunning && (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <Zap className="h-4 w-4 text-primary" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Agent Cards */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {steps.map((step, i) => {
            const ToolIcon = toolIcons[step.tool || ""] || Zap;
            const gradient = tierColors[step.targetAgent] || "from-muted to-muted";

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card rounded-2xl overflow-hidden transition-all ${
                  step.phase === "executing" ? "ring-2 ring-primary/30 shadow-lg shadow-primary/5" :
                  step.phase === "complete" ? "ring-1 ring-accent-emerald/30" : ""
                }`}
              >
                <div className={`h-1 transition-all duration-500 ${
                  step.phase === "complete" ? "bg-gradient-to-r from-accent-emerald to-accent-emerald/30" :
                  step.phase === "executing" ? "bg-gradient-to-r from-primary to-primary/30 animate-pulse" :
                  step.phase === "routing" ? "bg-gradient-to-r from-amber-500 to-amber-500/30" :
                  "bg-border/30"
                }`} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <ArrowRightLeft className={`h-3.5 w-3.5 transition-colors ${
                          step.phase === "executing" ? "text-primary animate-pulse" :
                          step.phase === "complete" ? "text-accent-emerald" : "text-muted-foreground/40"
                        }`} />
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <Bot className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="font-display font-semibold text-sm">{step.targetAgent}</p>
                        <p className="text-[11px] text-muted-foreground">{step.task}</p>
                      </div>
                    </div>

                    <Badge variant="secondary" className={`text-[10px] shrink-0 ${
                      step.phase === "complete" ? "bg-accent-emerald/15 text-accent-emerald" :
                      step.phase === "executing" ? "bg-primary/15 text-primary" :
                      step.phase === "routing" ? "bg-amber-500/15 text-amber-500" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {step.phase === "complete" && <><CheckCircle className="h-3 w-3 mr-1" /> Complete</>}
                      {step.phase === "executing" && <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Executing</>}
                      {step.phase === "routing" && <><ArrowRight className="h-3 w-3 mr-1" /> Routing</>}
                      {step.phase === "pending" && <><Clock className="h-3 w-3 mr-1" /> Waiting</>}
                    </Badge>
                  </div>

                  <AnimatePresence>
                    {step.phase === "complete" && step.subActions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 mt-3"
                      >
                        <div className="flex flex-wrap gap-1.5">
                          {step.subActions.map((sub, j) => {
                            const SubIcon = toolIcons[sub.tool] || Zap;
                            return (
                              <motion.div
                                key={j}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: j * 0.15 }}
                                className="flex items-center gap-1.5 bg-accent-emerald/10 border border-accent-emerald/20 rounded-lg px-2.5 py-1 text-[10px] text-accent-emerald"
                              >
                                <SubIcon className="h-3 w-3" />
                                <span>{sub.label}</span>
                                <CheckCircle className="h-2.5 w-2.5" />
                              </motion.div>
                            );
                          })}
                        </div>

                        {step.result && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-background/50 rounded-xl p-3 border border-border/50"
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Bot className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Response from {step.targetAgent}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed">{step.result}</p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <AnimatePresence>
        {completedCount === steps.length && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card rounded-2xl p-6 border-2 border-accent-emerald/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-emerald/15 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-accent-emerald" />
              </div>
              <div>
                <h3 className="font-display font-bold">Orchestration Complete</h3>
                <p className="text-xs text-muted-foreground">
                  {steps.length} delegations • {totalSubActions} sub-actions • {(totalTime / 1000).toFixed(1)}s
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-background/50 rounded-xl p-3 text-center">
                <p className="font-display text-2xl font-bold text-accent-emerald">{steps.length}</p>
                <p className="text-[10px] text-muted-foreground">Agents Activated</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3 text-center">
                <p className="font-display text-2xl font-bold text-primary">{totalSubActions}</p>
                <p className="text-[10px] text-muted-foreground">Actions Executed</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3 text-center">
                <p className="font-display text-2xl font-bold text-amber-500">100%</p>
                <p className="text-[10px] text-muted-foreground">Success Rate</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              💡 In production, this flow uses real AI via <strong>delegate_to_agent</strong> with up to 3 levels of recursion.
              Open the <strong>Agent Chat</strong> to test real delegations.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrchestrationDemo;
