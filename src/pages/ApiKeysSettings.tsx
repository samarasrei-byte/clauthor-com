import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Copy,
  KeyRound,
  Plus,
  RotateCw,
  Trash2,
  Check,
  ShieldAlert,
  Loader2,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  plan: "free" | "paid";
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  total_calls: number;
  created_at: string;
  revoked_at: string | null;
};

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-api-keys`;

function relativeTime(iso: string | null): string {
  if (!iso) return "Nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function ApiKeysSettings() {
  const { user, isLoading: authLoading } = useAuth();
  useEffect(() => { document.title = "API Keys · CLAUTHOR"; }, []);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<"free" | "paid">("free");
  const [submitting, setSubmitting] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ value: string; mode: "created" | "rotated" } | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<ApiKey | null>(null);
  const [confirmRotate, setConfirmRotate] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  async function authedFetch(url: string, init: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão expirada. Faça login novamente.");
    return fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...(init.headers || {}),
      },
    });
  }

  async function loadKeys() {
    setLoading(true);
    try {
      const res = await authedFetch(FN_URL);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao carregar");
      setKeys(json.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) loadKeys();
  }, [authLoading, user]);

  async function handleCreate() {
    if (!name.trim()) { toast.error("Dê um nome para a chave"); return; }
    setSubmitting(true);
    try {
      const res = await authedFetch(FN_URL, {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), plan }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao criar");
      setRevealedKey({ value: json.data.key, mode: "created" });
      setCreateOpen(false);
      setName("");
      setPlan("free");
      await loadKeys();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRotate(key: ApiKey) {
    setSubmitting(true);
    try {
      const res = await authedFetch(`${FN_URL}?id=${key.id}&action=rotate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao rotacionar");
      setRevealedKey({ value: json.data.key, mode: "rotated" });
      setConfirmRotate(null);
      await loadKeys();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(key: ApiKey) {
    setSubmitting(true);
    try {
      const res = await authedFetch(`${FN_URL}?id=${key.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao revogar");
      toast.success("Chave revogada");
      setConfirmRevoke(null);
      await loadKeys();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyKey(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Chave copiada");
    setTimeout(() => setCopied(false), 1800);
  }

  const activeKeys = keys.filter(k => k.is_active);
  const revokedKeys = keys.filter(k => !k.is_active);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-12 gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">API Keys</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
              Crie chaves para acessar a API CLAUTHOR de forma programática. Cada chave é exibida
              uma única vez — guarde em local seguro.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nova chave
          </Button>
        </div>

        {/* Empty / loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <KeyRound className="w-10 h-10 mx-auto text-muted-foreground/60 mb-4" />
            <h3 className="text-base font-medium">Nenhuma chave criada</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">
              Crie sua primeira chave para integrar a API CLAUTHOR ao seu sistema.
            </p>
            <Button onClick={() => setCreateOpen(true)} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Criar primeira chave
            </Button>
          </Card>
        ) : (
          <>
            {/* Active */}
            <section className="space-y-2">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-3 px-1">
                Ativas · {activeKeys.length}
              </h2>
              {activeKeys.map((k) => (
                <KeyRow
                  key={k.id}
                  apiKey={k}
                  onRotate={() => setConfirmRotate(k)}
                  onRevoke={() => setConfirmRevoke(k)}
                />
              ))}
              {activeKeys.length === 0 && (
                <p className="text-sm text-muted-foreground px-1 py-4">Nenhuma chave ativa.</p>
              )}
            </section>

            {/* Revoked */}
            {revokedKeys.length > 0 && (
              <section className="space-y-2 mt-12">
                <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-3 px-1">
                  Revogadas · {revokedKeys.length}
                </h2>
                {revokedKeys.map((k) => (
                  <KeyRow key={k.id} apiKey={k} revoked />
                ))}
              </section>
            )}
          </>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova API Key</DialogTitle>
            <DialogDescription>
              Identifique a chave por um nome. Você verá o valor completo uma única vez após criar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="key-name">Nome</Label>
              <Input
                id="key-name"
                placeholder="Ex: Produção · Backend Vendas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-plan">Plano</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as "free" | "paid")}>
                <SelectTrigger id="key-plan"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free · 60 req/min</SelectItem>
                  <SelectItem value="paid">Paid · 600 req/min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !name.trim()}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar chave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal new key (one-time) */}
      <Dialog open={!!revealedKey} onOpenChange={(o) => !o && setRevealedKey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              {revealedKey?.mode === "rotated" ? "Chave rotacionada" : "Chave criada"}
            </DialogTitle>
            <DialogDescription>
              {revealedKey?.mode === "rotated"
                ? "A chave anterior foi revogada. Atualize seus sistemas com este novo valor."
                : "Copie agora. Por segurança, não é possível visualizar este valor novamente."}
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <div className="rounded-md border bg-muted/40 px-4 py-3 font-mono text-sm break-all select-all">
              {revealedKey?.value}
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <EyeOff className="w-3.5 h-3.5" /> Não será exibida novamente
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => revealedKey && copyKey(revealedKey.value)} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button onClick={() => setRevealedKey(null)}>Entendi</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm rotate */}
      <AlertDialog open={!!confirmRotate} onOpenChange={(o) => !o && setConfirmRotate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotacionar “{confirmRotate?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              A chave atual será <strong>revogada imediatamente</strong> e uma nova será gerada com o
              mesmo nome e plano. Sistemas que ainda usam a chave antiga deixarão de funcionar até
              receberem o novo valor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmRotate && handleRotate(confirmRotate); }}
              disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Rotacionar agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm revoke */}
      <AlertDialog open={!!confirmRevoke} onOpenChange={(o) => !o && setConfirmRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar “{confirmRevoke?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>permanente</strong>. A chave deixará de funcionar imediatamente em
              todas as integrações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmRevoke && handleRevoke(confirmRevoke); }}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KeyRow({
  apiKey,
  revoked,
  onRotate,
  onRevoke,
}: {
  apiKey: ApiKey;
  revoked?: boolean;
  onRotate?: () => void;
  onRevoke?: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-4 px-4 py-3.5 rounded-lg border bg-card transition-colors ${
        revoked ? "opacity-60" : "hover:border-foreground/20"
      }`}
    >
      <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
        revoked ? "bg-muted" : "bg-primary/10"
      }`}>
        <KeyRound className={`w-4 h-4 ${revoked ? "text-muted-foreground" : "text-primary"}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">{apiKey.name}</span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-medium">
            {apiKey.plan}
          </Badge>
          {revoked && (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground">
              revogada
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          <span className="font-mono">{apiKey.key_prefix}…</span>
          <span>·</span>
          <span>{apiKey.total_calls.toLocaleString("pt-BR")} chamadas</span>
          <span>·</span>
          <span>Último uso: {relativeTime(apiKey.last_used_at)}</span>
        </div>
      </div>

      {!revoked && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onRotate} className="h-8 w-8">
                  <RotateCw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rotacionar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onRevoke} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Revogar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
