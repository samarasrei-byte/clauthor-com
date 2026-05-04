import { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, TrendingUp, Clock, CalendarDays, Users } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import AnimatedCounter from "./AnimatedCounter";

interface Props {
  allProfiles: any[];
  locale: string;
}

const AdminSignupMetrics = ({ allProfiles, locale }: Props) => {
  const queryClient = useQueryClient();

  // Realtime: listen for new profiles
  useEffect(() => {
    const channel = supabase
      .channel("admin-signups-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-all-profiles"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const signupsLastHour = allProfiles.filter(p => new Date(p.created_at) > hourAgo).length;
  const signupsToday = allProfiles.filter(p => new Date(p.created_at) > dayAgo).length;
  const signupsWeek = allProfiles.filter(p => new Date(p.created_at) > weekAgo).length;
  const signupsMonth = allProfiles.filter(p => new Date(p.created_at) > monthAgo).length;

  // Last 7 days chart
  const dailyData = useMemo(() => {
    const days: { name: string; signups: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextD = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      const count = allProfiles.filter(p => {
        const cd = new Date(p.created_at);
        return cd >= d && cd < nextD;
      }).length;
      days.push({ name: d.toLocaleDateString(locale, { weekday: "short" }), signups: count });
    }
    return days;
  }, [allProfiles, locale]);

  // Last 24h by hour
  const hourlyData = useMemo(() => {
    const hours: { name: string; signups: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const h = new Date(now.getTime() - i * 60 * 60 * 1000);
      const nextH = new Date(h.getTime() + 60 * 60 * 1000);
      const count = allProfiles.filter(p => {
        const cd = new Date(p.created_at);
        return cd >= h && cd < nextH;
      }).length;
      hours.push({ name: h.toLocaleTimeString(locale, { hour: "2-digit" }), signups: count });
    }
    return hours;
  }, [allProfiles, locale]);

  // Recent signups list
  const recentSignups = allProfiles.slice(0, 8);

  const kpis = [
    { icon: Clock, label: "Última hora", value: signupsLastHour, color: "text-amber-400", border: "border-amber-500/20", bg: "from-amber-500/20 to-orange-500/10" },
    { icon: CalendarDays, label: "Hoje", value: signupsToday, color: "text-cyan-400", border: "border-cyan-500/20", bg: "from-cyan-500/20 to-blue-500/10" },
    { icon: TrendingUp, label: "7 dias", value: signupsWeek, color: "text-emerald-400", border: "border-emerald-500/20", bg: "from-emerald-500/20 to-green-500/10" },
    { icon: Users, label: "30 dias", value: signupsMonth, color: "text-violet-400", border: "border-violet-500/20", bg: "from-violet-500/20 to-purple-500/10" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center">
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">Métricas de Signups</h2>
          <p className="text-[10px] text-muted-foreground">Monitoramento em tempo real de novos cadastros</p>
        </div>
        <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-0 text-[9px]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
          REALTIME
        </Badge>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl border ${kpi.border} bg-gradient-to-br ${kpi.bg} p-4`}
          >
            <kpi.icon className={`h-4 w-4 ${kpi.color} mb-2`} />
            <p className="font-display text-2xl font-bold">
              <AnimatedCounter value={kpi.value} />
            </p>
            <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Daily chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06]">
            <CardHeader className="py-3 px-4">
              <CardTitle className="font-display text-xs flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-cyan-400" /> Signups - Últimos 7 dias
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,8%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} />
                  <Bar dataKey="signups" radius={[6, 6, 0, 0]}>
                    {dailyData.map((_, i) => (
                      <Cell key={i} fill={i === dailyData.length - 1 ? "#22d3ee" : "rgba(34,211,238,0.3)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hourly chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06]">
            <CardHeader className="py-3 px-4">
              <CardTitle className="font-display text-xs flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-amber-400" /> Signups - Últimas 24h
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="signupHourly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8 }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,8%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} />
                  <Area type="monotone" dataKey="signups" stroke="#f59e0b" strokeWidth={2} fill="url(#signupHourly)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent signups */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06]">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-xs flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5 text-primary" /> Últimos Cadastros
              </CardTitle>
              <Badge variant="outline" className="text-[9px]">{allProfiles.length} total</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-1.5">
            {recentSignups.map((profile: any) => {
              const ago = Math.round((now.getTime() - new Date(profile.created_at).getTime()) / 60000);
              const timeLabel = ago < 60 ? `${ago}m atrás` : ago < 1440 ? `${Math.floor(ago / 60)}h atrás` : `${Math.floor(ago / 1440)}d atrás`;
              return (
                <div key={profile.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-accent/20">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {(profile.full_name || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{profile.full_name || "Sem nome"}</p>
                    <p className="text-[9px] text-muted-foreground">{profile.company_name || "-"}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0">{timeLabel}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminSignupMetrics;
