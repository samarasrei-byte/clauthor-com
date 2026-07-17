import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useActivationSteps } from "@/hooks/useActivationSteps";
import { ActivationCard } from "@/components/activation/ActivationCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";

export default function ActivationStatus() {
  const navigate = useNavigate();
  const { departments, stepsByDept, loading, error, refresh } = useActivationSteps();

  return (
    <>
      <Helmet>
        <title>Status de ativação · Clauthor</title>
        <meta
          name="description"
          content="Acompanhe cada etapa da ativação dos seus departamentos de IA e reprocesse falhas."
        />
      </Helmet>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="-ml-2 mb-1"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar ao painel
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">Status de ativação</h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Veja em tempo real cada etapa da configuração dos seus departamentos.
              Se alguma etapa falhar, é possível reprocessar direto por aqui.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
            Atualizar
          </Button>
        </header>

        {error && (
          <Card className="p-4 border-destructive/50 bg-destructive/5 text-sm text-destructive">
            {error}
          </Card>
        )}

        {loading && departments.length === 0 ? (
          <Card className="p-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Carregando departamentos...
          </Card>
        ) : departments.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <Sparkles className="h-10 w-10 mx-auto text-primary" />
            <h2 className="text-lg font-semibold">Nenhum departamento contratado ainda</h2>
            <p className="text-sm text-muted-foreground">
              Assim que você ativar um departamento, o progresso aparece aqui.
            </p>
            <Button onClick={() => navigate("/departamentos")}>Ver departamentos</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {departments.map((d) => (
              <ActivationCard
                key={d.id}
                department={d}
                steps={stepsByDept[d.id] ?? []}
                onRefresh={refresh}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
