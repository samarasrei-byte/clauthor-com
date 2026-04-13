import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, Shield, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

function maskCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 2) return `+${d}`;
  if (d.length <= 4) return `+${d.slice(0,2)} (${d.slice(2)}`;
  if (d.length <= 9) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4)}`;
  return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`;
}

const LexCadastro = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    nome: "", cpf: "", oab_numero: "", oab_estado: "",
    whatsapp: "+55 ", govbr_login: "", govbr_senha: ""
  });
  const [autorizo, setAutorizo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Faça login primeiro"); navigate("/auth"); return; }
    if (!autorizo) { toast.error("Aceite os termos para continuar"); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("lex-salvar-advogado", {
        body: {
          nome: form.nome,
          cpf: form.cpf,
          oab_numero: form.oab_numero,
          oab_estado: form.oab_estado,
          whatsapp: form.whatsapp,
          govbr_login: form.govbr_login,
          govbr_senha: form.govbr_senha,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar cadastro");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Lex ativado!</h2>
            <p className="text-muted-foreground">
              Você receberá alertas no WhatsApp a partir de amanhã às 6h30.
            </p>
            <Button onClick={() => navigate("/lex-dashboard")} className="mt-4">
              Ir para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scale className="w-8 h-8 text-primary" />
            <CardTitle className="text-2xl">Lex — Guardião de Prazos</CardTitle>
          </div>
          <CardDescription>
            Monitora o DJEN e avisa seus prazos no WhatsApp antes de você perder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" required value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" required placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={e => setForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oab">Número OAB</Label>
                <Input id="oab" required value={form.oab_numero}
                  onChange={e => setForm(f => ({ ...f, oab_numero: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oab_estado">Estado OAB</Label>
                <Select value={form.oab_estado} onValueChange={v => setForm(f => ({ ...f, oab_estado: v }))}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" required placeholder="+55 (00) 00000-0000"
                  value={form.whatsapp}
                  onChange={e => setForm(f => ({ ...f, whatsapp: maskPhone(e.target.value) }))} />
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Shield className="w-4 h-4" />
                <span>Credenciais gov.br — armazenadas com criptografia AES-256</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="govbr_login">Login gov.br (CPF)</Label>
                <Input id="govbr_login" required placeholder="000.000.000-00"
                  value={form.govbr_login}
                  onChange={e => setForm(f => ({ ...f, govbr_login: maskCPF(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="govbr_senha">Senha gov.br</Label>
                <Input id="govbr_senha" type="password" required
                  value={form.govbr_senha}
                  onChange={e => setForm(f => ({ ...f, govbr_senha: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <Checkbox id="autorizo" checked={autorizo}
                onCheckedChange={v => setAutorizo(v === true)} />
              <label htmlFor="autorizo" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                Autorizo o Lex a acessar meu DJEN para monitorar prazos. Entendo que minhas
                credenciais são armazenadas de forma criptografada.
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading || !autorizo}>
              {loading ? "Ativando..." : "Ativar Lex — R$ 197/mês"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LexCadastro;
