import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scale, Loader2 } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

interface Intimacao {
  id: string;
  numero_processo: string;
  tribunal: string;
  tipo_ato: string;
  texto_resumo: string;
  data_limite: string;
  status: string;
  whatsapp_enviado: boolean;
}

function PrazoBadge({ dataLimite }: { dataLimite: string }) {
  const days = differenceInDays(parseISO(dataLimite), new Date());
  if (days <= 3) return <Badge variant="destructive">{days}d restantes</Badge>;
  if (days <= 7) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">{days}d restantes</Badge>;
  return <Badge className="bg-green-500 hover:bg-green-600 text-white">{days}d restantes</Badge>;
}

const LexDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [advogado, setAdvogado] = useState<any>(null);
  const [intimacoes, setIntimacoes] = useState<Intimacao[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("lex-dashboard");
        if (error) throw error;
        setAdvogado(data?.advogado);
        setIntimacoes(data?.intimacoes || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!advogado) {
    return (
      <div className="p-6 text-center space-y-4">
        <Scale className="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-semibold text-foreground">Nenhum cadastro ativo</h2>
        <p className="text-muted-foreground">
          Ative o Lex em <a href="/lex-cadastro" className="text-primary underline">/lex-cadastro</a> para começar a monitorar seus prazos.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Scale className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lex — Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {advogado.nome} · OAB {advogado.oab_numero}/{advogado.oab_estado}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Intimações Monitoradas</CardTitle>
        </CardHeader>
        <CardContent>
          {intimacoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma intimação encontrada ainda. O monitoramento começa automaticamente.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead>Tribunal</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="max-w-[300px]">Resumo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intimacoes.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.numero_processo}</TableCell>
                    <TableCell>{item.tribunal}</TableCell>
                    <TableCell>{item.tipo_ato}</TableCell>
                    <TableCell><PrazoBadge dataLimite={item.data_limite} /></TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                      {item.texto_resumo}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LexDashboard;
