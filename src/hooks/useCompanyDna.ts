import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface BrandColors {
  primary?: string | null;
  secondary?: string | null;
  accent?: string | null;
  background?: string | null;
  textPrimary?: string | null;
  textSecondary?: string | null;
}

export interface BrandFont {
  family: string;
  role?: "heading" | "body" | "mono";
}

export interface CompanyIntelligence {
  business_summary?: string | null;
  core_business?: string | null;
  industry_guess?: string | null;
  icp?: { who?: string | null; segment?: string | null; trigger?: string | null } | null;
  tone_of_voice?: { primary?: string | null; notes?: string | null } | null;
  persona?: { role?: string | null; pain?: string | null } | null;
  differentiators?: string[];
  suggested_pain_points?: string[];
  confidence?: number | null;
}

export interface CompanyDna {
  id?: string;
  scope: "own" | "client";
  client_label?: string | null;
  source_url?: string | null;
  brand_colors: BrandColors;
  fonts: BrandFont[];
  logo_url?: string | null;
  favicon_url?: string | null;
  core_business?: string | null;
  pain_points: string[];
  industry?: string | null;
  intelligence?: CompanyIntelligence;
}

export interface ScrapeResult {
  colors: BrandColors;
  fonts: BrandFont[];
  logo: string | null;
  favicon: string | null;
  ogImage: string | null;
  colorScheme: string | null;
  summary: string;
  title: string;
  sourceUrl: string;
  intelligence?: CompanyIntelligence;
}

const emptyDna = (scope: "own" | "client" = "own"): CompanyDna => ({
  scope,
  brand_colors: {},
  fonts: [],
  pain_points: [],
  intelligence: {},
});

export function useCompanyDna() {
  const { user } = useAuth();
  const [dna, setDna] = useState<CompanyDna | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("company_dna")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setDna({
          id: data.id,
          scope: (data.scope as "own" | "client") ?? "own",
          client_label: data.client_label,
          source_url: data.source_url,
          brand_colors: (data.brand_colors ?? {}) as unknown as BrandColors,
          fonts: (data.fonts ?? []) as unknown as BrandFont[],
          logo_url: data.logo_url,
          favicon_url: data.favicon_url,
          core_business: data.core_business,
          pain_points: data.pain_points ?? [],
          industry: data.industry,
          intelligence: ((data as Record<string, unknown>).intelligence ?? {}) as CompanyIntelligence,
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const scrape = useCallback(async (url: string): Promise<ScrapeResult | { error: string }> => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("company-dna-scraper", {
        body: { url },
      });
      if (error) return { error: error.message || "Falha ao analisar site" };
      if (!data?.success) return { error: data?.error || "Falha ao analisar site" };
      return data.data as ScrapeResult;
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Falha ao analisar site" };
    } finally {
      setScraping(false);
    }
  }, []);

  const save = useCallback(async (payload: CompanyDna): Promise<CompanyDna | null> => {
    if (!user) return null;
    setSaving(true);
    try {
      const row = {
        user_id: user.id,
        scope: payload.scope,
        client_label: payload.client_label ?? null,
        source_url: payload.source_url ?? null,
        brand_colors: JSON.parse(JSON.stringify(payload.brand_colors ?? {})),
        fonts: JSON.parse(JSON.stringify(payload.fonts ?? [])),
        logo_url: payload.logo_url ?? null,
        favicon_url: payload.favicon_url ?? null,
        core_business: payload.core_business ?? null,
        pain_points: payload.pain_points ?? [],
        industry: payload.industry ?? null,
        intelligence: JSON.parse(JSON.stringify(payload.intelligence ?? {})),
      };

      if (payload.id) {
        const { data, error } = await supabase
          .from("company_dna")
          .update(row)
          .eq("id", payload.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data ? { ...payload, id: data.id } : null;
      }

      const { data, error } = await supabase
        .from("company_dna")
        .insert(row)
        .select()
        .maybeSingle();
      if (error) throw error;
      const saved = data ? { ...payload, id: data.id } : null;
      if (saved) setDna(saved);
      return saved;
    } catch (err) {
      console.error("[useCompanyDna] save failed", err);
      return null;
    } finally {
      setSaving(false);
    }
  }, [user]);

  return { dna, setDna, loading, scraping, saving, scrape, save, emptyDna };
}
