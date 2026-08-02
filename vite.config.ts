import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const hasServiceConfig = Boolean(
    env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );

  return {
    define: {
      // Make the service boundary a compile-time decision. Public-preview builds omit the
      // authenticated app and its Supabase/PostHog dependencies instead of merely hiding them.
      __MR_SELBY_PUBLIC_PREVIEW__: JSON.stringify(!hasServiceConfig),
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Split heavy vendors into their own chunks so the main bundle stays small (M39/L75).
      rollupOptions: {
        output: {
          manualChunks: hasServiceConfig
            ? {
                react: ["react", "react-dom", "react-router-dom"],
                supabase: ["@supabase/supabase-js"],
                pdf: ["pdfjs-dist", "mammoth"],
                charts: ["recharts"],
              }
            : undefined,
        },
      },
      chunkSizeWarningLimit: 900,
    },
  };
});
