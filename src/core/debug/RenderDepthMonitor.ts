/**
 * Blindagem Estrutural contra Error #185 (Maximum update depth exceeded)
 * Este monitor intercepta ciclos de renderização infinitos e fornece telemetria
 * detalhada para identificar o componente causador.
 */
import React from 'react';

const MAX_UPDATES_PER_SECOND = 30;
const CHECK_INTERVAL = 1000;

class RenderDepthMonitor {
  private updateCounts = new Map<string, number>();
  private startTime = Date.now();
  private isEnabled = true;

  constructor() {
    this.startCleanupTask();
  }

  private startCleanupTask() {
    setInterval(() => {
      this.updateCounts.clear();
      this.startTime = Date.now();
    }, CHECK_INTERVAL);
  }

  public trackUpdate(componentName: string) {
    if (!this.isEnabled) return;

    const currentCount = (this.updateCounts.get(componentName) || 0) + 1;
    this.updateCounts.set(componentName, currentCount);

    if (currentCount > MAX_UPDATES_PER_SECOND) {
      console.warn(
        `[RenderDepthMonitor] Potential Render Loop Detected: "${componentName}" updated ${currentCount} times in <1s.`,
        '\nComponent stack analysis initiated...'
      );
      
      // Throttle alerts to avoid console flooding
      this.isEnabled = false;
      setTimeout(() => { this.isEnabled = true; }, 5000);
      
      // Attempt to capture a stack trace for the update
      try {
        throw new Error(`Infinite render detection in ${componentName}`);
      } catch (e) {
        console.groupCollapsed(`Trace: ${componentName} Loop`);
        console.error(e);
        console.groupEnd();
      }
    }
  }
}

export const monitor = new RenderDepthMonitor();

/**
 * HOC para monitorar componentes específicos suspeitos de causar Error #185
 */
export function withRenderMonitor<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name || 'UnknownComponent';
  
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const isInitialRender = React.useRef(true);
    
    React.useEffect(() => {
      if (isInitialRender.current) {
        isInitialRender.current = false;
        return;
      }
      monitor.trackUpdate(name);
    });

    // We only pass ref if it's a component that can receive it
    // Using cast to any to satisfy TS for this monitoring HOC
    return React.createElement(Component as any, { ...props, ref });
  });

  WrappedComponent.displayName = `withRenderMonitor(${name})`;
  return WrappedComponent;
}
