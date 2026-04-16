import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Linkedin, CheckCircle2, ArrowRight, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import HunterStepper from "@/components/hunter/HunterStepper";

const HunterLinkedIn = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cookie, setCookie] = useState("");
  const [session, setSession] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("hunter_linkedin_session")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setSession(data);
      setLoading(false);
    })();
  }, [user]);

  const handleConnect = async () => {
    if (!cookie.trim() || cookie.trim().length < 20) {
      toast.error("Cole o cookie li_at do LinkedIn (mínimo 20 caracteres)");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("hunter-linkedin-connect", {
      body: { linkedin_cookie: cookie.trim() },
    });
    setSaving(false);
    if (error || !data?.success) {
      toast.error(error?.message || "Falha ao conectar LinkedIn");
      return;
    }
    toast.success("LinkedIn conectado!");
    const { data: refreshed } = await supabase
      .from("hunter_linkedin_session")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();
    setSession(refreshed);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <HunterStepper current={1} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-primary" /> Passo 1 — Conectar LinkedIn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {session?.linkedin_cookie ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session.profile_avatar_url} />
                  <AvatarFallback>{(session.profile_name || "L").charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">LinkedIn conectado</p>
                  <p className="text-sm text-muted-foreground truncate">{session.profile_name || "Perfil ativo"}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => navigate("/hunter-icp")} className="gap-2">
                  Próximo: definir ICP <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  Para autorizar, cole seu cookie <code className="font-mono">li_at</code> do LinkedIn.
                  No navegador: DevTools → Application → Cookies → linkedin.com → li_at.
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cookie li_at</Label>
                <Input
                  type="password"
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="AQEDAT..."
                />
              </div>
              <Button onClick={handleConnect} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Linkedin className="w-4 h-4" />}
                {saving ? "Conectando..." : "Conectar LinkedIn"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HunterLinkedIn;
