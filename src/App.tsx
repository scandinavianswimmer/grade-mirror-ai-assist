import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AuthGuard from "@/components/AuthGuard";
import LoginOverlay from "@/components/LoginOverlay";
import TeacherOnboarding from "@/components/onboarding/TeacherOnboarding";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreateAssignment from "./pages/CreateAssignment";
import AssignmentDetail from "./pages/AssignmentDetail";
import SubmissionDetail from "./pages/SubmissionDetail";
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
import PodcastGenerator from "./pages/PodcastGenerator";
import PodcastDetail from "./pages/PodcastDetail";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, session, loading } = useAuth();
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  console.log('AppContent: Auth state:', { user: !!user, session: !!session, loading });

  useEffect(() => {
    if (loading) return;

    if (!user && !session) {
      setShowLoginOverlay(true);
      setShowOnboarding(false);
      setCheckingOnboarding(false);
    } else if (user && session) {
      setShowLoginOverlay(false);
      checkOnboardingStatus();
    }
  }, [user, session, loading]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      setCheckingOnboarding(true);
      
      // Check both auth metadata and database
      const authOnboardingComplete = user.user_metadata?.onboarding_complete;
      
      // Also check the database
      const { data: userData, error } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        // Fallback to auth metadata only
        const needsOnboarding = !authOnboardingComplete;
        setOnboardingComplete(!needsOnboarding);
        setShowOnboarding(needsOnboarding);
        setIsNewUser(needsOnboarding);
      } else {
        const dbOnboardingComplete = userData?.onboarding_complete;
        const completed = authOnboardingComplete || dbOnboardingComplete;
        
        setOnboardingComplete(completed);
        setShowOnboarding(!completed);
        setIsNewUser(!completed);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to not showing onboarding on error
      setOnboardingComplete(true);
      setShowOnboarding(false);
      setIsNewUser(false);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginOverlay(false);
    // Onboarding status will be checked in the useEffect
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    setIsNewUser(false);
    setOnboardingComplete(true);
    
    // Refresh the user session to get updated metadata
    const { data: { session: refreshedSession } } = await supabase.auth.getSession();
    if (refreshedSession) {
      // The auth state will be updated automatically via the auth state listener
    }
  };

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  // Show login overlay for unauthenticated users
  if (showLoginOverlay) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Background content (blurred) */}
        <div className="opacity-50 blur-sm">
          <FreemiumDashboard />
        </div>
        
        {/* Login overlay */}
        <LoginOverlay onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Show onboarding for new users
  if (showOnboarding && isNewUser) {
    return <TeacherOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Routes>
      {/* Protected routes */}
      <Route path="/" element={
        <AuthGuard>
          <Dashboard />
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
      
      <Route path="/submission/:id" element={
        <AuthGuard>
          <SubmissionDetail />
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
      
      <Route path="/podcast-generator" element={
        <AuthGuard>
          <PodcastGenerator />
        </AuthGuard>
      } />
      
      <Route path="/podcast/:id" element={
        <AuthGuard>
          <PodcastDetail />
        </AuthGuard>
      } />
      
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
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
