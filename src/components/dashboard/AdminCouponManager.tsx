import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, Plus, Copy, Trash2, Loader2 } from "lucide-react";

export function AdminCouponManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [credits, setCredits] = useState("5000000");
  const [maxUses, setMaxUses] = useState("1");
  const [planUpgrade, setPlanUpgrade] = useState("none");

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "CL-";
    for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
    setNewCode(result);
  };

  const handleCreate = async () => {
    if (!newCode.trim() || !user) return;
    setCreating(true);
    try {
      const { error } = await supabase.from("coupons").insert({
        code: newCode.trim().toUpperCase(),
        credits_amount: parseInt(credits) || 0,
        max_uses: parseInt(maxUses) || 1,
        plan_upgrade: planUpgrade === "none" ? null : planUpgrade,
        created_by: user.id,
        description: `${(parseInt(credits) / 1000000).toFixed(0)}M tokens${planUpgrade !== "none" ? ` + plano ${planUpgrade}` : ""}`,
      });
      if (error) throw error;
      toast.success(`Cupom ${newCode} criado!`);
      setNewCode("");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar cupom");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("coupons").update({ is_active: false }).eq("id", id);
    if (error) toast.error("Erro ao desativar");
    else {
      toast.success("Cupom desativado");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const formatTokens = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(0)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return n.toString();
  };

  return (
    <Card className="glass-card border-white/10">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          Gerenciar Cupons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new coupon */}
        <div className="space-y-3 p-3 rounded-lg bg-muted/20 border border-white/5">
          <div className="flex gap-2">
            <Input
              placeholder="Código (ex: CL-TESTE)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="font-mono text-sm uppercase"
            />
            <Button size="sm" variant="outline" onClick={generateCode} className="shrink-0 text-xs">
              Gerar
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Tokens</label>
              <Select value={credits} onValueChange={setCredits}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="100000">100k</SelectItem>
                  <SelectItem value="500000">500k</SelectItem>
                  <SelectItem value="1000000">1M</SelectItem>
                  <SelectItem value="5000000">5M</SelectItem>
                  <SelectItem value="10000000">10M</SelectItem>
                  <SelectItem value="25000000">25M</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Usos</label>
              <Select value={maxUses} onValueChange={setMaxUses}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Plano</label>
              <Select value={planUpgrade} onValueChange={setPlanUpgrade}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem upgrade</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={creating || !newCode.trim()} size="sm" className="w-full gap-1.5">
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Criar Cupom
          </Button>
        </div>

        {/* List coupons */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="text-xs text-muted-foreground text-center py-4">Carregando...</div>
          ) : !coupons?.length ? (
            <div className="text-xs text-muted-foreground text-center py-4">Nenhum cupom criado</div>
          ) : (
            coupons.map((c: any) => (
              <div key={c.id} className={`flex items-center justify-between p-2 rounded-lg border ${c.is_active ? "border-white/10 bg-muted/10" : "border-white/5 bg-muted/5 opacity-50"}`}>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyCode(c.code)} className="hover:text-primary transition-colors">
                    <Copy className="h-3 w-3" />
                  </button>
                  <span className="font-mono text-xs font-bold">{c.code}</span>
                  <Badge variant="outline" className="text-[10px] h-4">
                    {formatTokens(c.credits_amount)}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {c.used_count}/{c.max_uses}
                  </span>
                </div>
                {c.is_active && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
