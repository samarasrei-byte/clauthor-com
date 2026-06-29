import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, Bot, Search, Star, Clock, Command } from "lucide-react";
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
  children?: SidebarChild[];
  colorClass?: string;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  activeItem: string;
  onItemChange: (id: string) => void;
}

const LS_KEYS = {
  collapsed: "sb:collapsed",
  expanded: "sb:expanded",
  sections: "sb:sections",
  pinned: "sb:pinned",
  recent: "sb:recent",
};

const readSet = (key: string): Set<string> => {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};
const writeSet = (key: string, set: Set<string>) => {
  try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch { /* noop */ }
};
const readList = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
};

const DashboardSidebar = ({ items, activeItem, onItemChange }: DashboardSidebarProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(LS_KEYS.collapsed) === "1"; } catch { return false; }
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => readSet(LS_KEYS.expanded));
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    const stored = readSet(LS_KEYS.sections);
    // Default: "Avançado/Advanced" sections start collapsed for a cleaner sidebar
    if (stored.size === 0) {
      try {
        const seen = localStorage.getItem("sb:sections-seeded");
        if (!seen) {
          localStorage.setItem("sb:sections-seeded", "1");
          return new Set(["Avançado", "Advanced"]);
        }
      } catch { /* noop */ }
    }
    return stored;
  });

  const [pinned, setPinned] = useState<Set<string>>(() => readSet(LS_KEYS.pinned));
  const [recent, setRecent] = useState<string[]>(() => readList(LS_KEYS.recent));
  const [query, setQuery] = useState("");
  const [hoverArrow, setHoverArrow] = useState<number>(-1);
  const searchRef = useRef<HTMLInputElement>(null);

  // Persist
  useEffect(() => { try { localStorage.setItem(LS_KEYS.collapsed, collapsed ? "1" : "0"); } catch { /* noop */ } }, [collapsed]);
  useEffect(() => writeSet(LS_KEYS.expanded, expandedGroups), [expandedGroups]);
  useEffect(() => writeSet(LS_KEYS.sections, collapsedSections), [collapsedSections]);
  useEffect(() => writeSet(LS_KEYS.pinned, pinned), [pinned]);
  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.recent, JSON.stringify(recent)); } catch { /* noop */ }
  }, [recent]);

  // Track recents on activeItem change
  useEffect(() => {
    if (!activeItem) return;
    setRecent(prev => {
      const next = [activeItem, ...prev.filter(id => id !== activeItem)].slice(0, 5);
      return next;
    });
  }, [activeItem]);

  // Keyboard shortcuts: [ collapse, / focus search, Esc clear
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "[" || ((e.metaKey || e.ctrlKey) && e.key === "b")) && !isTyping) {
        e.preventDefault();
        setCollapsed(v => !v);
      }
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        setCollapsed(false);
        setTimeout(() => searchRef.current?.focus(), 60);
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleGroup = useCallback((id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSection = (group: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinned(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Filtering by query (also matches children)
  const q = query.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!q) return items;
    return items
      .map(it => {
        const matchSelf = it.label.toLowerCase().includes(q);
        const matchedChildren = it.children?.filter(c => c.label.toLowerCase().includes(q)) || [];
        if (matchSelf) return it;
        if (matchedChildren.length) return { ...it, children: matchedChildren };
        return null;
      })
      .filter(Boolean) as SidebarItem[];
  }, [items, q]);

  // Auto-expand groups when filtering
  const effectiveExpanded = useMemo(() => {
    if (!q) return expandedGroups;
    const s = new Set(expandedGroups);
    filteredItems.forEach(it => it.children && s.add(it.id));
    return s;
  }, [q, expandedGroups, filteredItems]);

  const pinnedItems = useMemo(
    () => items.filter(it => pinned.has(it.id)),
    [items, pinned]
  );
  const recentItems = useMemo(() => {
    const map = new Map(items.map(it => [it.id, it]));
    // Exclude the currently-active item so it doesn't duplicate the highlighted entry below.
    return recent
      .filter(id => id !== activeItem)
      .map(id => map.get(id))
      .filter(Boolean) as SidebarItem[];
  }, [items, recent, activeItem]);

  const renderItem = (item: SidebarItem, idx: number, opts: { showGroupHeader?: boolean; compactRow?: boolean } = {}) => {
    const isActive = activeItem === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = effectiveExpanded.has(item.id);
    const isPinned = pinned.has(item.id);
    const numericBadge = typeof item.badge === "number" && item.badge > 0;

    return (
      <div key={item.id + (opts.compactRow ? ":c" : "")}>
        {opts.showGroupHeader && !collapsed && (
          <div className="px-3 pt-5 pb-1.5 first:pt-1">
            {item.group && (item.group.includes("Avançad") || item.group.includes("Advanced")) ? (
              <button
                onClick={() => toggleSection(item.group!)}
                className="flex items-center gap-2 w-full text-left group/section py-1 px-1.5 -mx-1.5 rounded-md hover:bg-primary/5 transition-colors"
              >
                <ChevronDown className={cn("h-3.5 w-3.5 text-primary/50 transition-transform duration-200", collapsedSections.has(item.group!) && "-rotate-90")} />
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary/60">{item.group}</span>
                <div className="flex-1" />
                <span className="text-[7px] font-medium text-primary/30 bg-primary/5 px-1.5 py-0.5 rounded-full">PRO</span>
              </button>
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">{item.group}</span>
            )}
          </div>
        )}
        {opts.showGroupHeader && collapsed && (
          <div className="w-full flex justify-center py-2"><div className="w-6 h-px bg-border/30" /></div>
        )}

        {item.group && !opts.compactRow && collapsedSections.has(item.group) && !collapsed ? null : (
          <>
            <button
              data-tour={
                item.id === "overview" ? "nav-overview" :
                item.id === "agents" ? "nav-agents" :
                item.id === "chat" ? "nav-chat" :
                item.id === "insights" ? "nav-reports" : undefined
              }
              onClick={() => {
                if (hasChildren && !collapsed) toggleGroup(item.id);
                else onItemChange(item.id);
              }}
              onMouseEnter={() => setHoverArrow(idx)}
              onMouseLeave={() => setHoverArrow(-1)}
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
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              <div className="relative shrink-0">
                <item.icon className={cn("h-[14px] w-[14px]", item.colorClass || (isActive ? "text-primary" : ""))} strokeWidth={1.5} />
                {numericBadge && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
                )}
              </div>

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

              {!collapsed && !hasChildren && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => togglePin(item.id, e)}
                  className={cn(
                    "p-0.5 rounded transition-opacity",
                    isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  aria-label={isPinned ? "Desafixar" : "Fixar"}
                >
                  <Star className={cn("h-3 w-3", isPinned ? "fill-amber-400 text-amber-400" : "text-muted-foreground/60")} strokeWidth={1.5} />
                </span>
              )}

              {hasChildren && !collapsed && (
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform text-muted-foreground/50", isExpanded && "rotate-180")} />
              )}

              {item.badge && !collapsed && (
                <span className={cn(
                  "text-[8px] font-medium px-1.5 py-0.5 rounded",
                  (typeof item.badge === "string" && item.badge.length > 3)
                    ? "bg-muted/30 text-muted-foreground/60 italic"
                    : "bg-primary/15 text-primary"
                )}>
                  {item.badge}
                </span>
              )}

              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-background border border-border/20 text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                  {item.badge && <span className="ml-1.5 text-[10px] text-primary">({item.badge})</span>}
                </div>
              )}
            </button>

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
          </>
        )}
      </div>
    );
  };

  return (
    <motion.aside
      data-tour="sidebar"
      initial={false}
      animate={{ width: collapsed ? 56 : 248 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-full flex flex-col bg-background/60 backdrop-blur-xl border-r border-border/10 overflow-hidden shrink-0 relative"
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expandir" : "Colapsar"}
        className="absolute -right-3 top-7 z-10 w-6 h-6 rounded-full bg-background border border-border/30 flex items-center justify-center hover:border-primary/40 hover:bg-accent/10 transition-all shadow-sm"
      >
        {collapsed ? <ChevronRight className="h-3 w-3 text-muted-foreground" /> : <ChevronLeft className="h-3 w-3 text-muted-foreground" />}
      </button>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/60" strokeWidth={1.5} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="w-full pl-7 pr-9 py-1.5 text-[11px] rounded-md bg-muted/20 border border-border/20 focus:border-primary/40 focus:bg-background outline-none transition-all placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 py-2 px-2.5 space-y-0.5 overflow-y-auto scrollbar-thin">
        {/* Pinned */}
        {!collapsed && !q && pinnedItems.length > 0 && (
          <div className="mb-1">
            <div className="px-3 pt-2 pb-1.5 flex items-center gap-1.5">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">Fixados</span>
            </div>
            {pinnedItems.map((it, i) => renderItem(it, i, { compactRow: true }))}
          </div>
        )}


        {/* Main list */}
        {filteredItems.map((item, idx) => {
          const prev = filteredItems[idx - 1];
          const showGroupHeader = !q && !!item.group && (idx === 0 || prev?.group !== item.group);
          return renderItem(item, idx, { showGroupHeader });
        })}

        {q && filteredItems.length === 0 && (
          <div className="px-3 py-6 text-center text-[11px] text-muted-foreground/60">
            Nenhum resultado para "{query}"
          </div>
        )}
      </nav>

    </motion.aside>
  );
};

export default DashboardSidebar;
