import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Users, TrendingUp, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantId } from "@/hooks/useTenantId";
import { toast } from "sonner";

interface Referral {
  id: string;
  code: string;
  clicks: number;
  signups: number;
  conversions: number;
  bonus_credits: number;
  active: boolean;
}

const genCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

export default function ReferralsPanel() {
  const { user } = useAuth();
  const { data: tenantId } = useTenantId();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !tenantId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (data) {
        setReferral(data as Referral);
      } else {
        const { data: created } = await supabase
          .from("referrals")
          .insert({
            tenant_id: tenantId,
            owner_user_id: user.id,
            code: `CL-${genCode()}`,
          })
          .select()
          .single();
        if (created) setReferral(created as Referral);
      }
      setLoading(false);
    })();
  }, [user?.id, tenantId]);

  const link = referral
    ? `https://www.clauthor.com/?ref=${referral.code}`
    : "";

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    toast.success("Link de indicação copiado!");
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Clauthor — Time de IA 24/7",
          text: "Acabei de montar meu time de agentes de IA no Clauthor. Ganhe créditos no cadastro:",
          url: link,
        });
      } catch {}
    } else {
      copy();
    }
  };

  if (loading) {
    return (
      <Card className="p-6 animate-pulse h-48 bg-muted/30" />
    );
  }

  if (!referral) return null;

  return (
    <Card className="p-6 space-y-5 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" /> Indique e ganhe
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Cada cadastro pago via seu link rende <strong>500 créditos</strong> para você.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input value={link} readOnly className="font-mono text-xs" />
        <Button variant="outline" size="icon" onClick={copy} aria-label="Copiar link">
          <Copy className="h-4 w-4" />
        </Button>
        <Button onClick={share} className="gap-2">
          <Share2 className="h-4 w-4" /> Compartilhar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Cliques" value={referral.clicks} />
        <Stat icon={<Users className="h-4 w-4" />} label="Cadastros" value={referral.signups} />
        <Stat icon={<Gift className="h-4 w-4" />} label="Créditos" value={referral.bonus_credits} />
      </div>
    </Card>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/50 p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-display text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
