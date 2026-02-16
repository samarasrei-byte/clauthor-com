import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { Plus, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DashboardStats from "@/components/dashboard/DashboardStats";
import AgentsList from "@/components/dashboard/AgentsList";
import ContractedAgents from "@/components/dashboard/ContractedAgents";
import AgentChat from "@/components/dashboard/AgentChat";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import ExecutionLogs from "@/components/dashboard/ExecutionLogs";
import SubscriptionManager from "@/components/dashboard/SubscriptionManager";

const ClientDashboard = () => {
  const { user } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string } | null>(null);

  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["my-agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["my-subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, agent:agents(*)")
        .eq("user_id", user!.id)
        .eq("status", "active");
      
      if (error) throw error;
      return data.map((sub: any) => ({
        id: sub.id,
        agent_name: sub.agent?.name || "Agente",
        monthly_price: sub.monthly_price,
        status: sub.status,
        current_period_end: sub.current_period_end,
      }));
    },
    enabled: !!user,
  });

  const { data: recentLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["execution-logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("execution_logs")
        .select("*, agent:agents(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data.map((log: any) => ({
        id: log.id,
        agent_name: log.agent?.name || "Agente",
        action: log.action,
        status: log.status,
        execution_time_ms: log.execution_time_ms,
        created_at: log.created_at,
        details: log.details,
      }));
    },
    enabled: !!user,
  });

  const totalExecutions = agents.reduce((acc, a) => acc + (a.total_executions || 0), 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const successRate = 98.5;
  const monthlyGrowth = 2;

  const handleSelectAgent = (agentId: string, agentName: string) => {
    setSelectedAgent({ id: agentId, name: agentName });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Meu Painel</h1>
          <p className="text-muted-foreground">Gerencie seus funcionários de IA</p>
        </div>
        <div className="flex items-center gap-3">
          <CreditsDisplay />
          <Link to="/create-agent">
            <Button className="glow group">
              <Plus className="h-4 w-4 mr-2" /> 
              Novo Agente
              <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <DashboardStats
        activeAgents={activeAgents}
        totalExecutions={totalExecutions}
        successRate={successRate}
        monthlyGrowth={monthlyGrowth}
      />

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="billing">Assinatura</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Contracted Agents */}
          <ContractedAgents
            subscriptions={subscriptions}
            onSelectAgent={handleSelectAgent}
          />
          
          <div className="grid lg:grid-cols-2 gap-6">
            <AgentsList
              agents={agents}
              isLoading={loadingAgents}
              onSelectAgent={handleSelectAgent}
            />
            <AgentChat
              agentId={selectedAgent?.id}
              agentName={selectedAgent?.name || "Assistente IA"}
            />
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AnalyticsChart />
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <ExecutionLogs logs={recentLogs} isLoading={loadingLogs} />
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="max-w-xl">
            <SubscriptionManager subscriptions={subscriptions} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDashboard;
