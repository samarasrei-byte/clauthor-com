import { useState } from "react";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronRight, Terminal, Zap, Shield, Book, Code2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth: boolean;
  params?: { name: string; type: string; required: boolean; description: string }[];
  queryParams?: { name: string; type: string; description: string }[];
  body?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
  curl: string;
}

const methodColors: Record<string, string> = {
  GET: "bg-accent-emerald/15 text-accent-emerald border-accent-emerald/30",
  POST: "bg-accent-blue/15 text-accent-blue border-accent-blue/30",
  PATCH: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  DELETE: "bg-destructive/15 text-destructive border-destructive/30",
};

const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/health",
    description: "Verifica o status da API e lista todos os endpoints disponíveis.",
    auth: false,
    response: `{
  "status": "operational",
  "version": "1.0.0",
  "platform": "CLAUTHOR",
  "endpoints": ["GET /health", "GET /agents", ...]
}`,
    curl: `curl ${BASE_URL}/health`,
  },
  {
    method: "GET",
    path: "/agents",
    description: "Lista todos os agentes da sua conta.",
    auth: true,
    response: `{
  "data": [
    {
      "id": "uuid",
      "name": "Sales Agent",
      "description": "...",
      "tier": "pro",
      "status": "active",
      "total_executions": 142
    }
  ],
  "count": 1
}`,
    curl: `curl -H "Authorization: Bearer YOUR_TOKEN" \\
  ${BASE_URL}/agents`,
  },
  {
    method: "GET",
    path: "/agents/:id",
    description: "Retorna detalhes completos de um agente específico.",
    auth: true,
    params: [{ name: "id", type: "uuid", required: true, description: "ID do agente" }],
    response: `{
  "data": {
    "id": "uuid",
    "name": "Sales Agent",
    "description": "...",
    "instructions": "...",
    "tier": "pro",
    "status": "active",
    "actions": [...],
    "integrations": [...]
  }
}`,
    curl: `curl -H "Authorization: Bearer YOUR_TOKEN" \\
  ${BASE_URL}/agents/AGENT_ID`,
  },
  {
    method: "POST",
    path: "/agents/:id/chat",
    description: "Envia uma mensagem para um agente e recebe a resposta da IA.",
    auth: true,
    params: [{ name: "id", type: "uuid", required: true, description: "ID do agente" }],
    body: [
      { name: "messages", type: "array", required: true, description: "Array de mensagens [{role, content}]" },
      { name: "actionType", type: "string", required: false, description: "Tipo de ação (chat, analyze, execute)" },
    ],
    response: `{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Resposta do agente..."
      }
    }
  ]
}`,
    curl: `curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"Olá"}]}' \\
  ${BASE_URL}/agents/AGENT_ID/chat`,
  },
  {
    method: "GET",
    path: "/tasks",
    description: "Lista tarefas criadas pelos agentes ou manualmente.",
    auth: true,
    queryParams: [{ name: "status", type: "string", description: "Filtrar por status (open, in_progress, done)" }],
    response: `{
  "data": [
    {
      "id": "uuid",
      "title": "Follow up com lead",
      "priority": "high",
      "status": "open",
      "agent_id": "uuid"
    }
  ],
  "count": 5
}`,
    curl: `curl -H "Authorization: Bearer YOUR_TOKEN" \\
  "${BASE_URL}/tasks?status=open"`,
  },
  {
    method: "POST",
    path: "/tasks",
    description: "Cria uma nova tarefa programaticamente.",
    auth: true,
    body: [
      { name: "title", type: "string", required: true, description: "Título da tarefa" },
      { name: "description", type: "string", required: false, description: "Descrição detalhada" },
      { name: "priority", type: "string", required: false, description: "low, medium, high, urgent" },
      { name: "agent_id", type: "uuid", required: false, description: "Atribuir a um agente" },
      { name: "due_date", type: "date", required: false, description: "Data limite (YYYY-MM-DD)" },
    ],
    response: `{
  "data": {
    "id": "uuid",
    "title": "Nova tarefa",
    "status": "open",
    "created_at": "2026-03-06T..."
  }
}`,
    curl: `curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Nova tarefa","priority":"high"}' \\
  ${BASE_URL}/tasks`,
  },
  {
    method: "PATCH",
    path: "/tasks/:id",
    description: "Atualiza uma tarefa existente (status, prioridade, etc).",
    auth: true,
    params: [{ name: "id", type: "uuid", required: true, description: "ID da tarefa" }],
    body: [
      { name: "status", type: "string", required: false, description: "open, in_progress, done" },
      { name: "priority", type: "string", required: false, description: "low, medium, high, urgent" },
      { name: "title", type: "string", required: false, description: "Novo título" },
    ],
    response: `{ "data": { "id": "uuid", "status": "done", ... } }`,
    curl: `curl -X PATCH -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"done"}' \\
  ${BASE_URL}/tasks/TASK_ID`,
  },
  {
    method: "GET",
    path: "/knowledge",
    description: "Lista documentos da base de conhecimento (RAG).",
    auth: true,
    queryParams: [{ name: "q", type: "string", description: "Busca semântica nos documentos" }],
    response: `{
  "data": [
    {
      "id": "uuid",
      "title": "Política de vendas",
      "content": "...",
      "category": "sales",
      "rank": 0.85
    }
  ]
}`,
    curl: `curl -H "Authorization: Bearer YOUR_TOKEN" \\
  "${BASE_URL}/knowledge?q=vendas"`,
  },
  {
    method: "POST",
    path: "/knowledge",
    description: "Adiciona um documento à base de conhecimento.",
    auth: true,
    body: [
      { name: "title", type: "string", required: true, description: "Título do documento" },
      { name: "content", type: "string", required: true, description: "Conteúdo completo" },
      { name: "category", type: "string", required: false, description: "Categoria (sales, support, hr, etc)" },
      { name: "agent_id", type: "uuid", required: false, description: "Restringir a um agente específico" },
    ],
    response: `{ "data": { "id": "uuid", "title": "Novo doc", ... } }`,
    curl: `curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"FAQ","content":"...","category":"support"}' \\
  ${BASE_URL}/knowledge`,
  },
  {
    method: "GET",
    path: "/executions",
    description: "Histórico de execuções dos agentes com detalhes de performance.",
    auth: true,
    queryParams: [{ name: "agent_id", type: "uuid", description: "Filtrar por agente" }],
    response: `{
  "data": [
    {
      "id": "uuid",
      "agent_id": "uuid",
      "action": "chat",
      "status": "success",
      "execution_time_ms": 1230,
      "created_at": "2026-03-06T..."
    }
  ]
}`,
    curl: `curl -H "Authorization: Bearer YOUR_TOKEN" \\
  "${BASE_URL}/executions?agent_id=AGENT_ID"`,
  },
  {
    method: "GET",
    path: "/credits",
    description: "Consulta o saldo de créditos e uso atual.",
    auth: true,
    response: `{
  "total_credits": 10000,
  "used_credits": 3200,
  "remaining_credits": 6800,
  "usage_pct": 32,
  "plan_type": "pro",
  "credits_reset_at": "2026-04-06T..."
}`,
    curl: `curl -H "Authorization: Bearer YOUR_TOKEN" \\
  ${BASE_URL}/credits`,
  },
];

