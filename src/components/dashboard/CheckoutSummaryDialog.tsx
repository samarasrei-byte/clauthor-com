import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Users, ShieldCheck, CreditCard, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/pricing";
import { useState } from "react";

export interface CheckoutSummaryData {
  label: string;
  slugs: string[];
  isDepartment: boolean;
  departmentId?: string;
  price: number;
  currency: string;
  lang: string;
}

interface Props {
  data: CheckoutSummaryData | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const CheckoutSummaryDialog = ({ data, onConfirm, onCancel }: Props) => {
  const [loading, setLoading] = useState(false);

  if (!data) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!data} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/20">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Resumo do Checkout
          </DialogTitle>
          <DialogDescription>Confira os detalhes antes de prosseguir ao pagamento.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type badge */}
          <div className="flex items-center gap-2">
            {data.isDepartment ? (
              <Badge variant="secondary" className="bg-primary/15 text-primary gap-1">
                <Users className="h-3 w-3" /> Squad / Departamento
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-accent/50 gap-1">
                <Bot className="h-3 w-3" /> Agente Individual
              </Badge>
            )}
          </div>

          {/* Item name */}
          <div className="rounded-xl border border-border/10 bg-accent/20 p-4 space-y-3">
            <p className="font-display font-semibold text-lg">{data.label}</p>
            {data.isDepartment && (
              <p className="text-xs text-muted-foreground">
                {data.slugs.length} agente{data.slugs.length > 1 ? "s" : ""} incluído{data.slugs.length > 1 ? "s" : ""}
              </p>
            )}
            {data.isDepartment && data.slugs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.slugs.map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px] capitalize">
                    {s.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Assinatura mensal</span>
            <span className="font-display text-2xl font-bold text-primary">
              {formatPrice(data.price, data.lang)}
              <span className="text-xs text-muted-foreground font-normal">/mês</span>
            </span>
          </div>

          {/* Trust signals */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary/60" />
            <span>Pagamento seguro via PayPal • Cancele quando quiser</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading} className="flex-1">
            Voltar
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className="flex-1 glow gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            {loading ? "Redirecionando..." : "Pagar com PayPal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutSummaryDialog;
