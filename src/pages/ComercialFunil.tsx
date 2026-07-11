import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Plus, Trash2, DollarSign, Building2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { STAGES, useDeals, type Deal, type DealStage } from "@/hooks/useDeals";

const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

function NewDealDialog({ defaultStage }: { defaultStage: DealStage }) {
  const { createDeal } = useDeals();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    contact_name: "",
    contact_email: "",
    contact_company: "",
    value_brl: "",
    notes: "",
  });

  const submit = async () => {
    if (!form.title.trim()) return;
    await createDeal.mutateAsync({
      title: form.title.trim(),
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      contact_company: form.contact_company || null,
      value_brl: Number(form.value_brl.replace(",", ".")) || 0,
      notes: form.notes || null,
      stage: defaultStage,
    });
    setForm({ title: "", contact_name: "", contact_email: "", contact_company: "", value_brl: "", notes: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs text-muted-foreground">
          <Plus className="h-3.5 w-3.5" /> Novo deal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo deal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Proposta ACME" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Contato</Label>
              <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            </div>
            <div>
              <Label>Empresa</Label>
              <Input value={form.contact_company} onChange={(e) => setForm({ ...form, contact_company: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input inputMode="decimal" value={form.value_brl} onChange={(e) => setForm({ ...form, value_brl: e.target.value })} placeholder="1900" />
            </div>
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={createDeal.isPending}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const { deleteDeal } = useDeals();
  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("deal/id", deal.id);
    e.dataTransfer.effectAllowed = "move";
  };
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group rounded-lg border border-border bg-card p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
    >
      <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight line-clamp-2">{deal.title}</p>
          <button
            onClick={() => deleteDeal.mutate(deal.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            aria-label="Remover deal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {deal.contact_company && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Building2 className="h-3 w-3" /> {deal.contact_company}
          </p>
        )}
        {deal.contact_email && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Mail className="h-3 w-3" /> {deal.contact_email}
          </p>
        )}
        {deal.value_brl > 0 && (
          <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary">
            <DollarSign className="h-3 w-3" /> {BRL(Number(deal.value_brl))}
          </p>
        )}
      </motion.div>
    </div>
  );
}

function StageColumn({ stage, deals }: { stage: (typeof STAGES)[number]; deals: Deal[] }) {
  const { updateDeal } = useDeals();
  const total = useMemo(() => deals.reduce((s, d) => s + Number(d.value_brl || 0), 0), [deals]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("deal/id");
    if (!id) return;
    updateDeal.mutate({ id, patch: { stage: stage.key } });
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="flex flex-col rounded-xl border border-border bg-background/40 min-w-[260px] w-[260px] shrink-0"
    >
      <header className={cn("rounded-t-xl px-3 py-2 flex items-center justify-between", stage.color)}>
        <div>
          <p className="text-xs font-semibold">{stage.label}</p>
          <p className="text-[10px] text-muted-foreground">
            {deals.length} · {BRL(total)}
          </p>
        </div>
      </header>
      <div className="flex-1 p-2 space-y-2 min-h-[120px]">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
      <div className="p-2 border-t border-border">
        <NewDealDialog defaultStage={stage.key} />
      </div>
    </div>
  );
}

export default function ComercialFunil() {
  const { dealsQuery } = useDeals();
  const deals = dealsQuery.data ?? [];

  const byStage = useMemo(() => {
    const map: Record<DealStage, Deal[]> = {
      novo: [], qualificado: [], proposta: [], negociacao: [], fechado_ganho: [], fechado_perdido: [],
    };
    for (const d of deals) map[d.stage].push(d);
    return map;
  }, [deals]);

  const totalPipeline = useMemo(
    () =>
      deals
        .filter((d) => d.stage !== "fechado_perdido")
        .reduce((s, d) => s + Number(d.value_brl || 0), 0),
    [deals]
  );

  return (
    <>
      <Helmet>
        <title>Sales Pipeline — CRM Funil | Clauthor</title>
        <meta
          name="description"
          content="Visual sales pipeline (Kanban) for commercial deals with drag-and-drop stages, values and integrated AI closer suggestions."
        />
      </Helmet>

      <div className="h-full flex flex-col p-4 sm:p-6 gap-4 overflow-hidden">
        <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Funil Comercial</h1>
            <p className="text-xs text-muted-foreground">
              Pipeline de vendas · Arraste os cards entre as colunas
            </p>
          </div>
          <div className="rounded-lg border border-border px-3 py-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pipeline aberto</p>
            <p className="text-sm font-semibold text-primary">{BRL(totalPipeline)}</p>
          </div>
        </header>

        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 h-full pb-2">
            {STAGES.map((s) => (
              <StageColumn key={s.key} stage={s} deals={byStage[s.key]} />
            ))}
          </div>
        </div>

        {dealsQuery.isLoading && (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        )}
      </div>
    </>
  );
}
