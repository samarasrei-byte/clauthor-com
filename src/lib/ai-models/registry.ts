// Registro central de modelos disponíveis para o Social Seller e demais agentes.
// Fonte de verdade: Lovable AI Gateway allowlist + integrações BYOK.

export type ModelProvider = "lovable-gateway" | "anthropic-byok" | "moonshot-byok";

export interface ModelOption {
  id: string;                    // ID enviado ao backend (ex: "openai/gpt-5.6-sol")
  label: string;                 // Nome exibido pro usuário
  provider: ModelProvider;
  description: string;
  strengths: string[];
  contextWindow: number;         // tokens
  costTier: "premium" | "balanced" | "fast";
  requiresSecret?: string;       // env var necessária quando BYOK
  available: boolean;            // se false, mostra "Conectar chave" no UI
  badge?: "Novo" | "Beta" | "Recomendado";
}

// Marque `available: true` só depois que o secret BYOK correspondente for adicionado.
// O front lê `available` pra bloquear seleção e abrir o fluxo de add_secret.
export const AGENT_MODELS: ModelOption[] = [
  {
    id: "openai/gpt-5.6-sol",
    label: "GPT-5.6 Sol",
    provider: "lovable-gateway",
    description: "Modelo flagship da OpenAI. Raciocínio profundo, cold email e negociação em ciclos longos.",
    strengths: ["Raciocínio complexo", "Escrita persuasiva", "Multi-step tool use"],
    contextWindow: 400_000,
    costTier: "premium",
    available: true,
    badge: "Novo",
  },
  {
    id: "openai/gpt-5.5",
    label: "GPT-5.5",
    provider: "lovable-gateway",
    description: "Default balanceado. Excelente para respostas de DM e follow-ups.",
    strengths: ["Custo/qualidade", "Instrução detalhada"],
    contextWindow: 400_000,
    costTier: "balanced",
    available: true,
    badge: "Recomendado",
  },
  {
    id: "google/gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro",
    provider: "lovable-gateway",
    description: "Multimodal forte. Analisa perfis do LinkedIn/Instagram com screenshot.",
    strengths: ["Visão", "Contexto gigante", "Análise de perfil"],
    contextWindow: 1_000_000,
    costTier: "balanced",
    available: true,
  },
  {
    id: "anthropic/claude-code",
    label: "Claude Code (Sonnet 4.5)",
    provider: "anthropic-byok",
    description: "Modelo da Anthropic focado em código e raciocínio estruturado. Requer chave própria (BYOK).",
    strengths: ["Aderência a instruções", "Segurança de output", "Longos scripts de outreach"],
    contextWindow: 200_000,
    costTier: "premium",
    requiresSecret: "ANTHROPIC_API_KEY",
    available: false,
  },
  {
    id: "moonshot/kimi-k2",
    label: "Kimi K2",
    provider: "moonshot-byok",
    description: "Modelo da Moonshot com contexto de 2M tokens. Ótimo para digestão de histórico longo. BYOK.",
    strengths: ["Contexto 2M", "PT-BR", "Custo baixo"],
    contextWindow: 2_000_000,
    costTier: "fast",
    requiresSecret: "MOONSHOT_API_KEY",
    available: false,
  },
];

export function getModel(id: string): ModelOption | undefined {
  return AGENT_MODELS.find((m) => m.id === id);
}

export const DEFAULT_SOCIAL_SELLER_MODEL = "openai/gpt-5.5";
