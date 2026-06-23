import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Check, Copy, Plug, Terminal, Zap, Shield,
  Workflow, Boxes, BookOpen, Sparkles,
} from "lucide-react";

/**
 * /mcp — Setup do CLAUTHOR MCP Server
 * Mostra endpoint, exemplos JSON-RPC e configs prontas para
 * Claude Desktop, Claude Code, Cursor, Windsurf e ChatGPT.
 */
const MCP_ENDPOINT =
  "https://ihzfwkiqkwbgbgjjbeih.supabase.co/functions/v1/mcp-server";
const PUBLIC_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloemZ3a2lxa3diZ2JnampiZWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjA0MjcsImV4cCI6MjA4NjE5NjQyN30.G9Hq_yHllqZI-NzkDiJCDC6V_UZAoDxzWGeRrwQR8ms";

const claudeDesktopConfig = `{
  "mcpServers": {
    "clauthor": {
      "url": "${MCP_ENDPOINT}",
      "headers": {
        "Authorization": "Bearer ${PUBLIC_ANON_KEY}"
      }
    }
  }
}`;

const claudeCodeCmd = `claude mcp add --transport http clauthor \\
  ${MCP_ENDPOINT} \\
  --header "Authorization: Bearer ${PUBLIC_ANON_KEY}"`;

const cursorConfig = `{
  "mcpServers": {
    "clauthor": {
      "url": "${MCP_ENDPOINT}",
      "headers": {
        "Authorization": "Bearer ${PUBLIC_ANON_KEY}"
      }
    }
  }
}`;

const curlListTools = `curl -X POST ${MCP_ENDPOINT} \\
  -H "Authorization: Bearer ${PUBLIC_ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

const curlCallTool = `curl -X POST ${MCP_ENDPOINT} \\
  -H "Authorization: Bearer ${PUBLIC_ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "agent_content_strategist",
      "arguments": {
        "message": "Crie um calendário editorial para B2B SaaS em janeiro"
      }
    }
  }'`;

function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Copiado", description: label ?? "Snippet copiado para a área de transferência." });
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative group">
      <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed">
        {code}
      </pre>
      <Button
        size="sm"
        variant="ghost"
        onClick={onCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export default function MCPServer() {
  const benefits = useMemo(
    () => [
      {
        icon: Boxes,
        title: "206 agentes especialistas em uma única conexão",
        desc: "Marketing, vendas, finanças, jurídico, engenharia, dados. Cada um vira uma tool nativa.",
      },
      {
        icon: Workflow,
        title: "Orquestração nativa no Claude Code",
        desc: "O Claude decide qual agente CLAUTHOR chamar a cada turn — sem você trocar de janela.",
      },
      {
        icon: Zap,
        title: "Latência baixa, JSON-RPC 2.0 puro",
        desc: "Sem WebSocket, sem polling. Cada chamada é um POST direto à edge function.",
      },
      {
        icon: Shield,
        title: "Bearer auth + RLS",
        desc: "Você controla o token. Pode usar a chave anônima ou um JWT do usuário logado.",
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>MCP Server — CLAUTHOR | Conecte 206 agentes ao Claude Code, Cursor e Claude Desktop</title>
        <meta
          name="description"
          content="Setup do CLAUTHOR MCP Server: expõe 206 agentes WORKFORCE como tools nativas para Claude Code, Claude Desktop, Cursor e qualquer cliente MCP."
        />
        <link rel="canonical" href="https://clauthor.com/mcp" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <Link to="/integrations">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar para Integrações
            </Button>
          </Link>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plug className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-semibold tracking-tight">CLAUTHOR MCP Server</h1>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" /> Novo
                </Badge>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Conecte os 206 agentes WORKFORCE como ferramentas nativas no Claude Code,
                Claude Desktop, Cursor, Windsurf e qualquer cliente que fale o Model Context
                Protocol (MCP).
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((b) => (
            <Card key={b.title} className="border-border/60">
              <CardHeader className="space-y-2">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <b.icon className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">{b.title}</CardTitle>
                <CardDescription>{b.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Endpoint */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Endpoint MCP
            </CardTitle>
            <CardDescription>
              Transporte: HTTP + JSON-RPC 2.0. Protocol version: <code>2025-06-18</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CopyBlock code={MCP_ENDPOINT} label="Endpoint copiado" />
            <p className="text-xs text-muted-foreground">
              Autenticação por <code>Authorization: Bearer &lt;token&gt;</code>. Use a chave
              anônima abaixo para começar, ou o JWT do usuário logado quando quiser isolar
              execuções por conta.
            </p>
            <CopyBlock code={PUBLIC_ANON_KEY} label="Chave anônima copiada" />
          </CardContent>
        </Card>

        {/* Setup tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuração por cliente</CardTitle>
            <CardDescription>
              Cole a config no arquivo do cliente, reinicie e os agentes aparecem como tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="claude-code">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
                <TabsTrigger value="claude-code">Claude Code</TabsTrigger>
                <TabsTrigger value="claude-desktop">Claude Desktop</TabsTrigger>
                <TabsTrigger value="cursor">Cursor</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>

              <TabsContent value="claude-code" className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">
                  Comando único no terminal — o Claude Code persiste a conexão e disponibiliza
                  todos os agentes automaticamente no próximo prompt.
                </p>
                <CopyBlock code={claudeCodeCmd} label="Comando Claude Code copiado" />
                <p className="text-xs text-muted-foreground">
                  Verifique com <code>claude mcp list</code>. Cada tool aparece como{" "}
                  <code>agent_&lt;slug&gt;</code> (ex: <code>agent_sales_closer</code>,{" "}
                  <code>agent_content_strategist</code>).
                </p>
              </TabsContent>

              <TabsContent value="claude-desktop" className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">
                  Edite <code>claude_desktop_config.json</code> (macOS:{" "}
                  <code>~/Library/Application Support/Claude/</code>; Windows:{" "}
                  <code>%APPDATA%\Claude\</code>), cole abaixo e reinicie o app.
                </p>
                <CopyBlock code={claudeDesktopConfig} label="Config Claude Desktop copiada" />
              </TabsContent>

              <TabsContent value="cursor" className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">
                  Cursor → Settings → MCP → <em>Add new MCP server</em>. Cole o JSON ou edite{" "}
                  <code>~/.cursor/mcp.json</code>.
                </p>
                <CopyBlock code={cursorConfig} label="Config Cursor copiada" />
              </TabsContent>

              <TabsContent value="curl" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Listar tools (todos os 206 agentes)</p>
                  <CopyBlock code={curlListTools} label="cURL copiado" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Invocar um agente</p>
                  <CopyBlock code={curlCallTool} label="cURL copiado" />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Métodos JSON-RPC suportados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                ["initialize", "Handshake MCP 2025-06-18"],
                ["ping", "Health check"],
                ["tools/list", "Retorna 206 agentes como tools"],
                ["tools/call", "Invoca um agente (proxy → agent-chat)"],
                ["resources/list", "Lista fichas dos agentes"],
                ["resources/read", "Lê metadados (clauthor://agent/<slug>)"],
              ].map(([m, d]) => (
                <div
                  key={m}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card"
                >
                  <code className="text-xs font-mono text-primary shrink-0 mt-0.5">{m}</code>
                  <span className="text-muted-foreground text-xs">{d}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
