import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Inbox, Clapperboard, Scissors, Activity, Brain,
  Layers3, Bot, CheckSquare, BarChart3, Plug, Settings, Radar, Building2, UsersRound,
  FolderOpen, Trello,
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
    { id: "tab:overview", label: "Command Center", icon: LayoutDashboard, group: zoneWork,
      description: "Visão geral do seu dia · KPIs, alertas e próximas ações." },
    {
      id: "tab:workspace", label: "Área de trabalho", icon: Layers3, group: zoneWork,
      description: "Seu ambiente operacional · produtividade, inteligência e aprovações.",
      children: [
        { id: "tab:productivity",     label: "Produtividade",      icon: Layers3,     description: "Tarefas, prazos e execução dos agentes em tempo real." },
        { id: "route:/dashboard/kanban", label: "Kanban", icon: Trello, description: "Quadro visual · arraste tarefas entre estágios, com prioridades, tags e checklist." },
        { id: "tab:intelligence-hub", label: "Inteligência",       icon: BarChart3,   description: "KPIs consolidados e insights gerados pela IA." },
        { id: "tab:media",            label: "Mídia",              icon: LayoutDashboard, description: "Biblioteca de imagens, vídeos e áudios produzidos pelos agentes." },
        { id: "tab:approvals",        label: "Central de Aprovações", icon: CheckSquare, description: "Aprove ou rejeite entregas antes de publicar." },
        { id: "route:/dashboard/traces", label: "Rastros de execução", icon: Activity, description: "Passo a passo do que cada agente executou · auditoria completa." },
      ],
    },
    { id: "route:/dashboard/inbox", label: "Inbox Unificado", icon: Inbox, group: zoneWork,
      description: "LinkedIn, Instagram, WhatsApp, Facebook, TikTok e e-mails em um só lugar." },
    { id: "route:/dashboard/arquivos", label: "Meus arquivos", icon: FolderOpen, group: zoneWork,
      description: "Documentos, vídeos e imagens organizados por projeto." },

    { id: "route:/video", label: "Video Hub", icon: Clapperboard, group: zoneWork,
      description: "Estúdio de vídeo com Veo 3 e corte automático de clipes.",
      locked: videoLocked, badge: videoLocked ? "Premium" : undefined },


    // Meu time
    {
      id: "tab:agents", label: "Agentes", icon: Bot, group: zoneTeam,
      description: "Seus funcionários digitais e criação de novos agentes.",
      children: [
        { id: "tab:agents",              label: "Meus agentes",  icon: Bot, description: "Todos os agentes que você já contratou." },
        { id: "route:/create-agent",     label: "Criar agente",  icon: Bot, description: "Assistente guiado para lançar um novo agente." },
      ],
    },
    {
      id: "route:/meus-departamentos", label: "Time", icon: Building2, group: zoneTeam,
      description: "Departamentos e squads contratados · catálogo para expandir.",
      children: [
        { id: "route:/meus-departamentos", label: "Meus departamentos", icon: Building2, description: "Departamentos ativos na sua operação." },
        { id: "route:/meus-squads",        label: "Meus squads",        icon: UsersRound, description: "Squads especializados que você já ativou." },
        ...(beginner ? [] : [{ id: "route:/dashboard/departamentos", label: "Catálogo de departamentos", icon: Building2, description: "Explore departamentos disponíveis para contratar." }]),
        ...(beginner ? [] : [{ id: "route:/dashboard/squads",        label: "Catálogo de squads",        icon: UsersRound, description: "Explore squads pré-configurados." }]),
        { id: "route:/dashboard/departamentos", label: "Contratar novo", icon: Building2, description: "Adicione um novo departamento ao seu time." },
      ],
    },



    // IA & Voz
    {
      id: "tab:omnix", label: "THOR", icon: Brain, group: zoneAI,
      description: "Seu copiloto executivo · voz, chat e orquestração.",
      children: [
        { id: "tab:omnix",       label: "Conversar",  icon: Brain, description: "Fale ou escreva com o THOR para pedir ações." },
        { id: "tab:thor-center", label: "Visão geral", icon: Radar, description: "Painel do THOR · o que ele está executando agora." },
      ],
    },

    // Configuração
    {
      id: "tab:system", label: "Sistema", icon: Settings, group: zoneConfig,
      description: "Integrações, credenciais e operações da conta.",
      children: [
        { id: "tab:integrations", label: "Integrações", icon: Plug, description: "Conecte WhatsApp, e-mail, CRM e outras ferramentas." },
        { id: "tab:system",       label: "Operações & Config", icon: Settings, description: "Preferências gerais, chaves e ajustes avançados." },
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

