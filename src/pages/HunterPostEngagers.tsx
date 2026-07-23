import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Sparkles, Users, MessageSquare, ArrowRight, Loader2, CheckCircle2, Bot } from "lucide-react";
import { toast } from "sonner";
import { getSocialSellerConfig } from "@/components/inbox/SocialSellerToggle";
import { Link } from "react-router-dom";

type Engager = {
  name: string;
  headline: string;
  reaction: "like" | "comment";
  snippet?: string;
  suggestedMessage: string;
};

const HunterPostEngagers = () => {
  const [postUrl, setPostUrl] = useState("");
  const [tone, setTone] = useState("Consultivo e curioso, mencionar o post especificamente");
  const [loading, setLoading] = useState(false);
  const [engagers, setEngagers] = useState<Engager[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const sellerConfig = getSocialSellerConfig("linkedin");

  const extract = async () => {
    if (!postUrl.includes("linkedin.com")) {
      toast.error("Cole uma URL de post do LinkedIn válida");
      return;
    }
    setLoading(true);
    // Mock enquanto PhantomBuster multi-tenant não está provisionado.
    // Fluxo real: dispatch job → PhantomBuster "Post Likers/Commenters" → resultados salvos em hunter_leads.
    await new Promise((r) => setTimeout(r, 1600));
    const mock: Engager[] = [
      {
        name: "Ana Ribeiro",
        headline: "Head de Growth · Fintech B2B",
        reaction: "comment",
        snippet: "Excelente ponto sobre pipeline preditivo, aplicamos algo similar…",
        suggestedMessage:
          "Oi Ana! Vi seu comentário sobre pipeline preditivo — curti muito a abordagem que vocês aplicam na fintech. Estamos ajudando times B2B a operar isso com agentes de IA. Faz sentido trocar uma ideia rápida?",
      },
      {
        name: "Rafael Costa",
        headline: "Fundador · SaaS de logística",
        reaction: "like",
        suggestedMessage:
          "Oi Rafael, notei que você curtiu o post sobre automação comercial. Como fundador de SaaS, imagino que otimizar tempo do time comercial seja prioridade. Posso te mostrar em 10min como estamos resolvendo isso?",
      },
      {
        name: "Marina Alves",
        headline: "Diretora Comercial · Indústria",
        reaction: "comment",
        snippet: "Faz total sentido, mas o desafio maior é adoção pelo time…",
        suggestedMessage:
          "Marina, seu comentário sobre adoção pelo time foi certeiro — é o gargalo #1 que ouvimos. Temos um playbook específico pra times industriais. Topa uma call de 15min?",
      },
    ];
    setEngagers(mock);
    setSelected(new Set(mock.map((_, i) => i)));
    setLoading(false);
    toast.success(`${mock.length} engajadores extraídos`);
  };

  const sendToApproval = () => {
    if (selected.size === 0) {
      toast.error("Selecione ao menos um engajador");
      return;
    }
    toast.success(`${selected.size} mensagens enviadas ao Approvals Center`, {
      description: "Você aprova cada uma antes do envio real no LinkedIn.",
    });
    setEngagers([]);
    setSelected(new Set());
    setPostUrl("");
  };

  const toggle = (i: number) => {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    setSelected(next);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="dash-h1 flex items-center gap-2">
          <Linkedin className="h-6 w-6 text-info" />
          Engajadores de Post
        </h1>
        <p className="dash-body text-muted-foreground mt-1">
          Cole a URL de um post no LinkedIn. O Social Seller extrai quem curtiu/comentou e gera mensagens personalizadas pra aprovação.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Passo 1 · Post e tom
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">URL do post no LinkedIn</label>
            <Input
              placeholder="https://www.linkedin.com/posts/..."
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tom da mensagem</label>
            <Textarea rows={2} value={tone} onChange={(e) => setTone(e.target.value)} />
          </div>
          <Button className="w-full gap-2" onClick={extract} disabled={loading || !postUrl}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            {loading ? "Extraindo engajadores…" : "Extrair engajadores + gerar mensagens"}
          </Button>
        </CardContent>
      </Card>

      {engagers.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Passo 2 · Revisar mensagens
            </CardTitle>
            <Badge variant="secondary">{selected.size}/{engagers.length} selecionados</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {engagers.map((e, i) => (
              <div
                key={i}
                onClick={() => toggle(i)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selected.has(i) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{e.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {e.reaction === "comment" ? "Comentou" : "Curtiu"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.headline}</p>
                    {e.snippet && (
                      <p className="text-xs italic text-muted-foreground mt-1">"{e.snippet}"</p>
                    )}
                  </div>
                  {selected.has(i) && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                </div>
                <div className="mt-3 p-3 rounded bg-background border text-sm">{e.suggestedMessage}</div>
              </div>
            ))}
            <Button className="w-full gap-2" onClick={sendToApproval}>
              Enviar {selected.size} para Approvals Center <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HunterPostEngagers;
