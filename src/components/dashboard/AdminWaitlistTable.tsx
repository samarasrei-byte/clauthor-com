import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListOrdered, Search, Mail, Phone, Building } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdminWaitlistTableProps {
  waitlist: any[];
  waitingCount: number;
  locale: string;
}

export default function AdminWaitlistTable({ waitlist, waitingCount, locale }: AdminWaitlistTableProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = waitlist.filter(e =>
    (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.company || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-cyan-400" /> Waitlist ({waitlist.length})
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-cyan-500/20 text-cyan-400">{waitingCount} {t("dashboard.waiting", { defaultValue: "aguardando" })}</Badge>
          <div className="relative w-40">
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
                <th className="text-left p-3 text-muted-foreground font-medium">#</th>
                <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.name", { defaultValue: "Nome" })}</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
                <th className="text-left p-3 text-muted-foreground font-medium">WhatsApp</th>
                <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.company", { defaultValue: "Empresa" })}</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.date", { defaultValue: "Data" })}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry: any) => (
                <tr key={entry.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                  <td className="p-3"><span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{entry.position}</span></td>
                  <td className="p-3 font-medium">{entry.name || "-"}</td>
                  <td className="p-3 text-muted-foreground"><span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {entry.email}</span></td>
                  <td className="p-3 text-muted-foreground"><span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {entry.whatsapp}</span></td>
                  <td className="p-3 text-muted-foreground"><span className="flex items-center gap-1"><Building className="h-3 w-3" /> {entry.company || "-"}</span></td>
                  <td className="p-3"><Badge variant="secondary" className={entry.status === "waiting" ? "bg-cyan-500/10 text-cyan-400" : "bg-primary/20 text-primary"}>{entry.status === "waiting" ? t("dashboard.waiting", { defaultValue: "Aguardando" }) : entry.status}</Badge></td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(entry.created_at).toLocaleDateString(locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
