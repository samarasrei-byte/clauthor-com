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
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    // "Ferramentas Avançadas" starts collapsed
    return new Set(["Ferramentas Avançadas", "Advanced Tools"]);
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSection = (group: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  };

  return (
    <motion.aside
      data-tour="sidebar"
      initial={false}
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-full flex flex-col bg-background/60 backdrop-blur-xl border-r border-border/10 overflow-hidden shrink-0 relative"
    >
      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 z-10 w-6 h-6 rounded-full bg-background border border-border/30 flex items-center justify-center hover:border-primary/40 hover:bg-accent/10 transition-all shadow-sm"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto scrollbar-thin">
        {items.map((item, idx) => {
          const showGroupHeader = item.group && (idx === 0 || items[idx - 1].group !== item.group);
          const isActive = activeItem === item.id;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedGroups.has(item.id);

          return (
            <div key={item.id}>
              {showGroupHeader && !collapsed && (
                <div
                  className="px-3 pt-5 pb-1.5 first:pt-1"
                >
                  {item.group && (item.group.includes("Avançad") || item.group.includes("Advanced")) ? (
                    <button
                      onClick={() => toggleSection(item.group!)}
                      className="flex items-center gap-1.5 w-full text-left group/section"
                    >
                      <ChevronDown className={cn("h-3 w-3 text-muted-foreground/40 transition-transform", collapsedSections.has(item.group!) && "-rotate-90")} />
                      <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/35 group-hover/section:text-muted-foreground/60 transition-colors">
                        {item.group}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/35">
                      {item.group}
                    </span>
                  )}
                </div>
              )}
              {showGroupHeader && collapsed && (
                <div className="w-full flex justify-center py-2">
                  <div className="w-6 h-px bg-border/30" />
                </div>
              )}

              {/* Hide items in collapsed sections */}
              {item.group && collapsedSections.has(item.group) && !collapsed ? null : (
              <>
              {/* Main item button */}
              <button
                data-tour={
                  item.id === "overview" ? "nav-overview" :
                  item.id === "agents" ? "nav-agents" :
                  item.id === "chat" ? "nav-chat" :
                  item.id === "insights" ? "nav-reports" :
                  undefined
                }
                onClick={() => {
                  if (hasChildren && !collapsed) {
                    toggleGroup(item.id);
                  } else {
                    onItemChange(item.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-lg transition-all duration-150 group relative",
                  collapsed ? "px-2 py-2 justify-center" : "px-3 py-[7px]",
                  (typeof item.badge === "string" && item.badge.length > 3)
                    ? "text-muted-foreground/50 hover:text-muted-foreground/70 hover:bg-muted/5"
                    : isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
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

                <item.icon className={cn("h-[14px] w-[14px] shrink-0", item.colorClass || (isActive ? "text-primary" : ""))} strokeWidth={1.5} />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-[11.5px] font-normal truncate flex-1 text-left tracking-[-0.01em]"
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
                  <span className={cn(
                    "ml-auto text-[8px] font-medium px-1.5 py-0.5 rounded",
                  (typeof item.badge === "string" && item.badge.length > 3) 
                      ? "bg-muted/30 text-muted-foreground/60 italic font-medium"
                      : "bg-primary/15 text-primary"
                  )}>
                    {item.badge}
                  </span>
                )}

                {/* Badge for items with children */}
                {item.badge && !collapsed && hasChildren && (
                  <span className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-background border border-border/20 text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
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
                    <div className="ml-4 pl-3 border-l border-border/10 space-y-0.5 py-1">
                      {item.children!.map(child => {
                        const ChildIcon = child.icon || Bot;
                        const isChildActive = activeItem === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => onItemChange(child.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-[5px] rounded-md text-[10.5px] transition-all",
                              isChildActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                            )}
                          >
                            <ChildIcon className="h-3 w-3 shrink-0" strokeWidth={1.5} />
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
