import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import LandingPage from "./components/LandingPage";
import GmailCallback from "./pages/GmailCallback";
import TemplatePreviewPage from "./pages/TemplatePreviewPage";
import TrackOpen from "./pages/TrackOpen";
import TrackClick from "./pages/TrackClick";
import Unsubscribe from "./pages/Unsubscribe";
import { RealtimeAnalyticsService } from "@/services/realtimeAnalyticsService";

const queryClient = new QueryClient();

const App = () => {
  // Cleanup real-time analytics on app unmount
  useEffect(() => {
    return () => {
      RealtimeAnalyticsService.cleanup();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/campaigns" element={<Index />} />
              <Route path="/contacts" element={<Index />} />
              <Route path="/templates" element={<Index />} />
              <Route path="/template-preview/:templateId" element={<TemplatePreviewPage />} />
              <Route path="/settings" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/gmail-callback" element={<GmailCallback />} />
              <Route path="/track-open" element={<TrackOpen />} />
              <Route path="/track-click" element={<TrackClick />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
