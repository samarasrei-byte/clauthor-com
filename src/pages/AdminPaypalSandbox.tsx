import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FlaskConical,
  Loader2,
  RefreshCw,
  XCircle,
  Clock,
} from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { cn } from "@/lib/utils";

type SandboxTest = {
  id: string;
  action: "create_order" | "capture_order" | "check_order";
  status: "pending" | "approved" | "captured" | "failed" | "cancelled";
  order_id: string | null;
  approve_url: string | null;
  amount: number | null;
  currency: string | null;
  description: string | null;
  error_message: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<SandboxTest["status"], { label: string; icon: typeof CheckCircle2; className: string }> = {
  pending: { label: "Pendente", icon: Clock, className: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  approved: { label: "Aprovado", icon: CheckCircle2, className: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  captured: { label: "Capturado", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  failed: { label: "Falhou", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/30" },
  cancelled: { label: "Cancelado", icon: XCircle, className: "bg-muted text-muted-foreground border-border" },
};

export default function AdminPaypalSandbox() {
  const { verified } = useAdminGuard();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<string>("1.00");
  const [description, setDescription] = useState<string>("Clauthor · Teste sandbox PayPal (não é cobrança real)");
  const [isCreating, setIsCreating] = useState(false);
  const [capturingId, setCapturingId] = useState<string | null>(null);

  // Feedback do redirect do PayPal sandbox
  useEffect(() => {
    const result = searchParams.get("result");
    if (result === "success") {
      toast.success("PayPal sandbox aprovou a ordem. Agora capture para concluir.");
      searchParams.delete("result");
      setSearchParams(searchParams, { replace: true });
    } else if (result === "cancelled") {
      toast.info("Ordem sandbox cancelada pelo payer.");
      searchParams.delete("result");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: tests, isLoading } = useQuery({
    queryKey: ["paypal-sandbox-tests"],
    enabled: verified === true,
    queryFn: async (): Promise<SandboxTest[]> => {
      const { data, error } = await supabase
        .from("paypal_sandbox_tests")
        .select("id, action, status, order_id, approve_url, amount, currency, description, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as SandboxTest[];
    },
    refetchInterval: 15000,
  });

  const stats = useMemo(() => {
    const list = tests ?? [];
    return {
      total: list.length,
      captured: list.filter((t) => t.status === "captured").length,
      pending: list.filter((t) => t.status === "pending").length,
      failed: list.filter((t) => t.status === "failed").length,
    };
  }, [tests]);

  const handleCreateOrder = async () => {
    const parsedAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 10) {
      toast.error("Valor inválido. Use um número entre 0.01 e 10.00 (sandbox).");
      return;
    }
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("paypal-sandbox-checkout", {
        body: {
          action: "create_order",
          amount: parsedAmount,
          currency: "BRL",
          description,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "unknown_error");
      toast.success(`Ordem sandbox criada: ${data.order_id}`);
      queryClient.invalidateQueries({ queryKey: ["paypal-sandbox-tests"] });
      if (data.approve_url) {
        window.open(data.approve_url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Falha ao criar ordem sandbox: ${msg}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCapture = async (test: SandboxTest) => {
    if (!test.order_id) return;
    setCapturingId(test.id);
    try {
      const { data, error } = await supabase.functions.invoke("paypal-sandbox-checkout", {
        body: { action: "capture_order", order_id: test.order_id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "unknown_error");
      toast.success(`Captura concluída: ${data.status}`);
      queryClient.invalidateQueries({ queryKey: ["paypal-sandbox-tests"] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Falha na captura: ${msg}`);
    } finally {
      setCapturingId(null);
    }
  };

  const handleCheck = async (test: SandboxTest) => {
    if (!test.order_id) return;
    try {
      const { data, error } = await supabase.functions.invoke("paypal-sandbox-checkout", {
        body: { action: "check_order", order_id: test.order_id },
      });
      if (error) throw error;
      toast.info(`Status atual da ordem: ${data?.status ?? "?"}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Falha ao consultar: ${msg}`);
    }
  };

  if (verified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-3 -ml-2 text-muted-foreground"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Admin
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Sandbox PayPal</h1>
                <p className="text-sm text-muted-foreground">
                  Dispare checkouts de teste contra <code className="text-xs">api-m.sandbox.paypal.com</code> sem gastar dinheiro real.
                </p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600">
            Ambiente: sandbox
          </Badge>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Capturadas" value={stats.captured} accent="emerald" />
          <StatCard label="Pendentes" value={stats.pending} accent="amber" />
          <StatCard label="Falhas" value={stats.failed} accent="destructive" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-4 h-4 text-primary" />
              Novo checkout de teste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sandbox-amount">Valor (BRL, máx. 10)</Label>
                <Input
                  id="sandbox-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="sandbox-desc">Descrição</Label>
                <Input
                  id="sandbox-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={120}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleCreateOrder} disabled={isCreating}>
                {isCreating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando…</>
                ) : (
                  <><FlaskConical className="w-4 h-4 mr-2" /> Disparar checkout sandbox</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Uma nova aba abrirá com o approve URL do PayPal. Use um <strong>Personal Sandbox account</strong> para aprovar; depois volte aqui e clique em <em>Capturar</em>.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Histórico de execuções</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["paypal-sandbox-tests"] })}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : !tests || tests.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nenhum teste executado ainda. Dispare o primeiro checkout acima.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {tests.map((test) => {
                  const meta = STATUS_STYLES[test.status];
                  const StatusIcon = meta.icon;
                  return (
                    <li key={test.id} className="py-3 flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-[220px]">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Badge variant="outline" className={cn("gap-1", meta.className)}>
                            <StatusIcon className="w-3 h-3" /> {meta.label}
                          </Badge>
                          <span className="text-muted-foreground text-xs uppercase tracking-wide">
                            {test.action.replace("_", " ")}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground space-x-2">
                          <span>
                            {test.currency} {(test.amount ?? 0).toFixed(2)}
                          </span>
                          <span>·</span>
                          <span>{new Date(test.created_at).toLocaleString("pt-BR")}</span>
                          {test.order_id && (
                            <>
                              <span>·</span>
                              <code className="text-[10px]">{test.order_id}</code>
                            </>
                          )}
                        </div>
                        {test.error_message && (
                          <div className="mt-1 text-xs text-destructive">{test.error_message}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {test.approve_url && test.status === "pending" && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                          >
                            <a href={test.approve_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Aprovar
                            </a>
                          </Button>
                        )}
                        {test.order_id && test.status !== "captured" && test.status !== "failed" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCapture(test)}
                            disabled={capturingId === test.id}
                          >
                            {capturingId === test.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              "Capturar"
                            )}
                          </Button>
                        )}
                        {test.order_id && (
                          <Button variant="ghost" size="sm" onClick={() => handleCheck(test)}>
                            Status
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "amber" | "destructive";
}) {
  const accentClass =
    accent === "emerald"
      ? "text-emerald-500"
      : accent === "amber"
      ? "text-amber-500"
      : accent === "destructive"
      ? "text-destructive"
      : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", accentClass)}>{value}</div>
    </div>
  );
}
