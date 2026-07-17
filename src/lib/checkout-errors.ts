/**
 * Traduz erros do edge function `paypal-checkout` (e afins) em mensagens
 * amigáveis para o usuário final. NUNCA jogar o `err.message` cru na tela ·
 * usuário lê "Edge function returned 400: Error, {\"error\":\"price_mismatch\"}"
 * e fica em branco.
 *
 * Uso:
 *   catch (err) {
 *     const { title, description } = friendlyCheckoutError(err);
 *     toast.error(title, { description });
 *   }
 */

export type CheckoutErrorCode =
  | "price_mismatch"
  | "amount_mismatch"
  | "currency_mismatch"
  | "unknown_plan"
  | "setup_fee_out_of_range"
  | "unauthorized"
  | "network"
  | "generic";

export interface FriendlyCheckoutError {
  code: CheckoutErrorCode;
  /** Mensagem curta para toast.title */
  title: string;
  /** Instrução acionável para toast.description */
  description: string;
  /** Indica se recarregar a página resolve automaticamente */
  reloadFixes: boolean;
}

/**
 * Extrai texto pesquisável de qualquer forma de erro: Error, FunctionsHttpError
 * do supabase-js (que carrega `context.body`), string, objeto plano.
 */
function extractErrorText(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  const parts: string[] = [];
  const anyErr = err as Record<string, unknown>;
  if (typeof anyErr.message === "string") parts.push(anyErr.message);
  if (anyErr.context) {
    try {
      parts.push(JSON.stringify(anyErr.context));
    } catch {
      /* ignore */
    }
  }
  if (anyErr.error && typeof anyErr.error === "string") parts.push(anyErr.error);
  try {
    parts.push(JSON.stringify(err));
  } catch {
    /* ignore */
  }
  return parts.join(" ");
}

export function friendlyCheckoutError(err: unknown, data?: unknown): FriendlyCheckoutError {
  const dataStr = data ? extractErrorText(data) : "";
  const raw = `${extractErrorText(err)} ${dataStr}`.toLowerCase();

  if (raw.includes("price_mismatch") || raw.includes("amount_mismatch")) {
    return {
      code: "price_mismatch",
      title: "O preço mudou desde que você abriu esta página",
      description:
        "Recarregue para carregar o valor atualizado · seu carrinho será preservado.",
      reloadFixes: true,
    };
  }

  if (raw.includes("currency_mismatch")) {
    return {
      code: "currency_mismatch",
      title: "Moeda inconsistente entre carrinho e cobrança",
      description: "Recarregue a página para reabrir o checkout na moeda correta.",
      reloadFixes: true,
    };
  }

  if (raw.includes("unknown_plan")) {
    return {
      code: "unknown_plan",
      title: "Este plano não está mais disponível",
      description:
        "O item saiu do catálogo. Volte para departamentos e escolha outro pacote.",
      reloadFixes: false,
    };
  }

  if (raw.includes("setup_fee")) {
    return {
      code: "setup_fee_out_of_range",
      title: "Taxa de setup fora do limite permitido",
      description:
        "Recarregue a página · o valor será corrigido automaticamente ao reabrir o carrinho.",
      reloadFixes: true,
    };
  }

  if (raw.includes("unauthorized") || raw.includes("401")) {
    return {
      code: "unauthorized",
      title: "Sua sessão expirou",
      description: "Faça login novamente para continuar o pagamento.",
      reloadFixes: false,
    };
  }

  if (raw.includes("failed to fetch") || raw.includes("networkerror") || raw.includes("network")) {
    return {
      code: "network",
      title: "Não conseguimos conectar ao gateway de pagamento",
      description:
        "Verifique sua conexão e tente de novo em alguns segundos. Se persistir, fale com o suporte.",
      reloadFixes: false,
    };
  }

  return {
    code: "generic",
    title: "Não conseguimos iniciar o pagamento agora",
    description:
      "Tente de novo em alguns segundos. Se o problema continuar, abra o chat do Thor no canto inferior direito.",
    reloadFixes: false,
  };
}
