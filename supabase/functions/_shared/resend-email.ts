const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_TIMEOUT_MS = 8_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EmailPayload {
  to: string[];
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSendResult {
  id: string;
}

export class EmailConfigurationError extends Error {}
export class EmailDeliveryError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
  }
}

export function validateEmailPayload(payload: EmailPayload): void {
  if (!Array.isArray(payload.to) || payload.to.length === 0 || payload.to.length > 20) {
    throw new EmailDeliveryError("Destinatários inválidos.", 400);
  }
  if (payload.to.some((email) => typeof email !== "string" || !EMAIL_PATTERN.test(email) || email.length > 254)) {
    throw new EmailDeliveryError("Destinatários inválidos.", 400);
  }
  if (typeof payload.subject !== "string" || !payload.subject.trim() || payload.subject.length > 180) {
    throw new EmailDeliveryError("Assunto inválido.", 400);
  }
  if (typeof payload.text !== "string" || !payload.text.trim() || payload.text.length > 20_000) {
    throw new EmailDeliveryError("Conteúdo inválido.", 400);
  }
  if (payload.html !== undefined && (typeof payload.html !== "string" || payload.html.length > 50_000)) {
    throw new EmailDeliveryError("Conteúdo inválido.", 400);
  }
}

export async function sendEmail(
  payload: EmailPayload,
  options: { apiKey?: string; from?: string; timeoutMs?: number } = {},
): Promise<EmailSendResult> {
  validateEmailPayload(payload);
  const apiKey = options.apiKey ?? Deno.env.get("RESEND_API_KEY");
  const from = options.from ?? Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from || !EMAIL_PATTERN.test(from.replace(/^.*<([^>]+)>$/, "$1").trim())) {
    throw new EmailConfigurationError("Serviço de e-mail não configurado.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, ...payload }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new EmailDeliveryError("O serviço de e-mail recusou o envio.", 502);
    }
    const result = await response.json().catch(() => null) as { id?: unknown } | null;
    if (!result || typeof result.id !== "string" || !result.id) {
      throw new EmailDeliveryError("O serviço de e-mail não confirmou o envio.", 502);
    }
    return { id: result.id };
  } catch (error) {
    if (error instanceof EmailDeliveryError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new EmailDeliveryError("O envio excedeu o tempo limite.", 504);
    }
    throw new EmailDeliveryError("Não foi possível concluir o envio.", 502);
  } finally {
    clearTimeout(timeout);
  }
}
