import { Helmet } from "react-helmet-async";
import { departments } from "@/data/departmentData";

/**
 * ItemList + Product JSON-LD for the /departamentos page.
 *
 * Emits one Product per department (name, description, category, offers)
 * so search engines can build long-tail rich results for queries like
 * "AI marketing department" or "AI legal department".
 *
 * All prices come from the same source as the UI (`departmentData`),
 * so structured data never drifts from what the user sees.
 */

const DEPT_NAMES: Record<string, { name: string; category: string }> = {
  tecnologia: { name: "Departamento de Tecnologia", category: "Software Engineering" },
  qualidade: { name: "Departamento de Qualidade", category: "Quality Assurance" },
  comercial: { name: "Departamento Comercial", category: "Sales" },
  prospeccao: { name: "Departamento de Prospecção", category: "Sales Development" },
  comunicacao: { name: "Departamento de Comunicação", category: "Communications" },
  operacoes: { name: "Departamento de Operações", category: "Operations" },
  ecommerce_growth: { name: "E-commerce & Growth", category: "E-commerce" },
  juridico: { name: "Departamento Jurídico", category: "Legal" },
  financeiro: { name: "Departamento Financeiro", category: "Finance" },
  rh: { name: "Departamento de Recursos Humanos", category: "Human Resources" },
  suporte: { name: "Suporte ao Cliente", category: "Customer Support" },
  marketing: { name: "Departamento de Marketing", category: "Marketing" },
  criacao: { name: "Departamento de Criação", category: "Creative" },
  logistica: { name: "Departamento de Logística", category: "Logistics" },
  compras: { name: "Departamento de Compras", category: "Procurement" },
};

function displayFor(id: string): { name: string; category: string } {
  return DEPT_NAMES[id] ?? { name: `Departamento ${id}`, category: "Business" };
}

export default function DepartmentsJsonLd() {
  const items = departments.map((d, i) => {
    const meta = displayFor(d.id);
    return {
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: meta.name,
        category: meta.category,
        description: `${meta.name} operado por ${d.agents.length} agentes autônomos CLAUTHOR · substitui uma equipe humana de ${d.headcount} pessoas.`,
        brand: { "@type": "Brand", name: "CLAUTHOR" },
        offers: {
          "@type": "Offer",
          price: d.clauthorCost,
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
          url: `https://www.clauthor.com/departamentos#${d.id}`,
        },
      },
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Departamentos CLAUTHOR",
    itemListElement: items,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
