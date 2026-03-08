import { useState } from 'react';
import logoUseSistemas from '@/assets/logo-use-sistemas.png';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { navigationItems } from '@/data/mockData';
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileCheck,
  Package,
  ShoppingCart,
  Factory,
  Warehouse,
  Settings,
  ChevronDown,
  ChevronRight,
  UserCircle,
  ShoppingBag,
  ClipboardList,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  CheckCircle,
  Receipt,
  BarChart3,
  Box,
  FolderTree,
  ArrowLeftRight,
  Calculator,
  Building2,
  FileSearch,
  ClipboardCheck,
  PackageMinus,
  Timer,
  PackagePlus,
  MapPin,
  PackageSearch,
  PackageCheck,
  MoveHorizontal,
  Building,
  Sliders,
  Plug,
  BookOpen,
  Scale,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Wallet,
  FileCheck,
  Package,
  ShoppingCart,
  Factory,
  Warehouse,
  Settings,
  UserCircle,
  ShoppingBag,
  ClipboardList,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  CheckCircle,
  Receipt,
  BarChart3,
  Box,
  FolderTree,
  ArrowLeftRight,
  Calculator,
  Building2,
  FileSearch,
  ClipboardCheck,
  PackageMinus,
  Timer,
  PackagePlus,
  MapPin,
  PackageSearch,
  PackageCheck,
  MoveHorizontal,
  Building,
  Sliders,
  Plug,
  BookOpen,
  Scale,
};

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed } = useAppStore();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Dashboard']);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (href: string) => location.pathname.startsWith(href);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
        {sidebarCollapsed ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="text-lg font-bold text-sidebar-primary-foreground">E</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center">
              <img src={logoUseSistemas} alt="Use Sistemas" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">Use Sistemas</h1>
              <p className="text-xs" style={{ color: '#ff9800' }}>ERP e WMS</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin p-3">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = iconMap[item.icon];
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.title);
            const isItemActive = isActive(item.href) || isParentActive(item.href);

            return (
              <li key={item.title}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.title)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isItemActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5 shrink-0" />}
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </button>
                    {!sidebarCollapsed && isExpanded && (
                      <ul className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4">
                        {item.children?.map((child) => {
                          const ChildIcon = iconMap[child.icon];
                          return (
                            <li key={child.title}>
                              <Link
                                to={child.href}
                                className={cn(
                                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                  isActive(child.href)
                                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                )}
                              >
                                {ChildIcon && <ChildIcon className="h-4 w-4" />}
                                <span>{child.title}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    {Icon && <Icon className="h-5 w-5 shrink-0" />}
                    {!sidebarCollapsed && <span>{item.title}</span>}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
