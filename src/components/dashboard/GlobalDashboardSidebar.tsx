import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Inbox, Clapperboard, Scissors, Activity, Brain,
  Layers3, Bot, CheckSquare, BarChart3, Plug, Settings, Radar,
} from "lucide-react";
import DashboardSidebar, { SidebarItem } from "./DashboardSidebar";
import { useBeginnerMode, BEGINNER_ALLOWED_IDS } from "@/hooks/useBeginnerMode";


/**
 * Sidebar global usado em todas as rotas do dashboard EXCETO /dashboard.
 * Espelha o menu principal do ClientDashboard para manter paridade em todas as páginas.
 * - Rotas dedicadas: navegam via URL (route:/...)
 * - Seções do Command Center: navegam via /dashboard?tab=<section>
 */
export default function GlobalDashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const zoneWork = "Meu trabalho";
  const zoneTeam = "Meu time";
  const zoneAI = "IA & Voz";
  const zoneConfig = "Configuração";

  const items: SidebarItem[] = useMemo(() => ([
    // Meu trabalho
    { id: "tab:overview",             label: "Command Center",     icon: LayoutDashboard, group: zoneWork },
    {
      id: "tab:workspace", label: "Workspace", icon: Layers3, group: zoneWork,
      children: [
        { id: "tab:productivity",     label: "Produtividade",      icon: Layers3 },
        { id: "tab:intelligence-hub", label: "Inteligência",       icon: BarChart3 },
        { id: "tab:media",            label: "Mídia",              icon: LayoutDashboard },
        { id: "tab:approvals",        label: "Central de Aprovações", icon: CheckSquare },
      ],
    },
    { id: "route:/dashboard/inbox",   label: "Inbox do Agente",    icon: Inbox,        group: zoneWork },
    { id: "route:/video-studio",      label: "Video Studio",       icon: Clapperboard, group: zoneWork },
    { id: "route:/video-clipper",     label: "Auto-Clipper",       icon: Scissors,     group: zoneWork },
    { id: "route:/dashboard/traces",  label: "Traces",             icon: Activity,     group: zoneWork },

    // Meu time
    { id: "tab:agents",               label: "Meus Agentes",       icon: Bot,          group: zoneTeam },
    { id: "tab:squads",                label: "Squads",             icon: Layers3,      group: zoneTeam },

    // IA & Voz
    {
      id: "tab:omnix", label: "THOR", icon: Brain, group: zoneAI,
      children: [
        { id: "tab:omnix",       label: "Chat",     icon: Brain },
        { id: "tab:thor-center", label: "Overview", icon: Radar },
      ],
    },

    // Configuração
    {
      id: "tab:system", label: "Sistema", icon: Settings, group: zoneConfig,
      children: [
        { id: "tab:integrations", label: "Integrações",       icon: Plug },
        { id: "tab:system",       label: "Operações & Config", icon: Settings },
      ],
    },
  ]), []);

  const activeItem = useMemo(() => {
    const match = items.find((it) => {
      if (it.id.startsWith("route:")) {
        const path = it.id.replace(/^route:/, "").split("?")[0];
        return location.pathname === path;
      }
      return false;
    });
    return match?.id ?? "";
  }, [items, location.pathname]);

  const handleNav = (id: string) => {
    if (id.startsWith("route:")) {
      navigate(id.replace("route:", ""));
    } else if (id.startsWith("tab:")) {
      const tab = id.replace("tab:", "");
      navigate(`/dashboard?tab=${encodeURIComponent(tab)}`);
    }
  };

  return <DashboardSidebar items={items} activeItem={activeItem} onItemChange={handleNav} />;
}
