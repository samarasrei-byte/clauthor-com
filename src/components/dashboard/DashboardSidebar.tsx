import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  activeItem: string;
  onItemChange: (id: string) => void;
}

const DashboardSidebar = ({ items, activeItem, onItemChange }: DashboardSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="sticky top-20 h-[calc(100vh-6rem)] flex flex-col glass-card rounded-2xl border border-white/[0.06] overflow-hidden shrink-0"
    >
      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-background border border-white/10 flex items-center justify-center hover:border-primary/30 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onItemChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative",
                collapsed ? "px-3 py-3 justify-center" : "px-3 py-2.5",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              <item.icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-primary" : "")} />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Badge */}
              {item.badge && !collapsed && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
                  {item.badge}
                </span>
              )}

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-background border border-white/10 text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                  {item.badge && (
                    <span className="ml-1.5 text-[10px] text-primary">({item.badge})</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </motion.aside>
  );
};

export default DashboardSidebar;
