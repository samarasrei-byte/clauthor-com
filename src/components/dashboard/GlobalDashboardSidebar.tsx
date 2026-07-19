import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Inbox, Clapperboard, Scissors, Activity, Brain,
  Layers3, Bot, CheckSquare, BarChart3, Plug, Settings, Radar, Building2,
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
  const [beginner] = useBeginnerMode();


  const zoneWork = "Meu trabalho";
  const zoneTeam = "Meu time";
  const zoneAI = "IA & Voz";
  const zoneConfig = "Configuração";

  const items: SidebarItem[] = useMemo(() => ([
    // Meu trabalho
    { id: "tab:overview",             label: "Command Center",     icon: LayoutDashboard, group: zoneWork },
    {
      id: "tab:workspace", label: "Área de trabalho", icon: Layers3, group: zoneWork,
      children: [
        { id: "tab:productivity",     label: "Produtividade",      icon: Layers3 },
        { id: "tab:intelligence-hub", label: "Inteligência",       icon: BarChart3 },
        { id: "tab:media",            label: "Mídia",              icon: LayoutDashboard },
        { id: "tab:approvals",        label: "Central de Aprovações", icon: CheckSquare },
      ],
    },
    { id: "route:/dashboard/inbox",   label: "Inbox do Agente",    icon: Inbox,        group: zoneWork },
    { id: "route:/video",             label: "Video Hub",          icon: Clapperboard, group: zoneWork },
    { id: "route:/dashboard/traces",  label: "Rastros de execução",icon: Activity,     group: zoneWork },


    // Meu time — hierarquia: Agentes (individual) → Squads (times) → Departamentos (unidade cobrada)
    { id: "tab:agents",                label: "Meus Agentes",       icon: Bot,          group: zoneTeam },
    { id: "tab:squads",                label: "Squads",             icon: Layers3,      group: zoneTeam },
    { id: "route:/departamentos",      label: "Departamentos",      icon: Building2,    group: zoneTeam },

    // IA & Voz
    {
      id: "tab:omnix", label: "THOR", icon: Brain, group: zoneAI,
      children: [
        { id: "tab:omnix",       label: "Conversar",  icon: Brain },
        { id: "tab:thor-center", label: "Visão geral", icon: Radar },
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
    // Rotas dedicadas: match por pathname.
    const routeMatch = items.find((it) => {
      if (!it.id.startsWith("route:")) return false;
      const path = it.id.replace(/^route:/, "").split("?")[0];
      return location.pathname === path;
    });
    if (routeMatch) return routeMatch.id;
    // No /dashboard, refletir o ?tab= atual (default overview).
    if (location.pathname === "/dashboard") {
      const params = new URLSearchParams(location.search);
      const tab = params.get("tab") || "overview";
      return `tab:${tab}`;
    }
    return "";
  }, [items, location.pathname, location.search]);

  const handleNav = (id: string) => {
    if (id.startsWith("route:")) {
      navigate(id.replace("route:", ""));
    } else if (id.startsWith("tab:")) {
      const tab = id.replace("tab:", "");
      navigate(`/dashboard?tab=${encodeURIComponent(tab)}`);
    }
  };

  const visibleItems = useMemo(() => (
    beginner ? items.filter((it) => BEGINNER_ALLOWED_IDS.has(it.id)) : items
  ), [items, beginner]);

  return <DashboardSidebar items={visibleItems} activeItem={activeItem} onItemChange={handleNav} />;
}

