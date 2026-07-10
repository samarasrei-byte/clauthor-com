import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import AppLayout from "@/components/AppLayout";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";
import CustomerSetup from "@/pages/CustomerSetup";
import FeatureGate from "@/components/FeatureGate";

// Retry wrapper for stale chunk errors after deploys
function lazyRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch((err) => {
      const key = "chunk_reload_" + Date.now().toString(36);
      const lastReload = sessionStorage.getItem("chunk_last_reload");
      const now = Date.now();
      // Only reload if we haven't reloaded in the last 10 seconds
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem("chunk_last_reload", now.toString());
        window.location.reload();
      }
      throw err;
    })
  );
}

// Lazy load all pages for faster initial load
const Index = lazyRetry(() => import("./pages/Index"));
const ClientDashboard = lazyRetry(() => import("./pages/ClientDashboard"));
const AdminDashboard = lazyRetry(() => import("./pages/AdminDashboard"));
const Agents = lazyRetry(() => import("./pages/Agents"));
const Library = lazyRetry(() => import("./pages/Library"));
const Pricing = lazyRetry(() => import("./pages/Pricing"));
const HowItWorks = lazyRetry(() => import("./pages/HowItWorks"));
const Waitlist = lazyRetry(() => import("./pages/Waitlist"));
const Community = lazyRetry(() => import("./pages/Community"));
const CreateAgent = lazyRetry(() => import("./pages/CreateAgent"));
const CreateWorkforce = lazyRetry(() => import("./pages/CreateWorkforce"));
const Integrations = lazyRetry(() => import("./pages/Integrations"));
const MCPServer = lazyRetry(() => import("./pages/MCPServer"));
const SettingsConnections = lazyRetry(() => import("./pages/SettingsConnections"));
const ArtDirector = lazyRetry(() => import("./pages/ArtDirector"));
const SocialConnections = lazyRetry(() => import("./pages/SocialConnections"));

const Auth = lazyRetry(() => import("./pages/Auth"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));
const AgentLanding = lazyRetry(() => import("./pages/AgentLanding"));
const Departamentos = lazyRetry(() => import("./pages/Departamentos"));
const Pitch = lazyRetry(() => import("./pages/Pitch"));
const Terms = lazyRetry(() => import("./pages/Terms"));
const Privacy = lazyRetry(() => import("./pages/Privacy"));

