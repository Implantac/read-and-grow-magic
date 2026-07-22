import { useEffect, useRef } from 'react';

/**
 * Focus trap + focus restoration for the mobile sidebar drawer.
 * Returns a ref to attach to the drawer's <aside> element.
 */
export function useMobileFocusTrap(
  isMobile: boolean,
  sidebarMobileOpen: boolean,
  setSidebarMobileOpen: (v: boolean) => void,
) {
  const asideRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isMobile) return;

    if (sidebarMobileOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

      const aside = asideRef.current;
      if (aside) {
        const first = aside.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        requestAnimationFrame(() => first?.focus());
      }

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSidebarMobileOpen(false);
          return;
        }
        if (e.key !== 'Tab') return;
        const el = asideRef.current;
        if (!el) return;

        const focusables = Array.from(
          el.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
          )
        ).filter((n) => n.offsetParent !== null || n === document.activeElement);

        if (focusables.length === 0) return;
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        const activeEl = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (activeEl === firstEl || !el.contains(activeEl)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (activeEl === lastEl || !el.contains(activeEl)) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      };

      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    } else {
      const prev = previouslyFocusedRef.current;
      const fallback = document.querySelector<HTMLElement>('[aria-controls="app-sidebar"]');
      const target = (prev && document.body.contains(prev) ? prev : fallback) || null;
      if (target && typeof target.focus === 'function') {
        requestAnimationFrame(() => requestAnimationFrame(() => target.focus()));
      }
      previouslyFocusedRef.current = null;
    }
  }, [sidebarMobileOpen, isMobile, setSidebarMobileOpen]);

  return asideRef;
}
