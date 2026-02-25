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

// Lazy load all pages for faster initial load
const Index = lazy(() => import("./pages/Index"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Agents = lazy(() => import("./pages/Agents"));
const Library = lazy(() => import("./pages/Library"));
const Pricing = lazy(() => import("./pages/Pricing"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const Community = lazy(() => import("./pages/Community"));
const CreateAgent = lazy(() => import("./pages/CreateAgent"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AgentLanding = lazy(() => import("./pages/AgentLanding"));
const Departamentos = lazy(() => import("./pages/Departamentos"));

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
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/marketplace" element={<Library />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/waitlist" element={<Waitlist />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/departamentos" element={<Departamentos />} />
                  <Route path="/agente/:slug" element={<AgentLanding />} />
                </Route>

                {/* Dashboard pages with minimal header + sidebar only */}
                <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<ClientDashboard />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/create-agent" element={<CreateAgent />} />
                  <Route path="/integrations" element={<Integrations />} />
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
