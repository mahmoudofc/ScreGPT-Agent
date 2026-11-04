import path from "path";
import { defineConfig, loadEnv } from "vite";
import checker from "vite-plugin-checker";
import react from "@vitejs/plugin-react";
import { createHtmlPlugin } from "vite-plugin-html";

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const CODEGEN_BACKEND =
    process.env.PROXY_CODEGEN_BACKEND || "http://127.0.0.1:7701";

  // Backend route prefixes forwarded to FastAPI when running against the Vite
  // dev server. The browser talks to a single origin (the dev server), so no
  // CORS setup or per-env backend URL is needed. Keep this in sync with the
  // routers registered in backend/main.py. Root-level API groups are listed
  // explicitly (rather than a broad "/") so they never shadow the SPA routes
  // defined in frontend/src/main.tsx (e.g. "/", "/evals", "/about").
  const BACKEND_ROUTES = [
    "/generate-code", // WebSocket code-generation stream (proxied with ws)
    "/api", // auth, capabilities, screenshot, export, design-systems
    "/local-assets", // uploaded asset files served by the backend
    "/eval_input_files",
    "/models",
    "/best-of-n-evals",
    "/output_folders",
    "/openai-input-compare",
    "/run_evals",
    "/run_evals_stream",
    "/eval-sets",
    "/eval-sessions",
    "/prompt-reports",
    "/agent-runs",
  ];

  const proxy = Object.fromEntries(
    BACKEND_ROUTES.map((route) => [
      route,
      { target: CODEGEN_BACKEND, ws: route === "/generate-code" },
    ])
  );

  return defineConfig({
    base: "",
    server: {
      // Listen on all interfaces so sandbox preview tunnels can reach the
      // dev server (default binding is loopback-only).
      host: true,
      // Route backend traffic through the frontend origin so the app works
      // via tunnels/preview URLs (no hardcoded localhost from the browser).
      proxy,
    },
    plugins: [
      react(),
      checker({ 
        typescript: true
      }),
      createHtmlPlugin({
        inject: {
          data: {
            injectHead: process.env.VITE_IS_DEPLOYED
              ? '<script defer="" data-domain="screenshottocode.com" src="https://plausible.io/js/script.js"></script>'
              : "",
          },
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  });
};
