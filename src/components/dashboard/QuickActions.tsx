import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import NotificationPanel from "./NotificationPanel";

const QuickActions = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex items-center gap-2"
    >
      <Link to="/create-agent">
        <Button size="sm" className="glow gap-1.5 font-medium">
          <Plus className="h-3.5 w-3.5" />
          Novo Agente
        </Button>
      </Link>
      <Link to="/library">
        <Button size="sm" variant="outline" className="gap-1.5 border-white/10">
          <Search className="h-3.5 w-3.5" />
          Biblioteca
        </Button>
      </Link>
      <NotificationPanel />
    </motion.div>
  );
};

export default QuickActions;
