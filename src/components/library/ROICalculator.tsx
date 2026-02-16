import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, Users, TrendingDown, DollarSign, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const ROICalculator = () => {
  const [employees, setEmployees] = useState(3);
  const [avgSalary, setAvgSalary] = useState(4500);

  const stats = useMemo(() => {
    const humanCost = employees * avgSalary;
    const agentCost = employees * 1899; // avg agent price
    const savings = humanCost - agentCost;
    const savingsPercent = humanCost > 0 ? Math.round((savings / humanCost) * 100) : 0;
    const yearSavings = savings * 12;
    return { humanCost, agentCost, savings, savingsPercent, yearSavings };
  }, [employees, avgSalary]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="holo-card rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg">Calculadora de ROI</h2>
          <p className="text-xs text-muted-foreground">Quanto você economiza com funcionários de IA?</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        {/* Employees Slider */}
        <div>
          <label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Funcionários a substituir
          </label>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8 border-white/10" onClick={() => setEmployees(Math.max(1, employees - 1))}>
              <Minus className="h-3 w-3" />
            </Button>
            <div className="flex-1">
              <Slider value={[employees]} onValueChange={([v]) => setEmployees(v)} min={1} max={20} step={1} />
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8 border-white/10" onClick={() => setEmployees(Math.min(20, employees + 1))}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-center text-2xl font-display font-bold mt-2 gradient-text">{employees}</p>
        </div>

        {/* Salary Slider */}
        <div>
          <label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Salário médio (R$)
          </label>
          <div className="flex-1">
            <Slider value={[avgSalary]} onValueChange={([v]) => setAvgSalary(v)} min={1500} max={15000} step={500} />
          </div>
          <p className="text-center text-2xl font-display font-bold mt-2 gradient-text">
            R$ {avgSalary.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.03] rounded-xl p-4 text-center border border-white/5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Custo Humano</p>
          <p className="font-display text-xl font-bold text-destructive/80">
            R$ {stats.humanCost.toLocaleString("pt-BR")}
          </p>
          <p className="text-[10px] text-muted-foreground">/mês</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-4 text-center border border-primary/10">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Custo ApexBot</p>
          <p className="font-display text-xl font-bold gradient-text">
            R$ {stats.agentCost.toLocaleString("pt-BR")}
          </p>
          <p className="text-[10px] text-muted-foreground">/mês</p>
        </div>
        <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/20 neon-border">
          <p className="text-[10px] uppercase tracking-wider text-primary mb-1 flex items-center justify-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Economia
          </p>
          <p className="font-display text-xl font-bold text-primary">
            {stats.savingsPercent}%
          </p>
          <p className="text-[10px] text-primary/70">
            R$ {stats.yearSavings.toLocaleString("pt-BR")}/ano
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ROICalculator;
