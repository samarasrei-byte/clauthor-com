import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bot,
  Search,
  Star,
  X,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBeginnerMode } from "@/hooks/useBeginnerMode";

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
  /** Se true, exibe cadeado sobre o ícone (acesso bloqueado / paywall). */
  locked?: boolean;
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

/**
 * Sidebar "Obsidian Red" · card flutuante, cantos arredondados (Trello-like),
 * página visível ao redor. Busca com um único ícone de ação (X quando há texto,
 * atalho ⌘K quando vazio) e toggle Iniciante/Avançado no rodapé.
 */
const DashboardSidebar = ({ items, activeItem, onItemChange }: DashboardSidebarProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(LS_KEYS.collapsed) === "1"; } catch { return false; }
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => readSet(LS_KEYS.expanded));
  const [pinned, setPinned] = useState<Set<string>>(() => readSet(LS_KEYS.pinned));
  const [recent, setRecent] = useState<string[]>(() => readList(LS_KEYS.recent));
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [beginner, , toggleBeginner] = useBeginnerMode();

  // Persist
  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.collapsed, collapsed ? "1" : "0"); } catch { /* noop */ }
    try { window.dispatchEvent(new CustomEvent("sb:collapsed-change", { detail: { collapsed } })); } catch { /* noop */ }
  }, [collapsed]);
  useEffect(() => writeSet(LS_KEYS.expanded, expandedGroups), [expandedGroups]);
  useEffect(() => writeSet(LS_KEYS.pinned, pinned), [pinned]);
  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.recent, JSON.stringify(recent)); } catch { /* noop */ }
  }, [recent]);

  useEffect(() => {
    if (!activeItem) return;
    setRecent(prev => [activeItem, ...prev.filter(id => id !== activeItem)].slice(0, 5));
  }, [activeItem]);

  // Keyboard shortcuts
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

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinned(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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

  const renderItem = (item: SidebarItem, idx: number, opts: { showGroupHeader?: boolean; compactRow?: boolean } = {}) => {
    const isActive = activeItem === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = effectiveExpanded.has(item.id);
    const isPinned = pinned.has(item.id);
    const numericBadge = typeof item.badge === "number" && item.badge > 0;

    return (
      <div key={item.id + (opts.compactRow ? ":c" : "")}>
        {opts.showGroupHeader && !collapsed && (
          <div className="px-3 pt-3.5 pb-1 first:pt-1">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-foreground/55">

              {item.group}
            </span>
          </div>
        )}
        {opts.showGroupHeader && collapsed && (
          <div className="w-full flex justify-center py-1.5"><div className="w-6 h-px bg-border/40" /></div>
        )}

        <button
          onClick={() => {
            if (hasChildren && !collapsed) toggleGroup(item.id);
            else onItemChange(item.id);
          }}
          className={cn(
            "w-full flex items-center gap-2.5 rounded-xl transition-all duration-150 group relative",
            collapsed ? "px-2 py-1.5 justify-center" : "px-2.5 py-1.5",
            isActive
              ? "bg-card border border-border/60 text-foreground shadow-sm"
              : "text-foreground/80 hover:text-foreground hover:bg-card/60 border border-transparent"
          )}
        >
          <div className="relative shrink-0">
            <item.icon
              className={cn(
                "h-[15px] w-[15px] transition-colors",
                isActive ? "text-primary" : "text-foreground/70 group-hover:text-primary"
              )}
              strokeWidth={1.75}
            />
            {numericBadge && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-success ring-2 ring-background animate-pulse" />
            )}
            {item.locked && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-background flex items-center justify-center ring-1 ring-border/60"
                aria-label="Requer contratação"
              >
                <Lock className="h-2 w-2 text-warning" strokeWidth={2.5} />

              </span>
            )}
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className={cn(
                  "text-[12.5px] truncate flex-1 text-left tracking-[-0.005em] leading-[1.3]",
                  isActive ? "font-semibold" : "font-medium"
                )}
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
              <Star className={cn("h-3 w-3", isPinned ? "fill-warning text-warning" : "text-muted-foreground/60")} strokeWidth={1.5} />
            </span>
          )}

          {hasChildren && !collapsed && (
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform text-muted-foreground/60", isExpanded && "rotate-180")} />
          )}

          {item.badge && !collapsed && !hasChildren && (
            <span className={cn(
              "text-[9px] font-semibold px-1.5 py-0.5 rounded-md",
              (typeof item.badge === "string" && item.badge.length > 3)
                ? "bg-muted/40 text-muted-foreground/70"
                : "bg-primary/15 text-primary"
            )}>
              {item.badge}
            </span>
          )}

          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-card border border-border/40 text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
              {item.label}
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
              <div className="ml-5 pl-3 border-l border-border/30 space-y-0.5 py-0.5">
                {item.children!.map(child => {
                  const ChildIcon = child.icon || Bot;
                  const isChildActive = activeItem === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => onItemChange(child.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[11.5px] font-medium transition-all",
                        isChildActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground/75 hover:text-foreground hover:bg-card/60"
                      )}
                    >
                      <ChildIcon className="h-3 w-3 shrink-0" strokeWidth={1.75} />
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
  };

  return (
    <motion.aside
      data-tour="sidebar"
      initial={false}
      animate={{ width: collapsed ? 64 : 244 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "h-full flex flex-col shrink-0 relative",
        // Floating rounded card (Trello / Obsidian Red direction)
        "rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl",
        "shadow-2xl shadow-black/40 ring-1 ring-white/[0.03]"
      )}
      style={{ overflow: "visible" }}
    >
      {/* Collapse handle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expandir" : "Colapsar"}
        title={collapsed ? "Expandir (⌘B)" : "Recolher (⌘B)"}
        className="sb-toggle absolute -right-2.5 top-6 z-50 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-all shadow-lg ring-2 ring-background"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" strokeWidth={3} /> : <ChevronLeft className="h-3 w-3" strokeWidth={3} />}
      </button>

      {/* Search · one clear affordance */}
      {!collapsed && (
        <div className="px-3 pt-4 pb-2">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70 group-focus-within:text-primary transition-colors"
              strokeWidth={1.75}
            />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                try { window.dispatchEvent(new CustomEvent("open-command-bar")); } catch { /* noop */ }
              }}
              placeholder="Pesquisar..."
              aria-label="Abrir busca global (⌘K)"
              className="w-full pl-9 pr-9 py-2 text-[12px] rounded-xl bg-background/60 border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/40 focus:bg-background outline-none transition-all placeholder:text-muted-foreground/60"
            />
            {query ? (
              <button
                onClick={() => { setQuery(""); searchRef.current?.focus(); }}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-border/40 bg-background/70 text-[9px] font-mono text-muted-foreground/70">
                ⌘K
              </kbd>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-1.5 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {!collapsed && !q && pinnedItems.length > 0 && (
          <div className="mb-1">
            <div className="px-3 pt-2 pb-1.5 flex items-center gap-1.5">
              <Star className="h-2.5 w-2.5 fill-warning text-warning" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">Fixados</span>
            </div>
            {pinnedItems.map((it, i) => renderItem(it, i, { compactRow: true }))}
          </div>
        )}

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

      {/* Modo Iniciante removido · todos os usuários veem o menu completo. */}
    </motion.aside>
  );
};

export default DashboardSidebar;
