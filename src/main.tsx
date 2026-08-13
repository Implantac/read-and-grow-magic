import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installBranchHeaderInterceptor } from "@/integrations/supabase/branchHeader";

installBranchHeaderInterceptor();

// Auto-recover from stale chunk hashes after a redeploy.
const RELOAD_KEY = "__chunk_reload_at";
function isChunkLoadError(message: string) {
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("error loading dynamically imported module")
  );
}
function maybeReload(message: string) {
  if (!isChunkLoadError(message)) return;
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - last < 10_000) return; // avoid loops
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  window.location.reload();
}
window.addEventListener("error", (e) => maybeReload(e.message || ""));
window.addEventListener("unhandledrejection", (e) => {
  const msg = (e.reason && (e.reason.message || String(e.reason))) || "";
  maybeReload(msg);
});

// Detect and log React Error #185 patterns in production
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && (message.includes('Maximum update depth exceeded') || message.includes('Minified React error #185'))) {
    const errorData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      message: message,
      stack: new Error().stack
    };
    
    // Log to a specialized endpoint or just enhanced console
    originalConsoleError("[REACT-ERROR-185-DETECTED]", errorData);
    
    // Attempt to notify the event bus if available
    try {
      window.dispatchEvent(new CustomEvent('app:render-loop-error', { detail: errorData }));
    } catch (e) { /* ignore */ }
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
