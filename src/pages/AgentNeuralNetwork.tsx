import { Suspense, useMemo, useRef, useState, useCallback } from "react";

// Pre-flight WebGL probe — avoids the R3F `Error creating WebGL context` crash
// on devices/browsers without GPU acceleration (headless, locked-down enterprise, etc).
const isWebGLAvailable = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
};
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Float, Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { CLAUTHOR_ORG_CHART } from "@/data/clauthorOrgChart";
// Estrutura oficial Clauthor: CEO Virtual (orquestrador) + 9 departamentos com sub-especialidades
const WORKFORCE = CLAUTHOR_ORG_CHART;
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Zap, Users, Target,
  Crown, Megaphone, DollarSign, Briefcase, Code2, Truck, Scale, Headphones,
  BarChart3, Lightbulb, Leaf, Globe, Handshake, Layers, TrendingUp, ShieldAlert,
  Database, Film, Building2,
} from "lucide-react";

// ── Icon per department ──
const DEPT_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>> = {
  executivo: Crown,
  marketing: Megaphone,
  vendas: Target,
  financeiro: DollarSign,
  rh: Briefcase,
  ti: Code2,
  operacoes: Truck,
  juridico: Scale,
  atendimento: Headphones,
  dados: BarChart3,
  inovacao: Lightbulb,
  sustentabilidade: Leaf,
  internacional: Globe,
  parcerias: Handshake,
  produto: Layers,
  growth: TrendingUp,
  seguranca: ShieldAlert,
  mlops: Database,
  midia: Film,
  facilities: Building2,
};

// ── Color palette per department (matches CLAUTHOR_ORG_CHART ids) ──
const DEPT_COLORS: Record<string, string> = {
  executivo: "#f59e0b",      // amber
  marketing: "#ec4899",      // pink
  vendas: "#ef4444",         // red
  financeiro: "#22c55e",     // green
  rh: "#06b6d4",             // cyan
  ti: "#8b5cf6",             // violet
  operacoes: "#f97316",      // orange
  juridico: "#64748b",       // slate
  atendimento: "#0ea5e9",    // sky
  dados: "#14b8a6",          // teal
  inovacao: "#a855f7",       // purple
  sustentabilidade: "#10b981",// emerald
  internacional: "#3b82f6",  // blue
  parcerias: "#facc15",      // yellow
  produto: "#ec4899",        // pink
  growth: "#84cc16",         // lime
  seguranca: "#dc2626",      // red-deep
  mlops: "#a855f7",          // purple
  midia: "#f43f5e",          // rose
  facilities: "#d97706",     // amber
};

// ── Tradução PT-BR ──
const DEPT_PT: Record<string, string> = {
  Marketing: "Marketing",
  Growth: "Crescimento",
  Product: "Produto",
  Sales: "Vendas",
  "Customer Success": "Sucesso do Cliente",
  Finance: "Financeiro",
  Operations: "Operações",
  "Segurança & Compliance": "Segurança & Compliance",
  Engenharia: "Engenharia",
  "Data & Analytics": "Dados & Analytics",
  "Comunicação & PR": "Comunicação & RP",
  "Talent & People": "Recursos Humanos",
  "Talentos & Pessoas": "Recursos Humanos",
  "Inovação & R&D": "Inovação & P&D",
  "IT & Infraestrutura": "TI & Infraestrutura",
  "Estratégia & Inteligência": "Estratégia & Inteligência",
};
const ptDept = (n: string) => DEPT_PT[n] || n;

