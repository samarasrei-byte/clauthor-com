import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/integrations/supabase/client", () => {
  const supabase = {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(async () => ({ data: { session: null } })),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(async () => ({ error: null })),
      signUp: vi.fn(async () => ({ data: { session: null }, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
      resetPasswordForEmail: vi.fn(async () => ({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(() => Promise.resolve({ data: [{ role: "customer" }], error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn().mockReturnThis(),
    })),
  };
  return { supabase };
});
vi.mock("@/lib/referral", () => ({ getStoredReferral: () => null }));

import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
const mockAuth = supabase.auth as unknown as Record<string, ReturnType<typeof vi.fn>>;
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.getSession.mockResolvedValue({ data: { session: null } });
    mockAuth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    mockAuth.signInWithPassword.mockResolvedValue({ error: null });
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it("inicia sem sessão", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("bloqueia login com campos vazios", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let response: Awaited<ReturnType<typeof result.current.signIn>>;
    await act(async () => { response = await result.current.signIn("", ""); });
    expect(response!.error?.message).toBe("Informe seu e-mail.");
    expect(mockAuth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("não revela o erro interno de login inválido", async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ error: { message: "database detail", status: 500 } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let response: Awaited<ReturnType<typeof result.current.signIn>>;
    await act(async () => { response = await result.current.signIn("pessoa@example.test", "senha-segura"); });
    expect(response!.error?.message).toBe("E-mail ou senha inválidos.");
  });

  it("solicita recuperação com redirect canônico", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.requestPasswordReset(" pessoa@example.test "); });
    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith("pessoa@example.test", {
      redirectTo: "https://clauthor.com/reset-password",
    });
  });

  it("encerra a sessão", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.signOut(); });
    expect(mockAuth.signOut).toHaveBeenCalledOnce();
  });
});
