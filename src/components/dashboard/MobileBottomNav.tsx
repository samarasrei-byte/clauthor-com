import { LayoutDashboard, Brain, Bot, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface MobileBottomNavProps {
  activeSection: string;
  onNavigate: (id: string) => void;
  agentCount?: number;
}

const MobileBottomNav = ({ activeSection, onNavigate, agentCount }: MobileBottomNavProps) => {
  const { t } = useTranslation();

  const items = [
    { id: "overview", label: t("dashboard.command_center_short", { defaultValue: "Início" }), icon: LayoutDashboard },
    { id: "omnix", label: "IA", icon: Brain },
    { id: "agents", label: t("dashboard.agents_tab_short", { defaultValue: "Agentes" }), icon: Bot, badge: agentCount },
    { id: "settings", label: t("dashboard.settings_short", { defaultValue: "Config" }), icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/20 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {items.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px] relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:scale-95"
              )}
            >
              {isActive && (
                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-primary" />
              )}
              <span className="relative">
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 text-[8px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className={cn("text-[10px] leading-tight", isActive ? "font-semibold" : "font-medium")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