const AGENT_WORD_PT: Array<[RegExp, string]> = [
  [/\bManager\b/g, "Gerente"],
  [/\bSpecialist\b/g, "Especialista"],
  [/\bStrategist\b/g, "Estrategista"],
  [/\bAnalyst\b/g, "Analista"],
  [/\bWriter\b/g, "Redator"],
  [/\bDesigner\b/g, "Designer"],
  [/\bDeveloper\b/g, "Desenvolvedor"],
  [/\bEngineer\b/g, "Engenheiro"],
  [/\bAgent\b/g, "Agente"],
  [/\bOptimizer\b/g, "Otimizador"],
  [/\bAllocator\b/g, "Alocador"],
  [/\bBuilder\b/g, "Construtor"],
  [/\bBuyer\b/g, "Comprador"],
  [/\bCopywriter\b/g, "Copywriter"],
  [/\bResearcher\b/g, "Pesquisador"],
  [/\bScientist\b/g, "Cientista"],
  [/\bCoordinator\b/g, "Coordenador"],
  [/\bDirector\b/g, "Diretor"],
  [/\bLead\b/g, "Líder"],
  [/\bAssistant\b/g, "Assistente"],
  [/\bAuditor\b/g, "Auditor"],
  [/\bAdvisor\b/g, "Consultor"],
  [/\bAccount Executive\b/g, "Executivo de Conta"],
  [/\bSales\b/g, "Vendas"],
  [/\bSupport\b/g, "Suporte"],
  [/\bCustomer Success\b/g, "Sucesso do Cliente"],
  [/\bOnboarding\b/g, "Onboarding"],
  [/\bRetention\b/g, "Retenção"],
  [/\bChurn\b/g, "Churn"],
  [/\bGrowth\b/g, "Crescimento"],
  [/\bContent\b/g, "Conteúdo"],
  [/\bPerformance\b/g, "Performance"],
  [/\bBrand\b/g, "Marca"],
  [/\bVoice\b/g, "Voz"],
  [/\bCampaign\b/g, "Campanha"],
  [/\bInfluencer\b/g, "Influenciador"],
  [/\bBlog\b/g, "Blog"],
  [/\bSocial Media\b/g, "Mídia Social"],
  [/\bVideo Script\b/g, "Roteiro de Vídeo"],
  [/\bIdentity\b/g, "Identidade"],
  [/\bVisual\b/g, "Visual"],
  [/\bPositioning\b/g, "Posicionamento"],
  [/\bAttribution\b/g, "Atribuição"],
  [/\bBudget\b/g, "Orçamento"],
  [/\bRetargeting\b/g, "Retargeting"],
  [/\bMedia\b/g, "Mídia"],
  [/\bTechnical\b/g, "Técnico"],
  [/\bLink\b/g, "Link"],
  [/\bPR\b/g, "RP"],
];
const ptAgent = (n: string) =>
  AGENT_WORD_PT.reduce((acc, [r, v]) => acc.replace(r, v), n);

// ── 3D Node for each agent ──
function AgentNode({
  position,
  color,
  name,
  onClick,
  isSelected,
}: {
  position: [number, number, number];
  color: string;
  name: string;
  onClick: () => void;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y =
      position[1] + Math.sin(t * 0.8 + position[0] * 2) * 0.05;
    const scale = isSelected ? 1.6 : hovered ? 1.3 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.2 : hovered ? 0.8 : 0.4}
          transparent
          opacity={0.9}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {/* Outer glow ring */}
      <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.18, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.6 : hovered ? 0.3 : 0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {hovered && (
        <Billboard position={[position[0], position[1] + 0.3, position[2]]}>
          <Text fontSize={0.08} color="white" anchorX="center" anchorY="bottom">
            {name}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

// ── Connection lines between nodes in the same squad ──
function SquadConnections({
  positions,
  color,
}: {
  positions: [number, number, number][];
  color: string;
}) {
  const lineRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        pts.push(...positions[i], ...positions[j]);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [positions]);

  useFrame((state) => {
    if (!lineRef.current) return;
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.08 + Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.12} />
    </lineSegments>
  );
}

// ── Department hub (larger node) ──
function DeptHub({
  position,
  color,
  name,
  agentCount,
  deptId,
  onClick,
  isSelected,
}: {
  position: [number, number, number];
  color: string;
  name: string;
  agentCount: number;
  deptId: string;
  onClick: () => void;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const Icon = DEPT_ICONS[deptId];

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.005;
    const s = isSelected ? 1.4 : hovered ? 1.2 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.5 : 0.6}
          transparent
          opacity={0.85}
          wireframe={!isSelected}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      <Billboard position={[position[0], position[1] + 0.4, position[2]]}>
        <Text fontSize={0.1} color={color} anchorX="center" anchorY="bottom" fontWeight={700}>
          {name}
        </Text>
        <Text
          fontSize={0.06}
          color="white"
          anchorX="center"
          anchorY="top"
          position={[0, -0.02, 0]}
        >
          {agentCount} agentes
        </Text>
      </Billboard>


    </group>
  );
}

// ── Ambient particles ──
function Particles() {
  const count = 300;
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#ffffff" transparent opacity={0.15} sizeAttenuation />
    </points>
  );
}

