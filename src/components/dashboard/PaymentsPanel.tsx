import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard, Wallet, Globe, QrCode,
  ArrowUpRight, Shield, CheckCircle2, Clock,
  Banknote, Coins, Lock, ExternalLink, Settings, Smartphone
} from "lucide-react";

interface PaymentsPanelProps {
  totalRevenue: number;
  subscriptionCount: number;
}

const PaymentsPanel = ({ totalRevenue, subscriptionCount }: PaymentsPanelProps) => {
  const gateways = [
    {
      name: "PayPal",
      description: "Pagamentos internacionais via PayPal",
      icon: Globe,
      status: "active",
      color: "from-blue-500/20 to-indigo-500/10",
      borderColor: "border-blue-500/30",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      badge: "Ativo",
      badgeClass: "bg-blue-500/10 text-blue-400",
      volume: "R$ " + (totalRevenue / 100).toLocaleString("pt-BR"),
      share: 100,
      features: ["Checkout global", "Multi-moeda", "Proteção ao comprador"],
    },
  ];

  const quickStats = [
    { label: "Volume Total", value: `R$ ${(totalRevenue / 100).toLocaleString("pt-BR")}`, icon: Banknote, color: "text-emerald-400" },
    { label: "Assinaturas Ativas", value: subscriptionCount.toString(), icon: Coins, color: "text-cyan-400" },
    { label: "Taxa Média", value: "1.2%", icon: ArrowUpRight, color: "text-amber-400" },
    { label: "Segurança", value: "PCI-DSS", icon: Shield, color: "text-violet-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> Central de Pagamentos
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Gerencie todos os gateways e métodos de pagamento</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-[10px]">
              <Lock className="h-3 w-3 mr-1" /> Ambiente Seguro
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl p-4 glass-hover"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="font-display text-xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Payment Gateways */}
      <div className="grid md:grid-cols-2 gap-4">
        {gateways.map((gw, i) => (
          <motion.div
            key={gw.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
          >
            <Card className={`relative overflow-hidden bg-gradient-to-br ${gw.color} border ${gw.borderColor} hover:scale-[1.01] transition-all duration-300`}>
              {/* Subtle glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/[0.02] blur-3xl" />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${gw.iconBg} flex items-center justify-center border border-white/[0.06]`}>
                      <gw.icon className={`h-5 w-5 ${gw.iconColor}`} />
                    </div>
                    <div>
                      <CardTitle className="font-display text-base">{gw.name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{gw.description}</p>
                    </div>
                  </div>
                  <Badge className={`${gw.badgeClass} text-[10px]`}>
                    {gw.status === "active" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                    {gw.badge}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Volume */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground">Volume processado</span>
                    <span className="font-display text-sm font-bold">{gw.volume}</span>
                  </div>
                  {gw.share > 0 && (
                    <Progress value={gw.share} className="h-1.5" />
                  )}
                  {gw.share > 0 && (
                    <p className="text-[9px] text-muted-foreground mt-1">{gw.share}% do volume total</p>
                  )}
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5">
                  {gw.features.map((f) => (
                    <span key={f} className="px-2 py-1 rounded-lg bg-background/30 text-[9px] text-muted-foreground border border-white/[0.04]">
                      {f}
                    </span>
                  ))}
                </div>

                {/* Action */}
                <Button 
                  variant={gw.status === "active" ? "ghost" : "default"} 
                  size="sm" 
                  className={`w-full text-xs gap-1.5 ${gw.status === "active" ? "hover:bg-white/[0.04]" : ""}`}
                >
                  {gw.status === "active" ? (
                    <><Settings className="h-3 w-3" /> Gerenciar Gateway</>
                  ) : (
                    <><ExternalLink className="h-3 w-3" /> Configurar Integração</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Security Footer */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center gap-4 py-3 text-[10px] text-muted-foreground/50"
      >
        <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> PCI-DSS Compliant</span>
        <span>•</span>
        <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> SSL/TLS 256-bit</span>
        <span>•</span>
        <span>Tokenização end-to-end</span>
      </motion.div>
    </div>
  );
};

export default PaymentsPanel;
