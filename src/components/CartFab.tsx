import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useDeptSelection } from "@/stores/deptSelection";
import { formatBRL } from "@/data/departmentPackages";

/**
 * CartFab — pílula flutuante que aparece quando há departamentos no carrinho.
 * Some no próprio /checkout e em rotas admin/dashboard pra não poluir.
 */
const HIDDEN_PREFIXES = ["/checkout", "/dashboard", "/admin", "/auth", "/thor"];

export default function CartFab() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = useDeptSelection((s) => s.items);
  const total = useDeptSelection((s) => s.total());

  const hidden =
    HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p)) || items.length === 0;

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.button
          key="cart-fab"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2 }}
          onClick={() => navigate("/checkout")}
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
            right: "calc(env(safe-area-inset-right, 0px) + 1.25rem)",
          }}
          className="fixed z-40 group inline-flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-full border border-white/15 bg-black/80 backdrop-blur-md text-white shadow-2xl hover:border-white/30 transition-colors"
          aria-label={`Ver carrinho com ${items.length} ${items.length === 1 ? "departamento" : "departamentos"}`}
        >
          <span className="relative">
            <ShoppingBag className="w-4 h-4" strokeWidth={1.8} />
            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-[10px] font-semibold flex items-center justify-center">
              {items.length}
            </span>
          </span>
          <span className="text-sm font-medium">{formatBRL(total)}/mês</span>
          <span className="inline-flex items-center gap-1 text-xs text-white/60 pl-1 border-l border-white/10 ml-1">
            Checkout <ArrowRight className="w-3 h-3" />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
