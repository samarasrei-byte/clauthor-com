import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Inbox, Clapperboard, Scissors, Activity, Brain,
  Layers3, Bot, CheckSquare, BarChart3, Plug, Settings, Radar, Building2, UsersRound,
  FolderOpen,
} from "lucide-react";
import DashboardSidebar, { SidebarItem } from "./DashboardSidebar";
import { useBeginnerMode, BEGINNER_ALLOWED_IDS } from "@/hooks/useBeginnerMode";
import { useModuleAccess } from "@/hooks/useModuleAccess";


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
  const videoAccess = useModuleAccess("video");
  const videoLocked = !videoAccess.loading && !videoAccess.hasAccess;


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
        { id: "route:/dashboard/traces", label: "Rastros de execução", icon: Activity },
      ],
    },
    { id: "route:/dashboard/inbox",   label: "Inbox do Agente",    icon: Inbox,        group: zoneWork },
    { id: "route:/dashboard/arquivos", label: "Meus arquivos", icon: FolderOpen, group: zoneWork },
    { id: "route:/video",             label: "Video Hub",          icon: Clapperboard, group: zoneWork, locked: videoLocked, badge: videoLocked ? "Premium" : undefined },


    // Meu time · 2 pais dobráveis: Agentes / Time (Squads + Departamentos unificados)
    {
      id: "tab:agents", label: "Agentes", icon: Bot, group: zoneTeam,
      children: [
        { id: "tab:agents",              label: "Meus agentes",  icon: Bot },
        { id: "route:/create-agent",     label: "Criar agente",  icon: Bot },
      ],
    },
    {
      id: "route:/meus-departamentos", label: "Time", icon: Building2, group: zoneTeam,
      children: [
        { id: "route:/meus-departamentos",         label: "Meus departamentos", icon: Building2 },
        { id: "route:/meus-squads",                label: "Meus squads",        icon: UsersRound },
        ...(beginner ? [] : [{ id: "route:/dashboard/departamentos", label: "Catálogo de departamentos", icon: Building2 }]),
        ...(beginner ? [] : [{ id: "route:/dashboard/squads",        label: "Catálogo de squads",         icon: UsersRound }]),
        { id: "route:/dashboard/departamentos",    label: "Contratar novo",     icon: Building2 },
      ],
    },



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
  ]), [videoLocked, beginner]);

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

