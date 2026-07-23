/**
 * Glossary Simple · tradução runtime de jargão técnico → português vovô-friendly.
 *
 * Uso:
 *   import { simplify } from "@/lib/glossarySimple";
 *   simplify("Contratar SDR pro LinkedIn") // → "Contratar Buscador de clientes pro LinkedIn"
 *
 * Aplicar via wrapper <Simplify>{children}</Simplify> ou em strings soltas.
 * Preserva maiúscula/minúscula inicial. Match por palavra inteira (\b).
 */

export const SIMPLE_DICTIONARY: Record<string, string> = {
  // Vendas / papéis
  "SDR": "Buscador de clientes",
  "Closer": "Fechador de vendas",
  "Hunter": "Caçador no LinkedIn",
  "Social Seller": "Vendedor nas redes",
  "Lead": "Cliente em potencial",
  "Leads": "Clientes em potencial",
  "Pipeline": "Funil de vendas",
  "Deal": "Negociação",
  "Deals": "Negociações",
  "Prospect": "Cliente novo",
  "Follow-up": "Retorno",
  "Outbound": "Prospecção ativa",
  "Inbound": "Cliente que veio até você",

  // Produto Clauthor
  "Squad": "Time",
  "Squads": "Times",
  "Workforce": "Time de IA",
  "Agente": "Funcionário de IA",
  "Agentes": "Funcionários de IA",
  "Departamento": "Setor",
  "Departamentos": "Setores",

  // Técnico
  "Dashboard": "Painel",
  "Kanban": "Quadro de tarefas",
  "Inbox": "Caixa de mensagens",
  "Traces": "Histórico",
  "MCP": "Integração externa",
  "API": "Conexão",
  "Webhook": "Aviso automático",
  "Onboarding": "Boas-vindas",
  "Checkout": "Pagamento",

  // Marketing
  "CTA": "Botão de ação",
  "Copy": "Texto",
  "Copywriting": "Escrita de vendas",
  "Engagement": "Interação",
  "Reach": "Alcance",
};

const KEYS_SORTED = Object.keys(SIMPLE_DICTIONARY).sort((a, b) => b.length - a.length);
const REGEX = new RegExp(`\\b(${KEYS_SORTED.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");

/**
 * Substitui jargões por termos vovô-friendly, preservando capitalização inicial.
 */
export function simplify(input: string): string {
  if (!input) return input;
  return input.replace(REGEX, (match) => {
    const canonical = KEYS_SORTED.find(k => k.toLowerCase() === match.toLowerCase());
    if (!canonical) return match;
    const translated = SIMPLE_DICTIONARY[canonical];
    // Preserva capitalização se match original começa com maiúscula
    if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
      return translated.charAt(0).toUpperCase() + translated.slice(1);
    }
    return translated.toLowerCase();
  });
}

/**
 * Indica se está no "Modo Simples" (armazenado em localStorage).
 */
const KEY = "clauthor:simple-mode";
export function isSimpleMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}
export function setSimpleMode(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "1" : "0");
    document.documentElement.classList.toggle("simple-mode", on);
  } catch { /* ignore */ }
}
