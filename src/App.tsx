
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import Landing from "./pages/Landing";
import Enterprise from "./pages/Enterprise";
import Pricing from "./pages/Pricing";
import Upload from "./pages/Upload";
import GradingPreview from "./pages/GradingPreview";
import Training from "./pages/Training";
import LMSIntegration from "./pages/LMSIntegration";
import LMSCallback from "./pages/LMSCallback";
import PrivacySettings from "./pages/PrivacySettings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import FreemiumDashboard from "./pages/FreemiumDashboard";
import UploadTraining from "./pages/UploadTraining";
import SubmitAssignment from "./pages/SubmitAssignment";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { session, loading } = useAuth();

  console.log('AppRoutes: Auth state:', { session: !!session, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/enterprise" element={<Enterprise />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/dashboard" element={<FreemiumDashboard />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/upload-training" element={<UploadTraining />} />
      <Route path="/submit-assignment" element={<SubmitAssignment />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/grading/preview" element={<GradingPreview />} />
      <Route path="/training" element={<Training />} />
      <Route path="/lms" element={<LMSIntegration />} />
      <Route path="/lms/callback" element={<LMSCallback />} />
      <Route path="/privacy" element={<PrivacySettings />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  console.log('App: Starting application');
  
  return (
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
};

export default App;
