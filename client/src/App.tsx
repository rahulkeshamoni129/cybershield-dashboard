import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ThreatFeed from "./pages/ThreatFeed";
import NetworkScan from "./pages/NetworkScan";
import IPCheck from "./pages/IPCheck";
import QRScan from "./pages/QRScan";
import Analytics from "./pages/Analytics";
import Incidents from "./pages/Incidents";
import AIChat from "./pages/AIChat";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { ThreatProvider } from "@/context/ThreatContext";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThreatProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected User Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/threats" element={<ThreatFeed />} />
                  <Route path="/network" element={<NetworkScan />} />
                  <Route path="/ip-check" element={<IPCheck />} />
                  <Route path="/qr-scan" element={<QRScan />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/incidents" element={<Incidents />} />
                  <Route path="/chat" element={<AIChat />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* Admin Routes */}
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </ThreatProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
