import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, CheckCircle, X, Settings2 } from "lucide-react";
import { connectors, categories, type ConnectorData } from "@/components/integrations/connectorData";
import ConnectorDetailDialog from "@/components/integrations/ConnectorDetailDialog";
import WhatsAppSetupGuide from "@/components/dashboard/WhatsAppSetupGuide";
import SendGridSetupGuide from "@/components/dashboard/SendGridSetupGuide";
import LinkedInSetupGuide from "@/components/dashboard/LinkedInSetupGuide";
import MetaAdsSetupGuide from "@/components/dashboard/MetaAdsSetupGuide";
import IntegrationsTutorial from "@/components/integrations/IntegrationsTutorial";

const SORT_OPTIONS = [
  { value: "popular", label: "Mais populares" },
  { value: "name", label: "A-Z" },
  { value: "recent", label: "Recentes" },
];

const IntegrationsPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedConnector, setSelectedConnector] = useState<ConnectorData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeSetup, setActiveSetup] = useState<string | null>(null);

  const { data: connectedCreds = [], refetch: refetchCreds } = useQuery({
    queryKey: ["integration-status"],
    queryFn: async () => {
      // Fetch both user integrations and platform credentials
      const [userRes, platformRes] = await Promise.all([
        supabase.functions.invoke("credential-manager", {
          body: { action: "list_user_integrations" },
        }),
        supabase.functions.invoke("credential-manager", {
          body: { action: "list_platform" },
        }),
      ]);
      const userCreds = userRes.data?.credentials || [];
      const platformCreds = platformRes.data?.credentials || [];
      return [...userCreds, ...platformCreds];
    },
    enabled: !!user,
  });

  const connectedMap = connectedCreds.reduce((acc: Record<string, Set<string>>, c: any) => {
    if (!acc[c.integration_name]) acc[c.integration_name] = new Set();
    acc[c.integration_name].add(c.credential_key);
    return acc;
  }, {} as Record<string, Set<string>>);

  const isConnected = (c: ConnectorData) => {
    const keys = connectedMap[c.integrationKey];
    if (!keys || keys.size === 0) return false;
    const required = c.fields.filter(f => f.required);
    if (required.length === 0) return keys.size > 0;
    return required.every(f => keys.has(f.key));
  };

  const filtered = useMemo(() => {
    let list = connectors;
    if (category !== "Todas") list = list.filter(c => c.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.shortDesc.toLowerCase().includes(q) ||
        c.tools.some(t => t.toLowerCase().includes(q))
      );
    }
    if (sortBy === "popular") list = [...list].sort((a, b) => (a.popularity || 99) - (b.popularity || 99));
    else if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [category, search, sortBy]);

  const openDetail = (c: ConnectorData) => {
    setSelectedConnector(c);
    setDetailOpen(true);
  };

  // Setup guides
  if (activeSetup) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setActiveSetup(null)} className="gap-1 mb-2">
          ← Voltar para Conectores
        </Button>
        {activeSetup === "whatsapp" && <WhatsAppSetupGuide />}
        {activeSetup === "email" && <SendGridSetupGuide />}
        {activeSetup === "linkedin" && <LinkedInSetupGuide />}
        {activeSetup === "meta-ads" && <MetaAdsSetupGuide />}
      </div>
    );
  }

  const connectedCount = connectors.filter(c => isConnected(c)).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold">Conectores</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          Conecte os agentes Clauthor aos seus aplicativos, arquivos e serviços. Os conectores permitem que seus agentes acessem dados e executem ações em ferramentas externas.
        </p>
      </motion.div>

      {/* Interactive tutorial */}
      <IntegrationsTutorial />



      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Procurar conectores..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 bg-muted/10 border-border/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px] h-10 bg-muted/10 border-border/30">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px] h-10 bg-muted/10 border-border/30">
            <SelectValue placeholder="Categorias" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Connected count + manage button */}
      <div className="flex items-center gap-3">
        {connectedCount > 0 && (
          <Badge className="bg-primary/15 text-primary border-primary/20 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            {connectedCount} conectado{connectedCount > 1 ? "s" : ""}
          </Badge>
        )}
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setActiveSetup("whatsapp")}>
          <Settings2 className="h-3.5 w-3.5" />
          Gerenciar conectores
        </Button>
      </div>

      {/* Connector Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {filtered.map((connector, i) => {
          const connected = isConnected(connector);
          const popularityLabel = connector.popularity === 1
            ? "Mais popular"
            : connector.popularity
              ? `#${connector.popularity} popular`
              : null;

          return (
            <motion.button
              key={connector.integrationKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => openDetail(connector)}
              className={`group relative flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 hover:bg-muted/10 ${
                connected
                  ? "border-primary/25 bg-primary/[0.02]"
                  : "border-border/30 bg-card/50"
              } ${connector.status === "soon" ? "opacity-60" : ""}`}
            >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                connected ? "bg-primary/15" : "bg-muted/20"
              }`}>
                {connector.iconUrl ? (
                  <img src={connector.iconUrl} alt={connector.name} className="w-6 h-6 rounded" />
                ) : (
                  <connector.icon className={`h-5 w-5 ${connected ? "text-primary" : "text-muted-foreground"}`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-semibold text-sm">{connector.name}</h3>
                  {popularityLabel && (
                    <span className="text-[10px] text-muted-foreground/60">{popularityLabel}</span>
                  )}
                  {connector.apiStatus === "live" && (
                    <span className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      API ativa
                    </span>
                  )}
                  {connector.apiStatus === "beta" && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Beta
                    </span>
                  )}
                  {connector.apiStatus === "soon" && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border/40">
                      Em breve
                    </span>
                  )}
                  {connected && (
                    <span className="flex items-center gap-0.5 text-[9px] text-emerald-500 font-medium ml-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Vinculado
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{connector.shortDesc}</p>
                {connector.apiStatus === "live" && !connected && (
                  <p className="text-[10px] text-primary/60 mt-0.5">Conecte suas credenciais para habilitar automações reais</p>
                )}
              </div>

              {/* Action */}
              <div className="shrink-0">
                {connector.status === "soon" ? (
                  <Badge variant="secondary" className="text-[10px]">Em breve</Badge>
                ) : connected ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhum conector encontrado para "{search}"</p>
        </div>
      )}

      {/* Detail Dialog */}
      <ConnectorDetailDialog
        connector={selectedConnector}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        connectedKeys={selectedConnector ? (connectedMap[selectedConnector.integrationKey] || new Set()) : new Set()}
        onSaved={refetchCreds}
      />
    </div>
  );
};

export default IntegrationsPage;
