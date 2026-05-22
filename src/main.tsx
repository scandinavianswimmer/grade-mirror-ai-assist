import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initAnalytics } from './lib/analytics'

// Product analytics (METRIC-04). No-ops gracefully when VITE_POSTHOG_KEY is unset.
initAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
