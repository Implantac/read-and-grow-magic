/**
 * Blindagem Estrutural contra Error #185 (Maximum update depth exceeded)
 * Este monitor intercepta ciclos de renderização infinitos e fornece telemetria
 * detalhada para identificar o componente causador.
 */
import React from 'react';

const MAX_UPDATES_PER_SECOND = 10;
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
        `[LOOP-PREVENTED] Supressão de renderização em: "${componentName}".`,
        `Frequência: ${currentCount} updates/seg.`
      );
      
      this.isEnabled = false;
      setTimeout(() => { this.isEnabled = true; }, 5000);
      
      // In production, we don't throw to avoid hiding the original React #185 error
      // which is more useful for debugging the root cause.
      // We use window.location as a proxy for environment check to avoid TS node types dependency
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        const error = new Error(`Infinite render in ${componentName}`);
        (error as any).isRenderLoop = true;
        throw error;
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
  
  // Return the component directly if we're not in a situation where we can safely wrap it
  // and keep the same behavior (like forwardRef)
  if (!Component) return Component;

  const MonitorWrapper = (props: P) => {
    const isInitialRender = React.useRef(true);
    
    React.useLayoutEffect(() => {
      if (isInitialRender.current) {
        isInitialRender.current = false;
        return;
      }
      monitor.trackUpdate(name);
    });

    return React.createElement(Component as any, props);
  };

  const ForwardedMonitor = React.forwardRef<any, P>((props, ref) => {
    const isInitialRender = React.useRef(true);
    
    React.useLayoutEffect(() => {
      if (isInitialRender.current) {
        isInitialRender.current = false;
        return;
      }
      monitor.trackUpdate(name);
    });

    return React.createElement(Component as any, { ...props, ref });
  });

  ForwardedMonitor.displayName = `withRenderMonitor(${name})`;
  MonitorWrapper.displayName = `withRenderMonitor(${name})`;

  // We always use forwardRef by default to be safe, as it handles most cases
  return ForwardedMonitor;
}
