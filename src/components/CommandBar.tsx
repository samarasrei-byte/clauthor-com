import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  Search, Bot, LayoutDashboard, Library, CreditCard, Users,
  Sparkles, ArrowRight, Zap, Rocket, Plus, Settings, MessageSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
  { name: "Criar novo agente", action: "/create-agent", icon: Rocket },
  { name: "Falar com consultor IA", action: "consultant", icon: MessageSquare },
  { name: "Ver squads de IA", action: "/pricing", icon: Users },
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

  const tierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      basic: "Starter",
      intermediate: "Pro",
      advanced: "Avançado",
      enterprise: "Enterprise",
    };
    return labels[tier] || tier;
  };

  return (
    <>
      {/* Minimal floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-11 w-11 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl flex items-center justify-center transition-all duration-500 hover:border-primary/30 hover:bg-primary/[0.06] hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)] group"
      >
        <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Busque agentes, navegue ou execute ações..." />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>
            <div className="py-10 text-center">
              <div className="h-px w-12 bg-white/[0.06] mx-auto mb-4" />
              <p className="text-[13px] text-muted-foreground/60 tracking-wide">Sem resultados</p>
            </div>
          </CommandEmpty>

          <CommandGroup heading="Ações">
            {quickActions.map((action) => (
              <CommandItem
                key={action.name}
                value={action.action}
                onSelect={handleSelect}
                className="flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-lg group/item"
              >
                <action.icon className="h-3.5 w-3.5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                <span className="flex-1 text-[13px] tracking-wide">{action.name}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover/item:text-primary/60 transition-all group-hover/item:translate-x-0.5" />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator className="bg-white/[0.04]" />

          <CommandGroup heading="Test Drive">
            {agentQuickList.map((agent) => (
              <CommandItem
                key={agent.key}
                value={`agent:${agent.key}`}
                onSelect={handleSelect}
                className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-lg group/item"
              >
                <span className="text-sm opacity-70 group-hover/item:opacity-100 transition-opacity">{agent.icon}</span>
                <span className="flex-1 text-[13px] tracking-wide">{agent.name}</span>
                <span className="text-[10px] text-muted-foreground/40 tracking-widest uppercase">
                  {tierLabel(agent.tier)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator className="bg-white/[0.04]" />

          <CommandGroup heading="Navegar">
            {navigationItems.map((item) => (
              <CommandItem
                key={item.href}
                value={item.href}
                onSelect={handleSelect}
                className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-lg group/item"
              >
                <item.icon className="h-3.5 w-3.5 text-muted-foreground/50 group-hover/item:text-foreground transition-colors" />
                <span className="text-[13px] tracking-wide">{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default CommandBar;