// ── Scene ──
function NetworkScene({
  onSelectDept,
  onSelectAgent,
  selectedDept,
}: {
  onSelectDept: (id: string | null) => void;
  onSelectAgent: (agent: { name: string; slug: string; dept: string; squad: string } | null) => void;
  selectedDept: string | null;
}) {
  const layout = useMemo(() => {
    const deptPositions: {
      id: string;
      name: string;
      color: string;
      pos: [number, number, number];
      agentCount: number;
      squads: {
        agents: { slug: string; name: string; pos: [number, number, number]; squadName: string }[];
        color: string;
      }[];
    }[] = [];

    const deptCount = WORKFORCE.length;
    const radius = 3.5;

    WORKFORCE.forEach((dept, di) => {
      const angle = (di / deptCount) * Math.PI * 2;
      const dx = Math.cos(angle) * radius;
      const dz = Math.sin(angle) * radius;
      const dy = (Math.random() - 0.5) * 0.5;
      const color = DEPT_COLORS[dept.id] || "#888888";

      let totalAgents = 0;
      const squadLayouts = dept.squads.map((squad, si) => {
        const squadAngle = angle + ((si - (dept.squads.length - 1) / 2) * 0.3);
        const squadRadius = 1.2 + si * 0.3;
        const agents = squad.agents.map((agent, ai) => {
          totalAgents++;
          const agentAngle = squadAngle + ((ai - (squad.agents.length - 1) / 2) * 0.15);
          const ar = squadRadius + 0.5 + ai * 0.15;
          return {
            slug: agent.slug,
            name: ptAgent(agent.name),
            squadName: squad.name,
            pos: [
              dx + Math.cos(agentAngle) * ar,
              dy + (Math.random() - 0.5) * 0.4,
              dz + Math.sin(agentAngle) * ar,
            ] as [number, number, number],
          };
        });
        return { agents, color };
      });

      deptPositions.push({
        id: dept.id,
        name: ptDept(dept.name),
        color,
        pos: [dx, dy, dz],
        agentCount: totalAgents,
        squads: squadLayouts,
      });
    });

    return deptPositions;
  }, []);

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#ef4444" />
      <pointLight position={[0, 4, 0]} intensity={0.2} color="#8b5cf6" />

      <Particles />

      {layout.map((dept) => (
        <group key={dept.id}>
          <DeptHub
            position={dept.pos}
            color={dept.color}
            name={dept.name}
            agentCount={dept.agentCount}
            deptId={dept.id}
            onClick={() => onSelectDept(selectedDept === dept.id ? null : dept.id)}
            isSelected={selectedDept === dept.id}
          />
          {dept.squads.map((squad, si) => (
            <group key={si}>
              <SquadConnections
                positions={squad.agents.map((a) => a.pos)}
                color={squad.color}
              />
              {squad.agents.map((agent) => (
                <AgentNode
                  key={agent.slug}
                  position={agent.pos}
                  color={dept.color}
                  name={agent.name}
                  isSelected={selectedDept === dept.id}
                  onClick={() =>
                    onSelectAgent({
                      name: agent.name,
                      slug: agent.slug,
                      dept: dept.name,
                      squad: agent.squadName,
                    })
                  }
                />
              ))}
            </group>
          ))}
        </group>
      ))}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate
        autoRotateSpeed={0.3}
        minDistance={2}
        maxDistance={12}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  );
}

