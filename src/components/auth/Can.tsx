import { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";

interface CanProps {
  resource: string;
  action: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Renders children only if the current user has the given permission
 * on the active tenant. Use for buttons, menu items, page sections.
 */
export function Can({ resource, action, fallback = null, children }: CanProps) {
  const { allowed, loading } = usePermission(resource, action);
  if (loading) return null;
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
