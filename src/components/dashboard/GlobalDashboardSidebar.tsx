import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Inbox, Clapperboard, Scissors, Activity, Brain,
} from "lucide-react";
import DashboardSidebar, { SidebarItem } from "./DashboardSidebar";

/**
 * Sidebar global usado em todas as rotas do dashboard EXCETO /dashboard
 * (essa rota já monta seu próprio sidebar com estado de "sections").
 * Navegação aqui é sempre por URL — mantém a paridade visual com o menu principal.
 */
export default function GlobalDashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items: SidebarItem[] = useMemo(() => ([
    { id: "route:/dashboard",          label: "Command Center",  icon: LayoutDashboard, group: "Meu trabalho" },
    { id: "route:/dashboard/inbox",    label: "Inbox do Agente", icon: Inbox,           group: "Meu trabalho" },
    { id: "route:/video-studio",       label: "Video Studio",    icon: Clapperboard,    group: "Meu trabalho" },
    { id: "route:/video-clipper",      label: "Auto-Clipper",    icon: Scissors,        group: "Meu trabalho" },
    { id: "route:/dashboard/traces",   label: "Traces",          icon: Activity,        group: "Meu trabalho" },
    { id: "route:/dashboard?tab=omnix",label: "IA & Voz (THOR)", icon: Brain,           group: "IA & Voz" },
  ]), []);

  const activeItem = useMemo(() => {
    const match = items.find((it) => {
      const url = it.id.replace(/^route:/, "");
      const path = url.split("?")[0];
      return location.pathname === path;
    });
    return match?.id ?? "";
  }, [items, location.pathname]);

  const handleNav = (id: string) => {
    if (id.startsWith("route:")) navigate(id.replace("route:", ""));
  };

  return <DashboardSidebar items={items} activeItem={activeItem} onItemChange={handleNav} />;
}
