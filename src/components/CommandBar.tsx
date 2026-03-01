import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Search, Bot, LayoutDashboard, Library, CreditCard, Users,
  Sparkles, ArrowRight, Rocket, Plus, Settings, MessageSquare,
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
  { name: "Marketplace", href: "/marketplace", icon: Library },
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
  const btnRef = useRef<HTMLButtonElement>(null);

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
      {/* ── FUTURISTIC FLOATING BUTTON ── */}
      <button
        ref={btnRef}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-6 z-[9999] h-14 w-14 rounded-2xl flex items-center justify-center group cursor-pointer"
        style={{ position: "fixed" }}
      >
        {/* Animated rotating border */}
        <span className="absolute inset-0 rounded-2xl overflow-hidden">
          <span
            className="absolute inset-[-50%] animate-spin"
            style={{
              background: "conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent, transparent)",
              animationDuration: "4s",
            }}
          />
        </span>

        {/* Inner glass surface */}
        <span className="absolute inset-[1px] rounded-[15px] bg-background/90 backdrop-blur-2xl" />

        {/* Primary glow pulse behind */}
        <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 shadow-[0_0_50px_hsl(var(--primary)/0.3),0_0_100px_hsl(var(--primary)/0.1)]" />

        {/* Corner accent dots */}
        <span className="absolute top-1.5 left-1.5 h-1 w-1 rounded-full bg-primary/40" />
        <span className="absolute bottom-1.5 right-1.5 h-1 w-1 rounded-full bg-primary/40" />

        {/* Horizontal scan line */}
        <span className="absolute inset-[1px] rounded-[15px] overflow-hidden pointer-events-none">
          <span
            className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            style={{
              animation: "commandScan 2.5s ease-in-out infinite",
            }}
          />
        </span>

        {/* Icon */}
        <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-500 relative z-10" />

        {/* ⌘K label on hover */}
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.2em] uppercase text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-top-9 whitespace-nowrap bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/[0.04]">
          ⌘K
        </span>
      </button>

      {/* Keyframe for scan line */}
      <style>{`
        @keyframes commandScan {
          0%, 100% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          50% { top: 85%; opacity: 1; }
          60% { opacity: 0; }
        }
      `}</style>

      {/* ── FUTURISTIC COMMAND DIALOG ── */}
      <AnimatePresence>
        {open && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden p-0 border-0 bg-transparent shadow-none max-w-[560px] [&>button]:hidden">
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-2xl overflow-hidden"
              >
                {/* Animated border glow */}
                <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
                  <div
                    className="absolute inset-[-100%] animate-spin"
                    style={{
                      background: "conic-gradient(from 180deg, transparent 60%, hsl(var(--primary) / 0.4), transparent 80%)",
                      animationDuration: "6s",
                    }}
                  />
                </div>

                {/* Glass container */}
                <div className="relative rounded-2xl bg-background/[0.97] backdrop-blur-3xl overflow-hidden">
                  {/* Top accent line */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                  {/* Ambient orbs */}
                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-48 bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/[0.02] rounded-full blur-3xl pointer-events-none" />

                  <Command className="bg-transparent">
                    {/* Header */}
                    <div className="px-5 pt-4 pb-2 flex items-center gap-3">
                      {/* Animated status orb */}
                      <div className="relative h-5 w-5 flex items-center justify-center">
                        <div className="absolute h-2 w-2 rounded-full bg-primary/80 animate-ping" style={{ animationDuration: "2s" }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                      </div>
                      <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground/40 font-semibold">
                        Command Center
                      </span>
                      <div className="flex-1" />
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md border border-white/[0.04] bg-white/[0.02]">
                        <kbd className="text-[9px] tracking-wider text-muted-foreground/30 font-mono">⌘</kbd>
                        <kbd className="text-[9px] tracking-wider text-muted-foreground/30 font-mono">K</kbd>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative mx-5 mb-2">
                      <div className="absolute inset-0 rounded-xl bg-white/[0.02] border border-white/[0.05]" />
                      <CommandInput
                        placeholder="O que você precisa?"
                        className="text-[13px] tracking-wide relative z-10"
                      />
                    </div>

                    {/* Separator */}
                    <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                    <CommandList className="max-h-[380px] py-2 px-2">
                      <CommandEmpty>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="py-14 text-center flex flex-col items-center gap-4"
                        >
                          <div className="relative">
                            <div className="h-12 w-12 rounded-2xl border border-white/[0.06] flex items-center justify-center bg-white/[0.02]">
                              <Sparkles className="h-5 w-5 text-muted-foreground/20" />
                            </div>
                            <div className="absolute -inset-2 rounded-2xl border border-white/[0.03] animate-pulse" style={{ animationDuration: "3s" }} />
                          </div>
                          <div>
                            <p className="text-[12px] text-muted-foreground/40 tracking-wider font-medium">
                              Nenhum resultado
                            </p>
                            <p className="text-[10px] text-muted-foreground/20 tracking-wider mt-1">
                              Tente "vendas", "criar" ou "marketing"
                            </p>
                          </div>
                        </motion.div>
                      </CommandEmpty>

                      <CommandGroup heading="Ações">
                        {quickActions.map((action) => (
                          <CommandItem
                            key={action.name}
                            value={action.action}
                            onSelect={handleSelect}
                            className="flex items-center gap-3 py-3 px-3 cursor-pointer rounded-xl group/item transition-all duration-300 data-[selected=true]:bg-primary/[0.06] data-[selected=true]:border-primary/10 border border-transparent mb-0.5"
                          >
                            <div className="h-9 w-9 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center group-hover/item:border-primary/20 group-hover/item:bg-primary/[0.06] group-hover/item:shadow-[0_0_20px_hsl(var(--primary)/0.1)] transition-all duration-500">
                              <action.icon className="h-4 w-4 text-muted-foreground/50 group-hover/item:text-primary transition-colors duration-300" />
                            </div>
                            <div className="flex-1 flex flex-col">
                              <span className="text-[13px] tracking-wide text-foreground/80 group-hover/item:text-foreground transition-colors font-medium">
                                {action.name}
                              </span>
                            </div>
                            <div className="h-6 w-6 rounded-lg border border-white/[0.04] bg-white/[0.01] flex items-center justify-center group-hover/item:border-primary/15 group-hover/item:bg-primary/[0.04] transition-all duration-300">
                              <ArrowRight className="h-3 w-3 text-muted-foreground/20 group-hover/item:text-primary/60 transition-all duration-300 group-hover/item:translate-x-0.5" />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>

                      <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

                      <CommandGroup heading="Test Drive">
                        {agentQuickList.map((agent) => (
                          <CommandItem
                            key={agent.key}
                            value={`agent:${agent.key}`}
                            onSelect={handleSelect}
                            className="flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-xl group/item transition-all duration-300 data-[selected=true]:bg-white/[0.03] border border-transparent data-[selected=true]:border-white/[0.04] mb-px"
                          >
                            <div className="h-8 w-8 rounded-lg border border-white/[0.04] bg-white/[0.01] flex items-center justify-center text-sm group-hover/item:border-white/[0.08] transition-all duration-300">
                              {agent.icon}
                            </div>
                            <span className="flex-1 text-[13px] tracking-wide text-foreground/60 group-hover/item:text-foreground transition-colors font-medium">
                              {agent.name}
                            </span>
                            <span className="text-[8px] text-muted-foreground/25 tracking-[0.2em] uppercase font-semibold group-hover/item:text-muted-foreground/40 transition-colors px-2 py-0.5 rounded border border-white/[0.03] bg-white/[0.01]">
                              {tierLabel(agent.tier)}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>

                      <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

                      <CommandGroup heading="Navegar">
                        {navigationItems.map((item) => (
                          <CommandItem
                            key={item.href}
                            value={item.href}
                            onSelect={handleSelect}
                            className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-xl group/item transition-all duration-300 data-[selected=true]:bg-white/[0.03] border border-transparent mb-px"
                          >
                            <item.icon className="h-3.5 w-3.5 text-muted-foreground/30 group-hover/item:text-foreground/60 transition-colors duration-300" />
                            <span className="text-[13px] tracking-wide text-foreground/50 group-hover/item:text-foreground/90 transition-colors">
                              {item.name}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>

                    {/* Footer status bar */}
                    <div className="relative px-5 py-3 flex items-center gap-3">
                      <div className="absolute top-0 inset-x-5 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50 opacity-75" style={{ animationDuration: "3s" }} />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary/70" />
                        </span>
                        <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/25 font-medium">Sistema ativo</span>
                      </div>
                      <div className="flex-1" />
                      <div className="flex items-center gap-2.5 text-[9px] tracking-wider text-muted-foreground/15">
                        <span>↑↓ navegar</span>
                        <span className="h-2.5 w-px bg-white/[0.04]" />
                        <span>↵ abrir</span>
                        <span className="h-2.5 w-px bg-white/[0.04]" />
                        <span>esc sair</span>
                      </div>
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
