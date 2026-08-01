import { createRoot } from 'react-dom/client';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing #root application mount');
}

const root = createRoot(rootElement);
const missingServiceConfig = [
  !import.meta.env.VITE_SUPABASE_URL && 'VITE_SUPABASE_URL',
  !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY && 'VITE_SUPABASE_PUBLISHABLE_KEY',
].filter(Boolean);

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
        <h1 className="mt-3 font-display text-3xl font-semibold">aiTA is not configured yet.</h1>
        <p className="mt-3 text-muted-foreground">
          This release is missing its service connection. Please try again after the deployment
          owner finishes setup.
        </p>
      </section>
    </main>,
  );
};

if (missingServiceConfig.length > 0) {
  console.error(`Missing required service configuration: ${missingServiceConfig.join(', ')}`);
  renderUnavailable();
} else {
  void Promise.all([import('./App.tsx'), import('./lib/analytics')])
    .then(([{ default: App }, { initAnalytics }]) => {
      // Product analytics (METRIC-04). No-ops gracefully when VITE_POSTHOG_KEY is unset.
      initAnalytics();
      root.render(<App />);
    })
    .catch((error: unknown) => {
      console.error('Failed to start aiTA', error);
      renderUnavailable();
    });
}
