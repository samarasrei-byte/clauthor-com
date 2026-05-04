import { describe, it, expect } from "vitest";

/**
 * STRESS TEST - CLAUTHOR Platform
 * Tests critical paths, routing, imports, and data integrity
 */

// ═══════════════════════════════════════════════════════
// 1. ROUTING - All pages load without import errors
// ═══════════════════════════════════════════════════════
describe("Page Imports (lazy load stress)", () => {
  const pages = [
    { name: "Index", path: "../pages/Index" },
    { name: "Auth", path: "../pages/Auth" },
    { name: "Library", path: "../pages/Library" },
    { name: "Pricing", path: "../pages/Pricing" },
    { name: "HowItWorks", path: "../pages/HowItWorks" },
    { name: "Waitlist", path: "../pages/Waitlist" },
    { name: "Community", path: "../pages/Community" },
    { name: "Agents", path: "../pages/Agents" },
    { name: "CreateAgent", path: "../pages/CreateAgent" },
    { name: "Integrations", path: "../pages/Integrations" },
    { name: "ClientDashboard", path: "../pages/ClientDashboard" },
    { name: "AdminDashboard", path: "../pages/AdminDashboard" },
    { name: "AgentLanding", path: "../pages/AgentLanding" },
    { name: "Departamentos", path: "../pages/Departamentos" },
    { name: "MonixCommandCenter", path: "../pages/MonixCommandCenter" },
    { name: "OmnixCommandCenter", path: "../pages/OmnixCommandCenter" },
    { name: "NotFound", path: "../pages/NotFound" },
  ];

  pages.forEach(({ name, path }) => {
    it(`${name} imports without errors`, async () => {
      const mod = await import(/* @vite-ignore */ path);
      expect(mod).toBeDefined();
      expect(mod.default).toBeDefined();
    });
  });
});

// ═══════════════════════════════════════════════════════
// 2. HOOKS - Core hooks export correctly
// ═══════════════════════════════════════════════════════
describe("Core Hook Exports", () => {
  it("useAuth exports correctly", async () => {
    const mod = await import("../hooks/useAuth");
    expect(mod.useAuth).toBeDefined();
    expect(mod.AuthProvider).toBeDefined();
  });

  it("useTheme exports correctly", async () => {
    const mod = await import("../hooks/useTheme");
    expect(mod.useTheme).toBeDefined();
    expect(mod.ThemeProvider).toBeDefined();
  });

  it("useCredits exports correctly", async () => {
    const mod = await import("../hooks/useCredits");
    expect(mod.useCredits).toBeDefined();
  });

  it("useNotifications exports correctly", async () => {
    const mod = await import("../hooks/useNotifications");
    expect(mod.useNotifications).toBeDefined();
  });

  it("useMonix exports correctly", async () => {
    const mod = await import("../hooks/useMonix");
    expect(mod.useMonix).toBeDefined();
  });

  it("useOmnix exports correctly", async () => {
    const mod = await import("../hooks/useOmnix");
    expect(mod.useOmnix).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════
// 3. DATA INTEGRITY - Static data is well-formed
// ═══════════════════════════════════════════════════════
describe("Agent Data Integrity", () => {
  it("libraryAgentData has valid structure", async () => {
    const { agentKeys, agentSlugs, agentIcons, agentTiers } = await import("../data/libraryAgentData");
    expect(Array.isArray(agentKeys)).toBe(true);
    expect(agentKeys.length).toBeGreaterThan(0);
    
    agentKeys.forEach((key: string) => {
      expect(agentSlugs[key]).toBeTruthy();
      expect(agentIcons[key]).toBeDefined();
      expect(agentTiers[key]).toBeTruthy();
    });
  });

  it("agentLandingData has valid structure", async () => {
    const { agentLandingPages, getAgentBySlug } = await import("../data/agentLandingData");
    expect(Array.isArray(agentLandingPages)).toBe(true);
    expect(agentLandingPages.length).toBeGreaterThan(0);

    agentLandingPages.forEach((agent: any) => {
      expect(agent.slug).toBeTruthy();
      expect(agent.heroHeadline).toBeTruthy();
    });

    // Test lookup
    const found = getAgentBySlug("voice_ai");
    expect(found).toBeDefined();
    expect(found?.slug).toBe("voice_ai");
  });
});

// ═══════════════════════════════════════════════════════
// 4. i18n - All locales load and have required keys
// ═══════════════════════════════════════════════════════
describe("i18n Locale Integrity", () => {
  const locales = ["en", "pt", "es", "fr", "de", "it", "ja", "ko", "zh", "ar", "hi", "ru", "tr"];
  const requiredKeys = ["hero.title1", "hero.subtitle"];

  locales.forEach((locale) => {
    it(`${locale}.json loads and has required keys`, async () => {
      const mod = await import(`../i18n/locales/${locale}.json`);
      expect(mod.default || mod).toBeDefined();

      const data = mod.default || mod;
      // Check nested key exists
      requiredKeys.forEach((key) => {
        const parts = key.split(".");
        let current: any = data;
        for (const part of parts) {
          current = current?.[part];
        }
        expect(current).toBeTruthy();
      });
    });
  });
});

// ═══════════════════════════════════════════════════════
// 5. UTILS & LIB - Core utilities work
// ═══════════════════════════════════════════════════════
describe("Core Utilities", () => {
  it("cn() merges classes correctly", async () => {
    const { cn } = await import("../lib/utils");
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("p-4", "p-2")).toBe("p-2"); // tailwind-merge
  });

  it("pricing module exports correctly", async () => {
    const pricing = await import("../lib/pricing");
    expect(pricing).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════
// 6. SUPABASE CLIENT - Exports are valid
// ═══════════════════════════════════════════════════════
describe("Supabase Client", () => {
  it("exports supabase client instance", async () => {
    const { supabase } = await import("../integrations/supabase/client");
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe("function");
    expect(typeof supabase.auth).toBe("object");
  });
});

// ═══════════════════════════════════════════════════════
// 7. COMPONENT IMPORTS - Critical dashboard components
// ═══════════════════════════════════════════════════════
describe("Dashboard Component Imports", () => {
  const components = [
    "AgentChat", "AgentSettings", "AgentsList", "ContractedAgents",
    "ExecutionLogs", "CompanyBoard", "DashboardStats",
    "WhatsAppSetupGuide", "SendGridSetupGuide",
    "ConciergeChat", "SquadChat", "PaymentsPanel",
  ];

  components.forEach((name) => {
    it(`${name} imports correctly`, async () => {
      const mod = await import(`../components/dashboard/${name}`);
      expect(mod.default).toBeDefined();
    });
  });
});

// ═══════════════════════════════════════════════════════
// 8. CONCURRENT LOAD TEST - Simulate parallel imports
// ═══════════════════════════════════════════════════════
describe("Concurrent Import Stress", () => {
  it("loads 15+ modules in parallel without errors", async () => {
    const imports = [
      import("../pages/Index"),
      import("../pages/Library"),
      import("../pages/Pricing"),
      import("../pages/Auth"),
      import("../pages/Agents"),
      import("../pages/ClientDashboard"),
      import("../pages/AdminDashboard"),
      import("../hooks/useAuth"),
      import("../hooks/useTheme"),
      import("../hooks/useCredits"),
      import("../data/libraryAgentData"),
      import("../data/agentLandingData"),
      import("../lib/utils"),
      import("../integrations/supabase/client"),
      import("../components/dashboard/DashboardStats"),
    ];

    const results = await Promise.all(imports);
    results.forEach((mod) => {
      expect(mod).toBeDefined();
    });
  });
});
