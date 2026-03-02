import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

interface AdminAgentsTableProps {
  allAgents: any[];
  locale: string;
}

export default function AdminAgentsTable({ allAgents, locale }: AdminAgentsTableProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = allAgents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.tier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" /> {t("dashboard.all_agents", { defaultValue: "Todos os Agentes" })} ({allAgents.length})
          </CardTitle>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder={t("dashboard.search", { defaultValue: "Buscar..." })} value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.name", { defaultValue: "Nome" })}</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Tier</th>
                <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.price", { defaultValue: "Preço" })}</th>
                <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.executions", { defaultValue: "Execuções" })}</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.created", { defaultValue: "Criado" })}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent: any) => (
                <tr key={agent.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                  <td className="p-3 font-medium">{agent.name}</td>
                  <td className="p-3"><Badge variant="secondary">{agent.tier}</Badge></td>
                  <td className="p-3">{new Intl.NumberFormat(locale, { style: "currency", currency: locale.startsWith("pt") ? "BRL" : "USD", minimumFractionDigits: 0 }).format(agent.monthly_price / 100)}</td>
                  <td className="p-3">{agent.total_executions}</td>
                  <td className="p-3"><Badge variant="secondary" className={agent.status === "active" ? "bg-primary/20 text-primary" : ""}>{agent.status}</Badge></td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(agent.created_at).toLocaleDateString(locale)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">{t("dashboard.no_results", { defaultValue: "Nenhum resultado encontrado." })}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
