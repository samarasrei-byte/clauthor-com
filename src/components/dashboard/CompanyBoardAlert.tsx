import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CompanyBoardAlertProps {
  onSetup: () => void;
}

export default function CompanyBoardAlert({ onSetup }: CompanyBoardAlertProps) {
  const { user } = useAuth();

  const { data: boardCount = 0 } = useQuery({
    queryKey: ["company-board-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("company_board")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  if (boardCount > 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-primary/5 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Seus agentes não conhecem sua empresa</h3>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sem informações da empresa, os agentes respondem de forma genérica. 
            Configure agora — cole a URL do seu site e a IA preenche tudo automaticamente.
          </p>
          <Button size="sm" onClick={onSetup} className="mt-2.5 gap-2 h-8 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Ensinar meus agentes
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {/* Decorative shimmer */}
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
    </motion.div>
  );
}
