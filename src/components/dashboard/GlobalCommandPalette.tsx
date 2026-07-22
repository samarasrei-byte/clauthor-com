import { useEffect, useState } from "react";
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
} from "lucide-react";

type Item = {
  label: string;
  hint?: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  keywords?: string;
};

const ITEMS: Item[] = [
  { label: "Painel", path: "/dashboard", icon: Home, group: "Navegação" },
  { label: "Meus arquivos", path: "/dashboard/arquivos", icon: FolderOpen, group: "Navegação" },
  { label: "Inbox unificado", path: "/dashboard/inbox", icon: Inbox, group: "Navegação", keywords: "whatsapp linkedin instagram mensagens" },
  { label: "Kanban", path: "/dashboard/kanban", icon: Kanban, group: "Navegação", keywords: "tarefas board" },
  { label: "Video Studio", path: "/video-studio", icon: Clapperboard, group: "Navegação", keywords: "veo vídeo geração" },
  { label: "Rastros de execução", path: "/dashboard/traces", icon: Activity, group: "Navegação" },

  { label: "Meus departamentos", path: "/meus-departamentos", icon: Building2, group: "Time" },
  { label: "Meus squads", path: "/meus-squads", icon: Users, group: "Time" },
  { label: "Meus agentes", path: "/agents", icon: Bot, group: "Time" },

  { label: "Catálogo · Departamentos", path: "/departamentos", icon: Building2, group: "Catálogo" },
  { label: "Catálogo · Squads", path: "/squads", icon: Users, group: "Catálogo" },
  { label: "Marketplace", path: "/marketplace", icon: Sparkles, group: "Catálogo" },

  { label: "Criar agente", path: "/create-agent", icon: Sparkles, group: "Ações", keywords: "novo wizard" },
  { label: "Integrações", path: "/integrations", icon: Plug, group: "Ações" },
  { label: "Falar com Thor", path: "/thor", icon: MessageSquare, group: "Ações" },
  { label: "Preços", path: "/pricing", icon: FileText, group: "Ações" },
];

export default function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const groups = Array.from(new Set(ITEMS.map((i) => i.group)));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar página, ação ou agente…" />
      <CommandList>
        <CommandEmpty>
          <div className="flex items-center gap-2 justify-center py-6 text-sm text-muted-foreground">
            <Search className="h-4 w-4" /> Nada encontrado.
          </div>
        </CommandEmpty>
        {groups.map((g, idx) => (
          <div key={g}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={g}>
              {ITEMS.filter((i) => i.group === g).map((i) => {
                const Icon = i.icon;
                return (
                  <CommandItem
                    key={i.path + i.label}
                    value={`${i.label} ${i.keywords ?? ""} ${i.group}`}
                    onSelect={() => go(i.path)}
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
