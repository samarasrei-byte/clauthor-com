import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Bot, LayoutDashboard, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import type { SidebarItem } from "./DashboardSidebar";

interface MobileNavSheetProps {
  sidebarItems: SidebarItem[];
  activeSection: string;
  breadcrumbLabel: string;
  onNavigate: (id: string) => void;
}

const MobileNavSheet = ({ sidebarItems, activeSection, breadcrumbLabel, onNavigate }: MobileNavSheetProps) => {
  const { t } = useTranslation();

  const flatMobileItems = useMemo(() => {
    const flat: { id: string; label: string; icon: React.ElementType; group?: string; badge?: string | number }[] = [];
    for (const item of sidebarItems) {
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          flat.push({ id: child.id, label: `${item.label} › ${child.label}`, icon: child.icon || Bot, group: item.group });
        }
      } else {
        flat.push({ id: item.id, label: item.label, icon: item.icon, group: item.group, badge: item.badge });
      }
    }
    return flat;
  }, [sidebarItems]);

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 text-xs w-full justify-start border-border/30">
            <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">{breadcrumbLabel}</span>
            <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b border-border/10">
            <SheetTitle className="font-display text-sm">{t("dashboard.navigation", { defaultValue: "Navegação" })}</SheetTitle>
          </SheetHeader>
          {flatMobileItems.length > 8 && (
            <div className="px-3 pt-3">
              <input
                type="text"
                placeholder={t("dashboard.search_nav", { defaultValue: "Buscar..." })}
                className="w-full h-8 px-3 text-xs rounded-lg bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                onChange={(e) => {
                  const val = e.target.value.toLowerCase();
                  const items = document.querySelectorAll("[data-mobile-nav-item]");
                  items.forEach((el) => {
                    const text = el.getAttribute("data-label")?.toLowerCase() || "";
                    (el as HTMLElement).style.display = text.includes(val) ? "" : "none";
                  });
                }}
              />
            </div>
          )}
          <nav className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {flatMobileItems.map((item, idx) => {
              const showGroup = item.group && (idx === 0 || flatMobileItems[idx - 1]?.group !== item.group);
              const isActive = activeSection === item.id || (item.id.startsWith("agent-chat-") && activeSection === "chat");
              return (
                <div key={item.id} data-mobile-nav-item data-label={item.label}>
                  {showGroup && (
                    <div className="px-3 pt-4 pb-1.5 first:pt-1">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">{item.group}</span>
                    </div>
                  )}
                  <SheetClose asChild>
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium border border-primary/15"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      {item.badge && !isActive && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">{item.badge}</span>}
                    </button>
                  </SheetClose>
                </div>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNavSheet;
