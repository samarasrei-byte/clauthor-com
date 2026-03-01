import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Loader2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CouponRedeemer() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleRedeem = async () => {
    if (!code.trim() || !user) return;
    setLoading(true);

    try {
      // 1. Find coupon
      const { data: coupon, error: findErr } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (findErr || !coupon) throw new Error("Cupom não encontrado ou inválido.");

      // 2. Check expiration
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw new Error("Este cupom expirou.");
      }

      // 3. Check max uses
      if (coupon.used_count >= coupon.max_uses) {
        throw new Error("Este cupom já atingiu o limite de uso.");
      }

      // 4. Check if already redeemed by this user
      const { data: existing } = await supabase
        .from("coupon_redemptions")
        .select("id")
        .eq("coupon_id", coupon.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) throw new Error("Você já resgatou este cupom.");

      // 5. Add credits
      if (coupon.credits_amount > 0) {
        const { data: currentCredits } = await supabase
          .from("user_credits")
          .select("total_credits, plan_type")
          .eq("user_id", user.id)
          .single();

        if (currentCredits) {
          const updatePayload: Record<string, any> = {
            total_credits: currentCredits.total_credits + coupon.credits_amount,
          };
          if (coupon.plan_upgrade) {
            updatePayload.plan_type = coupon.plan_upgrade;
          }
          await supabase
            .from("user_credits")
            .update(updatePayload)
            .eq("user_id", user.id);
        }
      }

      // 6. Record redemption
      await supabase.from("coupon_redemptions").insert({
        coupon_id: coupon.id,
        user_id: user.id,
      });

      // 7. Increment used_count (admin policy)
      // Use a workaround: we'll handle this via the admin side or a trigger
      // For now the admin can see redemptions count

      setRedeemed(true);
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });

      const msg = coupon.credits_amount > 0
        ? `🎉 Cupom resgatado! +${(coupon.credits_amount / 1000).toFixed(0)}k tokens adicionados.`
        : "🎉 Cupom resgatado com sucesso!";
      toast.success(msg, { duration: 5000 });

      setTimeout(() => setRedeemed(false), 3000);
    } catch (err: any) {
      toast.error(err.message || "Erro ao resgatar cupom");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          Resgatar Cupom
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="Digite o código"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="font-mono text-sm uppercase tracking-wider"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
          />
          <Button
            onClick={handleRedeem}
            disabled={loading || !code.trim()}
            size="sm"
            className="shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Resgatar"
            )}
          </Button>
        </div>
        <AnimatePresence>
          {redeemed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Cupom aplicado com sucesso!
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
