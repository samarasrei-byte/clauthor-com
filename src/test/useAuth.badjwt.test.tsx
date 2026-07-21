import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * bad_jwt guard: when getSession() returns a session but getUser() rejects
 * (stale token / missing sub claim), useAuth must:
 *   1. Call signOut EXACTLY once
 *   2. Clear user/session state
 *   3. NOT retry getUser in a loop
 */
vi.mock("@/integrations/supabase/client", () => {
  const staleSession = {
    user: { id: "stale-user", email: "stale@example.com" },
    access_token: "bad.jwt.token",
  };
  const supabase = {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(async () => ({ data: { session: staleSession } })),
      getUser: vi.fn(async () => ({
        data: { user: null },
        error: { message: "bad_jwt: missing sub claim", status: 403 },
      })),
      signOut: vi.fn(async () => ({ error: null })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
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

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("useAuth · bad_jwt guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs out exactly once and does not loop when getUser returns bad_jwt", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Guard fired
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    // getUser called exactly once (no retry loop)
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
    // Session cleared
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAdmin).toBe(false);

    // Wait a bit more — assert no further calls piled up
    await new Promise((r) => setTimeout(r, 100));
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
  });
});
