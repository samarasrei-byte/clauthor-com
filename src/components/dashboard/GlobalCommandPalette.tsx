import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Inbox,
  Users,
  Building2,
  Sparkles,
  Clapperboard,
  FileText,
  Kanban,
  Plug,
  Bot,
  MessageSquare,
  Activity,
  FolderOpen,
  Search,
  PauseCircle,
  PlayCircle,
  Plus,
  LogOut,
  Video,
  Target,
  Phone,
  Upload,
  Moon,
  Sun,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { trackKpi } from "@/lib/kpiTracker";

type StaticItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  keywords?: string;
};

const STATIC_ITEMS: StaticItem[] = [
  // ── Criar (ações rápidas) ──
  { label: "Novo vídeo (Veo 3)", path: "/video-studio?new=1", icon: Video, group: "Criar", keywords: "gerar video veo3 clip" },
  { label: "Nova campanha Hunter", path: "/dashboard/hunter?new=1", icon: Target, group: "Criar", keywords: "prospeccao linkedin lead outbound" },
  { label: "Novo agente", path: "/create-agent", icon: Plus, group: "Criar", keywords: "wizard criar bot" },
  { label: "Nova conversa WhatsApp", path: "/dashboard/whatsapp?new=1", icon: Phone, group: "Criar", keywords: "mensagem chat zap" },
  { label: "Falar com Thor", path: "/thor", icon: MessageSquare, group: "Criar", keywords: "chat copiloto assistente ia voz elevenlabs" },
  { label: "Enviar arquivo", path: "/dashboard/arquivos?upload=1", icon: Upload, group: "Criar", keywords: "upload documento imagem video" },

  // ── Navegação ──
  { label: "Painel", path: "/dashboard", icon: Home, group: "Navegação" },
  { label: "Meus arquivos", path: "/dashboard/arquivos", icon: FolderOpen, group: "Navegação" },
  { label: "Inbox unificado", path: "/dashboard/inbox", icon: Inbox, group: "Navegação", keywords: "whatsapp linkedin instagram mensagens" },
  { label: "Kanban", path: "/dashboard/kanban", icon: Kanban, group: "Navegação", keywords: "tarefas board" },
  { label: "Video Studio", path: "/video-studio", icon: Clapperboard, group: "Navegação", keywords: "veo vídeo geração" },
  { label: "Rastros de execução", path: "/dashboard/traces", icon: Activity, group: "Navegação" },

  // ── Time ──
  { label: "Meus departamentos", path: "/meus-departamentos", icon: Building2, group: "Time" },
  { label: "Meus squads", path: "/meus-squads", icon: Users, group: "Time" },
  { label: "Meus agentes", path: "/agents", icon: Bot, group: "Time" },

  // ── Catálogo ──
  { label: "Catálogo · Departamentos", path: "/departamentos", icon: Building2, group: "Catálogo" },
  { label: "Catálogo · Squads", path: "/squads", icon: Users, group: "Catálogo" },
  { label: "Marketplace", path: "/marketplace", icon: Sparkles, group: "Catálogo" },

  // ── Configurações ──
  { label: "Integrações", path: "/integrations", icon: Plug, group: "Configurações", keywords: "conectar redes sociais api" },
  { label: "Preços", path: "/pricing", icon: FileText, group: "Configurações" },
];

type UserAgent = { id: string; name: string; status: string | null };
type UserDept = { id: string; department_name: string; status: string | null };

