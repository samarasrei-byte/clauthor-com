import { LayoutDashboard, Brain, Bot, MessageSquare, Menu } from "lucide-react";
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
    { id: "omnix", label: "Thor", icon: Brain },
    { id: "agents", label: t("dashboard.agents_tab_short", { defaultValue: "Agentes" }), icon: Bot, badge: agentCount },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "more", label: t("dashboard.more", { defaultValue: "Mais" }), icon: Menu },
  ];

  // "more" opens the mobile sheet nav via overview section's Sheet
  const handleNav = (id: string) => {
    if (id === "more") {
      // Trigger the mobile sheet - we navigate to current section which shows the sheet button
      // We'll just not navigate but the button exists as a hint
      onNavigate(activeSection);
      return;
    }
    onNavigate(id);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/20 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {items.map((item) => {
          const isActive = item.id !== "more" && activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[56px] relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:scale-95"
              )}
            >
              {isActive && (
                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-primary" />
              )}
              <span className="relative">
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 text-[8px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-primary text-primary-foreground">
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
