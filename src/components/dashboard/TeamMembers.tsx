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
import { useTranslation } from "react-i18next";

const roleKeys: Record<string, { labelKey: string; icon: React.ElementType; color: string }> = {
  owner: { labelKey: "team.role_owner", icon: Crown, color: "bg-primary/15 text-primary" },
  admin: { labelKey: "team.role_admin", icon: Shield, color: "bg-primary/10 text-primary" },
  member: { labelKey: "team.role_member", icon: Users, color: "bg-muted text-muted-foreground" },
  viewer: { labelKey: "team.role_viewer", icon: Eye, color: "bg-muted text-muted-foreground" },
};

const areaKeys = [
  { id: "geral", key: "team.area_geral" },
  { id: "financeiro", key: "team.area_financeiro" },
  { id: "comercial", key: "team.area_comercial" },
  { id: "marketing", key: "team.area_marketing" },
  { id: "tecnologia", key: "team.area_tecnologia" },
  { id: "rh", key: "team.area_rh" },
  { id: "suporte", key: "team.area_suporte" },
  { id: "criacao", key: "team.area_criacao" },
];

const planLimits: Record<string, { members: number; label: string }> = {
  free: { members: 3, label: "Básico" },
  basic: { members: 3, label: "Básico" },
  starter: { members: 5, label: "Starter" },
  professional: { members: 10, label: "Profissional" },
  business: { members: 25, label: "Business" },
  enterprise: { members: 100, label: "Enterprise" },
};

const descKeys: Record<string, string> = {
  owner: "team.desc_owner",
  admin: "team.desc_admin",
  member: "team.desc_member",
  viewer: "team.desc_viewer",
};

const TeamMembers = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      const { data: membersData, error: membersErr } = await supabase
        .from("tenant_members")
        .select("*")
        .eq("tenant_id", tenantId!);
      if (membersErr) throw membersErr;

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

  const getRoleLabel = (role: string) => t(roleKeys[role]?.labelKey || "team.role_member");
  const getAreaLabel = (areaId: string) => {
    const area = areaKeys.find(a => a.id === areaId);
    return area ? t(area.key) : areaId;
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !tenantId || !user) return;
    if (!canInvite) {
      toast.error(t("team.limit_toast", { max: limits.members, plan: limits.label }));
      return;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast.error(t("team.invalid_email"));
      return;
    }

    setIsInviting(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: user.id,
        title: t("team.invite_notification"),
        message: t("team.invite_notification_msg", { email: inviteEmail, role: getRoleLabel(inviteRole), area: getAreaLabel(inviteArea) }),
        type: "team_invite",
        metadata: {
          invite_email: inviteEmail,
          invite_role: inviteRole,
          invite_area: inviteArea,
          tenant_id: tenantId,
        },
      });

      if (error) throw error;

      toast.success(t("team.invite_sent", { email: inviteEmail }), {
        description: t("team.invite_sent_desc", { area: getAreaLabel(inviteArea), role: getRoleLabel(inviteRole) }),
      });
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["tenant-members"] });
    } catch (err) {
      console.error("Invite error:", err);
      toast.error(t("team.invite_error"));
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === user?.id) {
      toast.error(t("team.remove_self_error"));
      return;
    }
    try {
      const { error } = await supabase
        .from("tenant_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
      toast.success(t("team.member_removed"));
      queryClient.invalidateQueries({ queryKey: ["tenant-members"] });
    } catch {
      toast.error(t("team.remove_error"));
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("tenant_members")
        .update({ role: newRole })
        .eq("id", memberId);
      if (error) throw error;
      toast.success(t("team.permission_updated"));
      queryClient.invalidateQueries({ queryKey: ["tenant-members"] });
    } catch {
      toast.error(t("team.permission_error"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">{t("team.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {tenant?.name || t("team.workspace_default")} • {memberCount} {t("team.members_used").toLowerCase()} ({limits.members} max)
          </p>
        </div>
        <Badge variant="secondary" className="self-start gap-1.5 text-xs">
          <Zap className="h-3 w-3" />
          {t("team.plan_label", { plan: limits.label })}
        </Badge>
      </div>

      {/* Member Usage Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{t("team.members_used")}</span>
          <span className="text-xs font-semibold">{memberCount}/{limits.members}</span>
        </div>
        <Progress value={usagePct} className="h-2" />
        {!canInvite && (
          <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-destructive/10">
            <Lock className="h-3 w-3 text-destructive" />
            <span className="text-[10px] text-destructive">{t("team.limit_reached")}</span>
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
            <UserPlus className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t("team.invite_member")}</span>
            <Badge variant="secondary" className="text-[9px] ml-auto">
              {memberCount}/{limits.members} {t("team.slots")}
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder={t("team.email_placeholder")}
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
              {areaKeys.map(a => (
                <option key={a.id} value={a.id}>{t(a.key)}</option>
              ))}
            </select>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              disabled={!canInvite}
              className="h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground"
            >
              <option value="admin">{t("team.role_admin")}</option>
              <option value="member">{t("team.role_member")}</option>
              <option value="viewer">{t("team.role_viewer")}</option>
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
                  {t("team.invite")}
                </>
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            {t("team.invite_desc")}
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
          <span className="text-sm font-medium">{t("team.members_count", { count: memberCount })}</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {t("team.no_members")}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((member: any) => {
              const roleInfo = roleKeys[member.role] || roleKeys.member;
              const RoleIcon = roleInfo.icon;
              const profile = member.profile;
              const isMe = member.user_id === user?.id;
              const isOwner = member.role === "owner";

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
                          {profile?.full_name || `User ${member.user_id.slice(0, 8)}`}
                        </span>
                        {isMe && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{t("team.you")}</Badge>
                        )}
                      </div>
                      {profile?.company_name && (
                        <span className="text-[10px] text-muted-foreground">{profile.company_name}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground block">
                        {t("team.since", { date: new Date(member.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }) })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && !isMe && !isOwner && (
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                        className="h-7 px-2 rounded border border-border bg-card text-[10px] text-foreground"
                      >
                        <option value="admin">{t("team.role_admin")}</option>
                        <option value="member">{t("team.role_member")}</option>
                        <option value="viewer">{t("team.role_viewer")}</option>
                      </select>
                    )}
                    <Badge variant="secondary" className={`text-[10px] gap-1 ${roleInfo.color}`}>
                      <RoleIcon className="h-2.5 w-2.5" />
                      {t(roleInfo.labelKey)}
                    </Badge>
                    {isAdmin && !isMe && !isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/60 hover:text-destructive"
                        onClick={() => handleRemoveMember(member.id, member.user_id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
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
        <h3 className="font-display font-semibold text-sm mb-3">{t("team.access_levels")}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(roleKeys).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-card/50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{t(config.labelKey)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t(descKeys[key])}
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
        <h3 className="font-display font-semibold text-sm mb-3">{t("team.plan_limits")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(planLimits).filter(([k]) => k !== "free").map(([key, plan]) => (
            <div
              key={key}
              className={`p-3 rounded-xl text-center ${planType === key ? "bg-primary/10 border border-primary/30" : "bg-card/50 border border-border"}`}
            >
              <p className="text-[10px] text-muted-foreground">{plan.label}</p>
              <p className="font-display font-bold text-lg">{plan.members}</p>
              <p className="text-[10px] text-muted-foreground">{t("team.members")}</p>
              {planType === key && (
                <Badge variant="default" className="text-[8px] mt-1">{t("team.current")}</Badge>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TeamMembers;
