import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Copy, ExternalLink, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { Helmet } from "react-helmet-async";

interface Intake {
  id: string;
  token: string;
  client_name: string | null;
  company_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: "pending" | "in_progress" | "completed";
  answers: Record<string, unknown> | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<Intake["status"], { text: string; variant: "outline" | "secondary" | "default" }> = {
  pending: { text: "Pendente", variant: "outline" },
  in_progress: { text: "Em andamento", variant: "secondary" },
  completed: { text: "Concluído", variant: "default" },
};

export default function AdminClientIntakes() {
  const { verified } = useAdminGuard();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Intake | null>(null);

  const { data: intakes = [], isLoading } = useQuery({
    queryKey: ["admin-client-intakes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_intakes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Intake[];
    },
    enabled: verified === true,
  });

  const createIntake = async () => {
    setCreating(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("client_intakes")
      .insert({ client_name: name.trim() || null, created_by: userRes.user?.id })
      .select("token, id")
      .maybeSingle();
    setCreating(false);
    if (error || !data) { toast.error("Falha ao criar link"); return; }
    const url = `${window.location.origin}/intake/${data.token}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Link criado e copiado!", { description: url });
    setName("");
    qc.invalidateQueries({ queryKey: ["admin-client-intakes"] });
  };

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/intake/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };

  const counts = useMemo(() => ({
    total: intakes.length,
    completed: intakes.filter((i) => i.status === "completed").length,
    pending: intakes.filter((i) => i.status === "pending").length,
  }), [intakes]);

  if (verified !== true) {
    return <div className="min-h-dvh grid place-items-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <>
      <Helmet><title>Clientes · Onboardings · Admin</title></Helmet>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes · Onboardings</h1>
          <p className="text-sm text-muted-foreground">Gere um link exclusivo pra cada cliente e acompanhe as respostas do intake em tempo real.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-semibold">{counts.total}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Concluídos</div><div className="text-2xl font-semibold text-primary">{counts.completed}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Pendentes</div><div className="text-2xl font-semibold">{counts.pending}</div></Card>
        </div>

        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Novo intake</div>
          <div className="flex gap-2">
            <Input placeholder="Nome do cliente (opcional)" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={createIntake} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1.5" /> Criar link</>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">O link é copiado automaticamente. Envie ao cliente por WhatsApp/e-mail.</p>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
              )}
              {!isLoading && intakes.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum intake ainda. Crie o primeiro acima.</TableCell></TableRow>
              )}
              {intakes.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => setSelected(row)}>
                  <TableCell className="font-medium">{row.client_name ?? "—"}</TableCell>
                  <TableCell>{row.company_name ?? "—"}</TableCell>
                  <TableCell className="text-xs">
                    {row.contact_email && <div>{row.contact_email}</div>}
                    {row.contact_phone && <div className="text-muted-foreground">{row.contact_phone}</div>}
                    {!row.contact_email && !row.contact_phone && "—"}
                  </TableCell>
                  <TableCell><Badge variant={STATUS_LABEL[row.status].variant}>{STATUS_LABEL[row.status].text}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); copyLink(row.token); }}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" asChild onClick={(e) => e.stopPropagation()}>
                      <a href={`/intake/${row.token}`} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selected && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5" />
                    {selected.client_name ?? "Intake"}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_LABEL[selected.status].variant}>{STATUS_LABEL[selected.status].text}</Badge>
                    <Button size="sm" variant="outline" onClick={() => copyLink(selected.token)}>
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar link
                    </Button>
                  </div>
                  <FieldRow label="Empresa" value={selected.company_name} />
                  <FieldRow label="E-mail" value={selected.contact_email} />
                  <FieldRow label="WhatsApp" value={selected.contact_phone} />
                  {selected.completed_at && (
                    <FieldRow label="Concluído em" value={new Date(selected.completed_at).toLocaleString("pt-BR")} />
                  )}
                  <div className="pt-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Respostas</div>
                    <div className="space-y-2">
                      {Object.entries(selected.answers ?? {}).map(([k, v]) => (
                        <div key={k} className="rounded-lg border border-border/60 p-2.5">
                          <div className="text-xs text-muted-foreground">{k}</div>
                          <div className="text-sm">{Array.isArray(v) ? v.join(", ") : String(v || "—")}</div>
                        </div>
                      ))}
                      {(!selected.answers || Object.keys(selected.answers).length === 0) && (
                        <div className="text-xs text-muted-foreground">Nenhuma resposta ainda.</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 pb-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </div>
  );
}
