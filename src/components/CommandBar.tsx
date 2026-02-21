import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command, CommandDialog, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  Search, Bot, LayoutDashboard, Library, CreditCard, Users,
  Sparkles, ArrowRight, Zap, Rocket, Plus, Settings, MessageSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

const agentQuickList = [
  { key: "voice_ai", name: "Voice AI Agent", icon: "🎙️", tier: "enterprise" },
  { key: "orchestrator", name: "Orchestrator Master", icon: "🤖", tier: "enterprise" },
  { key: "sales", name: "Sales Hunter", icon: "🎯", tier: "advanced" },
  { key: "content", name: "Content Creator", icon: "✍️", tier: "intermediate" },
  { key: "coding", name: "Full-Stack Dev", icon: "💻", tier: "enterprise" },
  { key: "omnichannel", name: "Omnichannel Support", icon: "💬", tier: "advanced" },
  { key: "security", name: "Cyber Security", icon: "🛡️", tier: "enterprise" },
  { key: "scheduler", name: "Appointment Scheduler", icon: "📅", tier: "basic" },
  { key: "ai_cfo", name: "AI CFO", icon: "📊", tier: "enterprise" },
  { key: "creative_design", name: "Creative Design", icon: "🎨", tier: "basic" },
];

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Biblioteca de Agentes", href: "/library", icon: Library },
  { name: "Preços & Planos", href: "/pricing", icon: CreditCard },
  { name: "Como Funciona", href: "/how-it-works", icon: Sparkles },
  { name: "Comunidade", href: "/community", icon: Users },
  { name: "Criar Agente", href: "/create-agent", icon: Plus },
  { name: "Meus Agentes", href: "/agents", icon: Bot },
  { name: "Integrações", href: "/integrations", icon: Settings },
];

const quickActions = [
  { name: "Criar novo agente", action: "/create-agent", icon: Rocket, badge: "Ação" },
  { name: "Falar com consultor IA", action: "consultant", icon: MessageSquare, badge: "IA" },
  { name: "Ver squads de IA", action: "/pricing", icon: Users, badge: "Planos" },
];

interface CommandBarProps {
  onOpenTestDrive?: (agentKey: string, agentName: string) => void;
}

const CommandBar = ({ onOpenTestDrive }: CommandBarProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((value: string) => {
    setOpen(false);
    if (value.startsWith("/")) {
      navigate(value);
    } else if (value.startsWith("agent:")) {
      const key = value.replace("agent:", "");
      const agent = agentQuickList.find(a => a.key === key);
      if (agent && onOpenTestDrive) {
        onOpenTestDrive(agent.key, agent.name);
      } else {
        navigate(`/agente/${key}`);
      }
    } else if (value === "consultant") {
      navigate("/library");
    }
  }, [navigate, onOpenTestDrive]);

  const tierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      basic: "bg-emerald-500/15 text-emerald-400",
      intermediate: "bg-cyan-500/15 text-cyan-400",
      advanced: "bg-cyan-500/15 text-cyan-300",
      enterprise: "bg-primary/15 text-primary",
    };
    const labels: Record<string, string> = {
      basic: "Starter",
      intermediate: "Pro",
      advanced: "Avançado",
      enterprise: "Enterprise",
    };
    return (
      <Badge variant="secondary" className={`text-[9px] ${colors[tier] || ""}`}>
        {labels[tier] || tier}
      </Badge>
    );
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-xl glass-btn-primary text-sm font-medium text-foreground group transition-all duration-300 hover:scale-105"
      >
        <Search className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline">Comando</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="border-b border-white/5 px-3 py-2 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">
            Busque agentes, navegue ou execute ações instantâneas
          </span>
        </div>
        <CommandInput placeholder="O que você precisa? Ex: 'agente de vendas', 'criar agente'..." />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>
            <div className="py-8 text-center">
              <Sparkles className="h-8 w-8 text-primary/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum resultado encontrado</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tente "vendas", "marketing" ou "criar"</p>
            </div>
          </CommandEmpty>

          <CommandGroup heading="⚡ Ações Rápidas">
            {quickActions.map((action) => (
              <CommandItem
                key={action.name}
                value={action.action}
                onSelect={handleSelect}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="flex-1 font-medium text-sm">{action.name}</span>
                <Badge variant="outline" className="text-[9px] border-primary/20 text-primary">
                  {action.badge}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="🤖 Test Drive — Converse com o Agente">
            {agentQuickList.map((agent) => (
              <CommandItem
                key={agent.key}
                value={`agent:${agent.key}`}
                onSelect={handleSelect}
                className="flex items-center gap-3 py-2.5 cursor-pointer"
              >
                <span className="text-lg">{agent.icon}</span>
                <span className="flex-1 text-sm">{agent.name}</span>
                {tierBadge(agent.tier)}
                <MessageSquare className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="📍 Navegação">
            {navigationItems.map((item) => (
              <CommandItem
                key={item.href}
                value={item.href}
                onSelect={handleSelect}
                className="flex items-center gap-3 py-2 cursor-pointer"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default CommandBar;
