import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarChild {
  id: string;
  label: string;
  icon?: React.ElementType;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  group?: string;
  /** Collapsible children (e.g. agents inside a department) */
  children?: SidebarChild[];
  /** Color class for the group icon */
  colorClass?: string;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  activeItem: string;
  onItemChange: (id: string) => void;
}

const DashboardSidebar = ({ items, activeItem, onItemChange }: DashboardSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-full flex flex-col glass-card border-r border-white/[0.06] overflow-hidden shrink-0 relative"
    >
      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute right-1 top-6 z-10 w-6 h-6 rounded-full bg-background border border-white/10 flex items-center justify-center hover:border-primary/30 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {items.map((item, idx) => {
          const showGroupHeader = item.group && (idx === 0 || items[idx - 1].group !== item.group);
          const isActive = activeItem === item.id;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedGroups.has(item.id);

          return (
            <div key={item.id}>
              {showGroupHeader && !collapsed && (
                <div className="px-3 pt-5 pb-1.5 first:pt-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                    {item.group}
                  </span>
                </div>
              )}
              {showGroupHeader && collapsed && (
                <div className="w-full flex justify-center py-2">
                  <div className="w-6 h-px bg-border/30" />
                </div>
              )}

              {/* Main item button */}
              <button
                onClick={() => {
                  if (hasChildren && !collapsed) {
                    toggleGroup(item.id);
                  } else {
                    onItemChange(item.id);
                  }
                }}
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

                <item.icon className={cn("h-4.5 w-4.5 shrink-0 icon-lift", item.colorClass || (isActive ? "text-primary" : ""))} strokeWidth={1.5} />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium truncate flex-1 text-left"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Chevron for collapsible items */}
                {hasChildren && !collapsed && (
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform text-muted-foreground/50", isExpanded && "rotate-180")} />
                )}

                {/* Badge */}
                {item.badge && !collapsed && !hasChildren && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
                    {item.badge}
                  </span>
                )}

                {/* Badge for items with children */}
                {item.badge && !collapsed && hasChildren && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
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

              {/* Children (collapsible) */}
              <AnimatePresence>
                {hasChildren && isExpanded && !collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 pl-3 border-l border-white/[0.06] space-y-0.5 py-1">
                      {item.children!.map(child => {
                        const ChildIcon = child.icon || Bot;
                        const isChildActive = activeItem === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => onItemChange(child.id)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all",
                              isChildActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                            )}
                          >
                            <ChildIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                            <span className="truncate">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </motion.aside>
  );
};

export default DashboardSidebar;