// ── Info Panel ──
function InfoPanel({
  agent,
  onClose,
}: {
  agent: { name: string; slug: string; dept: string; squad: string };
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-4 right-4 w-72 bg-background/80 backdrop-blur-xl border border-border/20 rounded-xl p-4 z-20"
    >
      <button onClick={onClose} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{agent.name}</h3>
            <p className="text-[10px] text-muted-foreground">{agent.slug}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/30 rounded-lg p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
              <Users className="h-3 w-3" /> Squad
            </div>
            <p className="text-xs font-medium text-foreground">{agent.squad}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
              <Target className="h-3 w-3" /> Depto
            </div>
            <p className="text-xs font-medium text-foreground">{agent.dept}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-emerald-400">Online — Pronto</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ──
export default function AgentNeuralNetwork() {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<{
    name: string;
    slug: string;
    dept: string;
    squad: string;
  } | null>(null);

  const totalAgents = useMemo(
    () => WORKFORCE.reduce((acc, d) => acc + d.squads.reduce((a, s) => a + s.agents.length, 0), 0),
    []
  );
  const totalSquads = useMemo(
    () => WORKFORCE.reduce((acc, d) => acc + d.squads.length, 0),
    []
  );

  return (
    <div className="relative bg-background overflow-hidden" style={{ height: "calc(100vh - 180px)", minHeight: "500px" }}>
      {/* Stats overlay */}
      <div className="absolute top-4 left-4 z-20 flex gap-3">
        {[
          { label: "Agentes", value: totalAgents, color: "text-primary" },
          { label: "Squads", value: totalSquads, color: "text-accent-violet" },
          { label: "Deptos", value: WORKFORCE.length, color: "text-accent-emerald" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-background/60 backdrop-blur-xl border border-border/10 rounded-lg px-3 py-1.5"
          >
            <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-[10px] text-muted-foreground ml-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-background/60 backdrop-blur-xl border border-border/10 rounded-lg p-3 max-h-48 overflow-y-auto">
        <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Departamentos</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {WORKFORCE.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(selectedDept === dept.id ? null : dept.id)}
              className={`flex items-center gap-1.5 text-[10px] hover:opacity-100 transition-opacity ${
                selectedDept && selectedDept !== dept.id ? "opacity-40" : "opacity-80"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: DEPT_COLORS[dept.id] || "#888" }}
              />
              <span className="text-foreground truncate">{ptDept(dept.name)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Agent info panel */}
      <AnimatePresence>
        {selectedAgent && (
          <InfoPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
        )}
      </AnimatePresence>

      {/* 3D Canvas — only mount if WebGL is available */}
      {isWebGLAvailable() ? (
        <Canvas
          camera={{ position: [0, 3, 7], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false, powerPreference: "default" }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault());
          }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <NetworkScene
              onSelectDept={setSelectedDept}
              onSelectAgent={setSelectedAgent}
              selectedDept={selectedDept}
            />
          </Suspense>
        </Canvas>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-2">
            <h2 className="text-base font-semibold text-foreground">Rede Neural 3D indisponível</h2>
            <p className="text-xs text-muted-foreground">
              Seu navegador ou dispositivo não tem suporte a WebGL ativo. Ative a aceleração de hardware
              ou abra em outro navegador (Chrome/Edge/Firefox) para visualizar a rede neural.
            </p>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-center">
        <h1 className="text-lg font-bold text-foreground tracking-wider">
          REDE NEURAL
        </h1>
        <p className="text-[10px] text-muted-foreground">
          Workforce de IA — Topologia de Agentes em Tempo Real
        </p>
      </div>
    </div>
  );
}
