import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit3, Trash2, Save, X, Building2, FileText, DollarSign, Users, Target, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notify, toastWithUndo } from "@/lib/notify";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface BoardItem {
  id: string;
  category: string;
  title: string;
  content: string;
  updated_at: string;
}

const categories = [
  { id: "geral", label: "Geral", icon: Building2, color: "bg-primary/15 text-primary" },
  { id: "financeiro", label: "Financeiro", icon: DollarSign, color: "bg-accent-emerald/15 text-accent-emerald" },
  { id: "equipe", label: "Equipe", icon: Users, color: "bg-accent-blue/15 text-accent-blue" },
  { id: "metas", label: "Metas", icon: Target, color: "bg-accent-violet/15 text-accent-violet" },
  { id: "produtos", label: "Produtos/Serviços", icon: Briefcase, color: "bg-warning/15 text-warning" },
  { id: "docs", label: "Documentos", icon: FileText, color: "bg-muted text-muted-foreground" },
];

const CompanyBoard = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ category: "geral", title: "", content: "" });
  const [editItem, setEditItem] = useState({ title: "", content: "" });
  const [filterCat, setFilterCat] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadItems();
  }, [user]);

  const loadItems = async () => {
    const { data, error } = await supabase
      .from("company_board")
      .select("*")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  const addItem = async () => {
    if (!newItem.title.trim()) return;
    const { error } = await supabase.from("company_board").insert({
      user_id: user!.id,
      category: newItem.category,
      title: newItem.title.trim(),
      content: newItem.content.trim(),
    });
    if (!error) {
      notify.success("Informação adicionada ao board");
      setAdding(false);
      setNewItem({ category: "geral", title: "", content: "" });
      loadItems();
    } else notify.danger("Erro ao salvar");
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from("company_board")
      .update({ title: editItem.title, content: editItem.content })
      .eq("id", id);
    if (!error) {
      notify.success("Atualizado");
      setEditing(null);
      loadItems();
    } else {
      notify.danger("Não foi possível atualizar");
    }
  };

  const deleteItem = async (id: string) => {
    const removed = items.find(i => i.id === id);
    if (!removed) return;
    // Optimistic remove
    setItems(prev => prev.filter(i => i.id !== id));
    const { error } = await supabase.from("company_board").delete().eq("id", id);
    if (error) {
      setItems(prev => [removed, ...prev]);
      notify.danger("Falha ao remover", { description: error.message });
      return;
    }
    toastWithUndo({
      message: "Item removido do board",
      description: removed.title,
      onUndo: async () => {
        const { error: undoErr } = await supabase.from("company_board").insert({
          id: removed.id,
          user_id: user!.id,
          category: removed.category,
          title: removed.title,
          content: removed.content,
        });
        if (undoErr) {
          notify.danger("Não foi possível restaurar");
          return;
        }
        loadItems();
      },
    });
  };

  const filtered = filterCat ? items.filter(i => i.category === filterCat) : items;
  const getCat = (id: string) => categories.find(c => c.id === id) || categories[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Board da Empresa</h2>
          <p className="text-sm text-muted-foreground">Informações que seus agentes podem acessar para tomar decisões</p>
        </div>
        <Button onClick={() => setAdding(true)} className="glow gap-1.5">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Badge
          variant={filterCat === null ? "default" : "secondary"}
          className="cursor-pointer shrink-0"
          onClick={() => setFilterCat(null)}
        >
          Todos ({items.length})
        </Badge>
        {categories.map(cat => {
          const count = items.filter(i => i.category === cat.id).length;
          return (
            <Badge
              key={cat.id}
              variant={filterCat === cat.id ? "default" : "secondary"}
              className={`cursor-pointer shrink-0 ${filterCat !== cat.id ? cat.color : ""}`}
              onClick={() => setFilterCat(filterCat === cat.id ? null : cat.id)}
            >
              <cat.icon className="h-3 w-3 mr-1" /> {cat.label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Nova Informação</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAdding(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Badge
                  key={cat.id}
                  variant={newItem.category === cat.id ? "default" : "secondary"}
                  className={`cursor-pointer ${newItem.category !== cat.id ? cat.color : ""}`}
                  onClick={() => setNewItem({ ...newItem, category: cat.id })}
                >
                  <cat.icon className="h-3 w-3 mr-1" /> {cat.label}
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Título (ex: Faturamento mensal, Meta Q1...)"
              value={newItem.title}
              onChange={e => setNewItem({ ...newItem, title: e.target.value })}
              className="bg-card border-border"
            />
            <textarea
              placeholder="Conteúdo detalhado que os agentes poderão consultar..."
              value={newItem.content}
              onChange={e => setNewItem({ ...newItem, content: e.target.value })}
              rows={4}
              className="w-full rounded-xl bg-card border border-border p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button onClick={addItem} className="glow gap-1.5">
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Ensine a IA sobre a sua empresa"
          description="Adicione dados de finanças, equipe, metas e produtos. Os agentes usam esse contexto pra tomar decisões alinhadas ao seu negócio."
          action={{
            label: "Adicionar primeira informação",
            icon: Plus,
            onClick: () => setAdding(true),
          }}
          hint="Comece pelo básico: nome fantasia, principal produto/serviço e meta do trimestre. Você refina depois."
          size="lg"
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((item, i) => {
            const cat = getCat(item.category);
            const isEditing = editing === item.id;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <Badge variant="secondary" className={`text-[10px] ${cat.color}`}>
                    <cat.icon className="h-2.5 w-2.5 mr-1" /> {cat.label}
                  </Badge>
                  <div className="flex gap-1">
                    {isEditing ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => saveEdit(item.id)}>
                          <Save className="h-3.5 w-3.5 text-accent-emerald" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item.id); setEditItem({ title: item.title, content: item.content }); }}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <>
                    <Input value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} className="bg-card border-border" />
                    <textarea
                      value={editItem.content}
                      onChange={e => setEditItem({ ...editItem, content: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl bg-card border border-border p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </>
                ) : (
                  <>
                    <h4 className="font-display font-semibold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{item.content}</p>
                  </>
                )}
                <p className="text-[10px] text-muted-foreground/60">
                  Updated: {new Date(item.updated_at).toLocaleDateString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyBoard;
