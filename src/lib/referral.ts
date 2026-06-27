/**
 * Captura ?ref=CODE da URL, persiste em localStorage e registra clique.
 * Usado durante o cadastro para creditar bônus ao referenciador.
 */
import { supabase } from "@/integrations/supabase/client";

const KEY = "clauthor_ref";

export function captureReferralFromURL() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const ref = url.searchParams.get("ref");
  if (!ref) return;

  const existing = localStorage.getItem(KEY);
  if (existing === ref) return;

  localStorage.setItem(KEY, ref);

  // Fire-and-forget click tracking
  (async () => {
    try {
      const { data: r } = await supabase
        .from("referrals")
        .select("id, clicks")
        .eq("code", ref)
        .maybeSingle();
      if (!r) return;
      await supabase.from("referral_events").insert({
        referral_id: r.id,
        event_type: "click",
        visitor_id: localStorage.getItem("visitor_id") ?? null,
        metadata: { path: url.pathname, ts: new Date().toISOString() },
      });
      await supabase
        .from("referrals")
        .update({ clicks: (r.clicks ?? 0) + 1 })
        .eq("id", r.id);
    } catch {
      /* silent */
    }
  })();
}

export function getStoredReferral(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function clearStoredReferral() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}