const OmnixCommandCenter = lazyRetry(() => import("./pages/OmnixCommandCenter"));
const KnowledgeBase = lazyRetry(() => import("./pages/KnowledgeBase"));
const ResetPassword = lazyRetry(() => import("./pages/ResetPassword"));
const ApiDocs = lazyRetry(() => import("./pages/ApiDocs"));
const TeamBuilder = lazyRetry(() => import("./pages/TeamBuilder"));
const Enterprise = lazyRetry(() => import("./pages/Enterprise"));
const ControlTower = lazyRetry(() => import("./pages/ControlTower"));
const Architecture = lazyRetry(() => import("./pages/Architecture"));
const ProjectTimeline = lazyRetry(() => import("./pages/ProjectTimeline"));
const ThorOnboarding = lazyRetry(() => import("./pages/ThorOnboarding"));
const OutcomePicker = lazyRetry(() => import("./pages/OutcomePicker"));
const AgentNeuralNetwork = lazyRetry(() => import("./pages/AgentNeuralNetwork"));
const ScrumBoard = lazyRetry(() => import("./pages/ScrumBoard"));
const HunterDashboard = lazyRetry(() => import("./pages/HunterDashboard"));
const HunterLinkedIn = lazyRetry(() => import("./pages/HunterLinkedIn"));
const HunterICP = lazyRetry(() => import("./pages/HunterICP"));
const HunterMensagem = lazyRetry(() => import("./pages/HunterMensagem"));
const HunterAtivar = lazyRetry(() => import("./pages/HunterAtivar"));
const HunterLeadDetail = lazyRetry(() => import("./pages/HunterLeadDetail"));
const HunterInbox = lazyRetry(() => import("./pages/HunterInbox"));
const AgentWorkspace = lazyRetry(() => import("./pages/AgentWorkspace"));
const Advocacia = lazyRetry(() => import("./pages/Advocacia"));
const AdvocaciaOnboarding = lazyRetry(() => import("./pages/AdvocaciaOnboarding"));
const AdvocaciaAudit = lazyRetry(() => import("./pages/AdvocaciaAudit"));
const AdvocaciaPainel = lazyRetry(() => import("./pages/AdvocaciaPainel"));
const AdvocaciaPainelHomeLazy = lazyRetry(() => import("./pages/AdvocaciaPainel").then(m => ({ default: m.AdvocaciaPainelHome })));
const AdvocaciaPainelContratosLazy = lazyRetry(() => import("./pages/AdvocaciaPainel").then(m => ({ default: m.AdvocaciaPainelContratos })));
const AdvocaciaPainelPropostasLazy = lazyRetry(() => import("./pages/AdvocaciaPainel").then(m => ({ default: m.AdvocaciaPainelPropostas })));
const AdvocaciaPainelCaptacaoLazy = lazyRetry(() => import("./pages/AdvocaciaPainel").then(m => ({ default: m.AdvocaciaPainelCaptacao })));
const AdvocaciaPainelDocumentosLazy = lazyRetry(() => import("./pages/AdvocaciaPainel").then(m => ({ default: m.AdvocaciaPainelDocumentos })));
const AdvocaciaPainelConfigLazy = lazyRetry(() => import("./pages/AdvocaciaPainel").then(m => ({ default: m.AdvocaciaPainelConfiguracoes })));
const AdvocaciaPainelMCPLazy = lazyRetry(() => import("./pages/MCPAssistente"));
const AdvocaciaExecucoesLazy = lazyRetry(() => import("./pages/AdvocaciaExecucoes"));
const AdminAdvocaciaVertical = lazyRetry(() => import("./pages/AdminAdvocaciaVertical"));
const ApiKeysSettings = lazyRetry(() => import("./pages/ApiKeysSettings"));
const ApresentacaoAdv = lazyRetry(() => import("./pages/ApresentacaoAdv"));
const InvestorPitch = lazyRetry(() => import("./pages/InvestorPitch"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min - reduce refetches
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-dvh flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public pages with full navbar */}
                {/* Standalone immersive pages - no navbar */}
                <Route path="/waitlist" element={<Waitlist />} />
                <Route path="/pitch" element={<Pitch />} />
                <Route path="/investidores" element={<InvestorPitch />} />
                <Route path="/investors" element={<InvestorPitch />} />
                <Route path="/onboarding" element={<ThorOnboarding />} />
                <Route path="/setup/:type/:ref" element={<ProtectedRoute><CustomerSetup /></ProtectedRoute>} />
                <Route path="/advocacia" element={<Advocacia />} />
                <Route path="/apresentacaoadv" element={<ApresentacaoAdv />} />
                <Route path="/apresentacao-adv" element={<ApresentacaoAdv />} />
                <Route path="/advocacia/onboarding" element={<ProtectedRoute><AdvocaciaOnboarding /></ProtectedRoute>} />
                <Route path="/advocacia/auditoria" element={<ProtectedRoute><AdvocaciaAudit /></ProtectedRoute>} />
                <Route path="/advocacia/execucoes" element={<ProtectedRoute><AdvocaciaExecucoesLazy /></ProtectedRoute>} />

                {/* Painel vertical isolado para advogados (multitenant via RLS) */}
                <Route path="/advocacia/painel" element={<ProtectedRoute><AdvocaciaPainel /></ProtectedRoute>}>
                  <Route index element={<AdvocaciaPainelHomeLazy />} />
                  <Route path="contratos" element={<AdvocaciaPainelContratosLazy />} />
                  <Route path="propostas" element={<AdvocaciaPainelPropostasLazy />} />
                  <Route path="captacao" element={<AdvocaciaPainelCaptacaoLazy />} />
                  <Route path="documentos" element={<AdvocaciaPainelDocumentosLazy />} />
                  <Route path="configuracoes" element={<AdvocaciaPainelConfigLazy />} />
                  <Route path="mcp" element={<AdvocaciaPainelMCPLazy />} />
                </Route>

                {/* Public pages with full navbar */}
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/marketplace" element={<Library />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/outcomes" element={<OutcomePicker />} />
                  <Route path="/quero" element={<OutcomePicker />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/departamentos" element={<Departamentos />} />
                  <Route path="/agente/:slug" element={<AgentLanding />} />
                  <Route path="/termos" element={<Terms />} />
                  <Route path="/privacidade" element={<Privacy />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/api-docs" element={<ApiDocs />} />
                  <Route path="/team-builder" element={<FeatureGate flag="team_builder" fallback="/"><TeamBuilder /></FeatureGate>} />
                  <Route path="/enterprise" element={<Enterprise />} />
                  <Route path="/architecture" element={<FeatureGate flag="architecture" fallback="/"><Architecture /></FeatureGate>} />
                  <Route path="/timeline" element={<FeatureGate flag="timeline" fallback="/"><ProjectTimeline /></FeatureGate>} />
                  
                  
                </Route>

                {/* Dashboard pages with minimal header + sidebar only */}
                <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<ClientDashboard />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/create-agent" element={<CreateWorkforce />} />
                  <Route path="/create-agent/classic" element={<CreateAgent />} />
                  <Route path="/integrations" element={<Integrations />} />
                  <Route path="/mcp" element={<FeatureGate flag="mcp"><MCPServer /></FeatureGate>} />
                  <Route path="/settings/connections" element={<SettingsConnections />} />
                  <Route path="/settings/social" element={<SocialConnections />} />
                  <Route path="/art-director" element={<FeatureGate flag="art_director"><ArtDirector /></FeatureGate>} />


                  <Route path="/knowledge-base" element={<KnowledgeBase />} />
                  <Route path="/monix" element={<Navigate to="/dashboard?tab=omnix" replace />} />
                  <Route path="/omnix" element={<Navigate to="/dashboard?tab=omnix" replace />} />
                  <Route path="/control-tower" element={<Navigate to="/dashboard?tab=operations-center" replace />} />
                  <Route path="/neural-network" element={<FeatureGate flag="neural"><AgentNeuralNetwork /></FeatureGate>} />
                  <Route path="/scrum" element={<FeatureGate flag="scrum"><ScrumBoard /></FeatureGate>} />
                  <Route path="/hunter" element={<FeatureGate flag="hunter"><HunterDashboard /></FeatureGate>} />
                  <Route path="/hunter-linkedin" element={<FeatureGate flag="hunter"><HunterLinkedIn /></FeatureGate>} />
                  <Route path="/hunter-icp" element={<FeatureGate flag="hunter"><HunterICP /></FeatureGate>} />
                  <Route path="/hunter-mensagem" element={<FeatureGate flag="hunter"><HunterMensagem /></FeatureGate>} />
                  <Route path="/hunter-ativar" element={<FeatureGate flag="hunter"><HunterAtivar /></FeatureGate>} />
                  <Route path="/hunter-lead/:id" element={<FeatureGate flag="hunter"><HunterLeadDetail /></FeatureGate>} />
                  <Route path="/hunter-inbox" element={<FeatureGate flag="hunter"><HunterInbox /></FeatureGate>} />
                  <Route path="/app/agente/:slug" element={<AgentWorkspace />} />
                  <Route path="/settings/api-keys" element={<ApiKeysSettings />} />
                </Route>

                {/* Admin */}
                <Route element={<ProtectedRoute requireAdmin><DashboardLayout /></ProtectedRoute>}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/verticals/advocacia" element={<AdminAdvocaciaVertical />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
