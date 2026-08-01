import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import AuthGuard from "@/components/AuthGuard";
import TeacherOnboarding from "@/components/onboarding/TeacherOnboarding";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
// Route-level code splitting — keep the initial bundle small (M39). Heavy pages load on demand.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateAssignment = lazy(() => import("./pages/CreateAssignment"));
const AssignmentDetail = lazy(() => import("./pages/AssignmentDetail"));
const SubmissionDetail = lazy(() => import("./pages/SubmissionDetail"));
const Training = lazy(() => import("./pages/Training"));
const LMSIntegration = lazy(() => import("./pages/LMSIntegration"));
const LMSCallback = lazy(() => import("./pages/LMSCallback"));
const Profile = lazy(() => import("./pages/Profile"));
const FreemiumDashboard = lazy(() => import("./pages/FreemiumDashboard"));
const UploadTraining = lazy(() => import("./pages/UploadTraining"));
const SubmitAssignment = lazy(() => import("./pages/SubmitAssignment"));
const PdfSubmission = lazy(() => import("./pages/PdfSubmission").then((m) => ({ default: m.PdfSubmission })));
const Pitch = lazy(() => import("./pages/Pitch"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Billing = lazy(() => import("./pages/Billing"));
const Metrics = lazy(() => import("./pages/Metrics"));
const History = lazy(() => import("./pages/History"));

const queryClient = new QueryClient();

const getDocumentTitle = (pathname: string) => {
  if (pathname === "/pitch") return "aiTA for teachers · grading co-pilot";
  if (pathname === "/pricing") return "Pricing · aiTA";
  if (pathname === "/auth") return "Sign in or create an account · aiTA";
  if (pathname === "/auth/callback") return "Completing sign-in · aiTA";

  const workspaceRoute =
    pathname === "/" ||
    [
      "/dashboard",
      "/create-assignment",
      "/upload-training",
      "/submit-assignment",
      "/training",
      "/lms",
      "/lms/callback",
      "/profile",
      "/billing",
      "/metrics",
      "/history",
    ].includes(pathname) ||
    pathname.startsWith("/assignment/") ||
    pathname.startsWith("/submission/") ||
    pathname.startsWith("/pdf/submission/");

  return workspaceRoute ? "Grading workspace · aiTA" : "Page not found · aiTA";
};

const AppContent = () => {
  const { user, session, loading } = useAuth();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    document.title = getDocumentTitle(location.pathname);
  }, [location.pathname]);

  const checkOnboardingStatus = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    if (loading) return;

    if (!user || !session) {
      setShowOnboarding(false);
      setIsNewUser(false);
      setCheckingOnboarding(false);
    } else {
      checkOnboardingStatus();
    }
  }, [user, session, loading, checkOnboardingStatus]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    setIsNewUser(false);
    setOnboardingComplete(true);
    // The auth state (and any updated metadata) is refreshed automatically via the auth state listener.
  };

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg font-medium" role="status" aria-live="polite">Loading…</div>
      </div>
    );
  }

  // Allow public marketing pages to be viewed without authentication.
  if (location.pathname === '/pitch' || location.pathname === '/pricing') {
    return (
      <Routes>
        <Route path="/pitch" element={<Pitch />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // OAuth return (AUTH-02): render the callback handler directly so the login
  // overlay never flashes while Supabase establishes the session from the URL.
  if (location.pathname === '/auth/callback') {
    return (
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    );
  }

  if (location.pathname === '/auth') {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
      </Routes>
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
      
      <Route path="/profile" element={
        <AuthGuard>
          <Profile />
        </AuthGuard>
      } />

      <Route path="/billing" element={
        <AuthGuard>
          <Billing />
        </AuthGuard>
      } />

      <Route path="/metrics" element={
        <AuthGuard>
          <Metrics />
        </AuthGuard>
      } />

      <Route path="/history" element={
        <AuthGuard>
          <History />
        </AuthGuard>
      } />
      
      <Route path="/pdf/submission/:id" element={
        <AuthGuard>
          <PdfSubmission />
        </AuthGuard>
      } />
      <Route path="/pitch" element={<Pitch />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center text-muted-foreground" role="status" aria-live="polite">
                Loading…
              </div>
            }>
              <AppContent />
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
