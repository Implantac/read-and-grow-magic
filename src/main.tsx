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

  const originalAppendChild = Node.prototype.appendChild;
  const originalRemoveChild = Node.prototype.removeChild;
  const originalInsertBefore = Node.prototype.insertBefore;

  Node.prototype.appendChild = function <T extends Node>(newNode: T): T {
    if (!this) return newNode;
    try {
      return originalAppendChild.call(this, newNode) as T;
    } catch (error) {
      return newNode;
    }
  };

  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (!this || !child) return child;
    if (child.parentNode && child.parentNode !== this) {
      try {
        return originalRemoveChild.call(child.parentNode, child) as T;
      } catch (e) {
        return child;
      }
    }

    try {
      return originalRemoveChild.call(this, child) as T;
    } catch (error) {
      return child;
    }
  };

  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (!this) return newNode;
    if (referenceNode && referenceNode.parentNode !== this) {
      return this.appendChild(newNode) as T;
    }

    try {
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch (error) {
      try {
        return this.appendChild(newNode) as T;
      } catch (e) {
        return newNode;
      }
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
