/**
 * ThorFirstTouchWelcome · o Thor abordando o usuário na primeira entrada
 * do painel. Objetivo: nenhum cliente (jovem, sênior, técnico ou leigo)
 * pode se sentir perdido — ele é recebido pelo nome, com os departamentos
 * contratados listados e a promessa explícita de acompanhamento (tokens,
 * aprovações, próximos passos).
 *
 * Regras de exibição:
 * - Aparece 1x por usuário (localStorage `clauthor-thor-first-touch-<uid>`).
 * - Precisa de perfil carregado + pelo menos 1 departamento contratado.
 * - Não colide com PostPaymentCelebration (aguarda 800ms para dar espaço).
 * - Fecha por: "Entendi, vamos lá" (dismiss silencioso) ou "Me guia agora"
 *   (leva o usuário para a seção Omnix, onde o Thor conversa).
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Bell, Compass, Building2, Sparkles, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onGuideMe?: () => void;
  /** Segundos até abrir, para não competir com celebrations. Default 900ms. */
  openDelayMs?: number;
}

const STORAGE_KEY = "clauthor-thor-first-touch";

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function ThorFirstTouchWelcome({ onGuideMe, openDelayMs = 900 }: Props) {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  // Departamentos ativos do usuário
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["thor-first-touch-depts", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("contracted_departments")
        .select("department_name, department_slug, status, created_at")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return (data ?? []) as Array<{ department_name: string; department_slug: string | null }>;
    },
  });

  const firstName = useMemo(() => {
    const full = (user?.user_metadata?.full_name as string | undefined) || user?.email || "";
    return full.split(/[ @]/)[0] || "guerreiro";
  }, [user]);

  const storageKey = user ? `${STORAGE_KEY}-${user.id}` : null;

  useEffect(() => {
    if (!storageKey || isLoading) return;
    if (typeof window === "undefined") return;
    // Admin não precisa desse toque (tem acesso total ao catálogo)
    if (isAdmin) return;
    // Só aparece quando há departamento ativo — se o usuário ainda não
    // contratou nada, o empty state cuida.
    if (departments.length === 0) return;
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch { /* ignore */ }
    const t = setTimeout(() => setOpen(true), openDelayMs);
    return () => clearTimeout(t);
  }, [storageKey, isLoading, isAdmin, departments.length, openDelayMs]);

  const dismiss = (reason: "understood" | "guide" | "close") => {
    if (storageKey) {
      try { localStorage.setItem(storageKey, new Date().toISOString()); } catch { /* ignore */ }
    }
    setOpen(false);
    if (reason === "guide") onGuideMe?.();
  };

  const deptList = departments.slice(0, 4);
  const extra = Math.max(0, departments.length - deptList.length);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : dismiss("close"))}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-primary/30 bg-card/95 backdrop-blur-2xl shadow-2xl rounded-2xl">
        <VisuallyHidden>
          <DialogTitle>Thor te recebe no painel</DialogTitle>
          <DialogDescription>Primeira apresentação personalizada do Thor com seus departamentos.</DialogDescription>
        </VisuallyHidden>

        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <button
          onClick={() => dismiss("close")}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-7 space-y-5">
          {/* Header + avatar Thor */}
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="relative shrink-0"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-background border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
              </span>
            </motion.div>
            <div className="flex-1 space-y-1.5">
              <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-widest gap-1 border-primary/40 text-primary">
                Thor · online
              </Badge>
              <h2 className="font-display font-bold text-xl leading-tight">
                Opa, {firstName}! Tô aqui — não vai ficar perdido não.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sou o Thor, seu copiloto. Vi que você já ativou {departments.length === 1 ? "o departamento" : `${departments.length} departamentos`} —
                pode deixar comigo, vou te guiar em tudo daqui pra frente.
              </p>
            </div>
          </div>

          {/* Departamentos contratados */}
          <AnimatePresence>
            {deptList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-2"
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  Seu time ativo
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {deptList.map((d) => (
                    <Badge key={d.department_slug ?? d.department_name} className="text-xs bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20">
                      {d.department_name}
                    </Badge>
                  ))}
                  {extra > 0 && (
                    <Badge variant="outline" className="text-xs">+{extra} outros</Badge>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Promessas do Thor */}
          <div className="space-y-2.5">
            <PromiseRow
              icon={<Coins className="h-4 w-4 text-primary" />}
              title="Vou te avisar sobre os tokens"
              desc="Quando o consumo subir demais eu apareço aqui antes de você ficar sem."
            />
            <PromiseRow
              icon={<Bell className="h-4 w-4 text-primary" />}
              title="Alertas do que importa"
              desc="Aprovações pendentes, agentes travados e oportunidades — chego junto."
            />
            <PromiseRow
              icon={<Compass className="h-4 w-4 text-primary" />}
              title="Se travar, é só me chamar"
              desc={`Clique em "Me guia agora" e eu abro o comando de voz e chat pra você.`}
            />
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button onClick={() => dismiss("guide")} className="gap-2 flex-1">
              Me guia agora
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => dismiss("understood")} className="flex-1">
              Entendi, vou explorar
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Você não verá esta boas-vindas de novo. Tô sempre no botão flutuante do painel.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PromiseRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/30 p-3"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
      </div>
    </motion.div>
  );
}
