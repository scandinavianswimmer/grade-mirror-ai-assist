import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Feather, ShieldCheck } from 'lucide-react';
import PublicFooter from '@/components/public/PublicFooter';

const Pitch = lazy(() => import('./pages/Pitch'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PUBLIC_TITLES: Record<string, string> = {
  '/': 'Mr Selby · Thoughtful grading support',
  '/privacy': 'Privacy preview · Mr Selby',
  '/terms': 'Terms preview · Mr Selby',
  '/accessibility': 'Accessibility · Mr Selby',
  '/auth': 'Workspace setup · Mr Selby',
  '/auth/forgot-password': 'Workspace setup · Mr Selby',
  '/auth/reset-password': 'Workspace setup · Mr Selby',
};

const LaunchSetup = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <a href="#launch-setup-main" className="skip-link">Skip to main content</a>
    <header className="border-b border-border/70">
      <nav aria-label="Primary" className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Mr Selby overview">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Feather className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight">Mr Selby</span>
        </Link>
        <Link
          to="/"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Explore the preview
        </Link>
      </nav>
    </header>

    <main id="launch-setup-main" tabIndex={-1} className="grid flex-1 place-items-center px-6 py-16">
      <section className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-lg sm:p-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Secure workspace setup
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Teacher workspaces are opening shortly.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          The Mr Selby public preview is live while the protected classroom service finishes its
          production connection. Account creation, sign-in, and password recovery stay closed
          until that connection is verified.
        </p>
        <p className="mt-4 font-medium text-foreground">
          No classroom or student data is accepted in this setup state.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            See how Mr Selby works
          </Link>
          <Link
            to="/privacy"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-5 py-2.5 font-medium transition-colors hover:bg-muted"
          >
            Read the privacy preview
          </Link>
        </div>
      </section>
    </main>
    <PublicFooter />
  </div>
);

const PublicRoutes = () => {
  const location = useLocation();
  const previousPathname = useRef(location.pathname);

  useEffect(() => {
    document.title = PUBLIC_TITLES[location.pathname] ?? 'Page not found · Mr Selby';

    const indexablePaths = new Set(['/', '/privacy', '/terms', '/accessibility']);
    const isIndexable = indexablePaths.has(location.pathname);
    const canonicalPath = isIndexable ? location.pathname : '/';
    const canonicalUrl = new URL(canonicalPath, 'https://mrselby.app').href;
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);

    let routeRobots = document.querySelector<HTMLMetaElement>('meta[data-route-robots]');
    if (isIndexable) {
      routeRobots?.remove();
    } else {
      if (!routeRobots) {
        routeRobots = document.createElement('meta');
        routeRobots.name = 'robots';
        routeRobots.dataset.routeRobots = 'true';
        document.head.append(routeRobots);
      }
      routeRobots.content = 'noindex, nofollow';
    }

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
      focusAnimationFrame = window.requestAnimationFrame(() => {
        const heading = document.querySelector<HTMLElement>("main h1, [role='main'] h1, h1");
        if (heading) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
        }
      });
    }

    previousPathname.current = location.pathname;
    return () => {
      window.cancelAnimationFrame(scrollAnimationFrame);
      window.cancelAnimationFrame(focusAnimationFrame);
    };
  }, [location.hash, location.pathname]);

  return (
    <Suspense
      fallback={(
        <main className="grid min-h-screen place-items-center text-muted-foreground" role="status" aria-live="polite">
          Loading…
        </main>
      )}
    >
      <Routes>
        <Route path="/" element={<Pitch />} />
        <Route path="/pitch" element={<Navigate to="/" replace />} />
        <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/accessibility" element={<Accessibility />} />
        <Route path="/auth/*" element={<LaunchSetup />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const PublicApp = () => (
  <BrowserRouter>
    <PublicRoutes />
  </BrowserRouter>
);

export default PublicApp;
