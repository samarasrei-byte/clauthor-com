import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useMemo } from "react";

/**
 * Contextual breadcrumb for the dashboard shell.
 * Renders a compact trail based on the current path so users always know
 * where they are inside the "Meu trabalho / IA / Configurações" hierarchy.
 * Hidden on the dashboard root to avoid noise.
 */
const LABELS: Record<string, string> = {
  dashboard: "Painel",
  "video-studio": "Video Studio",
  inbox: "Inbox",
  kanban: "Kanban",
  arquivos: "Meus arquivos",
  approvals: "Aprovações",
  traces: "Rastros",
  agents: "Agentes",
  squads: "Squads",
  departamentos: "Departamentos",
  team: "Time",
  time: "Time",
  admin: "Admin",
  settings: "Configurações",
  billing: "Faturamento",
  integrations: "Integrações",
  create: "Novo",
  "create-agent": "Novo agente",
  hire: "Contratar",
  "paypal-sandbox": "PayPal Sandbox",
};

const prettify = (seg: string) =>
  LABELS[seg] ??
  seg
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const DashboardBreadcrumb = () => {
  const { pathname } = useLocation();

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    // Hide on bare /dashboard
    if (parts.length <= 1) return [];
    return parts.map((seg, i) => ({
      label: prettify(seg),
      href: "/" + parts.slice(0, i + 1).join("/"),
      isLast: i === parts.length - 1,
    }));
  }, [pathname]);

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Trilha de navegação"
      className="flex items-center gap-1.5 px-4 sm:px-6 pt-3 text-[11px] text-muted-foreground/80"
    >
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        aria-label="Painel"
      >
        <Home className="h-3 w-3" />
      </Link>
      {crumbs.map((c) => (
        <span key={c.href} className="inline-flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
          {c.isLast ? (
            <span className="text-foreground/90 font-medium">{c.label}</span>
          ) : (
            <Link
              to={c.href}
              className="hover:text-foreground transition-colors"
            >
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default DashboardBreadcrumb;
