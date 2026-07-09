import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ReactNode } from "react";

// vi.mock is hoisted; keep the factory self-contained and export the mock refs
// via the returned module so tests can grab them after import.
vi.mock("@/integrations/supabase/client", () => {
  const supabase = {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(async () => ({ data: { session: null } })),
      signInWithPassword: vi.fn(async () => ({ error: null })),
      signUp: vi.fn(async () => ({ error: null })),
      signOut: vi.fn(async () => ({ error: null })),
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

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("useAuth", () => {
  beforeEach(() => {
    listeners.length = 0;
    vi.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  });

  it("throws when used outside AuthProvider", () => {
    // Suppress React error boundary noise for this expected throw
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
    err.mockRestore();
  });

  it("starts unauthenticated when no session", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it("signIn delegates to supabase.auth.signInWithPassword", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.signIn("a@b.com", "pw");
    });
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "pw",
    });
  });

  it("signOut clears user/session/role", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.signOut();
    });
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
  });
});
