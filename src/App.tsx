import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { useState, useEffect, useCallback, lazy, Suspense, useRef } from "react";
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
const Profile = lazy(() => import("./pages/Profile"));
const UploadTraining = lazy(() => import("./pages/UploadTraining"));
const PdfSubmission = lazy(() => import("./pages/PdfSubmission").then((m) => ({ default: m.PdfSubmission })));
const Pitch = lazy(() => import("./pages/Pitch"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const JudgeMode = lazy(() => import("./pages/JudgeMode"));
const ForgotPassword = lazy(() =>
  import("./pages/PasswordRecovery").then((module) => ({ default: module.ForgotPassword })),
);
const ResetPassword = lazy(() =>
  import("./pages/PasswordRecovery").then((module) => ({ default: module.ResetPassword })),
);
const Billing = lazy(() => import("./pages/Billing"));
const Metrics = lazy(() => import("./pages/Metrics"));
const History = lazy(() => import("./pages/History"));

const queryClient = new QueryClient();

const getDocumentTitle = (pathname: string) => {
  if (pathname === "/") return "Mr Selby · Thoughtful grading support";
  if (pathname === "/pitch") return "Mr Selby for teachers · grading co-pilot";
  if (pathname === "/pricing") return "Pricing · Mr Selby";
  if (pathname === "/privacy") return "Privacy preview · Mr Selby";
  if (pathname === "/terms") return "Terms preview · Mr Selby";
  if (pathname === "/accessibility") return "Accessibility · Mr Selby";
  if (pathname === "/judge") return "The Teacher’s Test · Mr Selby";
  if (pathname === "/auth") return "Sign in or create an account · Mr Selby";
  if (pathname === "/auth/callback") return "Completing sign-in · Mr Selby";
  if (pathname === "/auth/forgot-password") return "Reset your password · Mr Selby";
  if (pathname === "/auth/reset-password") return "Choose a new password · Mr Selby";

  const workspaceRoute =
    pathname === "/" ||
    [
      "/dashboard",
      "/create-assignment",
      "/upload-training",
      "/submit-assignment",
      "/training",
      "/profile",
      "/billing",
      "/metrics",
      "/history",
    ].includes(pathname) ||
    pathname.startsWith("/assignment/") ||
    pathname.startsWith("/submission/") ||
    pathname.startsWith("/pdf/submission/");

  return workspaceRoute ? "Grading workspace · Mr Selby" : "Page not found · Mr Selby";
};

const AppContent = () => {
  const { user, session, loading } = useAuth();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const previousPathname = useRef(location.pathname);
  const [routeAnnouncement, setRouteAnnouncement] = useState("");

  useEffect(() => {
    const title = getDocumentTitle(location.pathname);
    document.title = title;

    let scrollAnimationFrame = 0;
    let focusAnimationFrame = 0;
    if (location.hash) {
      scrollAnimationFrame = window.requestAnimationFrame(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView();
      });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    if (previousPathname.current !== location.pathname) {
      setRouteAnnouncement(`Navigated to ${title}`);

      let attempts = 0;
      const focusPageHeading = () => {
        const heading = document.querySelector<HTMLElement>("main h1, [role='main'] h1, h1");
        if (heading) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
          return;
        }

        attempts += 1;
        if (attempts < 12) focusAnimationFrame = window.requestAnimationFrame(focusPageHeading);
      };

      focusAnimationFrame = window.requestAnimationFrame(focusPageHeading);
    }

    previousPathname.current = location.pathname;
    return () => {
      window.cancelAnimationFrame(scrollAnimationFrame);
      window.cancelAnimationFrame(focusAnimationFrame);
    };
  }, [location.hash, location.pathname]);

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
      <>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{routeAnnouncement}</p>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-lg font-medium" role="status" aria-live="polite">Loading…</div>
        </div>
      </>
    );
  }

  // Show the public overview at the canonical root for signed-out visitors. Signed-in teachers
  // keep the established `/` workspace route below.
  if (location.pathname === '/' && !user && !session) {
    return (
      <>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{routeAnnouncement}</p>
        <Routes>
          <Route path="/" element={<Pitch />} />
        </Routes>
      </>
    );
  }

  // Allow public product, legal, and account-recovery pages without authentication.
  if (
    ['/pitch', '/pricing', '/privacy', '/terms', '/accessibility', '/judge', '/auth/forgot-password', '/auth/reset-password']
      .includes(location.pathname)
  ) {
    return (
      <>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{routeAnnouncement}</p>
        <Routes>
          <Route path="/pitch" element={<Pitch />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/judge" element={<JudgeMode />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
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
    <>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{routeAnnouncement}</p>
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
      
      {/* Historical one-paper grader retired: preserve old bookmarks, but route every teacher
          into the canonical assignment workflow backed by grade-submission. */}
      <Route path="/submit-assignment" element={<Navigate to="/create-assignment" replace />} />
      
      <Route path="/training" element={
        <AuthGuard>
          <Training />
        </AuthGuard>
      } />
      
      {/* Historical Canvas client retired: preserve old bookmarks and OAuth callbacks, but do not
          expose an unverified LMS-return workflow from the protected product. */}
      <Route path="/lms" element={<Navigate to="/dashboard" replace />} />
      <Route path="/lms/callback" element={<Navigate to="/dashboard" replace />} />
      
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
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/accessibility" element={<Accessibility />} />
      <Route path="/judge" element={<JudgeMode />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
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
