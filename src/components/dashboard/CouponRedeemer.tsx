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
      const { data, error } = await supabase.rpc("redeem_coupon", {
        _user_id: user.id,
        _code: code.trim(),
      });

      if (error) throw new Error("Erro ao resgatar cupom.");

      const result = data as { error?: string; success?: boolean; credits_amount?: number; plan_upgrade?: string };

      if (result?.error) throw new Error(result.error);

      setRedeemed(true);
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });

      const msg = result.credits_amount && result.credits_amount > 0
        ? `🎉 Cupom resgatado! +${(result.credits_amount / 1000).toFixed(0)}k tokens adicionados.`
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
