import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, ExternalLink, Send, Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Linkedin, Youtube } from "lucide-react";

/**
 * /settings/social — Conexões Sociais (per-user OAuth)
 * Cada cliente conecta a PRÓPRIA conta social. Tokens ficam por user_id.
 */

type ProviderKey = "linkedin" | "tiktok" | "x" | "youtube" | "meta";

interface ProviderDef {
  key: ProviderKey;
  name: string;
  brand: string;
  Icon: React.ComponentType<{ className?: string }>;
  permissions: string[];
  status: "ready" | "pending_credentials";
  helpText: string;
}

const XLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2H21l-6.53 7.462L22.5 22H16.09l-5.02-6.548L5.24 22H2.482l6.98-7.977L1.5 2h6.573l4.53 5.98L18.244 2Zm-1.14 18.34h1.518L7.02 3.564H5.39l11.714 16.777Z" />
  </svg>
);
const TikTokLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.36a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.79Z" />
  </svg>
);
const MetaLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm4.9 12.4c-.53 1.28-1.42 2.62-2.63 2.62-1.03 0-1.72-.67-2.87-2.5-.62-.98-1.32-2.24-1.87-3.16-.6.98-1.35 2.34-1.79 3.1-.98 1.72-1.72 2.56-2.66 2.56-1.29 0-2.35-1.14-2.8-2.72-.5-1.74-.5-3.8.02-5.28.55-1.6 1.66-2.62 3.01-2.62 1.32 0 2.24.83 3.34 2.62.62 1 1.3 2.2 1.87 3.11.57-.91 1.24-2.11 1.86-3.11 1.11-1.79 2.02-2.62 3.35-2.62 1.35 0 2.44 1.02 3 2.62.53 1.5.52 3.55 0 5.28-.05.05-.11.06-.15.1Z" />
  </svg>
);

const PROVIDERS: ProviderDef[] = [
  {
    key: "linkedin",
    name: "LinkedIn",
    brand: "text-[#0A66C2]",
    Icon: Linkedin,
    permissions: ["Ler perfil público", "Ler email", "Publicar posts em seu nome (w_member_social)"],
    status: "ready",
    helpText: "Conecte sua conta LinkedIn pessoal. Você poderá publicar posts e ver métricas dos últimos 30 dias.",
  },
  {
    key: "tiktok",
    name: "TikTok",
    brand: "text-foreground",
    Icon: TikTokLogo,
    permissions: ["Ler perfil", "Listar vídeos", "Publicar vídeos"],
    status: "pending_credentials",
    helpText: "Requer TIKTOK_CLIENT_ID e TIKTOK_CLIENT_SECRET no cofre de secrets antes do primeiro uso.",
  },
  {
    key: "x",
    name: "X (Twitter)",
    brand: "text-foreground",
    Icon: XLogo,
    permissions: ["Ler menções", "Publicar tweets", "Read & Write"],
    status: "pending_credentials",
    helpText: "Requer TWITTER_CONSUMER_KEY/SECRET com permissão Read & Write no portal do X Developer.",
  },
  {
    key: "youtube",
    name: "YouTube",
    brand: "text-[#FF0000]",
    Icon: Youtube,
    permissions: ["Upload de vídeos", "Ler analytics do canal", "Gerenciar playlists"],
    status: "pending_credentials",
    helpText: "Usa OAuth do Google. Requer GOOGLE_CLIENT_ID/SECRET com o escopo do YouTube ativado no Google Cloud Console.",
  },
  {
    key: "meta",
    name: "Instagram / Facebook",
    brand: "text-[#E4405F]",
    Icon: MetaLogo,
    permissions: ["Publicar em Página FB", "Publicar no Instagram Business", "Ler insights"],
    status: "ready",
    helpText: "Conecte sua conta Meta pessoal. O app listará automaticamente as Páginas do Facebook e contas Instagram Business vinculadas.",
  },
];

