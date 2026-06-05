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
      if (this && typeof this.appendChild === 'function') {
        return this.appendChild(newNode) as T;
      }
      return newNode;
    }

    try {
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError") {
        if (this && typeof this.appendChild === 'function') {
          return this.appendChild(newNode) as T;
        }
      }
      throw error;
    }
  };
}

installDomGuards();

const hideBadge = () => {
  const badge = document.getElementById('lovable-badge');
  if (badge) {
    badge.style.display = 'none';
    badge.style.visibility = 'hidden';
    badge.remove();
  }
};

const observer = new MutationObserver(() => hideBadge());
observer.observe(document.documentElement, { childList: true, subtree: true });

createRoot(document.getElementById("root")!).render(<App />);
