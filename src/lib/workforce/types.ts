// Digital Workforce OS — core types

export type WorkforceScale = "agent" | "squad" | "department" | "org";

export type AutonomyLevel = "assistant" | "operator" | "specialist" | "coordinator" | "executive";

export type DepartmentKey =
  | "vendas"
  | "marketing"
  | "rh"
  | "financeiro"
  | "juridico"
  | "atendimento"
  | "operacoes"
  | "ti"
  | "produto"
  | "dados"
  | "compliance"
  | "sucesso"
  | "suprimentos"
  | "logistica"
  | "executivo";

export interface AgentTemplate {
  id: string;
  role: string;
  department: DepartmentKey;
  tagline: string;
  suggestedTools: string[];
  suggestedIntegrations: string[];
  suggestedChannels: string[];
  defaultKPIs: string[];
  baselineCostCredits: number; // monthly estimate
  recommendedAutonomy: AutonomyLevel;
  resultTags: string[]; // "gerar leads", "reduzir churn"
}

export interface HierarchyNode {
  id: string;
  templateId: string;
  role: string;
  autonomy: AutonomyLevel;
  reportsTo?: string; // node id or "human"
  children: string[];
}

export interface BuilderState {
  step: number;
  objective: string;
  scale: WorkforceScale;
  name: string;
  selectedTemplates: string[]; // template ids
  autonomy: AutonomyLevel;
  tools: string[];
  integrations: string[];
  channels: string[];
  knowledge: { name: string; type: "url" | "file" | "text"; value: string }[];
  memory: { short: boolean; long: boolean; shared: boolean };
  hierarchy: Record<string, HierarchyNode>;
  governance: {
    approvalRequired: ("email" | "spend" | "external_contact" | "data_export")[];
    monthlyCreditCap: number;
    escalateToHuman: string; // email
  };
  aiAssisted: boolean;
}

export const initialBuilderState: BuilderState = {
  step: 0,
  objective: "",
  scale: "agent",
  name: "",
  selectedTemplates: [],
  autonomy: "specialist",
  tools: [],
  integrations: [],
  channels: [],
  knowledge: [],
  memory: { short: true, long: true, shared: false },
  hierarchy: {},
  governance: {
    approvalRequired: ["spend", "external_contact"],
    monthlyCreditCap: 50000,
    escalateToHuman: "",
  },
  aiAssisted: false,
};

export type BuilderAction =
  | { type: "SET_STEP"; step: number }
  | { type: "PATCH"; patch: Partial<BuilderState> }
  | { type: "TOGGLE_TEMPLATE"; id: string }
  | { type: "TOGGLE_LIST"; key: "tools" | "integrations" | "channels"; value: string }
  | { type: "RESET" };

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };
    case "PATCH":
      return { ...state, ...action.patch };
    case "TOGGLE_TEMPLATE": {
      const has = state.selectedTemplates.includes(action.id);
      return {
        ...state,
        selectedTemplates: has
          ? state.selectedTemplates.filter((i) => i !== action.id)
          : [...state.selectedTemplates, action.id],
      };
    }
    case "TOGGLE_LIST": {
      const list = state[action.key];
      const has = list.includes(action.value);
      return {
        ...state,
        [action.key]: has ? list.filter((v) => v !== action.value) : [...list, action.value],
      };
    }
    case "RESET":
      return initialBuilderState;
    default:
      return state;
  }
}

export const AUTONOMY_META: Record<AutonomyLevel, { label: string; desc: string; approval: string; color: string }> = {
  assistant: { label: "Assistente", desc: "Responde e sugere — sem agir sozinho", approval: "Aprovação humana sempre", color: "from-slate-500 to-slate-600" },
  operator: { label: "Operador", desc: "Executa tarefas simples já definidas", approval: "Aprova antes de ações externas", color: "from-cyan-500 to-blue-600" },
  specialist: { label: "Especialista", desc: "Domínio profundo, decide dentro do escopo", approval: "Apenas ações sensíveis", color: "from-violet-500 to-purple-600" },
  coordinator: { label: "Coordenador", desc: "Delega para outros agentes e supervisiona", approval: "Apenas mudanças estruturais", color: "from-amber-500 to-orange-600" },
  executive: { label: "Executivo", desc: "Define metas e governa squads inteiras", approval: "Apenas governança", color: "from-rose-500 to-red-600" },
};

export const SCALE_META: Record<WorkforceScale, { label: string; desc: string; min: number; max: string }> = {
  agent: { label: "Assistente Individual", desc: "Um funcionário digital especializado", min: 1, max: "1 agente" },
  squad: { label: "Equipe", desc: "3–6 agentes colaborando num objetivo", min: 3, max: "até 6 agentes" },
  department: { label: "Departamento", desc: "Múltiplas equipes com coordenador", min: 8, max: "8–24 agentes" },
  org: { label: "Organização", desc: "Empresa autônoma multi-departamento", min: 25, max: "25+ agentes" },
};
