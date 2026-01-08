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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/threats" element={<ThreatFeed />} />
          <Route path="/network" element={<NetworkScan />} />
          <Route path="/ip-check" element={<IPCheck />} />
          <Route path="/qr-scan" element={<QRScan />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/chat" element={<AIChat />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
