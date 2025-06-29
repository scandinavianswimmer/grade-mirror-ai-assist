
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreateAssignment from "./pages/CreateAssignment";
import AssignmentDetail from "./pages/AssignmentDetail";
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
import OnboardingFlow from "./pages/OnboardingFlow";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, session, loading } = useAuth();

  console.log('AppRoutes: Auth state:', { user: !!user, session: !!session, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={
        <AuthGuard requireAuth={false}>
          <Auth />
        </AuthGuard>
      } />
      
      {/* Protected routes */}
      <Route path="/" element={
        <AuthGuard>
          <FreemiumDashboard />
        </AuthGuard>
      } />
      <Route path="/dashboard" element={
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      } />
      <Route path="/create-assignment" element={
        <AuthGuard>
          <CreateAssignment />
        </AuthGuard>
      } />
      <Route path="/assignment/:id" element={
        <AuthGuard>
          <AssignmentDetail />
        </AuthGuard>
      } />
      <Route path="/onboarding" element={
        <AuthGuard>
          <Onboarding />
        </AuthGuard>
      } />
      <Route path="/onboarding-flow" element={
        <AuthGuard>
          <OnboardingFlow />
        </AuthGuard>
      } />
      <Route path="/upload-training" element={
        <AuthGuard>
          <UploadTraining />
        </AuthGuard>
      } />
      <Route path="/submit-assignment" element={
        <AuthGuard>
          <SubmitAssignment />
        </AuthGuard>
      } />
      <Route path="/upload" element={
        <AuthGuard>
          <Upload />
        </AuthGuard>
      } />
      <Route path="/grading/preview" element={
        <AuthGuard>
          <GradingPreview />
        </AuthGuard>
      } />
      <Route path="/training" element={
        <AuthGuard>
          <Training />
        </AuthGuard>
      } />
      <Route path="/lms" element={
        <AuthGuard>
          <LMSIntegration />
        </AuthGuard>
      } />
      <Route path="/lms/callback" element={
        <AuthGuard>
          <LMSCallback />
        </AuthGuard>
      } />
      <Route path="/privacy" element={
        <AuthGuard>
          <PrivacySettings />
        </AuthGuard>
      } />
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
