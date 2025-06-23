
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import GradingPreview from "./pages/GradingPreview";
import Training from "./pages/Training";
import LMSIntegration from "./pages/LMSIntegration";
import LMSCallback from "./pages/LMSCallback";
import PrivacySettings from "./pages/PrivacySettings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/grading/preview" element={<GradingPreview />} />
      <Route path="/training" element={<Training />} />
      <Route path="/lms" element={<LMSIntegration />} />
      <Route path="/privacy" element={<PrivacySettings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
