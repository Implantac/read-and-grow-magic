import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

declare global {
  interface Window {
    __erpDomGuardsInstalled?: boolean;
  }
}

function installDomGuards() {
  if (window.__erpDomGuardsInstalled) return;
  window.__erpDomGuardsInstalled = true;

  const originalRemoveChild = Node.prototype.removeChild;
  const originalInsertBefore = Node.prototype.insertBefore;

  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child?.parentNode && child.parentNode !== this) {
      return originalRemoveChild.call(child.parentNode, child) as T;
    }

    try {
      return originalRemoveChild.call(this, child) as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError") {
        return child;
      }
      throw error;
    }
  };

  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return this.appendChild(newNode) as T;
    }

    try {
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError") {
        return this.appendChild(newNode) as T;
      }
      throw error;
    }
  };
}

installDomGuards();

createRoot(document.getElementById("root")!).render(<App />);
