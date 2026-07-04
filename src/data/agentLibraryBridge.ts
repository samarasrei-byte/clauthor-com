/**
 * Bridge: auto-generates library entries for ALL 200 workforce agents.
 * Manual overrides in libraryAgentData.ts take precedence.
 * New agents from workforceArchitecture.ts get sensible defaults.
 */

import { WORKFORCE, ALL_AGENT_SLUGS, SLUG_TO_WORKFORCE_DEPT } from "./workforceArchitecture";
import { Bot, Zap, MessageSquare, FileText, DollarSign, Calendar, Star, ShoppingCart, Code, Brain, Shield, Mic, Eye, Workflow, Phone, Search, Users, Briefcase, BarChart3, Layers, Cpu, Globe, Rocket, Megaphone, Target, Palette, Video, ClipboardList, Truck, GraduationCap, HeartHandshake, Crown, Play, TrendingUp, Award, Newspaper, PenTool, Compass, Gem, Radio, ThumbsUp, CalendarDays, Linkedin, Instagram, Mail, Database, Handshake, Crosshair, Wheat, Gavel, ShieldCheck, Scale, BookOpen, Package, Factory, Receipt, Cog, ClipboardCheck, ScanLine, HardDrive, ContactRound, Lightbulb, CircleDollarSign, UserCheck, BarChart, Wrench, Settings, AlertTriangle, Monitor, Headphones, BookOpenCheck, PieChart, Laptop, Network, Gauge, ArrowUpDown, Timer, CheckCircle, Flag, Clipboard, type LucideIcon } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import type { PriceTier } from "@/lib/pricing";

// ─── Dept → default icon mapping ───
const DEPT_ICON_MAP: Record<string, LucideIcon> = {
  marketing: Megaphone,
  growth: TrendingUp,
  product: Layers,
  sales: Briefcase,
  customer_success: HeartHandshake,
  finance: DollarSign,
  operations: Settings,
  security: Shield,
  engineering: Cpu,
  data_analytics: BarChart3,
  communications: Megaphone,
  talent: Users,
  innovation: Lightbulb,
  it_infrastructure: Monitor,
  strategy: Compass,
};

// ─── Dept → default tier mapping ───
const DEPT_TIER_MAP: Record<string, string> = {
  marketing: "advanced",
  growth: "advanced",
  product: "advanced",
  sales: "advanced",
  customer_success: "intermediate",
  finance: "advanced",
  operations: "advanced",
  security: "enterprise",
  engineering: "advanced",
  data_analytics: "advanced",
  communications: "intermediate",
  talent: "intermediate",
  innovation: "advanced",
  it_infrastructure: "intermediate",
  strategy: "enterprise",
};

// ─── Dept → default price tier mapping ───
const DEPT_PRICE_MAP: Record<string, PriceTier> = {
  marketing: "mid",
  growth: "mid",
  product: "mid",
  sales: "mid",
  customer_success: "entry",
  finance: "mid",
  operations: "mid",
  security: "premium",
  engineering: "mid",
  data_analytics: "mid",
  communications: "entry",
  talent: "entry",
  innovation: "mid",
  it_infrastructure: "entry",
  strategy: "premium",
};

/**
 * Build a flat agent map from WORKFORCE for quick lookup.
 */
const workforceAgentMap = new Map<string, {
  name: string;
  responsibilities: string[];
  triggers: string[];
  deptId: string;
  deptName: string;
}>();

for (const dept of WORKFORCE) {
  for (const sq of dept.squads) {
    for (const agent of sq.agents) {
      workforceAgentMap.set(agent.slug, {
        name: agent.name,
        responsibilities: agent.responsibilities,
        triggers: agent.triggers,
        deptId: dept.id,
        deptName: dept.name,
      });
    }
  }
}

/**
 * Returns the full 200-agent key list.
 */
export function getAllAgentKeys(): readonly string[] {
  return ALL_AGENT_SLUGS;
}

/**
 * Returns default icon for a slug not manually overridden.
 */
export function getDefaultIcon(slug: string): LucideIcon {
  const agent = workforceAgentMap.get(slug);
  if (!agent) return Bot;
  return DEPT_ICON_MAP[agent.deptId] || Bot;
}

/**
 * Returns default tier for a slug.
 */
export function getDefaultTier(slug: string): string {
  const agent = workforceAgentMap.get(slug);
  if (!agent) return "intermediate";
  return DEPT_TIER_MAP[agent.deptId] || "intermediate";
}

/**
 * Returns default price tier for a slug.
 */
export function getDefaultPriceTier(slug: string): PriceTier {
  const agent = workforceAgentMap.get(slug);
  if (!agent) return "entry";
  return DEPT_PRICE_MAP[agent.deptId] || "entry";
}

/**
 * Returns default tags derived from responsibilities.
 */
export function getDefaultTags(slug: string): string[] {
  const agent = workforceAgentMap.get(slug);
  if (!agent) return ["IA", "Automação"];
  return agent.responsibilities.slice(0, 5);
}

/**
 * Returns default capabilities derived from responsibilities.
 */
export function getDefaultCapabilities(slug: string): string[] {
  const agent = workforceAgentMap.get(slug);
  if (!agent) return ["IA", "Análise", "Automação"];
  return agent.responsibilities.slice(0, 3);
}

/**
 * Returns default integrations based on department.
 */
export function getDefaultIntegrations(slug: string): string[] {
  const agent = workforceAgentMap.get(slug);
  if (!agent) return ["API", "Webhook", "Slack"];
  const deptIntegrations: Record<string, string[]> = {
    marketing: ["HubSpot", "Meta Business", "Google Ads", "Mailchimp", "WordPress"],
    growth: ["Google Ads", "Meta Ads", "Apollo.io", "HubSpot", "Lemlist"],
    product: ["Jira", "Linear", "Figma", "Notion", "GitHub"],
    sales: ["HubSpot", "Salesforce", "Pipedrive", "DocuSign", "Apollo.io"],
    customer_success: ["Intercom", "Zendesk", "HubSpot", "Mixpanel", "Gainsight"],
    finance: ["Conta Azul", "Omie", "SEFAZ", "SAP", "Power BI"],
    operations: ["Notion", "Slack", "Google Workspace", "Jira", "Asana"],
  };
  return deptIntegrations[agent.deptId] || ["API", "Webhook", "Slack", "Notion", "Google Workspace"];
}

/**
 * Returns default social proof.
 */
export function getDefaultSocialProof(slug: string): { companies: number; rating: number; savings: string } {
  return { companies: Math.floor(100 + Math.random() * 200), rating: 4.7, savings: "R$ 15k" };
}

/**
 * Returns the agent display name from workforce data.
 */
export function getAgentName(slug: string): string {
  return workforceAgentMap.get(slug)?.name || slug;
}

/**
 * Creates a proxy-like record that falls back to workforce defaults.
 * Usage: const icons = createFallbackRecord(manualIcons, getDefaultIcon);
 */
export function createFallbackRecord<T>(
  manual: Record<string, T>,
  fallbackFn: (slug: string) => T,
): Record<string, T> {
  return new Proxy(manual, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      if (typeof prop === "string" && workforceAgentMap.has(prop)) {
        return fallbackFn(prop);
      }
      return undefined;
    },
    has(target, prop: string) {
      return prop in target || (typeof prop === "string" && workforceAgentMap.has(prop));
    },
  });
}
