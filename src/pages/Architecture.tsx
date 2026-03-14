import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Cpu, Zap, Layers, Terminal,
  Eye, Database, Workflow, Bot, Server,
  Network, ArrowRight, ChevronDown, Code2, CheckCircle2,
  Play, Pause, MessageSquare, Sparkles, Clock, BookOpen,
  Search, Globe, Shield, BarChart3, Users, Lightbulb,
  MousePointerClick, Activity, Radio, Bell, Image, Kanban,
  Target, LineChart, Settings, Smartphone,
  TrendingUp, ChevronRight, Rocket, DollarSign,
  Hash, Link2, Mic, Send, AlertTriangle,
  FileText, Calendar, Package, Briefcase, Phone,
  Download, Eye as EyeIcon, TrendingDown, ArrowUpRight,
  Palette, Star, ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { departments, deptDetails, totalAgents, totalPrometheusCost, totalCltCost, totalSavingsPercent } from "@/data/departmentData";

// ── Animations ──
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }
  })
};

const Section = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`py-16 sm:py-24 px-4 sm:px-6 ${className}`}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const SectionTag = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-3 block">{children}</span>
);

const Divider = () => (
  <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>
);

// ═══════════════════════════════════════
// ═══ NAV PILLS ═══
// ═══════════════════════════════════════
const NAV_SECTIONS = [
  { id: "hero", label: "Overview" },
  { id: "dashboard", label: "Dashboard" },
  { id: "command-center", label: "Agent Board" },
  { id: "agent-comms", label: "Agent Comms" },
  { id: "insights", label: "Insights" },
  { id: "departments", label: "Departamentos" },
  { id: "platform", label: "Plataforma" },
  { id: "simulation", label: "Simulação" },
  { id: "architecture", label: "Arquitetura" },
  { id: "integrations", label: "Integrações" },
];

