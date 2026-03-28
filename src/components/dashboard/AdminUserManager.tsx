import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Coins, Edit, Save, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AdminUserManagerProps {
  allProfiles: any[];
  allCredits: any[];
}

export default function AdminUserManager({ allProfiles, allCredits }: AdminUserManagerProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pt" ? "pt-BR" : i18n.language;
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newCredits, setNewCredits] = useState("");
  const [newPlan, setNewPlan] = useState("");
  const [saving, setSaving] = useState(false);

  const openEdit = (profile: any) => {
    const credit = allCredits.find((c: any) => c.user_id === profile.user_id);
    setEditingUser({ ...profile, credit });
    setNewCredits(credit?.total_credits?.toString() || "10000");
    setNewPlan(credit?.plan_type || "free");
  };

  const handleSave = async () => {
    if (!editingUser?.credit) return;
    setSaving(true);

    const { error } = await supabase
      .from("user_credits")
      .update({
        total_credits: parseInt(newCredits) || 10000,
        plan_type: newPlan,
      })
      .eq("user_id", editingUser.user_id);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success(`Plano de ${editingUser.full_name || "usuário"} atualizado!`);
      queryClient.invalidateQueries({ queryKey: ["admin-all-credits"] });
      setEditingUser(null);
    }
    setSaving(false);
  };

  const resetCredits = async () => {
    if (!editingUser?.credit) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_credits")
      .update({ used_credits: 0 })
      .eq("user_id", editingUser.user_id);

    if (error) {
      toast.error("Failed to reset credits.");
    } else {
      toast.success("Credits reset!");
      queryClient.invalidateQueries({ queryKey: ["admin-all-credits"] });
    }
    setSaving(false);
  };

  return (
    <>
      <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" /> All Users ({allProfiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left p-3 text-muted-foreground font-medium">Name</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Company</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Plan</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Credits</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Joined</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allProfiles.map((profile: any) => {
                  const userCredit = allCredits.find((c: any) => c.user_id === profile.user_id);
                  const pct = userCredit ? Math.round((userCredit.used_credits / userCredit.total_credits) * 100) : 0;
                  return (
                    <tr key={profile.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                      <td className="p-3 font-medium">{profile.full_name || "—"}</td>
                      <td className="p-3 text-muted-foreground text-xs font-mono">{profile.email || "—"}</td>
                      <td className="p-3 text-muted-foreground">{profile.company_name || "—"}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {userCredit?.plan_type || "free"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {userCredit ? (
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-1.5 w-16" />
                            <span className="text-xs text-muted-foreground">
                              {userCredit.used_credits.toLocaleString()}/{userCredit.total_credits.toLocaleString()}
                            </span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(profile.created_at).toLocaleDateString(locale)}
                      </td>
                      <td className="p-3">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openEdit(profile)}>
                          <Edit className="h-3 w-3" /> Gerenciar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Gerenciar: {editingUser?.full_name || "Usuário"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (10k tokens)</SelectItem>
                  <SelectItem value="starter">Starter (50k tokens)</SelectItem>
                  <SelectItem value="pro">Pro (200k tokens)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (1M tokens)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Total credits</Label>
              <Input
                type="number"
                value={newCredits}
                onChange={(e) => setNewCredits(e.target.value)}
                className="bg-card border-border"
              />
            </div>
            {editingUser?.credit && (
              <div className="p-3 rounded-lg bg-muted/30 text-xs space-y-1">
                <p>Used: <strong>{editingUser.credit.used_credits.toLocaleString()}</strong></p>
                <p>Reset at: <strong>{new Date(editingUser.credit.credits_reset_at).toLocaleDateString(locale)}</strong></p>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={resetCredits} disabled={saving} className="w-full text-xs">
              Reset used credits to 0
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
