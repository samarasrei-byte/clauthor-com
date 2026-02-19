import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Bot, Settings, Save, ChevronRight, ChevronDown, Loader2,
  MessageSquare, Plug, Radio, Hash, FileText, Zap,
  Globe, Mail, Phone, Webhook, Code, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const CHANNEL_OPTIONS = [
  { id: "dashboard", label: "Dashboard Chat", icon: MessageSquare, desc: "Chat interno na plataforma" },
  { id: "whatsapp", label: "WhatsApp", icon: Phone, desc: "Integração com WhatsApp Business" },
  { id: "email", label: "E-mail", icon: Mail, desc: "Respostas automáticas por e-mail" },
  { id: "webhook", label: "Webhook", icon: Webhook, desc: "Notificações via HTTP" },
  { id: "api", label: "API REST", icon: Code, desc: "Chamadas via API" },
];

const INTEGRATION_OPTIONS = [
  { id: "google_calendar", label: "Google Calendar", icon: Globe },
  { id: "google_sheets", label: "Google Sheets", icon: FileText },
  { id: "slack", label: "Slack", icon: Hash },
  { id: "zapier", label: "Zapier", icon: Zap },
  { id: "n8n", label: "n8n", icon: Plug },
];

const AgentSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["my-agents-settings", user?.id],
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Configurações dos Agentes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Edite prompts, integrações e canais de cada agente
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : agents.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Bot className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold mb-2">Nenhum agente encontrado</h3>
          <p className="text-muted-foreground text-sm">Crie um agente primeiro para configurar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isExpanded={expandedAgent === agent.id}
              onToggle={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface AgentCardProps {
  agent: any;
  isExpanded: boolean;
  onToggle: () => void;
}

const AgentCard = ({ agent, isExpanded, onToggle }: AgentCardProps) => {
  const queryClient = useQueryClient();
  const [instructions, setInstructions] = useState(agent.instructions || "");
  const [channels, setChannels] = useState<string[]>(() => {
    try { return Array.isArray(agent.channels) ? agent.channels : []; }
    catch { return []; }
  });
  const [integrations, setIntegrations] = useState<string[]>(() => {
    try { return Array.isArray(agent.integrations) ? agent.integrations : []; }
    catch { return []; }
  });
  const [objective, setObjective] = useState(agent.objective || "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("agents")
        .update({
          instructions,
          channels: channels as any,
          integrations: integrations as any,
          objective,
        })
        .eq("id", agent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${agent.name} atualizado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["my-agents-settings"] });
    },
    onError: () => toast.error("Erro ao salvar configurações"),
  });

  const toggleChannel = (id: string) => {
    setChannels((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const tierColors: Record<string, string> = {
    basic: "bg-muted text-muted-foreground",
    intermediate: "bg-cyan-500/15 text-cyan-400",
    advanced: "bg-emerald-500/15 text-emerald-400",
    enterprise: "bg-primary/15 text-primary",
  };

  return (
    <motion.div layout className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-display font-semibold text-sm">{agent.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className={`text-[9px] ${tierColors[agent.tier] || ""}`}>{agent.tier}</Badge>
              <Badge variant="secondary" className={`text-[9px] ${agent.status === "active" ? "bg-emerald-500/20 text-emerald-500" : ""}`}>{agent.status}</Badge>
              <span className="text-[10px] text-muted-foreground">{agent.total_executions} execuções</span>
            </div>
          </div>
        </div>
        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {/* Expanded Settings */}
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
              {/* Objective */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Objetivo do Agente</label>
                <Input
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Ex: Atender clientes e responder dúvidas sobre produtos..."
                  className="bg-accent/20 border-white/[0.08]"
                />
              </div>

              {/* Instructions / Prompt */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Prompt / Instruções do Agente
                </label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Defina o comportamento, tom de voz e regras do agente..."
                  className="min-h-[140px] bg-accent/20 border-white/[0.08] font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {instructions.length} caracteres — Este prompt define como o agente se comporta e responde
                </p>
              </div>

              {/* Channels */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Canais de Comunicação</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHANNEL_OPTIONS.map((ch) => {
                    const active = channels.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        onClick={() => toggleChannel(ch.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          active
                            ? "border-primary/30 bg-primary/5"
                            : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-primary/15" : "bg-accent/30"}`}>
                          <ch.icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{ch.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{ch.desc}</p>
                        </div>
                        {active && <Check className="h-4 w-4 text-primary shrink-0" />}
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
                      <button
                        key={intg.id}
                        onClick={() => toggleIntegration(intg.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                          active
                            ? "border-primary/30 bg-primary/5"
                            : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                        }`}
                      >
                        <intg.icon className={`h-3.5 w-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-xs ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{intg.label}</span>
                        {active && <Check className="h-3 w-3 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="gap-2"
                >
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar Configurações
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AgentSettings;
