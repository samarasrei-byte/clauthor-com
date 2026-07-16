import { corsHeaders } from "../_shared/cors.ts";

interface FirecrawlBranding {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    textPrimary?: string;
    textSecondary?: string;
  };
  fonts?: Array<{ family: string }>;
  logo?: string;
  images?: { logo?: string; favicon?: string; ogImage?: string };
  colorScheme?: string;
}

interface ScrapePayload {
  success?: boolean;
  data?: {
    branding?: FirecrawlBranding;
    summary?: string;
    markdown?: string;
    metadata?: { title?: string; description?: string; sourceURL?: string; language?: string };
  };
  branding?: FirecrawlBranding;
  summary?: string;
  markdown?: string;
  metadata?: { title?: string; description?: string; sourceURL?: string };
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("URL vazia");
  if (trimmed.length > 500) throw new Error("URL muito longa");
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (!/^https?:$/.test(u.protocol)) throw new Error("Protocolo inválido");
    return u.toString();
  } catch {
    throw new Error("URL inválida");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawUrl = typeof body?.url === "string" ? body.url : "";
    if (!rawUrl) {
      return new Response(JSON.stringify({ success: false, error: "url é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = normalizeUrl(rawUrl);
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    const fcResponse = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["branding", "summary", "markdown"],
        onlyMainContent: true,
      }),
      signal: controller.signal,
    }).catch((err) => {
      clearTimeout(timeout);
      throw err;
    });
    clearTimeout(timeout);

    const payload = (await fcResponse.json()) as ScrapePayload;
    if (!fcResponse.ok) {
      const errMsg = (payload as { error?: string })?.error || `Firecrawl ${fcResponse.status}`;
      return new Response(JSON.stringify({ success: false, error: errMsg }), {
        status: fcResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Firecrawl v2 sometimes wraps in `data`
    const branding = payload.data?.branding ?? payload.branding ?? {};
    const summary = payload.data?.summary ?? payload.summary ?? "";
    const metadata = payload.data?.metadata ?? payload.metadata ?? {};

    const dna = {
      colors: {
        primary: branding?.colors?.primary || null,
        secondary: branding?.colors?.secondary || null,
        accent: branding?.colors?.accent || null,
        background: branding?.colors?.background || null,
        textPrimary: branding?.colors?.textPrimary || null,
        textSecondary: branding?.colors?.textSecondary || null,
      },
      fonts: (branding?.fonts ?? []).slice(0, 4).map((f) => ({ family: f.family })),
      logo: branding?.logo || branding?.images?.logo || null,
      favicon: branding?.images?.favicon || null,
      ogImage: branding?.images?.ogImage || null,
      colorScheme: branding?.colorScheme || null,
      summary: summary || metadata?.description || "",
      title: metadata?.title || "",
      sourceUrl: metadata?.sourceURL || url,
    };

    const hasColors = Object.values(dna.colors).some(Boolean);
    if (!hasColors && !dna.logo && !dna.summary) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Não foi possível extrair identidade visual desse site. Tente configurar manualmente.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true, data: dna }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[company-dna-scraper]", err);
    const msg = err instanceof Error ? err.message : "Falha no scrape";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
