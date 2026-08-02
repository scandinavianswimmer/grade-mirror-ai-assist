import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/hanken-grotesk/wght.css';
import '@fontsource/spline-sans-mono/latin-400.css';
import '@fontsource/spline-sans-mono/latin-500.css';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing #root application mount');
}

const root = createRoot(rootElement);
const renderUnavailable = () => {
  root.render(
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section
        className="w-full max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm"
        role="alert"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Service unavailable
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold">Mr Selby is not configured yet.</h1>
        <p className="mt-3 text-muted-foreground">
          This release is missing its service connection. Please try again after the deployment
          owner finishes setup.
        </p>
      </section>
    </main>,
  );
};

if (__MR_SELBY_PUBLIC_PREVIEW__) {
  void import('./PublicApp.tsx')
    .then(({ default: PublicApp }) => {
      root.render(<PublicApp />);
    })
    .catch((error: unknown) => {
      console.error('Failed to start the Mr Selby public preview', error);
      renderUnavailable();
    });
} else {
  void Promise.all([import('./App.tsx'), import('./lib/analytics')])
    .then(([{ default: App }, { initAnalytics }]) => {
      // Product analytics (METRIC-04). No-ops gracefully when VITE_POSTHOG_KEY is unset.
      initAnalytics();
      root.render(<App />);
    })
    .catch((error: unknown) => {
      console.error('Failed to start Mr Selby', error);
      renderUnavailable();
    });
}
