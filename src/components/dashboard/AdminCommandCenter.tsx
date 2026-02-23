import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Bot, DollarSign, TrendingUp, Coins, Zap,
  CheckCircle, ListOrdered, Globe, Cpu, Signal,
  ArrowUpRight, ArrowDownRight, Clock, Eye,
  Shield, Rocket, Wallet, ShieldCheck, Send, Loader2,
  RotateCcw, Sparkles, Activity, Server, Database,
  MessageSquare, Store, BarChart3, Radio, Brain
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import AnimatedCounter from "./AnimatedCounter";
import MiniSparkline from "./MiniSparkline";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

interface AdminCommandCenterProps {
  usersCount: number;
  activeAgents: number;
  totalRevenue: number;
  pendingCount: number;
  totalTokensUsed: number;
  totalExecutions: number;
  successRate: number;
  waitingCount: number;
  allAgents: any[];
  allCredits: any[];
  allProfiles: any[];
  executionLogs: any[];
  revenueData: any[];
  onTabChange: (tab: string) => void;
}

const AdminCommandCenter = ({
  usersCount, activeAgents, totalRevenue, pendingCount,
  totalTokensUsed, totalExecutions, successRate, waitingCount,
  allAgents, allCredits, allProfiles, executionLogs, revenueData,
  onTabChange
}: AdminCommandCenterProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setIsLoading(true);
    let assistantSoFar = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada."); setIsLoading(false); return; }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ messages: allMsgs }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: "Erro" }));
        toast.error(errData.error || `Erro ${resp.status}`);
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let ni: number;
        while ((ni = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, ni);
          textBuffer = textBuffer.slice(ni + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error("orchestrator error:", err);
      toast.error("Erro ao comunicar com o orquestrador.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const planDistribution = [
    { name: "Free", value: allCredits.filter(c => c.plan_type === "free").length, color: "#6b7280" },
    { name: "Starter", value: allCredits.filter(c => c.plan_type === "starter").length || 1, color: "hsl(0, 72%, 58%)" },
    { name: "Pro", value: allCredits.filter(c => c.plan_type === "pro").length || 1, color: "#22d3ee" },
    { name: "Enterprise", value: allCredits.filter(c => c.plan_type === "enterprise").length || 1, color: "#f59e0b" },
  ];

  const kpiCards = [
    { icon: Users, label: "Usuários", value: usersCount, spark: [1, 3, 5, 8, 12, usersCount], trend: "+12%", up: true, gradient: "from-cyan-500/20 to-blue-500/10", ic: "text-cyan-400", bc: "border-cyan-500/20" },
    { icon: Bot, label: "Agentes Ativos", value: activeAgents, spark: [0, 1, 2, 3, 4, activeAgents], trend: "+8%", up: true, gradient: "from-primary/20 to-rose-500/10", ic: "text-primary", bc: "border-primary/20" },
    { icon: DollarSign, label: "MRR", value: totalRevenue / 100, prefix: "R$ ", spark: [0, 100, 300, 500, 700, totalRevenue / 100], trend: "+23%", up: true, gradient: "from-emerald-500/20 to-green-500/10", ic: "text-emerald-400", bc: "border-emerald-500/20" },
    { icon: Coins, label: "Tokens", value: totalTokensUsed, spark: [0, 1000, 3000, 5000, 8000, totalTokensUsed], trend: "+45%", up: true, gradient: "from-amber-500/20 to-orange-500/10", ic: "text-amber-400", bc: "border-amber-500/20" },
    { icon: Zap, label: "Execuções", value: totalExecutions, spark: [0, 10, 30, 50, 70, totalExecutions], trend: "+18%", up: true, gradient: "from-violet-500/20 to-purple-500/10", ic: "text-violet-400", bc: "border-violet-500/20" },
    { icon: CheckCircle, label: "Sucesso", value: successRate, suffix: "%", spark: [90, 92, 94, 96, 97, successRate], trend: "+2%", up: true, gradient: "from-emerald-500/20 to-teal-500/10", ic: "text-emerald-400", bc: "border-emerald-500/20" },
    { icon: ListOrdered, label: "Waitlist", value: waitingCount, spark: [0, 2, 5, 8, 10, waitingCount], trend: "+5", up: true, gradient: "from-blue-500/20 to-indigo-500/10", ic: "text-blue-400", bc: "border-blue-500/20" },
    { icon: Eye, label: "Pendentes", value: pendingCount, spark: [0, 1, 2, 1, 3, pendingCount], trend: "0", up: false, gradient: "from-rose-500/20 to-red-500/10", ic: "text-rose-400", bc: "border-rose-500/20" },
  ];

  const departments = [
    { id: "cyber-group", label: "Cyber Security", icon: ShieldCheck, color: "text-red-400", bg: "bg-red-500/10", status: "🟢 Operacional", desc: "CISO + 6 agentes online" },
    { id: "cfo-agent", label: "Financeiro", icon: Wallet, color: "text-emerald-400", bg: "bg-emerald-500/10", status: "🟢 Operacional", desc: "CFO Digital ativo" },
    { id: "growth-agent", label: "Growth", icon: Rocket, color: "text-blue-400", bg: "bg-blue-500/10", status: "🟢 Operacional", desc: "CGO Digital ativo" },
    { id: "ai-agent", label: "Operações", icon: Cpu, color: "text-violet-400", bg: "bg-violet-500/10", status: "🟢 Operacional", desc: "COO Digital ativo" },
  ];

  const recentLogs = executionLogs.slice(0, 5);

  const QUICK_COMMANDS = [
    "Briefing executivo completo",
    "Status de todos os departamentos",
    "Alertas e riscos ativos",
    "Análise financeira e projeções",
    "Funil de crescimento AARRR",
    "Relatório de segurança",
  ];

  return (
    <div className="space-y-5">
      {/* Live Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-gradient-to-r from-primary/5 via-transparent to-cyan-500/5 rounded-2xl p-3 px-5 border border-white/[0.06]"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <span className="text-xs font-medium text-emerald-400">ORQUESTRADOR ATIVO</span>
          <Badge className="bg-primary/10 text-primary text-[9px] border-0">4 DEPARTAMENTOS</Badge>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> Edge: OK</span>
          <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> API: 42ms</span>
          <span className="flex items-center gap-1"><Database className="h-3 w-3" /> DB: OK</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`relative overflow-hidden rounded-2xl border ${kpi.bc} bg-gradient-to-br ${kpi.gradient} p-3.5 group hover:scale-[1.02] transition-all duration-300`}
          >
            <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-white/[0.02] blur-2xl" />
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-background/40 backdrop-blur flex items-center justify-center border border-white/[0.06]">
                <kpi.icon className={`h-3.5 w-3.5 ${kpi.ic}`} />
              </div>
              <div className="flex items-center gap-1">
                {kpi.up ? <ArrowUpRight className="h-3 w-3 text-emerald-400" /> : <ArrowDownRight className="h-3 w-3 text-muted-foreground" />}
                <span className={`text-[9px] font-medium ${kpi.up ? "text-emerald-400" : "text-muted-foreground"}`}>{kpi.trend}</span>
              </div>
            </div>
            <p className="font-display text-xl font-bold tracking-tight">
              <AnimatedCounter value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
              <MiniSparkline data={kpi.spark} color={kpi.ic.includes("cyan") ? "#22d3ee" : kpi.ic.includes("emerald") ? "#10b981" : kpi.ic.includes("amber") ? "#f59e0b" : kpi.ic.includes("violet") ? "#8b5cf6" : kpi.ic.includes("blue") ? "#3b82f6" : kpi.ic.includes("rose") ? "#f43f5e" : "hsl(0, 72%, 58%)"} width={50} height={18} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {departments.map((dept, i) => (
          <motion.button
            key={dept.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            onClick={() => onTabChange(dept.id)}
            className="glass-card rounded-2xl p-4 text-left hover:bg-white/[0.04] transition-all group border border-white/[0.06]"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-9 h-9 rounded-xl ${dept.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <dept.icon className={`h-4 w-4 ${dept.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium">{dept.label}</p>
                <p className="text-[9px] text-muted-foreground">{dept.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px]">{dept.status}</span>
              <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Main Row: Orchestrator Chat + Charts */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Orchestrator Chat — Main */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-3 flex flex-col">
          <div className="glass-card rounded-2xl border border-white/[0.06] flex flex-col h-[420px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/10 flex items-center justify-center relative">
                  <Brain className="h-5 w-5 text-primary" />
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm">Orquestrador Master</h3>
                    <Badge className="bg-primary/10 text-primary text-[8px] border-0">LIVE</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">CEO Digital — Coordena todos os departamentos</p>
                </div>
              </div>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="gap-1 text-[10px] text-muted-foreground">
                  <RotateCcw className="h-3 w-3" /> Limpar
                </Button>
              )}
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-amber-500/10 flex items-center justify-center mb-3">
                    <Brain className="h-7 w-7 text-primary" />
                  </div>
                  <h4 className="font-display font-bold text-sm mb-1">Orquestrador Clauthor</h4>
                  <p className="text-[10px] text-muted-foreground mb-4 max-w-xs">
                    Coordeno todos os departamentos em tempo real. Pergunte qualquer coisa.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 w-full max-w-sm">
                    {QUICK_COMMANDS.map((cmd) => (
                      <button
                        key={cmd}
                        onClick={() => sendMessage(cmd)}
                        className="px-2.5 py-2 rounded-xl bg-accent/30 hover:bg-accent/50 text-[10px] text-muted-foreground hover:text-foreground transition-all text-left border border-white/[0.04]"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                        <Brain className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent/30 border border-white/[0.06]"}`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none text-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-xs">{msg.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Brain className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-accent/30 border border-white/[0.06] rounded-2xl px-3.5 py-2.5 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span className="text-[10px] text-muted-foreground">Consultando departamentos...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-white/[0.06] flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte ao Orquestrador..."
                className="min-h-[40px] max-h-24 resize-none bg-accent/20 border-white/[0.08] rounded-xl text-xs"
                disabled={isLoading}
              />
              <Button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} size="icon" className="h-10 w-10 rounded-xl shrink-0">
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Revenue + Plans */}
        <div className="lg:col-span-2 space-y-4">
          {/* Revenue Chart */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06]">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-xs flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Receita
                  </CardTitle>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400">+23%</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevAdmin2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,8%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} />
                    <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} fill="url(#colorRevAdmin2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Plan Distribution */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06]">
              <CardHeader className="py-3 px-4">
                <CardTitle className="font-display text-xs">Planos</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center px-4 pb-3">
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={45} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {planDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1.5 w-full mt-1">
                  {planDistribution.map((plan) => (
                    <div key={plan.name} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: plan.color }} />
                      <span className="text-muted-foreground">{plan.name}</span>
                      <span className="ml-auto font-medium">{plan.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Financial Quick Stats */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06]">
              <CardHeader className="py-3 px-4">
                <CardTitle className="font-display text-xs flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-3">
                {[
                  { label: "MRR", value: `R$ ${(totalRevenue / 100).toLocaleString("pt-BR")}`, color: "border-l-emerald-500" },
                  { label: "ARR", value: `R$ ${((totalRevenue * 12) / 100).toLocaleString("pt-BR")}`, color: "border-l-cyan-500" },
                  { label: "ARPU", value: `R$ ${usersCount > 0 ? ((totalRevenue / usersCount) / 100).toFixed(2) : "0"}`, color: "border-l-amber-500" },
                  { label: "LTV 12m", value: `R$ ${usersCount > 0 ? (((totalRevenue / usersCount) * 12) / 100).toFixed(0) : "0"}`, color: "border-l-violet-500" },
                ].map((stat) => (
                  <div key={stat.label} className={`border-l-2 ${stat.color} pl-3 py-1`}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[9px] text-muted-foreground uppercase">{stat.label}</span>
                      <span className="font-display text-xs font-bold">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Bottom: Activity + Top Agents + Integration Status */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Activity */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06] h-full">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-xs flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-amber-400" /> Atividade
                </CardTitle>
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 px-4 pb-3">
              {recentLogs.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-4">Sem atividade</p>
              ) : recentLogs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-2 p-2 rounded-xl bg-accent/20">
                  <div className={`w-1.5 h-6 rounded-full ${log.status === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium truncate">{log.agent?.name || log.action}</p>
                    <p className="text-[9px] text-muted-foreground">{new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <Badge variant="secondary" className={`text-[8px] ${log.status === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{log.status}</Badge>
                </div>
              ))}
              <button onClick={() => onTabChange("logs")} className="w-full text-[9px] text-muted-foreground hover:text-foreground text-center pt-1">Ver todos →</button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Agents */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06] h-full">
            <CardHeader className="py-3 px-4">
              <CardTitle className="font-display text-xs flex items-center gap-2">
                <Bot className="h-3.5 w-3.5 text-primary" /> Top Agentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 px-4 pb-3">
              {allAgents.sort((a: any, b: any) => b.total_executions - a.total_executions).slice(0, 5).map((agent: any, i: number) => (
                <div key={agent.id} className="flex items-center gap-2 p-2 rounded-xl bg-accent/20">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium truncate">{agent.name}</p>
                    <p className="text-[9px] text-muted-foreground">{agent.total_executions} exec</p>
                  </div>
                  <Badge variant="secondary" className="text-[8px]">{agent.tier}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Integrations Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
          <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06] h-full">
            <CardHeader className="py-3 px-4">
              <CardTitle className="font-display text-xs flex items-center gap-2">
                <Server className="h-3.5 w-3.5 text-cyan-400" /> Integrações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 px-4 pb-3">
              {[
                { name: "Lovable AI Gateway", status: "online", icon: Brain, color: "text-primary" },
                { name: "Database (PostgreSQL)", status: "online", icon: Database, color: "text-emerald-400" },
                { name: "Edge Functions", status: "online", icon: Cpu, color: "text-cyan-400" },
                { name: "Stripe (Pagamentos)", status: "pendente", icon: DollarSign, color: "text-amber-400" },
                { name: "WhatsApp API", status: "futuro", icon: MessageSquare, color: "text-muted-foreground" },
                { name: "Marketplace", status: "online", icon: Store, color: "text-violet-400" },
              ].map((integ) => (
                <div key={integ.name} className="flex items-center gap-2 p-2 rounded-xl bg-accent/20">
                  <integ.icon className={`h-3.5 w-3.5 ${integ.color}`} />
                  <span className="text-[10px] font-medium flex-1">{integ.name}</span>
                  <Badge variant="secondary" className={`text-[8px] ${integ.status === "online" ? "bg-emerald-500/10 text-emerald-400" : integ.status === "pendente" ? "bg-amber-500/10 text-amber-400" : "bg-muted text-muted-foreground"}`}>
                    {integ.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminCommandCenter;
