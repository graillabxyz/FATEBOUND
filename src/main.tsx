import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/cormorant-garamond/latin-ext-500.css";
import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import App from "./ui/App";
import { ENABLE_DEV_TOOLS } from "./dev/gate";
const Dashboard = ENABLE_DEV_TOOLS
  ? React.lazy(() => import("./metrics/Dashboard"))
  : null;
import { ErrorBoundary } from "./ui/ErrorBoundary";
import "./ui/styles.css";
import "./ui/polish.css";
if (Capacitor.isNativePlatform())
  void ScreenOrientation.lock({ orientation: "portrait" }).catch(() => {});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {Dashboard && window.location.pathname.startsWith("/metrics") ? (
        <React.Suspense fallback={<p>Opening metrics…</p>}>
          <Dashboard />
        </React.Suspense>
      ) : (
        <App />
      )}
    </ErrorBoundary>
  </React.StrictMode>,
);
