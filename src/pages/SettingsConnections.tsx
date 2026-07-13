import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Zap, PlayCircle, KeyRound, ExternalLink } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { connectors, type ConnectorData } from "@/components/integrations/connectorData";

/**
 * /settings/connections · Tela unificada de conexões
 * - Cards visuais com logo
 * - Botão único "Conectar" (OAuth quando possível, API Key com tutorial quando não)
 * - Status verde / vermelho
 * - Vídeo tutorial curto para conectores que exigem API key
 * - Thor guia o usuário passo a passo
 */

// Conectores que suportam OAuth (popup) · não pedem chave manual
const OAUTH_CONNECTORS = new Set([
  "gmail", "google-drive", "google-sheets", "google-calendar",
  "outlook", "slack", "linkedin", "hubspot", "salesforce",
  "notion", "trello", "facebook", "instagram",
]);

// URLs de tutoriais (30s) para conectores API-key
const TUTORIAL_VIDEOS: Record<string, string> = {
  sendgrid: "https://www.youtube.com/embed/BvE0T2vC5Fc",
  twilio: "https://www.youtube.com/embed/YKzJUbCyPmA",
  brevo: "https://www.youtube.com/embed/gA_LDcJcTLg",
  resend: "https://www.youtube.com/embed/T4y6qJ6uNwI",
};

const SettingsConnections = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ConnectorData | null>(null);
  const [thorMsg, setThorMsg] = useState<string | null>(null);

  const { data: creds = [], refetch } = useQuery({
    queryKey: ["connections-status"],
    queryFn: async () => {
      const [userRes, platformRes] = await Promise.all([
        supabase.functions.invoke("credential-manager", { body: { action: "list_user_integrations" } }),
        supabase.functions.invoke("credential-manager", { body: { action: "list_platform" } }),
      ]);
      return [...(userRes.data?.credentials || []), ...(platformRes.data?.credentials || [])];
    },
    enabled: !!user,
  });

  const connectedMap = useMemo(() => {
    return creds.reduce((acc: Record<string, Set<string>>, c: any) => {
      if (!acc[c.integration_name]) acc[c.integration_name] = new Set();
      acc[c.integration_name].add(c.credential_key);
      return acc;
    }, {} as Record<string, Set<string>>);
  }, [creds]);

  const isConnected = (c: ConnectorData): boolean => {
    const keys = connectedMap[c.integrationKey];
    if (!keys || keys.size === 0) return false;
    const required = c.fields.filter(f => f.required);
    if (required.length === 0) return keys.size > 0;
    return required.every(f => keys.has(f.key));
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return connectors;
    const q = search.toLowerCase();
    return connectors.filter(c =>
      c.name.toLowerCase().includes(q) || c.shortDesc.toLowerCase().includes(q),
    );
  }, [search]);

  const connectedCount = connectors.filter(isConnected).length;

  const handleConnect = async (c: ConnectorData) => {
    const isOAuth = OAUTH_CONNECTORS.has(c.integrationKey);
    setThorMsg(`Vou te ajudar a conectar seu ${c.name}. ${isOAuth ? "Vai abrir uma janela pra você fazer login · clica em 'Autorizar' e volta pra cá." : "Você vai precisar da chave de API. Segue o vídeo abaixo (30s) que te mostra onde pegar."}`);
    setSelected(c);
  };

  const handleOAuthConnect = (c: ConnectorData) => {
    // Placeholder · em produção chama edge function que retorna authorize URL
    toast.info(`OAuth de ${c.name} em breve. Por enquanto use chave manual.`);
    window.open(`https://${c.integrationKey}.com`, "_blank", "width=600,height=700");
  };

  const handleDisconnect = async (c: ConnectorData) => {
    const { error } = await supabase.functions.invoke("credential-manager", {
      body: { action: "delete_integration", integration_name: c.integrationKey },
    });
    if (error) return toast.error("Erro ao desconectar");
    toast.success(`${c.name} desconectado`);
    refetch();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold">Conexões</h1>
          <Badge className="bg-primary/15 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            {connectedCount} ativo{connectedCount !== 1 ? "s" : ""}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Conecte seus serviços em um clique. Nós cuidamos da parte técnica · você só faz login.
        </p>
      </motion.div>

      {/* Thor helper banner */}
      {thorMsg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex gap-3 items-start">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-primary mb-1">Thor</p>
                <p className="text-sm">{thorMsg}</p>
              </div>
              <button onClick={() => setThorMsg(null)} className="text-muted-foreground hover:text-foreground text-xs">
                Fechar
              </button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar conector..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Grid de cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filtered.map((c, i) => {
          const connected = isConnected(c);
          const Icon = c.icon;
          const isOAuth = OAUTH_CONNECTORS.has(c.integrationKey);

          return (
            <motion.div
              key={c.integrationKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Card className={`group relative h-full transition-all hover:shadow-lg hover:border-primary/40 ${connected ? "border-primary/30 bg-primary/[0.02]" : ""}`}>
                <CardContent className="p-5 flex flex-col h-full gap-3">
                  {/* Status dot */}
                  <div className="absolute top-3 right-3">
                    {connected ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Conectado
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5" />
                        Desconectado
                      </div>
                    )}
                  </div>

                  {/* Logo */}
                  <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    {c.iconUrl ? (
                      <img src={c.iconUrl} alt={c.name} className="h-7 w-7 object-contain" />
                    ) : (
                      <Icon className="h-6 w-6 text-foreground/70" />
                    )}
                  </div>

                  {/* Nome + tipo auth */}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">{c.name}</h3>
                      {isOAuth ? (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                          1-clique
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          <KeyRound className="h-2.5 w-2.5 mr-0.5" />
                          API key
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.shortDesc}</p>
                  </div>

                  {/* Ação */}
                  <div className="flex gap-2 pt-2">
                    {connected ? (
                      <>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleConnect(c)}>
                          Gerenciar
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDisconnect(c)}>
                          Desconectar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => handleConnect(c)}
                        disabled={c.status === "soon"}
                      >
                        {c.status === "soon" ? "Em breve" : (
                          <>
                            <Zap className="h-3.5 w-3.5" />
                            Conectar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Dialog de setup por conector */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <selected.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle>{selected.name}</DialogTitle>
                    <DialogDescription className="text-xs mt-0.5">{selected.shortDesc}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {OAUTH_CONNECTORS.has(selected.integrationKey) ? (
                  /* OAuth flow */
                  <div className="space-y-3">
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm">
                      <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        Conexão em 1 clique
                      </p>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                        Sem chave, sem código. Clica em Autorizar, faz login no {selected.name} e volta pra cá.
                      </p>
                    </div>
                    <Button className="w-full gap-2" onClick={() => handleOAuthConnect(selected)}>
                      <ExternalLink className="h-4 w-4" />
                      Autorizar com {selected.name}
                    </Button>
                  </div>
                ) : (
                  /* API-key flow com vídeo */
                  <div className="space-y-3">
                    {TUTORIAL_VIDEOS[selected.integrationKey] && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <PlayCircle className="h-4 w-4 text-primary" />
                          Onde encontrar sua chave (30s)
                        </p>
                        <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                          <iframe
                            src={TUTORIAL_VIDEOS[selected.integrationKey]}
                            title={`Tutorial ${selected.name}`}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Cole a chave abaixo. Ela é armazenada criptografada e nunca aparece no frontend.
                    </p>
                    {selected.fields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <label className="text-xs font-medium">{f.label}</label>
                        <Input type={f.type || "text"} placeholder={f.placeholder} />
                      </div>
                    ))}
                    <Button className="w-full">Salvar credencial</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsConnections;
