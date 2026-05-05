import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Headphones, DollarSign, Megaphone, ArrowRight, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import thorPhoto from "@/assets/kaelis-ai.webp";

interface FirstAccessOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const PAIN_POINTS = [
  {
    id: "vendas",
    label: "Vendas",
    icon: ShoppingCart,
    agents: [
      { name: "SDR Outbound Lead", slug: "sdr-outbound" },
      { name: "Sales Closer", slug: "sales-closer" },
      { name: "CRM Manager", slug: "crm-manager" },
    ],
  },
  {
    id: "atendimento",
    label: "Atendimento",
    icon: Headphones,
    agents: [
      { name: "Support Channel", slug: "support-channel" },
      { name: "Omnichannel Agent", slug: "omnichannel" },
      { name: "Ticket Resolver", slug: "ticket-resolver" },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: DollarSign,
    agents: [
      { name: "CFO Agent", slug: "cfo-assistant" },
      { name: "Invoice Manager", slug: "invoice-manager" },
      { name: "Revenue Tracker", slug: "revenue-tracker" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    agents: [
      { name: "Content Creator", slug: "content-creator" },
      { name: "Social Media Manager", slug: "social-media" },
      { name: "Growth Hacker", slug: "growth-hacker" },
    ],
  },
];

const FirstAccessOnboarding = ({ isOpen, onClose, userName }: FirstAccessOnboardingProps) => {
  const [step, setStep] = useState<"question" | "recommendation">("question");
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const selectedPain = PAIN_POINTS.find(p => p.id === selected);

  const handleSelect = (id: string) => {
    setSelected(id);
    setStep("recommendation");
  };

  const handleActivate = () => {
    onClose();
    navigate("/library");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-lg w-full rounded-2xl border border-primary/20 bg-card p-8 shadow-2xl"
          >
            {/* Thor avatar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-accent-violet/30 shadow-lg shadow-accent-violet/20">
                <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-display font-bold text-base">Thor</p>
                <p className="font-mono text-[10px] text-accent-emerald uppercase tracking-wider">Online</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === "question" ? (
                <motion.div key="q" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <p className="text-sm text-foreground/90 leading-relaxed mb-6">
                    Bem-vindo{userName ? `, ${userName}` : ""}! 👋
                    <br /><br />
                    Me conta em uma frase: <span className="text-primary font-semibold">qual é o maior problema da sua operação hoje?</span>
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {PAIN_POINTS.map((pain) => (
                      <button
                        key={pain.id}
                        onClick={() => handleSelect(pain.id)}
                        className="group p-4 rounded-xl border border-border hover:border-primary/30 bg-muted/10 hover:bg-primary/5 transition-all duration-300 text-left"
                      >
                        <pain.icon className="h-5 w-5 text-primary/60 group-hover:text-primary mb-2 transition-colors" strokeWidth={1.5} />
                        <p className="font-display font-semibold text-sm">{pain.label}</p>
                      </button>
                    ))}
                  </div>

                  <button onClick={onClose} className="w-full mt-4 text-center text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors font-mono">
                    Pular por agora
                  </button>
                </motion.div>
              ) : (
                <motion.div key="r" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <p className="text-sm text-foreground/90 leading-relaxed mb-5">
                    Perfeito! Para <span className="text-primary font-semibold">{selectedPain?.label}</span>, recomendo estes 3 agentes:
                  </p>

                  <div className="space-y-2.5 mb-6">
                    {selectedPain?.agents.map((agent, i) => (
                      <motion.div
                        key={agent.slug}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/10"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{agent.name}</p>
                        </div>
                        <Sparkles className="h-3.5 w-3.5 text-primary/40" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleActivate} className="flex-1 h-11 rounded-xl gap-2">
                      <Sparkles className="h-3.5 w-3.5" />
                      Ativar esses agentes
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" onClick={onClose} className="h-11 rounded-xl px-4">
                      Depois
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstAccessOnboarding;
