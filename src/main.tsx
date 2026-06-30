import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installBranchHeaderInterceptor } from "@/integrations/supabase/branchHeader";

installBranchHeaderInterceptor();

createRoot(document.getElementById("root")!).render(<App />);