// ═══════════════════════════════════════
// ═══ REVENUE DASHBOARD ═══
// ═══════════════════════════════════════
const RevenueDashboard = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(p => p + 1), 3000); return () => clearInterval(t); }, []);

  const kpis = [
    { label: "Revenue 24h", value: `$${(12_847 + tick * 23).toLocaleString()}`, icon: DollarSign, trend: "+18%", up: true },
    { label: "Revenue 7d", value: `$${(89_432 + tick * 112).toLocaleString()}`, icon: TrendingUp, trend: "+24%", up: true },
    { label: "Active Customers", value: (2_847 + tick).toLocaleString(), icon: Users, trend: "+12", up: true },
    { label: "Churn Risk", value: "4", icon: AlertTriangle, trend: "High", up: false },
    { label: "Support Tickets", value: (23 + (tick % 5)).toString(), icon: MessageSquare, trend: "+3 today", up: false },
    { label: "Campaign ROAS", value: `${(3.2 + tick * 0.1).toFixed(1)}x`, icon: Target, trend: "+0.4x", up: true },
  ];

  const insights = [
    { icon: AlertTriangle, color: "text-accent-amber", text: "4 customers at risk — low engagement in last 14 days" },
    { icon: TrendingDown, color: "text-destructive", text: "Campaign 'Summer Launch' performance dropping -12% WoW" },
    { icon: MessageSquare, color: "text-accent-blue", text: "Support tickets increased 15% — suggest adding FAQ bot" },
    { icon: Search, color: "text-accent-emerald", text: "SEO opportunity detected: 3 keywords with low competition" },
    { icon: Star, color: "text-accent-amber", text: "Product feature 'Dark Mode' has 89% satisfaction score" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="p-4 border-border/20 bg-card/30">
            <div className="flex items-center gap-1.5 mb-2">
              <k.icon className="h-3.5 w-3.5 text-primary/50" strokeWidth={1.5} />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{k.label}</span>
            </div>
            <p className="font-display text-lg font-bold">{k.value}</p>
            <span className={cn("text-[10px] font-medium", k.up ? "text-accent-emerald" : "text-destructive")}>
              {k.up ? "↑" : "↓"} {k.trend}
            </span>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      <Card className="border-border/20 bg-card/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span className="text-sm font-semibold">AI-Generated Insights</span>
          <Badge variant="secondary" className="text-[8px] h-4 ml-auto">Auto-updated</Badge>
        </div>
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/10 border border-border/10">
              <ins.icon className={cn("h-4 w-4 shrink-0 mt-0.5", ins.color)} strokeWidth={1.5} />
              <span className="text-xs text-foreground/80">{ins.text}</span>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Mini charts */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { title: "Conversion Funnel", data: [100, 68, 42, 28, 19], labels: ["Visit", "Signup", "Trial", "Active", "Paid"] },
          { title: "Revenue by Channel", data: [45, 28, 18, 9], labels: ["Organic", "Paid", "Referral", "Direct"] },
          { title: "Agent Performance", data: [98, 95, 92, 88, 84], labels: ["Support", "SDR", "Content", "Analytics", "Finance"] },
        ].map(chart => (
          <Card key={chart.title} className="p-4 border-border/20 bg-card/30">
            <p className="text-xs font-semibold mb-3">{chart.title}</p>
            <div className="space-y-2">
              {chart.data.map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground w-14 shrink-0">{chart.labels[i]}</span>
                  <div className="flex-1 bg-muted/20 rounded-full h-1.5">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary" initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 1, delay: i * 0.1 }} />
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground w-7">{val}%</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// ═══ AGENT COMMUNICATION (SLACK-LIKE) ═══
// ═══════════════════════════════════════
const AGENT_CONVERSATIONS = [
  { from: "Marketing Agent", to: "Content Agent", avatar: "🎯", message: "I need 5 new ad creatives for the Summer campaign. Focus on mobile-first formats.", time: "14:32" },
  { from: "Content Agent", to: "Marketing Agent", avatar: "✍️", message: "Creatives ready! 3 video + 2 carousel. Sent to review folder.", time: "14:35" },
  { from: "Marketing Agent", to: "Ads Agent", avatar: "🎯", message: "Launch Campaign #47 with the new creatives. Budget: $2,500/day.", time: "14:36" },
  { from: "Ads Agent", to: "Analytics Agent", avatar: "📢", message: "Campaign #47 launched on Meta + Google. First results in 4h.", time: "14:38" },
  { from: "Analytics Agent", to: "Marketing Agent", avatar: "📊", message: "Early signal: CTR 2.8% (above 2.1% benchmark). Continue monitoring.", time: "18:42" },
  { from: "Finance Agent", to: "Marketing Agent", avatar: "💰", message: "Budget alert: Campaign spend at 78% of monthly allocation.", time: "19:15" },
  { from: "SEO Agent", to: "Content Agent", avatar: "🔍", message: "New keyword opportunity: 'AI automation tools' — 12K monthly searches, low competition.", time: "20:01" },
  { from: "Support Agent", to: "Product Agent", avatar: "🎧", message: "3 tickets about onboarding flow. Users confused at step 3. Suggest UX review.", time: "20:30" },
];

const AgentCommunication = () => {
  const [visibleCount, setVisibleCount] = useState(3);
  useEffect(() => {
    const t = setInterval(() => setVisibleCount(p => Math.min(p + 1, AGENT_CONVERSATIONS.length)), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <Card className="border-border/20 bg-card/20 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/20 bg-muted/10">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-amber/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-emerald/60" />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground ml-2"># agent-general</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
          <span className="font-mono text-[10px] text-accent-emerald">8 agents online</span>
        </div>
      </div>
      <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">
        {AGENT_CONVERSATIONS.slice(0, visibleCount).map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center text-sm shrink-0">{msg.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-foreground">{msg.from}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground/30" strokeWidth={1.5} />
                <span className="text-xs text-muted-foreground">{msg.to}</span>
                <span className="text-[9px] text-muted-foreground/50 ml-auto">{msg.time}</span>
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed">{msg.message}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-border/20 bg-muted/5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/20 bg-card/30">
          <span className="text-xs text-muted-foreground/40 flex-1">Thor is typing a delegation...</span>
          <Send className="h-3.5 w-3.5 text-muted-foreground/30" strokeWidth={1.5} />
        </div>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════
// ═══ COMPANY INSIGHT ENGINE ═══
// ═══════════════════════════════════════
const REPORTS = [
  { title: "Daily Sales Report", type: "daily", agent: "Finance Agent", date: "Today", metrics: ["Revenue: $12,847", "Orders: 142", "AOV: $90.47", "Refunds: 3"], status: "ready" },
  { title: "Weekly Marketing Performance", type: "weekly", agent: "Marketing Agent", date: "This Week", metrics: ["ROAS: 3.2x", "Spend: $8,400", "Leads: 247", "CPL: $34"], status: "ready" },
  { title: "Monthly Customer Health", type: "monthly", agent: "Support Agent", date: "March 2026", metrics: ["NPS: 72", "CSAT: 4.6/5", "Churn: 2.1%", "Tickets: 342"], status: "generating" },
  { title: "Product Analytics Summary", type: "weekly", agent: "Product Agent", date: "This Week", metrics: ["DAU: 1,847", "Sessions: 12K", "Feature adoption: 67%", "Bugs: 4"], status: "ready" },
  { title: "SEO Performance Report", type: "monthly", agent: "SEO Agent", date: "March 2026", metrics: ["Organic traffic: +18%", "Rankings: 47 top-10", "Backlinks: +23", "DA: 42"], status: "ready" },
];

const InsightEngine = () => {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const filtered = activeFilter === "all" ? REPORTS : REPORTS.filter(r => r.type === activeFilter);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        {["all", "daily", "weekly", "monthly"].map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={cn("text-[10px] font-medium px-3 py-1.5 rounded-lg transition-all capitalize",
              activeFilter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/20")}>
            {f === "all" ? "All Reports" : f}
          </button>
        ))}
      </div>

      {/* Reports grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((report, i) => (
          <motion.div key={report.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 border-border/20 bg-card/30 hover:border-primary/15 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-xs font-semibold mb-1">{report.title}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[8px] h-4 capitalize">{report.type}</Badge>
                    <span className="text-[9px] text-muted-foreground">{report.agent}</span>
                  </div>
                </div>
                {report.status === "generating" ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse" />
                    <span className="text-[9px] text-accent-amber">Generating</span>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="h-3 w-3" /> PDF
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {report.metrics.map(m => (
                  <div key={m} className="text-[10px] text-muted-foreground bg-muted/10 rounded px-2 py-1">{m}</div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[9px] text-muted-foreground/50">
                <Calendar className="h-3 w-3" strokeWidth={1.5} />
                {report.date}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// ═══ CREATIVE DISCOVERY ═══
// ═══════════════════════════════════════
const CREATIVES = [
  { title: "Mobile-first Video Ad", source: "Meta Ads Library", score: 92, type: "Video", engagement: "2.8% CTR", status: "high-performer" },
  { title: "Carousel Product Showcase", source: "Competitor Scan", score: 87, type: "Carousel", engagement: "3.1% CTR", status: "trending" },
  { title: "UGC Testimonial Clip", source: "TikTok Creative Center", score: 78, type: "Video", engagement: "1.9% CTR", status: "new" },
  { title: "Static Brand Awareness", source: "Google Ads", score: 65, type: "Image", engagement: "1.2% CTR", status: "average" },
];

const CreativeDiscovery = () => (
  <div className="grid sm:grid-cols-2 gap-3">
    {CREATIVES.map((c, i) => (
      <motion.div key={c.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
        <Card className="p-4 border-border/20 bg-card/30 hover:border-primary/15 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent-violet/10 flex items-center justify-center">
              {c.type === "Video" ? <Play className="h-5 w-5 text-primary/60" /> : <Image className="h-5 w-5 text-primary/60" strokeWidth={1.5} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold truncate">{c.title}</h4>
              <p className="text-[9px] text-muted-foreground">{c.source}</p>
            </div>
            <div className="text-right">
              <p className={cn("text-sm font-bold", c.score >= 85 ? "text-accent-emerald" : c.score >= 70 ? "text-accent-amber" : "text-muted-foreground")}>{c.score}</p>
              <p className="text-[8px] text-muted-foreground">Score</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[9px]">
            <Badge variant="secondary" className="text-[8px] h-4">{c.type}</Badge>
            <span className="text-muted-foreground">{c.engagement}</span>
            <Badge className={cn("text-[8px] h-4 ml-auto border-0",
              c.status === "high-performer" ? "bg-accent-emerald/10 text-accent-emerald" :
              c.status === "trending" ? "bg-accent-amber/10 text-accent-amber" :
              "bg-muted/20 text-muted-foreground"
            )}>{c.status}</Badge>
          </div>
        </Card>
      </motion.div>
    ))}
  </div>
);

// ═══════════════════════════════════════
// ═══ COMMAND CENTER TABS ═══
// ═══════════════════════════════════════
const MOCK_AGENTS = [
  { name: "SDR Outbound", dept: "Vendas", status: "running", task: "Prospecting 47 leads", progress: 72, executions: 1847, latency: "120ms" },
  { name: "Content Writer", dept: "Marketing", status: "running", task: "Blog post: AI Trends 2026", progress: 45, executions: 923, latency: "340ms" },
  { name: "Data Analyst", dept: "Analytics", status: "idle", task: "Waiting for data", progress: 0, executions: 2341, latency: "90ms" },
  { name: "Support Agent", dept: "Suporte", status: "running", task: "Ticket #4521 resolution", progress: 88, executions: 5102, latency: "200ms" },
  { name: "Dev Agent", dept: "Tecnologia", status: "running", task: "Refactoring auth module", progress: 34, executions: 1204, latency: "450ms" },
  { name: "CFO Agent", dept: "Financeiro", status: "completed", task: "Monthly report generated", progress: 100, executions: 342, latency: "180ms" },
  { name: "HR Recruiter", dept: "RH", status: "idle", task: "Screening paused", progress: 0, executions: 567, latency: "150ms" },
  { name: "Growth Hacker", dept: "Marketing", status: "running", task: "A/B test campaign #12", progress: 61, executions: 1089, latency: "280ms" },
];

const STATUS_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  running: { dot: "bg-accent-emerald", text: "text-accent-emerald", label: "Running" },
  idle: { dot: "bg-muted-foreground", text: "text-muted-foreground", label: "Idle" },
  completed: { dot: "bg-primary", text: "text-primary", label: "Done" },
};

type TabId = "agents" | "activity" | "scrum" | "metrics";

const CommandCenterTabs = () => {
  const [activeTab, setActiveTab] = useState<TabId>("agents");
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(p => p + 1), 2000); return () => clearInterval(t); }, []);

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: "agents", label: "Agents", icon: Bot },
    { id: "activity", label: "Live Activity", icon: Activity },
    { id: "scrum", label: "Scrum Board", icon: Kanban },
    { id: "metrics", label: "Metrics", icon: BarChart3 },
  ];

  return (
    <div>
      <div className="flex gap-1 border-b border-border/20 mb-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all",
              activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            <t.icon className="h-3.5 w-3.5" strokeWidth={1.5} />{t.label}
          </button>
        ))}
      </div>
      <div className="p-4 sm:p-6 min-h-[420px]">
        <AnimatePresence mode="wait">
          {activeTab === "agents" && <motion.div key="agents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AgentGridView tick={tick} /></motion.div>}
          {activeTab === "activity" && <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><LiveActivityView tick={tick} /></motion.div>}
          {activeTab === "scrum" && <motion.div key="scrum" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ScrumBoardView /></motion.div>}
          {activeTab === "metrics" && <motion.div key="metrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><MetricsView tick={tick} /></motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AgentGridView = ({ tick }: { tick: number }) => {
  const agents = useMemo(() => MOCK_AGENTS.map(a => ({
    ...a, progress: a.status === "running" ? Math.min(99, a.progress + (tick % 5)) : a.progress,
  })), [tick]);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {agents.map((agent, i) => {
        const st = STATUS_STYLES[agent.status];
        return (
          <motion.div key={agent.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 border-border/20 bg-card/30 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-2 h-2 rounded-full", st.dot, agent.status === "running" && "animate-pulse")} />
                <span className="text-xs font-semibold truncate">{agent.name}</span>
              </div>
              <Badge variant="secondary" className="text-[9px] mb-2">{agent.dept}</Badge>
              <p className="text-[10px] text-muted-foreground truncate mb-2">{agent.task}</p>
              {agent.status === "running" && (
                <div className="w-full bg-muted/30 rounded-full h-1.5">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary" initial={{ width: 0 }} animate={{ width: `${agent.progress}%` }} transition={{ duration: 0.5 }} />
                </div>
              )}
              <div className="flex justify-between mt-2 text-[9px] text-muted-foreground">
                <span>{agent.executions.toLocaleString()} exec</span>
                <span>{agent.latency}</span>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

const ACTIVITY_LOG = [
  { time: "14:32:01", agent: "SDR Outbound", action: "Lead qualificado: TechCorp Inc.", type: "success" },
  { time: "14:31:45", agent: "Thor", action: "Tarefa delegada → Content Writer", type: "info" },
  { time: "14:31:22", agent: "Dev Agent", action: "PR #847 criado: auth refactor", type: "success" },
  { time: "14:31:08", agent: "Support Agent", action: "Ticket #4521 resolvido em 2m 14s", type: "success" },
  { time: "14:30:55", agent: "Growth Hacker", action: "Variante B winning (+23% CTR)", type: "warning" },
  { time: "14:30:41", agent: "Claude Code", action: "Code review concluído: 0 issues", type: "success" },
  { time: "14:30:28", agent: "CFO Agent", action: "Relatório mensal exportado → PDF", type: "info" },
  { time: "14:30:12", agent: "OpenClaw", action: "3 agents em paralelo: exec OK", type: "success" },
  { time: "14:29:58", agent: "Data Analyst", action: "Dataset carregado: 124K rows", type: "info" },
  { time: "14:29:33", agent: "SDR Outbound", action: "Email automático enviado → 12 leads", type: "success" },
];

const TYPE_COLORS: Record<string, string> = { success: "text-accent-emerald", info: "text-accent-blue", warning: "text-accent-amber" };

const LiveActivityView = ({ tick }: { tick: number }) => {
  const visibleCount = Math.min(ACTIVITY_LOG.length, 4 + (tick % 7));
  return (
    <div className="space-y-0">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
        <span className="font-mono text-[10px] text-accent-emerald uppercase tracking-widest">Live Feed</span>
      </div>
      <div className="space-y-1 font-mono text-xs">
        {ACTIVITY_LOG.slice(0, visibleCount).map((log, i) => (
          <motion.div key={i} initial={i === 0 ? { opacity: 0, x: -12 } : {}} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 py-2 border-b border-border/10 last:border-0">
            <span className="text-muted-foreground/50 shrink-0 w-16">{log.time}</span>
            <span className="text-foreground font-semibold shrink-0 w-28 truncate">{log.agent}</span>
            <span className={cn("flex-1", TYPE_COLORS[log.type] || "text-muted-foreground")}>{log.action}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SCRUM_COLUMNS = [
  { title: "Backlog", items: [{ agent: "HR Recruiter", task: "Screen 20 candidates" }, { agent: "Legal Agent", task: "Review NDA template" }] },
  { title: "In Progress", items: [{ agent: "Dev Agent", task: "Auth module refactor" }, { agent: "SDR Outbound", task: "Prospect 47 leads" }, { agent: "Content Writer", task: "Blog: AI Trends" }] },
  { title: "Review", items: [{ agent: "Growth Hacker", task: "A/B test results" }] },
  { title: "Done", items: [{ agent: "CFO Agent", task: "Monthly report" }, { agent: "Support Agent", task: "Ticket #4521" }] },
];
const COLUMN_COLORS = ["text-muted-foreground", "text-accent-amber", "text-accent-blue", "text-accent-emerald"];

const ScrumBoardView = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {SCRUM_COLUMNS.map((col, ci) => (
      <div key={col.title}>
        <div className="flex items-center gap-2 mb-3">
          <span className={cn("font-semibold text-xs", COLUMN_COLORS[ci])}>{col.title}</span>
          <Badge variant="secondary" className="text-[9px] h-4">{col.items.length}</Badge>
        </div>
        <div className="space-y-2">
          {col.items.map(item => (
            <Card key={item.task} className="p-3 border-border/20 bg-card/30">
              <p className="text-[10px] font-semibold mb-1">{item.agent}</p>
              <p className="text-[10px] text-muted-foreground">{item.task}</p>
            </Card>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const MetricsView = ({ tick }: { tick: number }) => {
  const metrics = [
    { label: "Exec/hour", value: 180 + (tick % 20), icon: Zap, trend: "+12%" },
    { label: "Success Rate", value: "98.7%", icon: CheckCircle2, trend: "+0.3%" },
    { label: "Avg Time", value: "1.4s", icon: Clock, trend: "-18%" },
    { label: "Active Agents", value: 6, icon: Bot, trend: `${totalAgents} total` },
  ];
  const barData = [
    { label: "Sales", value: 84 }, { label: "Marketing", value: 72 }, { label: "Support", value: 95 },
    { label: "Dev", value: 67 }, { label: "Finance", value: 45 }, { label: "HR", value: 38 },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {metrics.map(m => (
          <Card key={m.label} className="p-4 border-border/20 bg-card/30">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className="h-3.5 w-3.5 text-primary/60" strokeWidth={1.5} />
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
            </div>
            <p className="text-xl font-bold font-display">{typeof m.value === "number" ? m.value.toLocaleString() : m.value}</p>
            <span className="text-[10px] text-accent-emerald">{m.trend}</span>
          </Card>
        ))}
      </div>
      <Card className="p-4 border-border/20 bg-card/30">
        <p className="text-xs font-semibold mb-4">Executions by Department</p>
        <div className="space-y-2.5">
          {barData.map(d => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground w-16 shrink-0">{d.label}</span>
              <div className="flex-1 bg-muted/20 rounded-full h-2">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary" initial={{ width: 0 }} animate={{ width: `${d.value}%` }} transition={{ duration: 1, delay: 0.1 }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-8">{d.value}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════
// ═══ LIVE TERMINAL SIMULATION ═══
// ═══════════════════════════════════════
const simulationSteps = [
  { agent: "Thor", icon: Zap, color: "text-primary", bgColor: "bg-primary/10", messages: [
    "📥 Task received: \"Create payment module\"",
    "🔍 Analyzing system context...",
    "📋 Classification: high priority, dept: fintech",
    "🧠 Routing to Claude Code for planning...",
  ]},
  { agent: "Claude Code", icon: Brain, color: "text-primary", bgColor: "bg-primary/10", messages: [
    "📖 Reading repository... 847 files",
    "🏗️ Plan created: 5 steps",
    "   1. Create src/modules/payments/",
    "   2. Implement PaymentService.ts",
    "   3. Create PaymentController.ts",
    "   4. Unit tests",
    "   5. Update docs",
    "✅ Plan validated → OpenClaw",
  ]},
  { agent: "OpenClaw", icon: Cpu, color: "text-accent-emerald", bgColor: "bg-accent-emerald/10", messages: [
    "⚡ Parallel execution started...",
    "📁 mkdir src/modules/payments/ ✓",
    "📝 PaymentService.ts · 127 lines ✓",
    "📝 PaymentController.ts · 89 lines ✓",
    "🧪 Tests: 12/12 passing ✓",
    "📚 Docs updated ✓",
  ]},
  { agent: "Claude Code", icon: CheckCircle2, color: "text-primary", bgColor: "bg-primary/10", messages: [
    "🔍 Code review...",
    "✅ Lint: 0 errors | Types: OK | Coverage: 94%",
    "🎉 Module created successfully!",
  ]},
];

const LiveSimulation = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<{ step: number; msg: number }[]>([]);

  const advance = useCallback(() => {
    setVisibleMessages(prev => [...prev, { step: currentStep, msg: currentMessage }]);
    const step = simulationSteps[currentStep];
    if (currentMessage < step.messages.length - 1) {
      setCurrentMessage(prev => prev + 1);
    } else if (currentStep < simulationSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setCurrentMessage(0);
    } else {
      setIsPlaying(false);
    }
  }, [currentStep, currentMessage]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(advance, 500);
    return () => clearTimeout(timer);
  }, [isPlaying, advance]);

  const start = () => {
    setCurrentStep(0); setCurrentMessage(0); setVisibleMessages([]);
    setTimeout(() => setIsPlaying(true), 100);
  };

  return (
    <Card className="border-border/20 bg-card/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/20 bg-muted/10">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-amber/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-emerald/60" />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground ml-2">clauthor-simulation.sh</span>
        <div className="ml-auto flex items-center gap-2">
          {isPlaying && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
              <span className="font-mono text-[10px] text-accent-emerald">live</span>
            </div>
          )}
          <Button onClick={isPlaying ? () => setIsPlaying(false) : start} size="sm" variant="ghost" className="h-6 px-2 gap-1.5 text-[10px]">
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isPlaying ? "Pause" : visibleMessages.length > 0 ? "Replay" : "Run"}
          </Button>
        </div>
      </div>
      <div className="p-4 max-h-[350px] overflow-y-auto font-mono text-xs space-y-1 min-h-[200px]">
        {visibleMessages.length === 0 && (
          <div className="flex items-center justify-center h-[180px] text-muted-foreground/30">
            <div className="text-center">
              <Terminal className="h-8 w-8 mx-auto mb-3 opacity-30" strokeWidth={1} />
              <p className="text-[11px]">Click Run to watch AI in action</p>
            </div>
          </div>
        )}
        {simulationSteps.map((step, si) => {
          const stepMessages = visibleMessages.filter(v => v.step === si);
          if (stepMessages.length === 0) return null;
          return (
            <div key={si} className="mb-3">
              <div className="flex items-center gap-2 mb-1.5 mt-2 first:mt-0">
                <div className={cn("w-5 h-5 rounded flex items-center justify-center", step.bgColor)}>
                  <step.icon className={cn("h-3 w-3", step.color)} strokeWidth={1.5} />
                </div>
                <span className={cn("font-semibold text-[11px]", step.color)}>{step.agent}</span>
                <div className="flex-1 h-px bg-border/20" />
              </div>
              {stepMessages.map((v, mi) => (
                <motion.div key={`${si}-${mi}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-muted-foreground pl-7 py-0.5">
                  {step.messages[v.msg]}
                </motion.div>
              ))}
            </div>
          );
        })}
        {isPlaying && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-4 bg-primary/60 ml-7" />}
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════
// ═══ DEPARTMENT EXPLORER ═══
// ═══════════════════════════════════════
const DepartmentExplorer = () => {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {departments.map((dept, i) => {
        const isOpen = expanded === dept.id;
        const detail = deptDetails[dept.id];
        const Icon = dept.icon;
        return (
          <motion.div key={dept.id} variants={fadeUp} custom={i}>
            <Card className={cn("border-border/20 bg-card/30 overflow-hidden transition-all cursor-pointer", isOpen ? `${dept.borderActive} bg-card/50` : "hover:border-primary/10")}
              onClick={() => setExpanded(isOpen ? null : dept.id)}>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", dept.iconBg)}>
                    <Icon className={cn("h-4 w-4", dept.color)} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold capitalize">{dept.id.replace(/_/g, " ")}</h3>
                      {dept.popular && <Badge className="text-[8px] h-4 bg-primary/10 text-primary border-0">Popular</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{dept.agents.length} agents · {dept.tokens} tokens</p>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground/40 transition-transform", isOpen && "rotate-180")} strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-3 text-[9px]">
                  <span className="text-muted-foreground/60">CLT: <span className="line-through">R${dept.cltCost.toLocaleString()}</span></span>
                  <span className="text-accent-emerald font-semibold">AI: R${dept.prometheusCost.toLocaleString()}/mo</span>
                  <Badge variant="secondary" className="text-[8px] h-4 text-accent-emerald bg-accent-emerald/10 border-0">-{dept.discount}%</Badge>
                </div>
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-3">
                      <div>
                        <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Agents</p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {dept.agents.map(a => (
                            <div key={a.key} className="flex items-center gap-2 text-[11px]">
                              <a.icon className={cn("h-3 w-3 shrink-0", dept.color)} strokeWidth={1.5} />
                              <span className="text-foreground/80">{a.role}</span>
                              <span className="ml-auto text-[9px] font-mono text-muted-foreground/50">{a.tokens}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {detail && (
                        <div>
                          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Replaces</p>
                          <div className="flex flex-wrap gap-1.5">
                            {detail.replaces.map(r => (
                              <span key={r} className="text-[9px] text-destructive/60 bg-destructive/5 px-2 py-0.5 rounded-full line-through">{r}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {detail && detail.faq.length > 0 && (
                        <div>
                          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">FAQ</p>
                          <div className="space-y-2">
                            {detail.faq.slice(0, 2).map(f => (
                              <div key={f.q}>
                                <p className="text-[10px] font-semibold text-foreground/80">{f.q}</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">{f.a}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════
// ═══ PLATFORM FEATURES ═══
// ═══════════════════════════════════════
const PLATFORM_FEATURES = [
  { icon: Bot, title: "Agent Command Center", tag: "Core", desc: "Real-time monitoring of all agents with status, tasks, progress and metrics.", details: ["Agent status cards", "Live progress tracking", "Execution metrics", "Department filters"] },
  { icon: MessageSquare, title: "THOR · Orchestrator", tag: "Brain", desc: "Conversational AI that orchestrates all agents automatically.", details: ["Context-aware chat", "Auto task delegation", "Long-term memory", "Proactive suggestions"] },
  { icon: Settings, title: "Agent Creator", tag: "Builder", desc: "Create custom agents with name, type, tasks, cron schedule and integrations.", details: ["4 types: marketing, analytics, automation, research", "Cron schedule config", "Integration selection", "Ready-made templates"] },
  { icon: Workflow, title: "Task Automation", tag: "Automation", desc: "Define automated routines: traffic analysis, weekly reports, daily creatives.", details: ["Visual workflow builder", "Cron/event triggers", "Agent chain sequences", "Auto WhatsApp notifications"] },
  { icon: Activity, title: "Real-time Activity", tag: "Monitoring", desc: "Live visual logs of which agent is running, the task and execution time.", details: ["Real-time activity feed", "Agent and type filters", "Auto error alerts", "Exportable history"] },
  { icon: Smartphone, title: "WhatsApp Notifications", tag: "Alerts", desc: "Alerts, reports and insights sent automatically to WhatsApp.", details: ["Configurable recipients", "Message templates", "PDF report delivery", "Priority-level alerts"] },
  { icon: Shield, title: "Advanced Security", tag: "Security", desc: "AES-256 encryption, RLS, audit logs, role-based access control.", details: ["Per-agent encrypted credentials", "Access audit logs", "Row Level Security (RLS)", "Tenant-based access control"] },
  { icon: Kanban, title: "AI Scrum Board", tag: "Management", desc: "Backlog, In Progress, Testing, Completed — each agent as a visual task.", details: ["Kanban drag-and-drop", "Priorities and deadlines", "Execution history", "Throughput metrics"] },
  { icon: Palette, title: "Creative Discovery", tag: "Creative", desc: "AI scrapes the internet for ad creatives. Analyzes and suggests improvements.", details: ["Auto creative scanning", "Performance scoring", "Creative library", "Improvement suggestions"] },
  { icon: BookOpen, title: "Knowledge Base", tag: "Knowledge", desc: "Vector search knowledge base that powers all agents.", details: ["Document upload", "Full-text search", "RAG integration", "Auto categorization"] },
  { icon: LineChart, title: "Data Dashboards", tag: "Analytics", desc: "Traffic, ROI, conversions, creatives and campaigns in interactive dashboards.", details: ["Real-time interactive charts", "Per-department KPIs", "Report export", "Anomaly alerts"] },
  { icon: Users, title: "Multi-tenant", tag: "Enterprise", desc: "Per-company data isolation, access roles and team management.", details: ["Isolated workspaces", "Roles: owner, admin, member", "Member invitations", "Per-plan limits"] },
];

const PlatformFeatureCard = ({ feature, index }: { feature: typeof PLATFORM_FEATURES[0]; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = feature.icon;
  return (
    <motion.div variants={fadeUp} custom={index}>
      <Card className={cn("border-border/20 bg-card/30 overflow-hidden transition-all cursor-pointer group h-full", isOpen ? "border-primary/20 bg-card/50" : "hover:border-primary/10")}
        onClick={() => setIsOpen(!isOpen)}>
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <Badge variant="secondary" className="text-[8px] h-4">{feature.tag}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
            <MousePointerClick className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-1" strokeWidth={1.5} />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-3 border-t border-border/20 space-y-1.5">
                  {feature.details.map(d => (
                    <div key={d} className="flex items-center gap-2 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 text-accent-emerald shrink-0" strokeWidth={1.5} />
                      <span className="text-foreground/70">{d}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// ═══ INTEGRATIONS ═══
// ═══════════════════════════════════════
const INTEGRATIONS = [
  { name: "WhatsApp", icon: Phone, status: "active", desc: "24/7 support & sales" },
  { name: "Meta Ads", icon: Target, status: "active", desc: "Meta campaign management" },
  { name: "Google Ads", icon: Globe, status: "active", desc: "Search & display campaigns" },
  { name: "LinkedIn", icon: Hash, status: "active", desc: "B2B automated prospecting" },
  { name: "SendGrid", icon: MessageSquare, status: "active", desc: "Email marketing & transactional" },
  { name: "PayPal", icon: DollarSign, status: "active", desc: "Payment processing" },
  { name: "HubSpot", icon: Briefcase, status: "coming", desc: "CRM & marketing automation" },
  { name: "Salesforce", icon: Database, status: "coming", desc: "Enterprise CRM" },
  { name: "Slack", icon: MessageSquare, status: "coming", desc: "Notifications & chat" },
  { name: "Zapier", icon: Zap, status: "coming", desc: "Cross-platform automation" },
  { name: "GitHub", icon: Code2, status: "active", desc: "Repos & CI/CD" },
  { name: "ElevenLabs", icon: Mic, status: "active", desc: "AI voice for agents" },
];

// ═══════════════════════════════════════
// ═══ ARCHITECTURE FLOW ═══
// ═══════════════════════════════════════
const FlowArrow = () => (
  <div className="flex justify-center py-1">
    <div className="w-px h-5 bg-gradient-to-b from-primary/40 to-primary/10 relative">
      <ChevronDown className="h-3 w-3 text-primary/50 absolute -bottom-1.5 -left-[5px]" strokeWidth={1.5} />
    </div>
  </div>
);

const FlowNode = ({ icon: Icon, label, sublabel, accent = false, onClick }: {
  icon: any; label: string; sublabel?: string; accent?: boolean; onClick?: () => void;
}) => (
  <div onClick={onClick}
    className={cn("flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-sm transition-all",
      onClick && "cursor-pointer hover:scale-[1.02]",
      accent ? "border-primary/30 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.08)]" : "border-border/40 bg-card/40")}>
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", accent ? "bg-primary/10" : "bg-muted/60")}>
      <Icon className={cn("h-4 w-4", accent ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
    </div>
    <div>
      <p className={cn("text-sm font-semibold", accent ? "text-primary" : "text-foreground")}>{label}</p>
      {sublabel && <p className="text-[11px] text-muted-foreground">{sublabel}</p>}
    </div>
    {onClick && <MousePointerClick className="h-3 w-3 text-muted-foreground/40 ml-auto" strokeWidth={1.5} />}
  </div>
);

const architectureDetails: Record<string, { title: string; desc: string; stats: string[] }> = {
  "Thor": { title: "Thor · Orchestrator", desc: "Digital CEO. Receives all requests, classifies and distributes to the right layer.", stats: ["Latency: 120ms", "Uptime: 99.97%", "2,400 tasks/day"] },
  "Claude Code": { title: "Claude Code · Brain", desc: "AI model that reads entire repos, plans architecture and reviews code.", stats: ["Context: 200K tokens", "Accuracy: 94.2%", "Claude 3.5 Sonnet"] },
  "OpenClaw": { title: "OpenClaw · Engine", desc: "Runtime that turns plans into actions: creates files, runs commands, executes tests.", stats: ["12 parallel agents", "Full filesystem", "~180 exec/hour"] },
  [`${totalAgents} Agents`]: { title: `${totalAgents} Specialized Agents`, desc: "Each agent is an expert in its department. Working 24/7.", stats: ["15 departments", "24/7 operation", "Infinite scale"] },
};

const ClickableArchNode = ({ icon, label, sublabel, accent }: { icon: any; label: string; sublabel?: string; accent?: boolean }) => {
  const [open, setOpen] = useState(false);
  const detail = architectureDetails[label];
  return (
    <div className="relative">
      <FlowNode icon={icon} label={label} sublabel={sublabel} accent={accent} onClick={detail ? () => setOpen(!open) : undefined} />
      <AnimatePresence>
        {open && detail && (
          <>
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-full top-0 ml-4 z-20 w-64 hidden lg:block">
              <Card className="p-4 border-primary/20 bg-card/95 backdrop-blur-xl shadow-xl">
                <h4 className="font-semibold text-sm mb-1.5">{detail.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{detail.desc}</p>
                <div className="space-y-1">
                  {detail.stats.map(s => (
                    <div key={s} className="flex items-center gap-2 text-[10px] font-mono text-primary/70">
                      <div className="w-1 h-1 rounded-full bg-primary/40" />{s}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden overflow-hidden mt-2">
              <Card className="p-3 border-primary/20 bg-card/90 backdrop-blur-xl">
                <h4 className="font-semibold text-xs mb-1">{detail.title}</h4>
                <p className="text-[10px] text-muted-foreground mb-2">{detail.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {detail.stats.map(s => <span key={s} className="text-[9px] font-mono text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">{s}</span>)}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════
// ═══ 3D OFFICE VISUALIZATION ═══
// ═══════════════════════════════════════
const OFFICE_AGENTS = [
  { name: "SDR", emoji: "🎯", status: "working", task: "Prospecting" },
  { name: "Content", emoji: "✍️", status: "working", task: "Blog post" },
  { name: "Support", emoji: "🎧", status: "working", task: "Ticket #4521" },
  { name: "Finance", emoji: "💰", status: "idle", task: "Waiting" },
  { name: "Dev", emoji: "👨‍💻", status: "working", task: "Auth refactor" },
  { name: "Analytics", emoji: "📊", status: "working", task: "Data pipeline" },
  { name: "Growth", emoji: "🚀", status: "working", task: "A/B test" },
  { name: "HR", emoji: "👥", status: "idle", task: "Screening" },
  { name: "SEO", emoji: "🔍", status: "working", task: "Keyword research" },
  { name: "Legal", emoji: "⚖️", status: "idle", task: "Standby" },
  { name: "Product", emoji: "📱", status: "working", task: "UX review" },
  { name: "Ads", emoji: "📢", status: "working", task: "Campaign #47" },
];

const OfficeVisualization = () => (
  <div className="relative">
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3" style={{ perspective: "800px" }}>
      {OFFICE_AGENTS.map((agent, i) => (
        <motion.div key={agent.name} initial={{ opacity: 0, rotateX: 15, y: 20 }} animate={{ opacity: 1, rotateX: 0, y: 0 }}
          transition={{ delay: i * 0.06 }}>
          <Card className={cn("p-3 text-center border-border/20 transition-all hover:scale-105",
            agent.status === "working" ? "bg-primary/[0.03] border-primary/10" : "bg-card/20")}>
            <div className="text-2xl mb-1.5">{agent.emoji}</div>
            <p className="text-[10px] font-semibold">{agent.name}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", agent.status === "working" ? "bg-accent-emerald animate-pulse" : "bg-muted-foreground/40")} />
              <span className="text-[8px] text-muted-foreground">{agent.task}</span>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════
// ═══ MAIN PAGE ═══
// ═══════════════════════════════════════
const Architecture = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ═══ STICKY NAV ═══ */}
      <div className="sticky top-16 z-30 border-b border-border/20 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {NAV_SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              className="text-[10px] font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/30 whitespace-nowrap transition-all">
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <Section id="hero" className="pt-20 sm:pt-28 pb-12 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/[0.03] blur-[150px]" />
        </div>
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="text-center relative z-10">
          <motion.div variants={fadeUp} custom={0}>
            <Badge variant="secondary" className="text-[10px] px-3 py-1 mb-6 font-mono uppercase tracking-widest">
              <Radio className="h-3 w-3 mr-1.5 text-primary" strokeWidth={1.5} />
              AI Company Command Center
            </Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] mb-6">
            <span className="text-foreground">Your company</span><br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-primary">powered by AI agents</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
            {totalAgents} agents across 15 departments. Intelligent orchestration. Autonomous execution. Everything in one place.
          </motion.p>
          <motion.p variants={fadeUp} custom={3} className="text-sm text-muted-foreground/50 max-w-xl mx-auto mb-10">
            Click each section to explore details. This is the full vision of what we deliver.
          </motion.p>
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {[
              { value: String(totalAgents), label: "AI Agents", icon: Bot },
              { value: "15", label: "Departments", icon: Users },
              { value: `${totalSavingsPercent}%`, label: "Cost Savings", icon: TrendingUp },
              { value: "24/7", label: "Operation", icon: Clock },
              { value: "12", label: "Integrations", icon: Link2 },
              { value: "98.7%", label: "Success Rate", icon: CheckCircle2 },
            ].map(s => (
              <div key={s.label} className="text-center">
                <s.icon className="h-4 w-4 text-primary/40 mx-auto mb-1.5" strokeWidth={1.5} />
                <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
                <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ COMPANY DASHBOARD ═══ */}
      <Section id="dashboard">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Company Dashboard</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Real-time Business Intelligence</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Revenue, customers, campaigns, support — all monitored by AI with auto-generated insights.
          </motion.p>
          <motion.div variants={fadeUp}><RevenueDashboard /></motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ AGENT BOARD (COMMAND CENTER) ═══ */}
      <Section id="command-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Agent Board · Trello-style</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Command Center · Live</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Monitor agents, track activity, manage sprints and view metrics in real-time.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Card className="border-border/20 bg-card/20 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20 bg-muted/10">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-amber/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-emerald/60" />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground ml-2">clauthor.com/command-center</span>
              </div>
              <CommandCenterTabs />
            </Card>
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ AGENT COMMUNICATION ═══ */}
      <Section id="agent-comms">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Agent Communication</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Agents talk to each other</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Slack-like channel where agents coordinate, delegate tasks and share results autonomously.
          </motion.p>
          <motion.div variants={fadeUp} className="max-w-3xl">
            <AgentCommunication />
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ INSIGHT ENGINE & REPORTS ═══ */}
      <Section id="insights">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Company Insight Engine</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Auto-generated Reports</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Daily, weekly and monthly reports generated automatically by specialized agents.
          </motion.p>
          <motion.div variants={fadeUp}><InsightEngine /></motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ CREATIVE DISCOVERY ═══ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Creative Discovery</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">AI Creative Scanner</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            AI scans the internet for high-performing ad creatives, scores them and stores in your library.
          </motion.p>
          <motion.div variants={fadeUp}><CreativeDiscovery /></motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ 3D OFFICE ═══ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Digital Headquarters</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Virtual Office</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            See who's working, on what task, and their real-time status in the AI office.
          </motion.p>
          <motion.div variants={fadeUp}><OfficeVisualization /></motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ DEPARTMENTS ═══ */}
      <Section id="departments">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          <motion.div variants={fadeUp}><SectionTag>15 Departments · {totalAgents} Agents</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Entire company in AI</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-3">
            Each department has specialized agents. Click to see agents, who they replace and FAQs.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/20 border border-border/20">
              <DollarSign className="h-3.5 w-3.5 text-accent-emerald" strokeWidth={1.5} />
              <span className="text-xs">
                <span className="text-muted-foreground line-through">R${totalCltCost.toLocaleString()}</span>
                <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground/40" />
                <span className="text-accent-emerald font-bold">R${totalPrometheusCost.toLocaleString()}/mo</span>
              </span>
            </div>
            <Badge variant="secondary" className="text-accent-emerald bg-accent-emerald/10 border-0">{totalSavingsPercent}% savings</Badge>
          </motion.div>
          <DepartmentExplorer />
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ PLATFORM FEATURES ═══ */}
      <Section id="platform">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Full Feature Set · 12 Modules</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Platform Features</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Click each card to see technical details.
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLATFORM_FEATURES.map((f, i) => <PlatformFeatureCard key={f.title} feature={f} index={i} />)}
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ LIVE SIMULATION ═══ */}
      <Section id="simulation">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Live Execution</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Watch AI working</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Real simulation: <span className="text-foreground font-medium">"Create payment module"</span>. Click Run to watch Thor → Claude Code → OpenClaw in action.
          </motion.p>
          <motion.div variants={fadeUp} className="max-w-3xl"><LiveSimulation /></motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ SYSTEM ARCHITECTURE ═══ */}
      <Section id="architecture">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center">
          <motion.div variants={fadeUp}><SectionTag>System Architecture</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Full Architecture</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg mx-auto text-sm mb-8">
            Click each layer for technical details and metrics.
          </motion.p>
          <motion.div variants={fadeUp} className="inline-flex flex-col items-center gap-1 relative">
            <ClickableArchNode icon={Eye} label="User" sublabel="Request" />
            <FlowArrow />
            <ClickableArchNode icon={Zap} label="Thor" sublabel="Orchestrator" accent />
            <FlowArrow />
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <ClickableArchNode icon={Brain} label="Claude Code" sublabel="Planning Brain" accent />
              <FlowNode icon={Database} label="Memory" sublabel="Vector / DB" />
            </div>
            <FlowArrow />
            <FlowNode icon={Workflow} label="Task Queue" sublabel="Execution queue" />
            <FlowArrow />
            <ClickableArchNode icon={Cpu} label="OpenClaw" sublabel="Execution Engine" />
            <FlowArrow />
            <ClickableArchNode icon={Bot} label={`${totalAgents} Agents`} sublabel="Workers" />
            <FlowArrow />
            <FlowNode icon={Server} label="Tools · FS · APIs · DB" />
          </motion.div>
        </motion.div>

        {/* Layers */}
        <div className="mt-16 space-y-3">
          <SectionTag>System Layers</SectionTag>
          <h3 className="font-display text-2xl font-bold mb-6">4 layers, 1 system</h3>
          {[
            { layer: "Layer 1", title: "Orchestration", subtitle: "Thor", icon: Zap, accent: true, desc: "Receives, classifies and distributes all tasks" },
            { layer: "Layer 2", title: "Intelligence", subtitle: "Claude Code", icon: Brain, accent: true, desc: "Plans, reasons and reviews code" },
            { layer: "Layer 3", title: "Execution", subtitle: "OpenClaw", icon: Cpu, accent: false, desc: "Real actions on filesystem and terminal" },
            { layer: "Layer 4", title: "Workers", subtitle: `${totalAgents} Agents`, icon: Bot, accent: false, desc: "Specialized agents per department" },
          ].map((l, i) => (
            <motion.div key={l.layer} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <Card className={cn("p-5 flex items-center gap-4", l.accent ? "border-primary/20 bg-primary/[0.02]" : "border-border/20 bg-card/30")}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", l.accent ? "bg-primary/10" : "bg-muted/40")}>
                  <l.icon className={cn("h-5 w-5", l.accent ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{l.layer}</span>
                    <span className="font-mono text-[10px] text-primary/40">{l.subtitle}</span>
                  </div>
                  <h3 className="font-semibold text-sm">{l.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">{l.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Two Pillars */}
        <div className="mt-16">
          <SectionTag>Two Pillars</SectionTag>
          <h3 className="font-display text-2xl font-bold mb-6">One thinks. The other acts.</h3>
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="p-6 border-primary/20 bg-primary/[0.02]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div><h4 className="font-display text-lg font-bold">Claude Code</h4><p className="text-[10px] font-mono text-primary/60 uppercase tracking-wider">Intelligence</p></div>
              </div>
              <ul className="space-y-2">
                {["Reads repos of 847+ files", "Plans architecture", "Generates code", "Code review", "Detects vulnerabilities"].map(t => (
                  <li key={t} className="flex items-center gap-2 text-xs text-foreground/80"><div className="w-1 h-1 rounded-full bg-primary/50" />{t}</li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-border/20 flex gap-6">
                <div><p className="font-mono text-[9px] text-muted-foreground">Context</p><p className="font-semibold text-sm">200K</p></div>
                <div><p className="font-mono text-[9px] text-muted-foreground">Accuracy</p><p className="font-semibold text-sm">94.2%</p></div>
              </div>
            </Card>
            <Card className="p-6 border-accent-emerald/20 bg-accent-emerald/[0.02]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-accent-emerald" strokeWidth={1.5} />
                </div>
                <div><h4 className="font-display text-lg font-bold">OpenClaw</h4><p className="text-[10px] font-mono text-accent-emerald/60 uppercase tracking-wider">Execution</p></div>
              </div>
              <ul className="space-y-2">
                {["Creates/edits files", "Runs terminal commands", "Executes tests", "Parallel workflows", "Integrates external APIs"].map(t => (
                  <li key={t} className="flex items-center gap-2 text-xs text-foreground/80"><div className="w-1 h-1 rounded-full bg-accent-emerald/50" />{t}</li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-border/20 flex gap-6">
                <div><p className="font-mono text-[9px] text-muted-foreground">Parallel</p><p className="font-semibold text-sm">12</p></div>
                <div><p className="font-mono text-[9px] text-muted-foreground">Exec/hr</p><p className="font-semibold text-sm">~180</p></div>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ═══ INTEGRATIONS ═══ */}
      <Section id="integrations">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Ecosystem</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Integrations</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Platforms that agents connect to natively.
          </motion.p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {INTEGRATIONS.map((intg, i) => (
              <motion.div key={intg.name} variants={fadeUp} custom={i}>
                <Card className={cn("p-4 border-border/20 bg-card/30 transition-all", intg.status === "active" ? "hover:border-primary/20" : "opacity-50")}>
                  <div className="flex items-center gap-2 mb-2">
                    <intg.icon className={cn("h-4 w-4", intg.status === "active" ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
                    <span className="text-xs font-semibold">{intg.name}</span>
                    {intg.status === "active" ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald ml-auto" />
                    ) : (
                      <Badge variant="secondary" className="text-[8px] h-4 ml-auto">Soon</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{intg.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ FINAL ═══ */}
      <Section className="pb-28">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center max-w-3xl mx-auto">
          <motion.div variants={fadeUp}><SectionTag>The Bottom Line</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-5">
            An entire company.<br /><span className="text-primary">Operated by AI.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-sm leading-relaxed mb-10">
            {totalAgents} agents. 15 departments. 12 modules. Intelligent orchestration. Everything running 24/7 with {totalSavingsPercent}% savings vs traditional hiring.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-primary/20 bg-primary/[0.03]">
              <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <div className="text-left"><p className="font-semibold text-sm">Claude Code</p><p className="font-mono text-[9px] text-primary/60 uppercase tracking-widest">Intelligence</p></div>
            </div>
            <span className="text-muted-foreground font-mono text-lg">+</span>
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-accent-emerald/20 bg-accent-emerald/[0.03]">
              <Cpu className="h-5 w-5 text-accent-emerald" strokeWidth={1.5} />
              <div className="text-left"><p className="font-semibold text-sm">OpenClaw</p><p className="font-mono text-[9px] text-accent-emerald/60 uppercase tracking-widest">Execution</p></div>
            </div>
            <span className="text-muted-foreground font-mono text-lg">=</span>
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-accent-amber/20 bg-accent-amber/[0.03]">
              <Rocket className="h-5 w-5 text-accent-amber" strokeWidth={1.5} />
              <div className="text-left"><p className="font-semibold text-sm">{totalAgents} Agents</p><p className="font-mono text-[9px] text-accent-amber/60 uppercase tracking-widest">Infinite scale</p></div>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-12">
            <p className="text-[10px] text-muted-foreground/30 font-mono">clauthor.com · AI Company Command Center · {new Date().getFullYear()}</p>
          </motion.div>
        </motion.div>
      </Section>
    </div>
  );
};

export default Architecture;
