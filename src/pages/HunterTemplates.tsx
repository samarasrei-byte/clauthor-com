import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Template { id: string; nome: string; tipo: string; conteudo: string; ativo: boolean; }

const TIPOS = ["nota_conexao", "mensagem1", "mensagem2", "break_up"];

const previewTemplate = (conteudo: string) =>
  conteudo
    .replace(/\{\{nome\}\}/g, "João")
    .replace(/\{\{cargo\}\}/g, "CTO")
    .replace(/\{\{empresa\}\}/g, "TechCorp")
    .replace(/\{\{icebreaker\}\}/g, "Vi seu post sobre IA. Muito bom!");

const HunterTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "nota_conexao", conteudo: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("hunter_templates").select("*").eq("user_id", user.id).order("tipo");
    setTemplates((data as Template[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const createTemplate = async () => {
    if (!user || !form.nome.trim()) return;
    setSaving(true);
    await supabase.from("hunter_templates").insert({ user_id: user.id, ...form });
    toast.success("Template criado");
    setDialogOpen(false);
    setForm({ nome: "", tipo: "nota_conexao", conteudo: "" });
    setSaving(false);
    load();
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("hunter_templates").delete().eq("id", id);
    toast.success("Template removido");
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const grouped = TIPOS.map(t => ({ tipo: t, items: templates.filter(tpl => tpl.tipo === t) }));

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Template</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Minha nota de conexão" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea rows={4} value={form.conteudo} onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))} placeholder="Oi {{nome}}, vi que você é {{cargo}} na {{empresa}}..." />
                <p className="text-xs text-muted-foreground">Variáveis: {"{{nome}}"}, {"{{cargo}}"}, {"{{empresa}}"}, {"{{icebreaker}}"}</p>
              </div>
              {form.conteudo && (
                <div className="space-y-1">
                  <Label className="text-xs">Preview</Label>
                  <p className="text-sm bg-muted/50 p-3 rounded italic text-muted-foreground">{previewTemplate(form.conteudo)}</p>
                </div>
              )}
              <Button className="w-full" onClick={createTemplate} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Criar Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {grouped.map(g => (
        <div key={g.tipo} className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground capitalize">{g.tipo.replace(/_/g, " ")}</h2>
          {g.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum template deste tipo</p>
          ) : (
            g.items.map(t => (
              <Card key={t.id}>
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{t.nome}</p>
                    <p className="text-sm text-muted-foreground font-mono mt-1">{t.conteudo}</p>
                    <p className="text-xs text-muted-foreground/60 mt-2 italic">Preview: {previewTemplate(t.conteudo)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteTemplate(t.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ))}
    </div>
  );
};

export default HunterTemplates;