export default function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [agents, setAgents] = useState<UserAgent[]>([]);
  const [departments, setDepartments] = useState<UserDept[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    const onOpen = () => setOpen(true);
    window.addEventListener("cmdk:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cmdk:open", onOpen);
    };
  }, []);

  const { signOut } = useAuth();
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("theme", isDark ? "dark" : "light"); } catch { /* noop */ }
    trackKpi("cmdk_selected", { target: "panel", label: `theme:${isDark ? "dark" : "light"}` });
    setOpen(false);
  };
  const doSignOut = async () => {
    trackKpi("cmdk_selected", { target: "panel", label: "signout" });
    setOpen(false);
    await signOut();
  };

  // KPI: track opens
  useEffect(() => {
    if (open) trackKpi("cmdk_opened", {});
  }, [open]);

  // Fetch user's real agents + departments when palette opens
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      const [{ data: ag }, { data: dp }] = await Promise.all([
        supabase.from("agents").select("id, name, status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("contracted_departments").select("id, department_name, status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      ]);
      if (cancelled) return;
      setAgents((ag ?? []) as UserAgent[]);
      setDepartments((dp ?? []) as UserDept[]);
    })();
    return () => { cancelled = true; };
  }, [open, user]);

  const go = (path: string, label: string) => {
    trackKpi("cmdk_selected", { target: "panel", label });
    setOpen(false);
    navigate(path);
  };

  const toggleAgent = async (agent: UserAgent) => {
    const nextStatus = agent.status === "paused" ? "active" : "paused";
    trackKpi("cmdk_selected", { target: "panel", label: `${nextStatus}:agent:${agent.name}` });
    setOpen(false);
    const { error } = await supabase.from("agents").update({ status: nextStatus }).eq("id", agent.id);
    if (error) {
      toast({ title: "Falha ao atualizar agente", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: nextStatus === "paused" ? "Agente pausado" : "Agente ativado", description: agent.name });
  };

  const toggleDept = async (dept: UserDept) => {
    const nextStatus = dept.status === "paused" ? "active" : "paused";
    trackKpi("cmdk_selected", { target: "panel", label: `${nextStatus}:dept:${dept.department_name}` });
    setOpen(false);
    const { error } = await supabase.from("contracted_departments").update({ status: nextStatus }).eq("id", dept.id);
    if (error) {
      toast({ title: "Falha ao atualizar departamento", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: nextStatus === "paused" ? "Departamento pausado" : "Departamento ativado", description: dept.department_name });
  };

  const groups = useMemo(() => Array.from(new Set(STATIC_ITEMS.map((i) => i.group))), []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar página, agente, departamento ou ação…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>
          <div className="flex items-center gap-2 justify-center py-6 text-sm text-muted-foreground">
            <Search className="h-4 w-4" /> Nada encontrado.
          </div>
        </CommandEmpty>

        {agents.length > 0 && (
          <>
            <CommandGroup heading="Meus agentes">
              {agents.map((a) => {
                const paused = a.status === "paused";
                return (
                  <div key={a.id} className="contents">
                    <CommandItem
                      value={`agente abrir ${a.name}`}
                      onSelect={() => go(`/agents/${a.id}`, `open:agent:${a.name}`)}
                    >
                      <Bot className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Abrir · {a.name}</span>
                      <span className="ml-auto text-[11px] text-muted-foreground/70">{a.status ?? "—"}</span>
                    </CommandItem>
                    <CommandItem
                      value={`${paused ? "ativar" : "pausar"} agente ${a.name}`}
                      onSelect={() => toggleAgent(a)}
                    >
                      {paused ? <PlayCircle className="mr-2 h-4 w-4 text-muted-foreground" /> : <PauseCircle className="mr-2 h-4 w-4 text-muted-foreground" />}
                      <span>{paused ? "Ativar" : "Pausar"} · {a.name}</span>
                    </CommandItem>
                  </div>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {departments.length > 0 && (
          <>
            <CommandGroup heading="Meus departamentos">
              {departments.map((d) => {
                const paused = d.status === "paused";
                return (
                  <div key={d.id} className="contents">
                    <CommandItem
                      value={`departamento abrir ${d.department_name}`}
                      onSelect={() => go(`/departamento-ativo/${d.id}`, `open:dept:${d.department_name}`)}
                    >
                      <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Abrir · {d.department_name}</span>
                      <span className="ml-auto text-[11px] text-muted-foreground/70">{d.status ?? "—"}</span>
                    </CommandItem>
                    <CommandItem
                      value={`${paused ? "ativar" : "pausar"} departamento ${d.department_name}`}
                      onSelect={() => toggleDept(d)}
                    >
                      {paused ? <PlayCircle className="mr-2 h-4 w-4 text-muted-foreground" /> : <PauseCircle className="mr-2 h-4 w-4 text-muted-foreground" />}
                      <span>{paused ? "Ativar" : "Pausar"} · {d.department_name}</span>
                    </CommandItem>
                  </div>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {groups.map((g, idx) => (
          <div key={g}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={g}>
              {STATIC_ITEMS.filter((i) => i.group === g).map((i) => {
                const Icon = i.icon;
                return (
                  <CommandItem
                    key={i.path + i.label}
                    value={`${i.label} ${i.keywords ?? ""} ${i.group}`}
                    onSelect={() => go(i.path, i.label)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{i.label}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground/70">
                      {i.path}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
