import { describe, it, expect } from "vitest";

/**
 * Integration test: ensures REVOKE EXECUTE actually blocks anon users
 * from invoking SECURITY DEFINER RPCs that should be restricted.
 *
 * Uses raw fetch against PostgREST so we don't depend on supabase-js
 * client behavior. The anon key is public/publishable — safe to embed.
 *
 * Skipped automatically when env is missing (e.g. offline CI).
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL;
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

const canRun = Boolean(SUPABASE_URL && ANON_KEY);

async function rpcAsAnon(fn: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY!,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

describe.skipIf(!canRun)("SECURITY DEFINER · REVOKE EXECUTE", () => {
  it("check_video_quota rejects anon callers (authenticated-only)", async () => {
    const { status, body } = await rpcAsAnon("check_video_quota", {
      _user_id: "00000000-0000-0000-0000-000000000000",
    });
    // PostgREST returns 401/403/404 depending on how EXECUTE is revoked.
    // The key contract: it must NOT return 200 with a result payload for anon.
    expect(status).toBeGreaterThanOrEqual(400);
    expect(body).not.toMatch(/"plan"\s*:/);
  });

  it("get_ttfv_percentiles rejects anon (admin-only KPI)", async () => {
    const { status } = await rpcAsAnon("get_ttfv_percentiles", {});
    expect(status).toBeGreaterThanOrEqual(400);
  });

  it("get_wow_funnel rejects anon (admin-only KPI)", async () => {
    const { status } = await rpcAsAnon("get_wow_funnel", {});
    expect(status).toBeGreaterThanOrEqual(400);
  });
});
