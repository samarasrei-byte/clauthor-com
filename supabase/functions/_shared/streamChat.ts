/**
 * Shared streaming chat helper for edge functions.
 *
 * Consolida o padrão duplicado em 6+ funções de chat:
 *   - chamada ao Lovable AI Gateway via fetchAI
 *   - mapeamento uniforme de erros (429 rate limit / 402 credits / 5xx)
 *   - resposta SSE OpenAI-compatível com CORS + security headers
 *
 * Cada função de chat continua dona da sua persona/prompt/auth/logging;
 * este helper cuida apenas do transporte.
 */

import { fetchAI } from "./ai-gateway.ts";
import { corsHeaders } from "./cors.ts";
import { securityHeaders } from "./security.ts";

export interface StreamChatOptions {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
  /** Extra headers to merge into gateway request */
  extraHeaders?: Record<string, string>;
}

export interface StreamChatResult {
  ok: boolean;
  response: Response;
}

/**
 * Executa a chamada ao gateway e retorna uma Response pronta para o cliente.
 * Em erro (429/402/5xx), retorna Response de erro já formatada.
 * Em sucesso, retorna o stream SSE com os headers corretos.
 */
export async function streamAIChat(options: StreamChatOptions): Promise<StreamChatResult> {
  const upstream = await fetchAI({
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2048,
    stream: true,
    ...(options.tools ? { tools: options.tools } : {}),
  }, options.extraHeaders);

  if (!upstream.ok) {
    if (upstream.status === 429) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ error: "Rate limit exceeded. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        ),
      };
    }
    if (upstream.status === 402) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ error: "Créditos esgotados. Recarregue seu workspace.", suggest_upgrade: true }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        ),
      };
    }
    const errorText = await upstream.text().catch(() => "");
    console.error("[streamAIChat] gateway error:", upstream.status, errorText);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: `AI gateway error: ${upstream.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  return {
    ok: true,
    response: new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        ...securityHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }),
  };
}

/**
 * Valida um array de messages recebido do cliente.
 * Retorna null se OK, ou uma Response 400 se inválido.
 */
export function validateMessages(
  messages: any,
  opts: { maxLength?: number } = {}
): Response | null {
  const maxLength = opts.maxLength ?? 8000;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Messages array is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid message format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (typeof msg.content !== "string" || msg.content.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message content must be a non-empty string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (msg.content.length > maxLength) {
      return new Response(
        JSON.stringify({ error: `Message exceeds max length (${maxLength})` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (msg.role !== "user" && msg.role !== "assistant" && msg.role !== "system") {
      return new Response(
        JSON.stringify({ error: "Invalid message role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return null;
}
