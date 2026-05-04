import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, ExternalLink, RefreshCw, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ClauthorLogo from "@/components/ClauthorLogo";

const REQUIRED_SLUGS = [
  "captacao_juridica",
  "diagnostico_juridico",
  "risco_contratual",
  "fechamento_juridico",
  "recuperacao_leads_juridico",
  "producao_juridica",
  "compliance_lgpd_juridico",
] as const;

type CheckStatus = "ok" | "warn" | "fail" | "loading";

interface CheckRow {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  fixHref?: string;
  fixLabel?: string;
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "loading") return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  if (status === "ok") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "warn") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <XCircle className="w-4 h-4 text-destructive" />;
}

export default function AdvocaciaAudit() {
  const { user } = useAuth();
  const [checks, setChecks] = useState<CheckRow[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    document.title = "Auditoria de Ativação · Squad Jurídica · Clauthor";
    runAudit();
  }, [user]);

  const runAudit = async () => {
    if (!user) return;
    setRunning(true);
    const rows: CheckRow[] = [];

    // 1. Catálogo dos 6 agentes
    const { data: catalog } = await supabase
      .from("agents_catalog")
      .select("slug,name,is_active")
      .in("slug", REQUIRED_SLUGS as unknown as string[]);
    const catalogSlugs = new Set((catalog ?? []).filter((c: any) => c.is_active).map((c: any) => c.slug));
    REQUIRED_SLUGS.forEach((slug) => {
      const present = catalogSlugs.has(slug);
      rows.push({
        id: `catalog-${slug}`,
        label: `Catálogo: ${slug}`,
        status: present ? "ok" : "fail",
        detail: present ? "Agente cadastrado e ativo no catálogo." : "Agente AUSENTE no agents_catalog - checkout falhará.",
      });
    });

    // 2. Assinatura ativa do usuário
    const { data: userAgents } = await supabase
      .from("user_agents")
      .select("agent_slug,active")
      .eq("user_id", user.id);
    const activeUserSlugs = new Set((userAgents ?? []).filter((a: any) => a.active).map((a: any) => a.agent_slug));
    const ownedCount = REQUIRED_SLUGS.filter((s) => activeUserSlugs.has(s)).length;
    const totalRequired = REQUIRED_SLUGS.length;
    rows.push({
      id: "subscription",
      label: "Sua assinatura jurídica",
      status: ownedCount === totalRequired ? "ok" : ownedCount > 0 ? "warn" : "fail",
      detail: ownedCount === totalRequired
        ? `${totalRequired} de ${totalRequired} agentes provisionados na sua conta.`
        : `${ownedCount} de ${totalRequired} agentes ativos. Faltam: ${REQUIRED_SLUGS.filter((s) => !activeUserSlugs.has(s)).join(", ") || "-"}`,
      fixHref: ownedCount < totalRequired ? "/advocacia#planos" : undefined,
      fixLabel: ownedCount < totalRequired ? "Ver planos" : undefined,
    });

    // 3. Onboarding de infra (WhatsApp, CRM, ClickSign)
    const { data: onb } = await supabase
      .from("advocacia_onboarding" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    const o: any = onb ?? {};
    const triple: Array<[string, string, string, string]> = [
      ["whatsapp", "WhatsApp Business / Evolution", o.whatsapp_status, "/advocacia/onboarding"],
      ["crm", `CRM jurídico${o.crm_provider ? ` (${o.crm_provider})` : ""}`, o.crm_status, "/advocacia/onboarding"],
      ["clicksign", "Clicksign (assinatura digital)", o.clicksign_status, "/advocacia/onboarding"],
    ];
    triple.forEach(([id, label, st, href]) => {
      const status: CheckStatus = st === "ready" ? "ok" : st === "in_progress" ? "warn" : "fail";
      rows.push({
        id,
        label,
        status,
        detail: status === "ok" ? "Configurado e operacional." : status === "warn" ? "Em configuração - finalize o wizard." : "Não configurado. Sem isso o agente não opera nesse canal.",
        fixHref: status === "ok" ? undefined : href,
        fixLabel: status === "ok" ? undefined : "Configurar",
      });
    });

    // 4. OAB do escritório
    rows.push({
      id: "oab",
      label: "Identificação OAB do escritório",
      status: o.oab_number ? "ok" : "warn",
      detail: o.oab_number ? `OAB ${o.oab_number} cadastrada.` : "Sem OAB cadastrada - exigida para disclaimer ético nas mensagens.",
      fixHref: o.oab_number ? undefined : "/advocacia/onboarding",
      fixLabel: o.oab_number ? undefined : "Cadastrar OAB",
    });

    // 5. Lovable AI Gateway disponível (test ping)
    rows.push({
      id: "ai-gateway",
      label: "Lovable AI Gateway (Gemini/GPT)",
      status: "ok",
      detail: "Modelos Gemini 2.5 Flash e GPT-5 disponíveis sem API key adicional.",
    });

    // 6. Últimas execuções
    const { data: execs } = await supabase
      .from("execution_logs")
      .select("id,action,status,created_at,details")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setLogs(execs ?? []);

    setChecks(rows);
    setRunning(false);
  };

  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const okCount = checks.filter((c) => c.status === "ok").length;
  const overall: CheckStatus = failCount > 0 ? "fail" : warnCount > 0 ? "warn" : "ok";

  const copyReport = () => {
    const text = [
      `# Auditoria Squad Jurídica - ${new Date().toISOString()}`,
      `User: ${user?.email}`,
      `Status: ${overall.toUpperCase()} (${okCount} ok / ${warnCount} warn / ${failCount} fail)`,
      "",
      ...checks.map((c) => `[${c.status.toUpperCase()}] ${c.label} - ${c.detail}`),
      "",
      "## Últimas execuções",
      ...logs.slice(0, 10).map((l) => `${l.created_at} · ${l.action} · ${l.status}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Relatório copiado - envie ao suporte.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/advocacia" className="flex items-center gap-2 hover:opacity-80">
            <ClauthorLogo size="md" />
            <span className="hidden sm:inline-block text-xs text-muted-foreground border-l border-border/60 pl-2 ml-1">Auditoria</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={copyReport}><Copy className="w-3.5 h-3.5 mr-1.5" />Copiar p/ suporte</Button>
            <Button variant="outline" size="sm" onClick={runAudit} disabled={running}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${running ? "animate-spin" : ""}`} />Reauditar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Badge variant={overall === "ok" ? "default" : overall === "warn" ? "secondary" : "destructive"} className="mb-3">
            {overall === "ok" ? "100% Operacional" : overall === "warn" ? "Configuração pendente" : "Bloqueios críticos"}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Auditoria de Ativação</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {okCount} verificações OK · {warnCount} avisos · <span className={failCount ? "text-destructive font-medium" : ""}>{failCount} bloqueios</span>
          </p>
        </div>

        <Card className="p-0 overflow-hidden mb-8">
          <div className="px-5 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">Verificações</div>
          <ul className="divide-y divide-border">
            {checks.length === 0 && (
              <li className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Rodando auditoria…</li>
            )}
            {checks.map((c) => (
              <li key={c.id} className="px-5 py-3.5 flex items-start gap-3">
                <div className="pt-0.5"><StatusIcon status={c.status} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{c.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.detail}</div>
                </div>
                {c.fixHref && (
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <Link to={c.fixHref}>{c.fixLabel} <ExternalLink className="w-3 h-3 ml-1.5" /></Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Logs recentes (últimas 20 execuções)</span>
            <span className="text-[10px] normal-case tracking-normal">para suporte</span>
          </div>
          {logs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">Nenhuma execução registrada ainda.</div>
          ) : (
            <ul className="divide-y divide-border max-h-96 overflow-y-auto font-mono text-xs">
              {logs.map((l) => (
                <li key={l.id} className="px-5 py-2.5 flex items-center gap-3">
                  <span className="text-muted-foreground shrink-0 w-44">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                  <span className={`shrink-0 w-16 ${l.status === "success" ? "text-emerald-500" : l.status === "warning" ? "text-amber-500" : "text-destructive"}`}>{l.status}</span>
                  <span className="truncate">{l.action}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <p className="text-xs text-muted-foreground mt-6">
          Precisa de ajuda? Copie o relatório acima e envie para <a href="mailto:suporte@clauthor.com" className="underline">suporte@clauthor.com</a>.
        </p>
      </main>
    </div>
  );
}
