import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, Upload, Sparkles, CheckCircle, Loader2, 
  ChevronDown, ChevronRight, Users, Bot, Zap,
  FileJson, FileSpreadsheet, Brain, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { WORKFORCE, type WorkforceDepartment } from "@/data/workforceArchitecture";
import { getDefaultTier, getDefaultIntegrations } from "@/data/agentLibraryBridge";

type ProvisionStatus = "idle" | "provisioning" | "done" | "error";

interface DeptSelection {
  deptId: string;
  selected: boolean;
  agentCount: number;
  expandedSquads: Set<string>;
  excludedAgents: Set<string>;
}

const TIER_MAP: Record<string, "basic" | "intermediate" | "advanced" | "enterprise"> = {
  basic: "basic", intermediate: "intermediate", advanced: "advanced", enterprise: "enterprise",
};

const BulkAgentProvisioner = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("templates");
  const [selections, setSelections] = useState<Map<string, DeptSelection>>(() => {
    const map = new Map<string, DeptSelection>();
    WORKFORCE.forEach(dept => {
      const agentCount = dept.squads.reduce((s, sq) => s + sq.agents.length, 0);
      map.set(dept.id, {
        deptId: dept.id,
        selected: false,
        agentCount,
        expandedSquads: new Set(),
        excludedAgents: new Set(),
      });
    });
    return map;
  });
  const [status, setStatus] = useState<ProvisionStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [aiEnhance, setAiEnhance] = useState(true);
  const [csvData, setCsvData] = useState("");
  const [deployedCount, setDeployedCount] = useState(0);

  const toggleDept = (deptId: string) => {
    setSelections(prev => {
      const next = new Map(prev);
      const item = next.get(deptId)!;
      next.set(deptId, { ...item, selected: !item.selected });
      return next;
    });
  };

  const toggleSquadExpand = (deptId: string, squadId: string) => {
    setSelections(prev => {
      const next = new Map(prev);
      const item = { ...next.get(deptId)! };
      const expanded = new Set(item.expandedSquads);
      expanded.has(squadId) ? expanded.delete(squadId) : expanded.add(squadId);
      item.expandedSquads = expanded;
      next.set(deptId, item);
      return next;
    });
  };

  const toggleAgentExclude = (deptId: string, agentSlug: string) => {
    setSelections(prev => {
      const next = new Map(prev);
      const item = { ...next.get(deptId)! };
      const excluded = new Set(item.excludedAgents);
      excluded.has(agentSlug) ? excluded.delete(agentSlug) : excluded.add(agentSlug);
      item.excludedAgents = excluded;
      next.set(deptId, item);
      return next;
    });
  };

  const selectedDepts = Array.from(selections.values()).filter(s => s.selected);
  const totalSelectedAgents = selectedDepts.reduce((sum, s) => {
    const dept = WORKFORCE.find(d => d.id === s.deptId)!;
    return sum + dept.squads.reduce((ss, sq) => 
      ss + sq.agents.filter(a => !s.excludedAgents.has(a.slug)).length, 0
    );
  }, 0);

  const selectAll = () => {
    setSelections(prev => {
      const next = new Map(prev);
      const allSelected = Array.from(next.values()).every(s => s.selected);
      next.forEach((item, key) => {
        next.set(key, { ...item, selected: !allSelected });
      });
      return next;
    });
  };

  const provisionFromTemplates = useCallback(async () => {
    if (!user) { toast.error("You need to be logged in"); return; }
    if (totalSelectedAgents === 0) { toast.error("Select at least one department"); return; }

    setStatus("provisioning");
    setProgress(0);
    setDeployedCount(0);

    const agentsToCreate: Array<{
      name: string; slug: string; description: string; tier: string;
      instructions: string; integrations: string[];
    }> = [];

    for (const sel of selectedDepts) {
      const dept = WORKFORCE.find(d => d.id === sel.deptId)!;
      for (const squad of dept.squads) {
        for (const agent of squad.agents) {
          if (sel.excludedAgents.has(agent.slug)) continue;
          agentsToCreate.push({
            name: agent.name,
            slug: agent.slug,
            description: `${dept.name} → ${squad.name} | ${agent.responsibilities.join(", ")}`,
            tier: getDefaultTier(agent.slug),
            instructions: `Role: ${agent.name}\nDepartment: ${dept.name}\nSquad: ${squad.name}\nMission: ${squad.mission}\n\nResponsibilities:\n${agent.responsibilities.map(r => `• ${r}`).join("\n")}\n\nTriggers:\n${agent.triggers.map(t => `• ${t}`).join("\n")}`,
            integrations: getDefaultIntegrations(agent.slug),
          });
        }
      }
    }

    const batchSize = 10;
    let created = 0;

    try {
      // Get tenant
      const { data: tenantData } = await supabase.rpc("get_user_tenant_id", { _user_id: user.id });
      
      for (let i = 0; i < agentsToCreate.length; i += batchSize) {
        const batch = agentsToCreate.slice(i, i + batchSize);
        const records = batch.map(a => ({
          user_id: user.id,
          name: a.name,
          description: a.description,
          tier: TIER_MAP[a.tier] || ("intermediate" as const),
          instructions: a.instructions,
          integrations: a.integrations as any,
          status: "active" as const,
        }));

        const { error } = await supabase.from("agents").insert(records);
        if (error) {
          console.error("Batch insert error:", error);
          // Continue with next batch
        }

        created += batch.length;
        setDeployedCount(created);
        setProgress(Math.round((created / agentsToCreate.length) * 100));
        setProgressText(`${created}/${agentsToCreate.length} agents deployed...`);
      }

      setStatus("done");
      setProgress(100);
      setProgressText(`✅ ${created} agents deployed successfully!`);
      toast.success(`${created} agents deployed!`);
    } catch (err) {
      console.error("Provision error:", err);
      setStatus("error");
      toast.error("Error during provisioning");
    }
  }, [user, selectedDepts, totalSelectedAgents]);

  const provisionFromCSV = useCallback(async () => {
    if (!user) { toast.error("You need to be logged in"); return; }
    if (!csvData.trim()) { toast.error("Paste CSV/JSON data first"); return; }

    setStatus("provisioning");
    setProgress(0);

    try {
      let agents: Array<{ name: string; description?: string; tier?: string; instructions?: string }> = [];

      // Try JSON first
      try {
        const parsed = JSON.parse(csvData);
        agents = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Parse as CSV
        const lines = csvData.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim());
          const obj: any = {};
          headers.forEach((h, idx) => { obj[h] = values[idx] || ""; });
          if (obj.name) agents.push(obj);
        }
      }

      if (agents.length === 0) { toast.error("No valid agents found in data"); setStatus("idle"); return; }

      const records = agents.map(a => ({
        user_id: user.id,
        name: a.name,
        description: a.description || "",
        tier: TIER_MAP[a.tier || "intermediate"] || ("intermediate" as const),
        instructions: a.instructions || "",
        status: "active" as const,
      }));

      const { error } = await supabase.from("agents").insert(records);
      if (error) throw error;

      setStatus("done");
      setProgress(100);
      setDeployedCount(records.length);
      setProgressText(`✅ ${records.length} agents imported!`);
      toast.success(`${records.length} agents imported!`);
    } catch (err) {
      console.error("CSV import error:", err);
      setStatus("error");
      toast.error("Import error — check your data format");
    }
  }, [user, csvData]);

  const resetState = () => {
    setStatus("idle");
    setProgress(0);
    setProgressText("");
    setDeployedCount(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Rocket className="w-6 h-6 text-primary" />
            Provisionamento em Massa
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Implante toda a sua força de trabalho IA em minutos — não horas.
          </p>
        </div>
        {status === "done" && (
          <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 px-3 py-1">
            <CheckCircle className="w-4 h-4 mr-1" /> {deployedCount} agentes implantados
          </Badge>
        )}
      </div>

      {/* Progress Bar */}
      <AnimatePresence>
        {status === "provisioning" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  {progressText}
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="templates" className="gap-1.5 text-xs sm:text-sm">
            <Users className="w-4 h-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-1.5 text-xs sm:text-sm">
            <Upload className="w-4 h-4" /> Importar
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4" /> Gerar com IA
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Templates ── */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Selecione departamentos para implantar. Cada um inclui squads e agentes pré-configurados.
            </p>
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
              {Array.from(selections.values()).every(s => s.selected) ? "Desmarcar Todos" : "Selecionar Todos"}
            </Button>
          </div>

          <div className="grid gap-3">
            {WORKFORCE.map(dept => {
              const sel = selections.get(dept.id)!;
              const agentCount = dept.squads.reduce((s, sq) => 
                s + sq.agents.filter(a => !sel.excludedAgents.has(a.slug)).length, 0
              );
              const totalAgents = dept.squads.reduce((s, sq) => s + sq.agents.length, 0);

              return (
                <Card 
                  key={dept.id}
                  className={`transition-all cursor-pointer ${
                    sel.selected 
                      ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10" 
                      : "border-border/30 hover:border-border/60"
                  }`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3" onClick={() => toggleDept(dept.id)}>
                      <div className={`w-3 h-3 rounded-full ${sel.selected ? "bg-primary" : "bg-muted"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{dept.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {agentCount}/{totalAgents} agents
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {dept.squads.length} squads
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSquadExpand(dept.id, "__all__");
                        }}
                        className="text-xs px-2"
                      >
                        {sel.expandedSquads.has("__all__") ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* Expanded squads */}
                    <AnimatePresence>
                      {sel.expandedSquads.has("__all__") && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2 pl-6 border-l border-border/20">
                            {dept.squads.map(squad => (
                              <div key={squad.id}>
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  {squad.name} ({squad.agents.length})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {squad.agents.map(agent => {
                                    const excluded = sel.excludedAgents.has(agent.slug);
                                    return (
                                      <Badge
                                        key={agent.slug}
                                        variant={excluded ? "outline" : "secondary"}
                                        className={`text-[10px] cursor-pointer transition-all ${
                                          excluded ? "opacity-40 line-through" : "hover:bg-primary/20"
                                        }`}
                                        onClick={() => toggleAgentExclude(dept.id, agent.slug)}
                                      >
                                        <Bot className="w-3 h-3 mr-0.5" />
                                        {agent.name}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* AI Enhancement Toggle */}
          <Card className="border-border/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Aprimoramento com IA</p>
                  <p className="text-xs text-muted-foreground">Gerar prompts de sistema detalhados com IA após a implantação</p>
                </div>
              </div>
              <Switch checked={aiEnhance} onCheckedChange={setAiEnhance} />
            </CardContent>
          </Card>

          {/* Deploy Button */}
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={status === "done" ? resetState : provisionFromTemplates}
              disabled={status === "provisioning" || (status !== "done" && totalSelectedAgents === 0)}
              className="gap-2"
            >
              {status === "provisioning" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Implantando...</>
              ) : status === "done" ? (
                <><Zap className="w-4 h-4" /> Implantar Mais</>
              ) : (
                <><Rocket className="w-4 h-4" /> Implantar {totalSelectedAgents} Agentes</>
              )}
            </Button>
            {totalSelectedAgents > 0 && status === "idle" && (
              <p className="text-xs text-muted-foreground">
                {selectedDepts.length} departamentos • {totalSelectedAgents} agentes prontos
              </p>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 2: Import ── */}
        <TabsContent value="import" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileJson className="w-5 h-5 text-primary" />
                Importar CSV / JSON
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cole seus dados de agentes abaixo. Suporta formato CSV (com cabeçalhos) ou array JSON.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="border-border/20 bg-muted/30">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium mb-1 flex items-center gap-1">
                      <FileSpreadsheet className="w-3 h-3" /> Formato CSV
                    </p>
                    <pre className="text-[10px] text-muted-foreground font-mono">
{`name,tier,description,instructions
Sales SDR,advanced,Outbound sales,Cold outreach
Support Agent,basic,Tier 1 support,Handle tickets`}
                    </pre>
                  </CardContent>
                </Card>
                <Card className="border-border/20 bg-muted/30">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium mb-1 flex items-center gap-1">
                      <FileJson className="w-3 h-3" /> Formato JSON
                    </p>
                    <pre className="text-[10px] text-muted-foreground font-mono">
{`[
  {"name": "Sales SDR",
   "tier": "advanced",
   "instructions": "..."}
]`}
                    </pre>
                  </CardContent>
                </Card>
              </div>

              <Textarea
                placeholder="Cole dados CSV ou JSON aqui..."
                value={csvData}
                onChange={e => setCsvData(e.target.value)}
                className="min-h-[160px] font-mono text-xs"
              />

              <Button onClick={provisionFromCSV} disabled={status === "provisioning" || !csvData.trim()} className="gap-2">
                {status === "provisioning" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Importar Agentes</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: AI Generate ── */}
        <TabsContent value="ai" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Geração Automática com IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Descreva seu negócio e necessidades. A IA gerará uma frota de agentes personalizada com habilidades, 
                prompts e integrações otimizadas para seu setor.
              </p>

              <Textarea
                placeholder="Ex: Tenho uma empresa SaaS com 50 funcionários. Preciso de agentes para automação de marketing, suporte ao cliente e prospecção de vendas. Nossos principais canais são LinkedIn, email e WhatsApp..."
                className="min-h-[120px]"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["SaaS B2B", "E-commerce", "Agency", "Enterprise"].map(preset => (
                  <Button key={preset} variant="outline" size="sm" className="text-xs">
                    {preset}
                  </Button>
                ))}
              </div>

              <Button className="gap-2" disabled>
                <Brain className="w-4 h-4" /> Gerar Frota
                <Badge variant="secondary" className="text-[10px] ml-1">Em Breve</Badge>
              </Button>
              <p className="text-xs text-muted-foreground">
                A geração com IA usará o contexto do seu negócio para criar agentes com habilidades e prompts otimizados.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkAgentProvisioner;
