import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./App.css";
import "./i18n";
import { captureReferralFromURL } from "./lib/referral";
import { initSentry } from "./lib/sentry";

initSentry();
captureReferralFromURL();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
