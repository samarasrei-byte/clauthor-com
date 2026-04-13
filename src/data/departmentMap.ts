/**
 * Maps agent template slugs to their department.
 * Auto-generated from workforceArchitecture for ALL 200 agents.
 */

import { WORKFORCE, SLUG_TO_WORKFORCE_DEPT } from "./workforceArchitecture";

export interface DepartmentInfo {
  id: string;
  label: string;
  color: string;
}

const DEPARTMENTS: Record<string, DepartmentInfo> = {
  tecnologia:       { id: "tecnologia",       label: "Tecnologia",               color: "text-blue-400" },
  comercial:        { id: "comercial",         label: "Comercial",                color: "text-cyan-400" },
  marketing:        { id: "marketing",         label: "Marketing",                color: "text-primary" },
  financeiro:       { id: "financeiro",        label: "Financeiro",               color: "text-amber-400" },
  criacao:          { id: "criacao",           label: "Criação",                  color: "text-violet-400" },
  suporte:          { id: "suporte",           label: "Suporte",                  color: "text-emerald-400" },
  rh:               { id: "rh",               label: "RH",                       color: "text-pink-400" },
  prospeccao:       { id: "prospeccao",        label: "Prospecção & SDR",         color: "text-orange-400" },
  comunicacao:      { id: "comunicacao",       label: "Comunicação & Branding",   color: "text-rose-400" },
  operacoes:        { id: "operacoes",         label: "Operações & Estratégia",   color: "text-indigo-400" },
  ecommerce_growth: { id: "ecommerce_growth",  label: "E-commerce & Growth",      color: "text-teal-400" },
  juridico:         { id: "juridico",          label: "Jurídico & Compliance",    color: "text-slate-400" },
  compras:          { id: "compras",           label: "Compras & Procurement",    color: "text-lime-400" },
  logistica:        { id: "logistica",         label: "Logística & Supply Chain", color: "text-sky-400" },
  qualidade:        { id: "qualidade",         label: "Qualidade & Processos",    color: "text-yellow-400" },
  // Workforce architecture departments
  growth:           { id: "growth",            label: "Growth",                   color: "text-emerald-400" },
  product:          { id: "product",           label: "Product",                  color: "text-violet-400" },
  sales:            { id: "sales",             label: "Sales",                    color: "text-cyan-400" },
  customer_success: { id: "customer_success",  label: "Customer Success",         color: "text-emerald-400" },
  finance:          { id: "finance",           label: "Finance",                  color: "text-amber-400" },
  operations:       { id: "operations",        label: "Operations",               color: "text-indigo-400" },
  security:         { id: "security",          label: "Segurança & Compliance",   color: "text-red-400" },
  engineering:      { id: "engineering",       label: "Engenharia",               color: "text-cyan-400" },
  data_analytics:   { id: "data_analytics",    label: "Data & Analytics",         color: "text-indigo-400" },
  communications:   { id: "communications",    label: "Comunicação & PR",         color: "text-pink-400" },
  talent:           { id: "talent",            label: "Talent & People",          color: "text-amber-400" },
  innovation:       { id: "innovation",        label: "Inovação & R&D",           color: "text-violet-400" },
  it_infrastructure:{ id: "it_infrastructure", label: "IT & Infraestrutura",      color: "text-slate-400" },
  strategy:         { id: "strategy",          label: "Estratégia & Inteligência",color: "text-emerald-400" },
};

// ─── Manual overrides for legacy slugs ───
const MANUAL_SLUG_TO_DEPT: Record<string, string> = {
  // Tecnologia
  coding: "tecnologia", computer: "tecnologia", project_management: "tecnologia", security: "tecnologia", data_engineer: "tecnologia",
  // Comercial
  sales: "comercial", customer_success: "comercial", sales_channel: "comercial", voice_ai: "comercial", crm_manager: "comercial",
  // Marketing
  content: "marketing", marketing_automation: "marketing", seo_growth: "marketing", influencer: "marketing", media_buyer: "marketing", community_mgr: "marketing",
  // Financeiro
  revenue: "financeiro", data_analytics: "financeiro", ai_cfo: "financeiro", tax_content: "financeiro",
  digital_accountant: "financeiro", tax_compliance: "financeiro", credit_recovery: "financeiro",
  // Criação
  creative_design: "criacao", video_production: "criacao", creative_writer: "criacao", content_producer: "criacao", ux_researcher: "criacao",
  // Suporte
  support_channel: "suporte", support_lead: "suporte", voice_support: "suporte", rag: "suporte", onboarding_specialist: "suporte", omnichannel: "suporte",
  // RH
  hr: "rh", training: "rh", people_analytics: "rh",
  // Prospecção & SDR
  sdr_outbound: "prospeccao", sdr_inbound: "prospeccao", sdr_linkedin: "prospeccao", sdr_whatsapp: "prospeccao",
  sdr_instagram: "prospeccao", sdr_social: "prospeccao", sdr_database: "prospeccao", sdr_events: "prospeccao",
  sdr_partnerships: "prospeccao", pre_qualifier: "prospeccao", hunter: "prospeccao", farmer: "prospeccao",
  // Comunicação & Branding
  copywriting: "comunicacao", branding: "comunicacao", positioning: "comunicacao", public_relations: "comunicacao",
  social_proof: "comunicacao", events_speaker: "comunicacao",
  // Operações & Estratégia
  orchestrator: "operacoes", concierge: "operacoes", ceo: "operacoes", startup_creator: "operacoes",
  scheduler: "operacoes", proposal_gen: "operacoes", research: "operacoes",
  // E-commerce & Growth
  paid_traffic: "ecommerce_growth", whatsapp_commerce: "ecommerce_growth", influencer_liveshop: "ecommerce_growth",
  affiliate_manager: "ecommerce_growth", podcast_manager: "ecommerce_growth", reputation: "ecommerce_growth", ecommerce: "ecommerce_growth",
  // Jurídico & Compliance
  contract_analyst: "juridico", compliance_officer: "juridico", labor_law: "juridico", litigation: "juridico", legal: "juridico",
  // Compras & Procurement
  procurement: "compras", supplier_mgr: "compras", cost_analyst: "compras", contract_negotiator: "compras",
  // Logística & Supply Chain
  logistics: "logistica", inventory: "logistica", supply_chain: "logistica",
  // Qualidade & Processos
  quality: "qualidade", process_analyst: "qualidade",
  // Hunter
  hunter_linkedin: "sales",
};

/** Combined slug → department id (manual overrides + workforce auto-mapping) */
export const SLUG_TO_DEPT: Record<string, string> = { ...MANUAL_SLUG_TO_DEPT };

// Auto-fill from workforce architecture for any slug not manually overridden
for (const [slug, deptId] of Object.entries(SLUG_TO_WORKFORCE_DEPT)) {
  if (!(slug in SLUG_TO_DEPT)) {
    SLUG_TO_DEPT[slug] = deptId;
  }
}


export function getDepartmentForSlug(slug: string): DepartmentInfo | null {
  const deptId = SLUG_TO_DEPT[slug];
  return deptId ? DEPARTMENTS[deptId] || null : null;
}

export function getDepartmentById(id: string): DepartmentInfo | null {
  return DEPARTMENTS[id] || null;
}

export { DEPARTMENTS };
