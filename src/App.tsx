import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Agents from "./pages/Agents";
import Library from "./pages/Library";
import Pricing from "./pages/Pricing";
import HowItWorks from "./pages/HowItWorks";
import Waitlist from "./pages/Waitlist";
import Community from "./pages/Community";
import CreateAgent from "./pages/CreateAgent";
import Integrations from "./pages/Integrations";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AgentLanding from "./pages/AgentLanding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
