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
  if (!Component) return Component;

  const name = componentName || Component.displayName || Component.name || 'UnknownComponent';

  // Only components that actually accept a ref (forwardRef / memo(forwardRef) /
  // class components) may receive one. Wrapping a plain function component in
  // forwardRef triggers React's "Function components cannot be given refs" warning.
  const anyComp = Component as unknown as { $$typeof?: symbol; prototype?: { isReactComponent?: unknown }; render?: unknown };
  const acceptsRef =
    typeof Component === 'function'
      ? Boolean(anyComp.prototype?.isReactComponent)
      : Boolean(anyComp.render || (anyComp as { type?: unknown }).type);

  const useTracking = () => {
    const isInitialRender = React.useRef(true);
    React.useLayoutEffect(() => {
      if (isInitialRender.current) {
        isInitialRender.current = false;
        return;
      }
      monitor.trackUpdate(name);
    });
  };

  if (acceptsRef) {
    const ForwardedMonitor = React.forwardRef<unknown, P>((props, ref) => {
      useTracking();
      return React.createElement(Component as never, { ...props, ref } as never);
    });
    ForwardedMonitor.displayName = `withRenderMonitor(${name})`;
    return ForwardedMonitor as unknown as React.ComponentType<P>;
  }

  const MonitorWrapper = (props: P) => {
    useTracking();
    return React.createElement(Component as never, props as never);
  };
  MonitorWrapper.displayName = `withRenderMonitor(${name})`;
  return MonitorWrapper as React.ComponentType<P>;
}

