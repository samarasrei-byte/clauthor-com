import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Receipt, Globe, FlaskConical, CheckCircle, Clock, XCircle, Coins,
} from "lucide-react";

interface PaymentRecord {
  id: string;
  type: string;
  item_id: string;
  item_name: string;
  tokens_amount: number;
  amount_cents: number;
  currency: string;
  status: string;
  paypal_order_id: string | null;
  created_at: string;
}

export default function PaymentHistoryTable() {
  const { user } = useAuth();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payment-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as PaymentRecord[];
    },
    enabled: !!user?.id,
  });

  const statusConfig: Record<string, { icon: typeof CheckCircle; class: string; label: string }> = {
    completed: { icon: CheckCircle, class: "bg-emerald-500/10 text-emerald-400", label: "Concluído" },
    pending: { icon: Clock, class: "bg-amber-500/10 text-amber-400", label: "Pendente" },
    failed: { icon: XCircle, class: "bg-destructive/10 text-destructive", label: "Falhou" },
  };

  const typeConfig: Record<string, { icon: typeof Globe; class: string; label: string }> = {
    paypal: { icon: Globe, class: "text-blue-400", label: "PayPal" },
    test_bypass: { icon: FlaskConical, class: "text-amber-400", label: "Modo Teste" },
    pix: { icon: Receipt, class: "text-emerald-400", label: "PIX" },
  };

  const formatTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
  };

  const formatCurrency = (cents: number, currency: string) => {
    if (cents === 0) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(cents);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="flex items-center gap-3 p-5 pb-3">
        <Receipt className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold">Transaction History</h3>
        <Badge variant="secondary" className="text-[10px]">{payments.length}</Badge>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
      ) : payments.length === 0 ? (
        <div className="p-8 text-center">
          <Coins className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Your token purchases and upgrades will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Item</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-right">Tokens</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-right">Amount</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const st = statusConfig[p.status] || statusConfig.completed;
                const tp = typeConfig[p.type] || typeConfig.paypal;
                const StatusIcon = st.icon;
                const TypeIcon = tp.icon;

                return (
                  <TableRow key={p.id} className="border-white/5">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString("en-US", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className={`h-3.5 w-3.5 ${tp.class}`} />
                        <span className="text-xs">{tp.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{p.item_name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">
                        +{formatTokens(p.tokens_amount)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium">
                      {formatCurrency(p.amount_cents, p.currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${st.class} text-[10px] gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {st.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}
