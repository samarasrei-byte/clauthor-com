import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import AppLayout from "@/components/AppLayout";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";

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
const Integrations = lazyRetry(() => import("./pages/Integrations"));
const Auth = lazyRetry(() => import("./pages/Auth"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));
const AgentLanding = lazyRetry(() => import("./pages/AgentLanding"));
const Departamentos = lazyRetry(() => import("./pages/Departamentos"));
const Pitch = lazyRetry(() => import("./pages/Pitch"));
const Terms = lazyRetry(() => import("./pages/Terms"));
const Privacy = lazyRetry(() => import("./pages/Privacy"));
const MonixCommandCenter = lazyRetry(() => import("./pages/MonixCommandCenter"));
const OmnixCommandCenter = lazyRetry(() => import("./pages/OmnixCommandCenter"));
const KnowledgeBase = lazyRetry(() => import("./pages/KnowledgeBase"));
const ResetPassword = lazyRetry(() => import("./pages/ResetPassword"));
const ApiDocs = lazyRetry(() => import("./pages/ApiDocs"));
const TeamBuilder = lazyRetry(() => import("./pages/TeamBuilder"));
const ControlTower = lazyRetry(() => import("./pages/ControlTower"));
const Architecture = lazyRetry(() => import("./pages/Architecture"));
const ProjectTimeline = lazyRetry(() => import("./pages/ProjectTimeline"));
const ThorOnboarding = lazyRetry(() => import("./pages/ThorOnboarding"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — reduce refetches
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
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
                {/* Waitlist — standalone immersive page, no navbar */}
                <Route path="/waitlist" element={<Waitlist />} />

                {/* Public pages with full navbar */}
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/marketplace" element={<Library />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/departamentos" element={<Departamentos />} />
                  <Route path="/agente/:slug" element={<AgentLanding />} />
                  <Route path="/pitch" element={<Pitch />} />
                  <Route path="/termos" element={<Terms />} />
                  <Route path="/privacidade" element={<Privacy />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/api-docs" element={<ApiDocs />} />
                  <Route path="/team-builder" element={<TeamBuilder />} />
                  <Route path="/architecture" element={<Architecture />} />
                  <Route path="/timeline" element={<ProjectTimeline />} />
                </Route>

                {/* Dashboard pages with minimal header + sidebar only */}
                <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<ClientDashboard />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/create-agent" element={<CreateAgent />} />
                  <Route path="/integrations" element={<Integrations />} />
                  <Route path="/knowledge-base" element={<KnowledgeBase />} />
                  <Route path="/monix" element={<MonixCommandCenter />} />
                  <Route path="/omnix" element={<OmnixCommandCenter />} />
                  <Route path="/control-tower" element={<ControlTower />} />
                </Route>

                {/* Admin */}
                <Route element={<ProtectedRoute requireAdmin><DashboardLayout /></ProtectedRoute>}>
                  <Route path="/admin" element={<AdminDashboard />} />
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
