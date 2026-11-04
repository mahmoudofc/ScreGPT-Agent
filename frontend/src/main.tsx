import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "react-hot-toast";
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import RunEvalsPage from "./components/evals/RunEvalsPage.tsx";
import BestOfNEvalsPage from "./components/evals/BestOfNEvalsPage.tsx";
import AllEvalsPage from "./components/evals/AllEvalsPage.tsx";
import OpenAIInputComparePage from "./components/evals/OpenAIInputComparePage.tsx";
import PromptReportsPage from "./components/evals/PromptReportsPage.tsx";
import AgentRunsPage from "./components/evals/AgentRunsPage.tsx";
import EvalSessionsPage from "./components/evals/EvalSessionsPage.tsx";
import EvalComparePage from "./components/evals/EvalComparePage.tsx";
import { AuthProvider } from "./store/auth-context.tsx";
import LoginPage from "./components/auth/LoginPage.tsx";
import SignupPage from "./components/auth/SignupPage.tsx";
import RequireAuth from "./components/auth/RequireAuth.tsx";
import HomeLanding from "./components/marketing/HomeLanding.tsx";
import AboutPage from "./components/marketing/AboutPage.tsx";
import ContactPage from "./components/marketing/ContactPage.tsx";
import TemplatesPage from "./components/marketing/TemplatesPage.tsx";
import PricingPage from "./components/marketing/PricingPage.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeLanding />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <App />
              </RequireAuth>
            }
          />
          <Route path="/evals" element={<AllEvalsPage />} />
          <Route path="/evals/best-of-n" element={<BestOfNEvalsPage />} />
          <Route path="/evals/run" element={<RunEvalsPage />} />
          <Route
            path="/evals/openai-input-compare"
            element={<OpenAIInputComparePage />}
          />
          <Route path="/evals/prompt-reports" element={<PromptReportsPage />} />
          <Route path="/evals/agent-runs" element={<AgentRunsPage />} />
          <Route path="/evals/sessions" element={<EvalSessionsPage />} />
          <Route path="/evals/compare" element={<EvalComparePage />} />
        </Routes>
      </AuthProvider>
    </Router>
    <Toaster toastOptions={{ className: "dark:bg-zinc-950 dark:text-white" }} />
  </React.StrictMode>
);
