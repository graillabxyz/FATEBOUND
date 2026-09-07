import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "../ui/styles.css";
import "../online/account.css";
import { Account } from "../online/Account";
import { ErrorBoundary } from "../ui/ErrorBoundary";
const Dashboard = lazy(() => import("./Dashboard"));
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Account requireDeveloper>
        <Suspense fallback={<p>Opening metrics…</p>}>
          <Dashboard />
        </Suspense>
      </Account>
    </ErrorBoundary>
  </React.StrictMode>,
);
