export const AUTH_REDIRECT_URL = "https://clauthor.com/auth";
export const PASSWORD_RECOVERY_REDIRECT_URL = "https://clauthor.com/reset-password";

export type AuthFormMode = "login" | "signup" | "recovery";

export interface AuthValidationResult {
  valid: boolean;
  message?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthFields(
  mode: AuthFormMode,
  email: string,
  password = "",
  fullName = "",
): AuthValidationResult {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    return { valid: false, message: "Informe seu e-mail." };
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return { valid: false, message: "Informe um e-mail válido." };
  }

  if (mode === "recovery") {
    return { valid: true };
  }

  if (!password) {
    return { valid: false, message: "Informe sua senha." };
  }

  if (password.length < 6) {
    return { valid: false, message: "A senha deve ter pelo menos 6 caracteres." };
  }

  if (mode === "signup" && !fullName.trim()) {
    return { valid: false, message: "Informe seu nome." };
  }

  return { valid: true };
}

/**
 * Converte falhas de autenticação em mensagens seguras. A mensagem original do
 * serviço nunca é mostrada ao usuário nem incluída no retorno.
 */
export function getSafeAuthErrorMessage(
  operation: "login" | "signup" | "recovery" | "password" | "logout" | "oauth",
  error?: { message?: string; status?: number } | null,
): string {
  const message = error?.message?.toLowerCase() ?? "";

  if (operation === "login") {
    if (message.includes("email not confirmed")) {
      return "Confirme seu e-mail antes de entrar.";
    }
    if (message.includes("rate limit") || error?.status === 429) {
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    }
    return "E-mail ou senha inválidos.";
  }

  if (message.includes("rate limit") || error?.status === 429) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }

  const fallback = {
    signup: "Não foi possível criar a conta. Revise os dados e tente novamente.",
    recovery: "Não foi possível processar a solicitação agora. Tente novamente mais tarde.",
    password: "Não foi possível atualizar a senha. Solicite um novo link e tente novamente.",
    logout: "Não foi possível encerrar a sessão. Tente novamente.",
    oauth: "Não foi possível continuar com este provedor. Tente novamente.",
  } as const;

  return fallback[operation];
}
