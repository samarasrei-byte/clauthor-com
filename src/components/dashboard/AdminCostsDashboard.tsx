import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Cpu, DollarSign, TrendingDown, Zap, Users, Bot } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const MODEL_COSTS: Record<string, { input: number; output: number; label: string; color: string }> = {
  "google/gemini-2.5-flash-lite": { input: 0.075, output: 0.30, label: "Flash Lite (Econômico)", color: "hsl(var(--primary))" },
  "google/gemini-2.5-flash": { input: 0.15, output: 0.60, label: "Flash (Balanceado)", color: "#22d3ee" },
  "google/gemini-3-flash-preview": { input: 0.15, output: 0.60, label: "Flash Preview", color: "#818cf8" },
  "google/gemini-2.5-pro": { input: 1.25, output: 5.00, label: "Pro (Qualidade Máx)", color: "#f59e0b" },
};

const DEFAULT_COST = { input: 0.15, output: 0.60, label: "Outro", color: "hsl(var(--muted-foreground))" };

function getModelInfo(model: string) {
  return MODEL_COSTS[model] || DEFAULT_COST;
}

function estimateCostUSD(tokens: number, model: string): number {
  const info = getModelInfo(model);
  const inputTokens = tokens * 0.4;
  const outputTokens = tokens * 0.6;
  return (inputTokens * info.input + outputTokens * info.output) / 1_000_000;
}

const AdminCostsDashboard = () => {
  const { data: tokenUsage = [] } = useQuery({
    queryKey: ["admin-token-usage-costs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("token_usage").select("*").order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["admin-agents-costs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-costs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  const tokensByModel = useMemo(() => {
    const map: Record<string, { tokens: number; count: number }> = {};
    for (const t of tokenUsage) {
      const m = t.model || "google/gemini-3-flash-preview";
      if (!map[m]) map[m] = { tokens: 0, count: 0 };
      map[m].tokens += t.tokens_used || 0;
      map[m].count++;
    }
    return Object.entries(map).map(([model, data]) => ({
      model, ...data,
      cost: estimateCostUSD(data.tokens, model),
      ...getModelInfo(model),
    })).sort((a, b) => b.tokens - a.tokens);
  }, [tokenUsage]);

  const totalCost = tokensByModel.reduce((s, m) => s + m.cost, 0);
  const totalTokens = tokensByModel.reduce((s, m) => s + m.tokens, 0);
  const costIfAllPro = totalTokens > 0 ? estimateCostUSD(totalTokens, "google/gemini-2.5-pro") : 0;
  const savings = costIfAllPro > 0 ? Math.round(((costIfAllPro - totalCost) / costIfAllPro) * 100) : 0;

  const costPerAgent = useMemo(() => {
    const map: Record<string, { tokens: number; cost: number }> = {};
    for (const t of tokenUsage) {
      const aid = t.agent_id || "sem-agente";
      if (!map[aid]) map[aid] = { tokens: 0, cost: 0 };
      map[aid].tokens += t.tokens_used || 0;
      map[aid].cost += estimateCostUSD(t.tokens_used || 0, t.model || "google/gemini-3-flash-preview");
    }
    return Object.entries(map).map(([id, data]) => {
      const agent = agents.find((a: any) => a.id === id);
      return { id, name: agent?.name || "Sem agente", ...data };
    }).sort((a, b) => b.cost - a.cost).slice(0, 10);
  }, [tokenUsage, agents]);

  const costPerUser = useMemo(() => {
    const map: Record<string, { tokens: number; cost: number }> = {};
    for (const t of tokenUsage) {
      const uid = t.user_id;
      if (!map[uid]) map[uid] = { tokens: 0, cost: 0 };
      map[uid].tokens += t.tokens_used || 0;
      map[uid].cost += estimateCostUSD(t.tokens_used || 0, t.model || "google/gemini-3-flash-preview");
    }
    return Object.entries(map).map(([id, data]) => {
      const profile = profiles.find((p: any) => p.user_id === id);
      return { id, name: profile?.full_name || profile?.email || id.slice(0, 8), ...data };
    }).sort((a, b) => b.cost - a.cost).slice(0, 10);
  }, [tokenUsage, profiles]);

  const dailyCosts = useMemo(() => {
    const map: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    for (const t of tokenUsage) {
      const day = t.created_at?.slice(0, 10);
      if (day && map[day] !== undefined) {
        map[day] += estimateCostUSD(t.tokens_used || 0, t.model || "google/gemini-3-flash-preview");
      }
    }
    return Object.entries(map).map(([date, cost]) => ({ date: date.slice(5), cost: Math.round(cost * 10000) / 10000 }));
  }, [tokenUsage]);

  const pieData = tokensByModel.map(m => ({ name: m.label, value: m.tokens, color: m.color }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" /> Custos de IA - Smart Routing
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Roteamento inteligente de modelos para otimização de custos</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: DollarSign, color: "text-emerald-400", label: "Custo Total", value: `$${totalCost.toFixed(4)}`, sub: `${totalTokens.toLocaleString()} tokens` },
          { icon: TrendingDown, color: "text-primary", label: "Economia", value: `${savings}%`, sub: "vs usar Pro para tudo" },
          { icon: Zap, color: "text-cyan-400", label: "Chamadas", value: tokenUsage.length.toString(), sub: "requisições totais" },
          { icon: DollarSign, color: "text-amber-400", label: "Custo/Chamada", value: `$${tokenUsage.length > 0 ? (totalCost / tokenUsage.length).toFixed(6) : "0"}`, sub: "média por requisição" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-2xl font-bold font-display">{card.value}</p>
            <p className="text-[10px] text-muted-foreground">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold mb-3">Tokens por Modelo</h3>
          <div className="space-y-2">
            {tokensByModel.map((m) => (
              <div key={m.model} className="flex items-center justify-between p-2 rounded-xl bg-accent/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-xs font-medium">{m.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{m.tokens.toLocaleString()} tokens</p>
                  <p className="text-[10px] text-muted-foreground">${m.cost.toFixed(4)} • {m.count} chamadas</p>
                </div>
              </div>
            ))}
            {tokensByModel.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum dado disponível</p>}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold mb-3">Distribuição por Modelo</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => v.toLocaleString() + " tokens"} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">Sem dados</div>}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-sm font-bold mb-3">Custo Diário - Últimos 30 Dias (USD)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailyCosts}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.15)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v: number) => `$${Number(v).toFixed(4)}`} />
            <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Custo por Agente</h3>
          <div className="space-y-1.5">
            {costPerAgent.map((a, i) => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-xs font-medium truncate max-w-[140px]">{a.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold">${a.cost.toFixed(4)}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{a.tokens.toLocaleString()} tk</span>
                </div>
              </div>
            ))}
            {costPerAgent.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-cyan-400" /> Custo por Usuário</h3>
          <div className="space-y-1.5">
            {costPerUser.map((u, i) => (
              <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-xs font-medium truncate max-w-[140px]">{u.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold">${u.cost.toFixed(4)}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{u.tokens.toLocaleString()} tk</span>
                </div>
              </div>
            ))}
            {costPerUser.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCostsDashboard;
