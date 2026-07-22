/**
 * WhatsAppPair · pareamento de nova instância WhatsApp via QR Code (Evolution API).
 *
 * Fluxo:
 * 1. Usuário informa nome da campanha + telefone (ex: 5511947009430).
 * 2. Clica em "Gerar QR" → chama edge function whatsapp-pair-qr.
 * 3. Escaneia o QR pelo app WhatsApp do celular (Aparelhos conectados).
 * 4. Polling verifica quando a instância conectou (state = "open").
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Smartphone, Loader2, CheckCircle2, RefreshCw, Phone } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";

type PairState = "idle" | "loading" | "waiting" | "connected" | "error";

interface PairResponse {
  connected: boolean;
  instance: string;
  state: string;
  qr_base64?: string | null;
  pairing_code?: string | null;
}

// Normaliza input do usuário: mantém só dígitos (Evolution/WhatsApp esperam E.164 sem "+").
function normalizePhone(raw: string) {
  return raw.replace(/\D/g, "");
}

export default function WhatsAppPair() {
  const [params] = useSearchParams();
  const [campaign, setCampaign] = useState(params.get("campaign") ?? "primeira campanha MLS");
  const [dateLabel, setDateLabel] = useState(params.get("date") ?? "22/07/2026");
  const [phone, setPhone] = useState(params.get("phone") ?? "5511947009430");

  const [state, setState] = useState<PairState>("idle");
  const [qr, setQr] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [instance, setInstance] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const cleanPhone = useMemo(() => normalizePhone(phone), [phone]);
  const phoneValid = cleanPhone.length >= 12 && cleanPhone.length <= 15;

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  async function requestQr() {
    if (!phoneValid) {
      toast.error("Telefone inválido. Use o formato internacional, ex: 5511947009430.");
      return;
    }
    setState("loading");
    setErrorMsg(null);
    setQr(null);
    setPairingCode(null);
    try {
      const { data, error } = await supabase.functions.invoke<PairResponse>("whatsapp-pair-qr", {
        body: {
          phone: cleanPhone,
          label: campaign.trim() || "campanha",
          started_at: dateLabel,
        },
      });
      if (error) throw error;
      if (!data) throw new Error("Resposta vazia da API.");

      setInstance(data.instance);
      if (data.connected || data.state === "open") {
        setState("connected");
        toast.success("WhatsApp já está pareado nesta instância.");
        return;
      }
      setQr(data.qr_base64 ?? null);
      setPairingCode(data.pairing_code ?? null);
      setState("waiting");
      startPolling(data.instance);
    } catch (e: any) {
      const msg = e?.message ?? "Falha ao gerar QR.";
      setErrorMsg(msg);
      setState("error");
      toast.error(msg);
    }
  }

  function startPolling(inst: string) {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke<PairResponse>("whatsapp-pair-qr", {
          body: { phone: cleanPhone, label: campaign.trim(), started_at: dateLabel },
        });
        if (!data) return;
        if (data.connected || data.state === "open") {
          setState("connected");
          if (pollRef.current) window.clearInterval(pollRef.current);
          toast.success(`Instância ${inst} conectada com sucesso.`);
        } else if (data.qr_base64 && data.qr_base64 !== qr) {
          setQr(data.qr_base64);
        }
      } catch {
        // silencioso — o polling continua e usuário pode clicar em "Atualizar QR"
      }
    }, 5000);
  }

  const qrSrc = qr
    ? qr.startsWith("data:")
      ? qr
      : `data:image/png;base64,${qr}`
    : null;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <SEO title="Parear WhatsApp · Clauthor" description="Escaneie o QR para conectar uma nova instância WhatsApp ao seu tenant." />

      <Card>
        <CardHeader>
          <CardTitle className="dash-title flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" /> Nova instância WhatsApp
          </CardTitle>
          <CardDescription className="dash-label">
            Registre o número, gere o QR e escaneie no app WhatsApp em <span className="font-medium">Aparelhos conectados</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="campaign" className="dash-label">Nome da campanha</Label>
              <Input
                id="campaign"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="primeira campanha MLS"
                disabled={state === "waiting" || state === "loading"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="dash-label">Data</Label>
              <Input
                id="date"
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
                placeholder="22/07/2026"
                disabled={state === "waiting" || state === "loading"}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone" className="dash-label flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Telefone (formato internacional, sem +)
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="5511947009430"
                disabled={state === "waiting" || state === "loading"}
              />
              {!phoneValid && phone.length > 0 && (
                <p className="text-xs text-destructive">Use o padrão DDI+DDD+número (ex: 5511947009430).</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={requestQr} disabled={!phoneValid || state === "loading"} className="gap-2">
              {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              {state === "waiting" || state === "connected" ? "Atualizar QR" : "Gerar QR Code"}
            </Button>
            {instance && (
              <Badge variant="secondary" className="font-mono text-xs">instância: {instance}</Badge>
            )}
            {state === "connected" && (
              <Badge className="gap-1 bg-success/15 text-success border-success/30">
                <CheckCircle2 className="w-3 h-3" /> Conectado
              </Badge>
            )}
          </div>

          {errorMsg && (
            <div className="text-sm p-3 rounded-md border border-destructive/30 bg-destructive/5 text-destructive">
              {errorMsg}
            </div>
          )}

          {(qrSrc || pairingCode) && state !== "connected" && (
            <div className="rounded-lg border border-border/60 bg-card/40 p-5 flex flex-col md:flex-row gap-6 items-center">
              {qrSrc && (
                <img
                  src={qrSrc}
                  alt="QR Code para parear WhatsApp"
                  className="w-56 h-56 rounded-md bg-white p-2 border"
                />
              )}
              <div className="space-y-3 flex-1">
                <p className="dash-title text-base">Como escanear</p>
                <ol className="text-sm space-y-1.5 text-muted-foreground list-decimal list-inside">
                  <li>Abra o WhatsApp no celular <span className="font-mono">{phone}</span>.</li>
                  <li>Toque em <span className="font-medium">Configurações → Aparelhos conectados → Conectar aparelho</span>.</li>
                  <li>Aponte a câmera para este QR.</li>
                  <li>Aguarde — esta tela detecta a conexão automaticamente.</li>
                </ol>
                {pairingCode && (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Ou use o código: </span>
                    <span className="font-mono font-bold tracking-widest text-primary">{pairingCode}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <RefreshCw className="w-3 h-3 animate-spin" /> aguardando pareamento…
                </div>
              </div>
            </div>
          )}

          {state === "connected" && (
            <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>
                Campanha <strong>{campaign}</strong> ({dateLabel}) conectada ao número <strong>{phone}</strong>. Já pode enviar mensagens pela caixa de entrada.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
