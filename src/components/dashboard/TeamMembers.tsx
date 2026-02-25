import { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Shield, Eye, Crown, Mail, Loader2, Trash2, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner: { label: "Proprietário", icon: Crown, color: "bg-primary/15 text-primary" },
  admin: { label: "Admin", icon: Shield, color: "bg-accent-amber/15 text-accent-amber" },
  member: { label: "Membro", icon: Users, color: "bg-accent-blue/15 text-accent-blue" },
  viewer: { label: "Visualizador", icon: Eye, color: "bg-muted text-muted-foreground" },
};

const areaOptions = [
  { id: "geral", label: "Geral" },
  { id: "financeiro", label: "Financeiro" },
  { id: "comercial", label: "Comercial" },
  { id: "marketing", label: "Marketing" },
  { id: "tecnologia", label: "Tecnologia" },
  { id: "rh", label: "RH" },
  { id: "suporte", label: "Suporte" },
  { id: "criacao", label: "Criação" },
];

const planLimits: Record<string, { members: number; label: string }> = {
  free: { members: 3, label: "Básico" },
  basic: { members: 3, label: "Básico" },
  starter: { members: 5, label: "Starter" },
  professional: { members: 10, label: "Profissional" },
  business: { members: 25, label: "Business" },
  enterprise: { members: 100, label: "Enterprise" },
};

const TeamMembers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteArea, setInviteArea] = useState("geral");
  const [isInviting, setIsInviting] = useState(false);

  const { data: tenantId } = useQuery({
    queryKey: ["my-tenant", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_tenant_id", { _user_id: user!.id });
      if (error) throw error;
      return data as string;
    },
    enabled: !!user,
  });

  const { data: tenant } = useQuery({
    queryKey: ["tenant-details", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["tenant-members", tenantId],
    queryFn: async () => {
      // Get members
      const { data: membersData, error: membersErr } = await supabase
        .from("tenant_members")
        .select("*")
        .eq("tenant_id", tenantId!);
      if (membersErr) throw membersErr;

      // Enrich with profiles
      const enriched = await Promise.all(
        (membersData || []).map(async (m: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, company_name")
            .eq("user_id", m.user_id)
            .single();
          return { ...m, profile: profile || null };
        })
      );
      return enriched;
    },
    enabled: !!tenantId,
  });

  const currentMember = members.find((m: any) => m.user_id === user?.id);
  const isAdmin = currentMember?.role === "owner" || currentMember?.role === "admin";

  const planType = tenant?.plan_type || "free";
  const limits = planLimits[planType] || planLimits.free;
  const memberCount = members.length;
  const canInvite = memberCount < limits.members;
  const usagePct = Math.min((memberCount / limits.members) * 100, 100);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !tenantId) return;
    if (!canInvite) {
      toast.error(`Limite de ${limits.members} membros atingido no plano ${limits.label}. Faça upgrade para adicionar mais.`);
      return;
    }
    setIsInviting(true);
    toast.success(`Convite enviado para ${inviteEmail}`, {
      description: `Área: ${areaOptions.find(a => a.id === inviteArea)?.label || inviteArea} • Função: ${roleConfig[inviteRole]?.label}`,
    });
    setInviteEmail("");
    setIsInviting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Equipe</h2>
          <p className="text-sm text-muted-foreground">
            {tenant?.name || "Meu Workspace"} • {memberCount} de {limits.members} membro{limits.members !== 1 ? "s" : ""}
          </p>
        </div>
        <Badge variant="secondary" className="self-start gap-1.5 text-xs">
          <Zap className="h-3 w-3" />
          Plano {limits.label}
        </Badge>
      </div>

      {/* Member Usage Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Membros utilizados</span>
          <span className="text-xs font-semibold">{memberCount}/{limits.members}</span>
        </div>
        <Progress value={usagePct} className="h-2" />
        {!canInvite && (
          <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-destructive/10">
            <Lock className="h-3 w-3 text-destructive" />
            <span className="text-[10px] text-destructive">Limite atingido. Faça upgrade para adicionar mais membros.</span>
          </div>
        )}
      </motion.div>

      {/* Invite Section */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-4 w-4 text-accent-violet" />
            <span className="text-sm font-medium">Convidar Membro</span>
            <Badge variant="secondary" className="text-[9px] ml-auto">
              {memberCount}/{limits.members} vagas
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="email@empresa.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={!canInvite}
              className="flex-1 bg-card border-border"
            />
            <select
              value={inviteArea}
              onChange={(e) => setInviteArea(e.target.value)}
              disabled={!canInvite}
              className="h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground"
            >
              {areaOptions.map(a => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              disabled={!canInvite}
              className="h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground"
            >
              <option value="admin">Admin</option>
              <option value="member">Membro</option>
              <option value="viewer">Visualizador</option>
            </select>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || isInviting || !canInvite}
              className="neon-glow gap-1.5 shrink-0"
            >
              {isInviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Convidar
                </>
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Membros participam da reunião com agentes e acessam o dashboard de acordo com sua função e área.
          </p>
        </motion.div>
      )}

      {/* Members List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl overflow-hidden border border-border"
      >
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Membros ({memberCount})</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum membro encontrado.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((member: any) => {
              const role = roleConfig[member.role] || roleConfig.member;
              const RoleIcon = role.icon;
              const profile = member.profile;
              const isMe = member.user_id === user?.id;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 hover:bg-card/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center border border-border">
                      <span className="text-sm font-bold text-primary">
                        {(profile?.full_name || member.user_id.slice(0, 2)).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {profile?.full_name || `Usuário ${member.user_id.slice(0, 8)}`}
                        </span>
                        {isMe && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            Você
                          </Badge>
                        )}
                      </div>
                      {profile?.company_name && (
                        <span className="text-[10px] text-muted-foreground">
                          {profile.company_name}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground block">
                        Desde {new Date(member.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[10px] gap-1 ${role.color}`}>
                      <RoleIcon className="h-2.5 w-2.5" />
                      {role.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Permissions Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-5 border border-border"
      >
        <h3 className="font-display font-semibold text-sm mb-3">Níveis de Acesso</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(roleConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-card/50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{config.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {key === "owner" && "Controle total do workspace, agentes e membros."}
                    {key === "admin" && "Gerencia agentes, configurações e convida membros."}
                    {key === "member" && "Usa agentes, vê analytics e participa de reuniões."}
                    {key === "viewer" && "Visualiza dashboards e relatórios. Sem edição."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Plan Upgrade Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-5 border border-border"
      >
        <h3 className="font-display font-semibold text-sm mb-3">Limites por Plano</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(planLimits).filter(([k]) => k !== "free").map(([key, plan]) => (
            <div
              key={key}
              className={`p-3 rounded-xl text-center ${planType === key ? "bg-primary/10 border border-primary/30" : "bg-card/50 border border-border"}`}
            >
              <p className="text-[10px] text-muted-foreground">{plan.label}</p>
              <p className="font-display font-bold text-lg">{plan.members}</p>
              <p className="text-[10px] text-muted-foreground">membros</p>
              {planType === key && (
                <Badge variant="default" className="text-[8px] mt-1">Atual</Badge>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TeamMembers;
