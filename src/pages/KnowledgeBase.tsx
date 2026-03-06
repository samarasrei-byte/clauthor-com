import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, Search, Trash2, Edit3, Save, X, FileText,
  FolderOpen, Bot, Filter, Upload, Database, Sparkles, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const CATEGORIES = [
  { value: "general", label: "Geral", icon: "📁" },
  { value: "produto", label: "Produto", icon: "📦" },
  { value: "vendas", label: "Vendas", icon: "💰" },
  { value: "suporte", label: "Suporte", icon: "🎧" },
  { value: "marketing", label: "Marketing", icon: "📢" },
  { value: "financeiro", label: "Financeiro", icon: "📊" },
  { value: "rh", label: "RH", icon: "👥" },
  { value: "juridico", label: "Jurídico", icon: "⚖️" },
  { value: "tecnologia", label: "Tecnologia", icon: "💻" },
  { value: "operacoes", label: "Operações", icon: "⚙️" },
  { value: "faq", label: "FAQ", icon: "❓" },
  { value: "processos", label: "Processos", icon: "📋" },
  { value: "politicas", label: "Políticas", icon: "📜" },
];

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  category: string;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
}

const KnowledgeBase = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: "", content: "", category: "general", agent_id: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: "", content: "", category: "general", agent_id: "" });

  // Fetch tenant_id
  const { data: tenantId } = useQuery({
    queryKey: ["tenant-id", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.rpc("get_user_tenant_id", { _user_id: user.id });
      return data as string;
    },
    enabled: !!user?.id,
  });

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["knowledge-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_documents")
        .select("id, title, content, category, agent_id, created_at, updated_at")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as KnowledgeDoc[];
    },
    enabled: !!user?.id,
  });

  // Fetch user's agents for assignment
  const { data: agents = [] } = useQuery({
    queryKey: ["user-agents-list", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agents")
        .select("id, name")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("name");
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create document
  const createMutation = useMutation({
    mutationFn: async (doc: typeof newDoc) => {
      if (!user?.id || !tenantId) throw new Error("Not authenticated");
      const { error } = await supabase.from("knowledge_documents").insert({
        user_id: user.id,
        tenant_id: tenantId,
        title: doc.title,
        content: doc.content,
        category: doc.category,
        agent_id: doc.agent_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
      setShowCreate(false);
      setNewDoc({ title: "", content: "", category: "general", agent_id: "" });
      toast.success("Documento adicionado à base de conhecimento! 📚");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar documento"),
  });

  // Update document
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title: string; content: string; category: string; agent_id: string }) => {
      const { error } = await supabase
        .from("knowledge_documents")
        .update({ title: data.title, content: data.content, category: data.category, agent_id: data.agent_id || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
      setEditingId(null);
      toast.success("Documento atualizado! ✅");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar"),
  });

  // Delete document
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("knowledge_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
      toast.success("Documento removido da base! 🗑️");
    },
  });

  // Filter documents
  const filtered = documents.filter((doc) => {
    if (categoryFilter !== "all" && doc.category !== categoryFilter) return false;
    if (agentFilter !== "all" && (doc.agent_id || "global") !== agentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q);
    }
    return true;
  });

  const startEdit = (doc: KnowledgeDoc) => {
    setEditingId(doc.id);
    setEditData({ title: doc.title, content: doc.content, category: doc.category, agent_id: doc.agent_id || "" });
  };

  const catLabel = (val: string) => CATEGORIES.find((c) => c.value === val);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-border/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold">Base de Conhecimento</h1>
              <p className="text-xs text-muted-foreground">
                RAG • {documents.length} documentos • Full-Text Search
              </p>
            </div>
          </div>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 rounded-xl">
                <Plus className="h-4 w-4" /> Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Adicionar Documento
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Título do documento"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc((p) => ({ ...p, title: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={newDoc.category} onValueChange={(v) => setNewDoc((p) => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newDoc.agent_id || "global"} onValueChange={(v) => setNewDoc((p) => ({ ...p, agent_id: v === "global" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="Agente" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">🌐 Todos os agentes</SelectItem>
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>🤖 {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Conteúdo do documento... (informações, processos, FAQ, políticas)"
                  value={newDoc.content}
                  onChange={(e) => setNewDoc((p) => ({ ...p, content: e.target.value }))}
                  className="min-h-[200px] resize-y"
                />
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                  Este conteúdo será indexado automaticamente e usado pelos agentes via RAG.
                </div>
                <Button
                  className="w-full rounded-xl"
                  disabled={!newDoc.title.trim() || !newDoc.content.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate(newDoc)}
                >
                  {createMutation.isPending ? "Salvando..." : "Salvar na Base"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-9 rounded-xl">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[160px] h-9 rounded-xl">
              <Bot className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Agente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos agentes</SelectItem>
              <SelectItem value="global">🌐 Global</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>🤖 {a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium mb-1">
              {documents.length === 0 ? "Base de conhecimento vazia" : "Nenhum resultado encontrado"}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {documents.length === 0
                ? "Adicione documentos para que seus agentes possam buscar informações relevantes via RAG."
                : "Tente ajustar os filtros ou a busca."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((doc) => {
                const isEditing = editingId === doc.id;
                const cat = catLabel(doc.category);
                const agentName = agents.find((a) => a.id === doc.agent_id)?.name;

                return (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="p-4 border-border/10 hover:border-primary/20 transition-colors">
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            value={editData.title}
                            onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))}
                            className="font-semibold"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Select value={editData.category} onValueChange={(v) => setEditData((p) => ({ ...p, category: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={editData.agent_id || "global"} onValueChange={(v) => setEditData((p) => ({ ...p, agent_id: v === "global" ? "" : v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="global">🌐 Global</SelectItem>
                                {agents.map((a) => (
                                  <SelectItem key={a.id} value={a.id}>🤖 {a.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Textarea
                            value={editData.content}
                            onChange={(e) => setEditData((p) => ({ ...p, content: e.target.value }))}
                            className="min-h-[150px] resize-y"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4 mr-1" /> Cancelar
                            </Button>
                            <Button
                              size="sm"
                              disabled={updateMutation.isPending}
                              onClick={() => updateMutation.mutate({ id: doc.id, ...editData })}
                            >
                              <Save className="h-4 w-4 mr-1" /> Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <h3 className="font-semibold text-sm truncate">{doc.title}</h3>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                  {cat?.icon} {cat?.label || doc.category}
                                </Badge>
                                {agentName && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                                    <Bot className="h-2.5 w-2.5 mr-0.5" /> {agentName}
                                  </Badge>
                                )}
                                {!doc.agent_id && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 text-muted-foreground">
                                    🌐 Global
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {doc.content}
                              </p>
                              <p className="text-[10px] text-muted-foreground/50 mt-2">
                                Atualizado: {new Date(doc.updated_at).toLocaleDateString("pt-BR")}
                                {" • "}{doc.content.length} caracteres
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(doc)}>
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => deleteMutation.mutate(doc.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="shrink-0 px-6 py-3 border-t border-border/10 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{filtered.length} de {documents.length} documentos</span>
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary" />
          RAG ativo • Full-Text Search em português
        </span>
      </div>
    </div>
  );
};

export default KnowledgeBase;
