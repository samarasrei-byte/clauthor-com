import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Bot, Settings, Save, ChevronRight, ChevronDown, Loader2,
  MessageSquare, Plug, Radio, Hash, FileText, Zap, Search,
  Globe, Mail, Phone, Webhook, Code, Check, User, Building,
  Shield, Eye, AlertTriangle, Trash2, Power, PowerOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CHANNEL_OPTIONS = [
  { id: "dashboard", label: "Dashboard Chat", icon: MessageSquare, desc: "Chat interno" },
  { id: "whatsapp", label: "WhatsApp", icon: Phone, desc: "WhatsApp Business" },
  { id: "email", label: "E-mail", icon: Mail, desc: "Respostas por e-mail" },
  { id: "webhook", label: "Webhook", icon: Webhook, desc: "HTTP notifications" },
  { id: "api", label: "API REST", icon: Code, desc: "External API calls" },
];

const INTEGRATION_OPTIONS = [
  { id: "google_calendar", label: "Google Calendar", icon: Globe },
  { id: "google_sheets", label: "Google Sheets", icon: FileText },
  { id: "slack", label: "Slack", icon: Hash },
  { id: "zapier", label: "Zapier", icon: Zap },
  { id: "n8n", label: "n8n", icon: Plug },
];

const AdminAgentSettings = () => {
  const queryClient = useQueryClient();
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["admin-all-agents-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-for-agents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, company_name");
      if (error) throw error;
      return data;
    },
  });

  const getOwnerName = (userId: string) => {
    const p = profiles.find((pr: any) => pr.user_id === userId);
    return p?.full_name || p?.company_name || "Usuário";
  };

  const filtered = agents.filter((a: any) => {
    const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getOwnerName(a.user_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchTier = filterTier === "all" || a.tier === filterTier;
    return matchSearch && matchStatus && matchTier;
  });

  const stats = {
    total: agents.length,
    active: agents.filter((a: any) => a.status === "active").length,
    draft: agents.filter((a: any) => a.status === "draft").length,
    noPrompt: agents.filter((a: any) => !a.instructions || a.instructions.trim().length < 10).length,
    noChannels: agents.filter((a: any) => !a.channels || (Array.isArray(a.channels) && a.channels.length === 0)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" /> Configurações de Agentes — Admin
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie prompts, integrações e canais de todos os agentes da plataforma
        </p>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Bot, color: "text-primary" },
          { label: "Ativos", value: stats.active, icon: Power, color: "text-emerald-400" },
          { label: "Rascunho", value: stats.draft, icon: FileText, color: "text-muted-foreground" },
          { label: "Sem Prompt", value: stats.noPrompt, icon: AlertTriangle, color: stats.noPrompt > 0 ? "text-amber-400" : "text-emerald-400" },
          { label: "Sem Canal", value: stats.noChannels, icon: Radio, color: stats.noChannels > 0 ? "text-amber-400" : "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-3 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="font-display text-lg font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar agente ou dono..."
            className="pl-9 bg-accent/20 border-white/[0.08]"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "active", "draft", "paused", "archived"].map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterStatus(s)}
              className="text-xs capitalize"
            >
              {s === "all" ? "Todos" : s}
            </Button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {["all", "basic", "intermediate", "advanced", "enterprise"].map((t) => (
            <Button
              key={t}
              variant={filterTier === t ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterTier(t)}
              className="text-xs capitalize"
            >
              {t === "all" ? "Todos" : t}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} agentes encontrados</p>

      {/* Agent List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((agent: any) => (
            <AdminAgentCard
              key={agent.id}
              agent={agent}
              ownerName={getOwnerName(agent.user_id)}
              isExpanded={expandedAgent === agent.id}
              onToggle={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface AdminAgentCardProps {
  agent: any;
  ownerName: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const AdminAgentCard = ({ agent, ownerName, isExpanded, onToggle }: AdminAgentCardProps) => {
  const queryClient = useQueryClient();
  const [instructions, setInstructions] = useState(agent.instructions || "");
  const [channels, setChannels] = useState<string[]>(() => {
    try { return Array.isArray(agent.channels) ? agent.channels : []; } catch { return []; }
  });
  const [integrations, setIntegrations] = useState<string[]>(() => {
    try { return Array.isArray(agent.integrations) ? agent.integrations : []; } catch { return []; }
  });
  const [objective, setObjective] = useState(agent.objective || "");
  const [status, setStatus] = useState(agent.status);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("agents")
        .update({ instructions, channels: channels as any, integrations: integrations as any, objective, status })
        .eq("id", agent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${agent.name} atualizado!`);
      queryClient.invalidateQueries({ queryKey: ["admin-all-agents-settings"] });
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const toggleChannel = (id: string) => setChannels((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  const toggleIntegration = (id: string) => setIntegrations((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const tierColors: Record<string, string> = {
    basic: "bg-muted text-muted-foreground",
    intermediate: "bg-cyan-500/15 text-cyan-400",
    advanced: "bg-emerald-500/15 text-emerald-400",
    enterprise: "bg-primary/15 text-primary",
  };

  const hasIssues = !instructions || instructions.trim().length < 10 || channels.length === 0;

  return (
    <motion.div layout className={`glass-card rounded-2xl border overflow-hidden ${hasIssues ? "border-amber-500/20" : "border-white/[0.06]"}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === "active" ? "bg-emerald-500/10" : "bg-primary/10"}`}>
            <Bot className={`h-5 w-5 ${status === "active" ? "text-emerald-400" : "text-primary"}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="font-display font-semibold text-sm">{agent.name}</p>
              {hasIssues && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className={`text-[9px] ${tierColors[agent.tier] || ""}`}>{agent.tier}</Badge>
              <Badge variant="secondary" className={`text-[9px] ${status === "active" ? "bg-emerald-500/20 text-emerald-500" : ""}`}>{status}</Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <User className="h-2.5 w-2.5" /> {ownerName}
              </span>
              <span className="text-[10px] text-muted-foreground">{agent.total_executions} exec</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {channels.length > 0 && <Badge variant="outline" className="text-[8px] border-white/10">{channels.length} canais</Badge>}
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 space-y-5 border-t border-white/[0.06] pt-4">
              {/* Status Toggle */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-muted-foreground">Status:</label>
                <div className="flex gap-1.5">
                  {["draft", "active", "paused", "archived"].map((s) => (
                    <Button key={s} variant={status === s ? "default" : "ghost"} size="sm" onClick={() => setStatus(s)} className="text-xs capitalize">
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Objective */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Objetivo</label>
                <Input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Objetivo do agente..." className="bg-accent/20 border-white/[0.08]" />
              </div>

              {/* Prompt */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                  Prompt / Instruções
                  {(!instructions || instructions.trim().length < 10) && (
                    <Badge className="bg-amber-500/15 text-amber-400 text-[8px] border-0">SEM PROMPT</Badge>
                  )}
                </label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Defina o comportamento, tom de voz e regras..."
                  className="min-h-[140px] bg-accent/20 border-white/[0.08] font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{instructions.length} chars</p>
              </div>

              {/* Channels */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                  Canais
                  {channels.length === 0 && <Badge className="bg-amber-500/15 text-amber-400 text-[8px] border-0">NENHUM</Badge>}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {CHANNEL_OPTIONS.map((ch) => {
                    const active = channels.includes(ch.id);
                    return (
                      <button key={ch.id} onClick={() => toggleChannel(ch.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${active ? "border-primary/30 bg-primary/5" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${active ? "bg-primary/15" : "bg-accent/30"}`}>
                          <ch.icon className={`h-3.5 w-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{ch.label}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{ch.desc}</p>
                        </div>
                        {active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Integrations */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Integrações</label>
                <div className="flex flex-wrap gap-2">
                  {INTEGRATION_OPTIONS.map((intg) => {
                    const active = integrations.includes(intg.id);
                    return (
                      <button key={intg.id} onClick={() => toggleIntegration(intg.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${active ? "border-primary/30 bg-primary/5" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                        <intg.icon className={`h-3.5 w-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-xs ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{intg.label}</span>
                        {active && <Check className="h-3 w-3 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-2 border-t border-white/[0.04]">
                <span>ID: {agent.id.slice(0, 8)}...</span>
                <span>Criado: {new Date(agent.created_at).toLocaleDateString("pt-BR")}</span>
                <span>Preço: R$ {(agent.monthly_price / 100).toFixed(2)}</span>
                <span>Dono: {ownerName}</span>
              </div>

              {/* Save */}
              <div className="flex justify-end">
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminAgentSettings;
