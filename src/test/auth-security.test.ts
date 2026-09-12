import { describe, expect, it } from "vitest";
import {
  AUTH_REDIRECT_URL,
  PASSWORD_RECOVERY_REDIRECT_URL,
  getSafeAuthErrorMessage,
  validateAuthFields,
} from "@/lib/auth-security";

describe("segurança de autenticação", () => {
  it("rejeita campos vazios sem chamar o backend", () => {
    expect(validateAuthFields("login", "", "")).toEqual({ valid: false, message: "Informe seu e-mail." });
    expect(validateAuthFields("login", "pessoa@example.test", "")).toEqual({ valid: false, message: "Informe sua senha." });
  });

  it("usa mensagem genérica para login inválido", () => {
    expect(getSafeAuthErrorMessage("login", { message: "Invalid login credentials", status: 400 }))
      .toBe("E-mail ou senha inválidos.");
    expect(getSafeAuthErrorMessage("login", { message: "internal database detail", status: 500 }))
      .toBe("E-mail ou senha inválidos.");
  });

  it("valida recuperação e usa a rota canônica", () => {
    expect(validateAuthFields("recovery", "pessoa@example.test")).toEqual({ valid: true });
    expect(validateAuthFields("recovery", "inválido").valid).toBe(false);
    expect(PASSWORD_RECOVERY_REDIRECT_URL).toBe("https://clauthor.com/reset-password");
    expect(AUTH_REDIRECT_URL).toBe("https://clauthor.com/auth");
  });
});