interface LinkedInMetrics {
  connected: boolean;
  token_valid?: boolean;
  profile?: { name?: string; avatar_url?: string; email?: string; linkedin_id?: string };
  session?: { connected_at?: string; expires_at?: string };
  metrics?: { total_published: number; total_failed: number; last_30_days_count: number };
  recent_posts?: Array<{ id: string; content: string; link_url?: string; status: string; created_at: string; linkedin_urn: string }>;
}

const SocialConnections = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [testingProvider, setTestingProvider] = useState<ProviderKey | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postLink, setPostLink] = useState("");

  const { data: linkedin, isLoading: liLoading } = useQuery<LinkedInMetrics>({
    queryKey: ["linkedin-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("linkedin-metrics", { body: {} });
      if (error) throw error;
      return data as LinkedInMetrics;
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  const { data: metaStatus } = useQuery<{ connected: boolean; connection: any }>({
    queryKey: ["meta-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("meta-oauth", { body: { action: "status" } });
      if (error) throw error;
      return data as { connected: boolean; connection: any };
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  // Trata callback OAuth (LinkedIn e Meta) via query params ?code=&state=
  // Se estiver em popup, processa e avisa a janela pai; caso contrário, processa inline.
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state || !user) return;

    const isPopup = !!window.opener && window.opener !== window;
    const storedProvider = sessionStorage.getItem("oauth_provider");
    const isMeta = state.startsWith(`meta:${user.id}:`) || (!state.startsWith("linkedin:") && storedProvider === "meta");
    const provider = isMeta ? "meta-oauth" : "hunter-linkedin-oauth";
    const label = isMeta ? "Meta" : "LinkedIn";
    const invalidateKey = isMeta ? "meta-status" : "linkedin-metrics";
    (async () => {
      try {
        const redirect_uri = window.location.origin + "/settings/social";
        const { error } = await supabase.functions.invoke(provider, {
          body: { action: "callback", code, redirect_uri },
        });
        if (error) throw error;
        sessionStorage.removeItem("oauth_provider");
        if (isPopup) {
          window.opener.postMessage({ type: "oauth:success", provider: isMeta ? "meta" : "linkedin", label, invalidateKey }, window.location.origin);
          window.close();
          return;
        }
        toast.success(`${label} conectado com sucesso!`);
        qc.invalidateQueries({ queryKey: [invalidateKey] });
        window.history.replaceState({}, "", "/settings/social");
      } catch (e) {
        const msg = (e as Error).message || "erro desconhecido";
        if (isPopup) {
          window.opener.postMessage({ type: "oauth:error", message: msg }, window.location.origin);
          window.close();
          return;
        }
        toast.error("Falha ao concluir conexão: " + msg);
      }
    })();
  }, [user, qc]);

  // Escuta mensagens do popup OAuth
  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      const d = ev.data as { type?: string; label?: string; invalidateKey?: string; message?: string };
      if (d?.type === "oauth:success") {
        toast.success(`${d.label} conectado com sucesso!`);
        if (d.invalidateKey) qc.invalidateQueries({ queryKey: [d.invalidateKey] });
      } else if (d?.type === "oauth:error") {
        toast.error("Falha ao concluir conexão: " + (d.message ?? ""));
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [qc]);

  const openOAuthPopup = (url: string) => {
    const w = 600, h = 720;
    const y = window.top!.outerHeight / 2 + window.top!.screenY - h / 2;
    const x = window.top!.outerWidth / 2 + window.top!.screenX - w / 2;
    const popup = window.open(url, "oauth_popup", `width=${w},height=${h},left=${x},top=${y},resizable=yes,scrollbars=yes`);
    if (!popup) toast.error("Popup bloqueado. Habilite popups para este site.");
  };

  const connectLinkedIn = useMutation({
    mutationFn: async () => {
      const redirect_uri = window.location.origin + "/settings/social";
      sessionStorage.setItem("oauth_provider", "linkedin");
      const { data, error } = await supabase.functions.invoke("hunter-linkedin-oauth", {
        body: { action: "authorize", redirect_uri },
      });
      if (error) throw error;
      openOAuthPopup((data as { url: string }).url);
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao iniciar OAuth"),
  });

  const disconnectLinkedIn = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("hunter-linkedin-oauth", { body: { action: "disconnect" } });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("LinkedIn desconectado");
      qc.invalidateQueries({ queryKey: ["linkedin-metrics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const connectMeta = useMutation({
    mutationFn: async () => {
      const redirect_uri = window.location.origin + "/settings/social";
      sessionStorage.setItem("oauth_provider", "meta");
      const { data, error } = await supabase.functions.invoke("meta-oauth", {
        body: { action: "authorize", redirect_uri },
      });
      if (error) throw error;
      openOAuthPopup((data as { url: string }).url);
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao iniciar OAuth Meta"),
  });

  const disconnectMeta = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("meta-oauth", { body: { action: "disconnect" } });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meta desconectado");
      qc.invalidateQueries({ queryKey: ["meta-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishPost = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("linkedin-publish", {
        body: { content: postContent, link_url: postLink || undefined },
      });
      if (error) throw error;
      return data as { urn: string; url: string };
    },
    onSuccess: (data) => {
      toast.success("Post publicado!", { action: { label: "Abrir", onClick: () => window.open(data.url, "_blank") } });
      setPublishOpen(false);
      setPostContent("");
      setPostLink("");
      qc.invalidateQueries({ queryKey: ["linkedin-metrics"] });
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao publicar"),
  });

  const testConnection = async (provider: ProviderKey) => {
    setTestingProvider(provider);
    try {
      const { data, error } = await supabase.functions.invoke("social-test-integration", { body: { provider } });
      if (error) throw error;
      const res = data as { ok: boolean; detail: string; latency_ms?: number };
      if (res.ok) {
        toast.success(`${provider.toUpperCase()} OK`, { description: `${res.detail} (${res.latency_ms}ms)` });
      } else {
        toast.warning(`${provider.toUpperCase()} indisponível`, { description: res.detail });
      }
    } catch (e) {
      toast.error("Erro no teste: " + (e as Error).message);
    } finally {
      setTestingProvider(null);
    }
  };

  const isLinkedInConnected = !!linkedin?.connected && !!linkedin?.token_valid;
  const isMetaConnected = !!metaStatus?.connected;

  const providerStatus = useMemo(() => {
    return PROVIDERS.map((p) => {
      if (p.key === "linkedin") {
        return { ...p, isConnected: isLinkedInConnected, subtitle: linkedin?.profile?.name || "" };
      }
      if (p.key === "meta") {
        const c = metaStatus?.connection;
        const parts: string[] = [];
        if (c?.pages?.length) parts.push(`${c.pages.length} página${c.pages.length > 1 ? "s" : ""}`);
        if (c?.instagram_accounts?.length) parts.push(`${c.instagram_accounts.length} IG`);
        return { ...p, isConnected: isMetaConnected, subtitle: c?.profile_name ? `${c.profile_name}${parts.length ? " • " + parts.join(" · ") : ""}` : "" };
      }
      return { ...p, isConnected: false, subtitle: "" };
    });
  }, [isLinkedInConnected, isMetaConnected, linkedin?.profile?.name, metaStatus?.connection]);

  return (
    <div className="h-full overflow-y-auto">
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-6 sm:py-10 lg:py-12 space-y-8 sm:space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          <Badge variant="outline" className="text-xs">OAuth por usuário</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-tight">Conexões Sociais</h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
          Cada cliente conecta sua própria conta. Os tokens ficam isolados por usuário e criptografados no cofre — a CLAUTHOR nunca compartilha credenciais entre workspaces.
        </p>
      </motion.div>

      {/* Provider cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">

        {providerStatus.map((p, i) => (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full border-border/60 hover:border-primary/40 transition-colors">
              <CardContent className="p-5 sm:p-6 lg:p-7 space-y-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                      <p.Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${p.brand}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-base truncate">{p.name}</div>
                      {p.subtitle && <div className="text-xs text-muted-foreground truncate">{p.subtitle}</div>}
                    </div>
                  </div>

                  {p.isConnected ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Conectado
                    </Badge>
                  ) : p.status === "pending_credentials" ? (
                    <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Aguardando setup
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <XCircle className="w-3 h-3 mr-1" /> Desconectado
                    </Badge>
                  )}
                </div>

                {/* Permissions */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissões</div>
                  <ul className="space-y-1.5">
                    {p.permissions.map((perm) => (
                      <li key={perm} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-muted-foreground italic leading-relaxed">{p.helpText}</p>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {p.key === "linkedin" && p.isConnected ? (
                    <>
                      <Button size="sm" onClick={() => setPublishOpen(true)}>
                        <Send className="w-3.5 h-3.5 mr-1.5" /> Publicar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => testConnection(p.key)} disabled={testingProvider === p.key}>
                        {testingProvider === p.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 mr-1.5" />}
                        Testar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => disconnectLinkedIn.mutate()} disabled={disconnectLinkedIn.isPending}>
                        Desconectar
                      </Button>
                    </>
                  ) : p.key === "linkedin" ? (
                    <Button size="sm" onClick={() => connectLinkedIn.mutate()} disabled={connectLinkedIn.isPending}>
                      {connectLinkedIn.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ExternalLink className="w-3.5 h-3.5 mr-1.5" />}
                      Conectar
                    </Button>
                  ) : p.key === "meta" && p.isConnected ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => testConnection(p.key)} disabled={testingProvider === p.key}>
                        {testingProvider === p.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 mr-1.5" />}
                        Testar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => disconnectMeta.mutate()} disabled={disconnectMeta.isPending}>
                        Desconectar
                      </Button>
                    </>
                  ) : p.key === "meta" ? (
                    <Button size="sm" onClick={() => connectMeta.mutate()} disabled={connectMeta.isPending}>
                      {connectMeta.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ExternalLink className="w-3.5 h-3.5 mr-1.5" />}
                      Conectar
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" disabled>
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Em breve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => testConnection(p.key)} disabled={testingProvider === p.key}>
                        {testingProvider === p.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 mr-1.5" />}
                        Testar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* LinkedIn metrics section */}
      {isLinkedInConnected && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-semibold">Métricas LinkedIn — últimos 30 dias</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4">
              <div className="text-2xl font-semibold">{linkedin?.metrics?.total_published ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Publicados no total</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="text-2xl font-semibold">{linkedin?.metrics?.last_30_days_count ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Últimos 30 dias</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="text-2xl font-semibold text-destructive">{linkedin?.metrics?.total_failed ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Falhas</div>
            </CardContent></Card>
          </div>

          {linkedin?.recent_posts && linkedin.recent_posts.length > 0 && (
            <Card>
              <CardContent className="p-0 divide-y divide-border/60">
                {linkedin.recent_posts.map((post) => (
                  <div key={post.id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={post.status === "published" ? "default" : "destructive"} className="text-xs">
                        {post.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    {post.status === "published" && (
                      <a
                        href={`https://www.linkedin.com/feed/update/${encodeURIComponent(post.linkedin_urn)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                      >
                        Ver no LinkedIn <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {liLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Carregando conexões...
        </div>
      )}

      {/* Publish Dialog */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Publicar no LinkedIn</DialogTitle>
            <DialogDescription>
              Como {linkedin?.profile?.name || "você"} — visibilidade pública.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="O que você quer compartilhar?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={6}
              maxLength={3000}
            />
            <div className="text-xs text-muted-foreground text-right">{postContent.length}/3000</div>
            <Input
              placeholder="URL para anexar (opcional)"
              value={postLink}
              onChange={(e) => setPostLink(e.target.value)}
              type="url"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>Cancelar</Button>
            <Button onClick={() => publishPost.mutate()} disabled={publishPost.isPending || postContent.trim().length < 3}>
              {publishPost.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Publicar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
};

export default SocialConnections;
