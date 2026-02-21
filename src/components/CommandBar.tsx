import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Search, Bot, LayoutDashboard, Library, CreditCard, Users,
  Sparkles, ArrowRight, Rocket, Plus, Settings, MessageSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

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
  const [hovered, setHovered] = useState(false);
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
      {/* Futuristic floating trigger with orbital glow */}
      <motion.button
        onClick={() => setOpen(true)}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full flex items-center justify-center group relative"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-primary/20"
          animate={{
            boxShadow: hovered
              ? "0 0 40px hsl(var(--primary) / 0.2), inset 0 0 20px hsl(var(--primary) / 0.05)"
              : "0 0 15px hsl(var(--primary) / 0.06), inset 0 0 10px hsl(var(--primary) / 0.02)",
          }}
          transition={{ duration: 0.6 }}
        />
        {/* Glass surface */}
        <div className="absolute inset-[1px] rounded-full bg-background/80 backdrop-blur-xl" />
        {/* Scan line */}
        <motion.div
          className="absolute inset-[1px] rounded-full overflow-hidden"
          initial={false}
        >
          <motion.div
            className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
        {/* Icon */}
        <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300 relative z-10" />
      </motion.button>

      {/* Custom futuristic dialog */}
      <AnimatePresence>
        {open && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden p-0 border-0 bg-transparent shadow-none max-w-[540px] [&>button]:hidden">
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-2xl overflow-hidden"
              >
                {/* Outer glow */}
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-primary/20 via-white/[0.06] to-white/[0.02]" />
                
                {/* Glass container */}
                <div className="relative rounded-2xl bg-background/95 backdrop-blur-2xl border border-white/[0.04] overflow-hidden">
                  {/* Top scan line effect */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  
                  {/* Ambient glow orb */}
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

                  <Command className="bg-transparent">
                    {/* Header with status indicator */}
                    <div className="px-4 pt-3.5 pb-2 flex items-center gap-2.5">
                      <div className="relative flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <div className="absolute h-1.5 w-1.5 rounded-full bg-primary animate-ping opacity-40" />
                      </div>
                      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/50 font-medium">
                        Command Center
                      </span>
                      <div className="flex-1" />
                      <kbd className="text-[9px] tracking-wider text-muted-foreground/30 border border-white/[0.04] rounded px-1.5 py-0.5 bg-white/[0.02]">
                        ⌘K
                      </kbd>
                    </div>

                    {/* Search input area */}
                    <div className="relative">
                      <div className="absolute bottom-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                      <CommandInput
                        placeholder="O que você precisa?"
                        className="text-[13px] tracking-wide"
                      />
                    </div>

                    <CommandList className="max-h-[380px] py-1">
                      <CommandEmpty>
                        <div className="py-12 text-center">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-3"
                          >
                            <div className="h-8 w-8 rounded-full border border-white/[0.06] flex items-center justify-center">
                              <Sparkles className="h-3.5 w-3.5 text-muted-foreground/30" />
                            </div>
                            <p className="text-[12px] text-muted-foreground/40 tracking-wider">
                              Sem resultados encontrados
                            </p>
                          </motion.div>
                        </div>
                      </CommandEmpty>

                      <CommandGroup heading="Ações">
                        {quickActions.map((action, i) => (
                          <CommandItem
                            key={action.name}
                            value={action.action}
                            onSelect={handleSelect}
                            className="flex items-center gap-3 py-2.5 px-3 mx-1 cursor-pointer rounded-xl group/item transition-all duration-200 data-[selected=true]:bg-white/[0.04]"
                          >
                            <div className="h-7 w-7 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center group-hover/item:border-primary/20 group-hover/item:bg-primary/[0.04] transition-all duration-300">
                              <action.icon className="h-3.5 w-3.5 text-muted-foreground/60 group-hover/item:text-primary transition-colors duration-300" />
                            </div>
                            <span className="flex-1 text-[13px] tracking-wide text-foreground/80 group-hover/item:text-foreground transition-colors">
                              {action.name}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/20 group-hover/item:text-primary/50 transition-all duration-300 group-hover/item:translate-x-0.5" />
                          </CommandItem>
                        ))}
                      </CommandGroup>

                      <div className="mx-4 my-1">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                      </div>

                      <CommandGroup heading="Test Drive">
                        {agentQuickList.map((agent) => (
                          <CommandItem
                            key={agent.key}
                            value={`agent:${agent.key}`}
                            onSelect={handleSelect}
                            className="flex items-center gap-3 py-2 px-3 mx-1 cursor-pointer rounded-xl group/item transition-all duration-200 data-[selected=true]:bg-white/[0.04]"
                          >
                            <span className="text-sm opacity-60 group-hover/item:opacity-100 transition-opacity duration-300">
                              {agent.icon}
                            </span>
                            <span className="flex-1 text-[13px] tracking-wide text-foreground/70 group-hover/item:text-foreground transition-colors">
                              {agent.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground/30 tracking-[0.15em] uppercase group-hover/item:text-muted-foreground/50 transition-colors">
                              {tierLabel(agent.tier)}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>

                      <div className="mx-4 my-1">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                      </div>

                      <CommandGroup heading="Navegar">
                        {navigationItems.map((item) => (
                          <CommandItem
                            key={item.href}
                            value={item.href}
                            onSelect={handleSelect}
                            className="flex items-center gap-3 py-2 px-3 mx-1 cursor-pointer rounded-xl group/item transition-all duration-200 data-[selected=true]:bg-white/[0.04]"
                          >
                            <item.icon className="h-3.5 w-3.5 text-muted-foreground/40 group-hover/item:text-foreground/70 transition-colors duration-300" />
                            <span className="text-[13px] tracking-wide text-foreground/60 group-hover/item:text-foreground transition-colors">
                              {item.name}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>

                    {/* Bottom status bar */}
                    <div className="relative px-4 py-2.5 flex items-center gap-3">
                      <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-primary/60" />
                        <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground/30">Online</span>
                      </div>
                      <div className="flex-1" />
                      <span className="text-[9px] tracking-wider text-muted-foreground/20">
                        ↑↓ navegar · ↵ selecionar · esc fechar
                      </span>
                    </div>
                  </Command>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
};

export default CommandBar;
