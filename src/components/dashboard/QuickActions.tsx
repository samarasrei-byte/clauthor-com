import { motion } from "framer-motion";
import { Plus, Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const QuickActions = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex items-center gap-2"
    >
      <Link to="/outcomes">
        <Button size="sm" className="glow gap-1.5 font-medium">
          <Target className="h-3.5 w-3.5" />
          {t("dashboard.outcomes", { defaultValue: "Resultado" })}
        </Button>
      </Link>
      <Link to="/create-agent">
        <Button size="sm" variant="outline" className="gap-1.5 border-white/10">
          <Plus className="h-3.5 w-3.5" />
          {t("dashboard.new_agent", { defaultValue: "Novo Agente" })}
        </Button>
      </Link>
      <Link to="/library">
        <Button size="sm" variant="outline" className="gap-1.5 border-white/10">
          <Search className="h-3.5 w-3.5" />
          {t("dashboard.library", { defaultValue: "Biblioteca" })}
        </Button>
      </Link>
    </motion.div>
  );
};

export default QuickActions;