const EndpointCard = ({ ep }: { ep: Endpoint }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCmd = () => {
    navigator.clipboard.writeText(ep.curl);
    setCopied(true);
    toast.success("cURL copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        <Badge variant="outline" className={`font-mono text-[10px] px-2 py-0.5 ${methodColors[ep.method]}`}>
          {ep.method}
        </Badge>
        <code className="text-sm font-mono text-foreground">{ep.path}</code>
        <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">{ep.description.slice(0, 60)}...</span>
        {ep.auth && <Shield className="h-3.5 w-3.5 text-primary shrink-0" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/20">
          <p className="text-sm text-muted-foreground pt-3">{ep.description}</p>

          {ep.params && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Path Parameters</h4>
              <div className="space-y-1">
                {ep.params.map(p => (
                  <div key={p.name} className="flex items-center gap-2 text-xs">
                    <code className="text-primary font-mono">{p.name}</code>
                    <Badge variant="secondary" className="text-[9px]">{p.type}</Badge>
                    {p.required && <Badge className="text-[9px] bg-destructive/20 text-destructive">required</Badge>}
                    <span className="text-muted-foreground">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ep.queryParams && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Query Parameters</h4>
              <div className="space-y-1">
                {ep.queryParams.map(p => (
                  <div key={p.name} className="flex items-center gap-2 text-xs">
                    <code className="text-primary font-mono">?{p.name}</code>
                    <Badge variant="secondary" className="text-[9px]">{p.type}</Badge>
                    <span className="text-muted-foreground">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ep.body && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Request Body</h4>
              <div className="space-y-1">
                {ep.body.map(p => (
                  <div key={p.name} className="flex items-center gap-2 text-xs">
                    <code className="text-primary font-mono">{p.name}</code>
                    <Badge variant="secondary" className="text-[9px]">{p.type}</Badge>
                    {p.required && <Badge className="text-[9px] bg-destructive/20 text-destructive">required</Badge>}
                    <span className="text-muted-foreground">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2">Response</h4>
            <pre className="bg-card/80 rounded-xl p-3 text-xs font-mono text-foreground overflow-x-auto border border-border/20">
              {ep.response}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground">cURL Example</h4>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={copyCmd}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <pre className="bg-card/80 rounded-xl p-3 text-xs font-mono text-primary/80 overflow-x-auto border border-border/20 whitespace-pre-wrap">
              {ep.curl}
            </pre>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const ApiDocs = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="API Reference — Clauthor Developer Docs" description="REST API documentation for Clauthor: authenticate, create agents, run executions, manage credits and outcomes." path="/api-docs" />
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Terminal className="h-8 w-8 text-primary" />
            <h1 className="font-display text-4xl font-bold tracking-tight">API Reference</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Integre a CLAUTHOR em qualquer sistema. REST API completa com autenticação via Bearer token ou API Key.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Badge variant="outline" className="gap-1.5"><Globe className="h-3 w-3" /> REST</Badge>
            <Badge variant="outline" className="gap-1.5"><Shield className="h-3 w-3" /> OAuth 2.0</Badge>
            <Badge variant="outline" className="gap-1.5"><Zap className="h-3 w-3" /> SSE Streaming</Badge>
            <Badge variant="outline" className="gap-1.5"><Code2 className="h-3 w-3" /> JSON</Badge>
          </div>
        </motion.div>

        {/* Base URL */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> Base URL
          </h2>
          <pre className="bg-card/80 rounded-xl p-3 text-sm font-mono text-primary border border-border/20 overflow-x-auto">
            {BASE_URL}
          </pre>
        </motion.div>

        {/* Authentication */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Autenticação
          </h2>
          <p className="text-sm text-muted-foreground">Dois métodos disponíveis:</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-card/50 rounded-xl p-4 border border-border/20 space-y-2">
              <h3 className="font-semibold text-sm">Bearer Token</h3>
              <p className="text-xs text-muted-foreground">Use o token JWT do login do usuário.</p>
              <pre className="text-[10px] font-mono text-primary/80 bg-background/50 rounded p-2">
                Authorization: Bearer eyJhbGci...
              </pre>
            </div>
            <div className="bg-card/50 rounded-xl p-4 border border-border/20 space-y-2">
              <h3 className="font-semibold text-sm">API Key</h3>
              <p className="text-xs text-muted-foreground">Para integrações server-to-server.</p>
              <pre className="text-[10px] font-mono text-primary/80 bg-background/50 rounded p-2">
                x-api-key: clauthor_sk_...
              </pre>
            </div>
          </div>
        </motion.div>

        {/* Quick Start */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Quick Start
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-1">JavaScript / TypeScript</h3>
              <pre className="bg-card/80 rounded-xl p-4 text-xs font-mono text-foreground border border-border/20 overflow-x-auto whitespace-pre-wrap">{`const API = "${BASE_URL}";
const TOKEN = "your_bearer_token";

// List agents
const agents = await fetch(\`\${API}/agents\`, {
  headers: { Authorization: \`Bearer \${TOKEN}\` }
}).then(r => r.json());

// Chat with an agent
const chat = await fetch(\`\${API}/agents/\${agents.data[0].id}/chat\`, {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${TOKEN}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Analise meus KPIs" }]
  })
}).then(r => r.json());

console.log(chat);`}</pre>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-1">Python</h3>
              <pre className="bg-card/80 rounded-xl p-4 text-xs font-mono text-foreground border border-border/20 overflow-x-auto whitespace-pre-wrap">{`import requests

API = "${BASE_URL}"
HEADERS = {"Authorization": "Bearer YOUR_TOKEN"}

# List agents
agents = requests.get(f"{API}/agents", headers=HEADERS).json()

# Check credits
credits = requests.get(f"{API}/credits", headers=HEADERS).json()
print(f"Remaining: {credits['remaining_credits']}")`}</pre>
            </div>
          </div>
        </motion.div>

        {/* Endpoints */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" /> Endpoints
          </h2>
          {endpoints.map((ep, i) => (
            <EndpointCard key={`${ep.method}-${ep.path}-${i}`} ep={ep} />
          ))}
        </div>

        {/* Rate Limits */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold">Rate Limits</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-card/50 rounded-xl p-4 border border-border/20 text-center">
              <p className="text-2xl font-bold text-primary">60</p>
              <p className="text-xs text-muted-foreground">req/minuto (Free)</p>
            </div>
            <div className="bg-card/50 rounded-xl p-4 border border-border/20 text-center">
              <p className="text-2xl font-bold text-primary">300</p>
              <p className="text-xs text-muted-foreground">req/minuto (Pro)</p>
            </div>
            <div className="bg-card/50 rounded-xl p-4 border border-border/20 text-center">
              <p className="text-2xl font-bold text-primary">1000</p>
              <p className="text-xs text-muted-foreground">req/minuto (Enterprise)</p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground/50 pb-8">
          CLAUTHOR API v1.0.0 • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
