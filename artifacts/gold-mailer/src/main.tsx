import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { LanguageProvider } from "./i18n/LanguageContext";

document.documentElement.classList.add("dark");

const isAdminPage = typeof window !== "undefined" && (window.location.pathname.toLowerCase().includes("/admin") || window.location.href.toLowerCase().includes("/admin"));
if (!isAdminPage && import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
    scope: import.meta.env.BASE_URL,
  }).catch(() => {
    // Monetag's visible ad tags remain independent of the optional worker.
  });
}

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
