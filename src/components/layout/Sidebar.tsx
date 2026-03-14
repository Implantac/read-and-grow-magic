import { useState } from 'react';
import logoUseSistemas from '@/assets/logo-use-sistemas.png';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { navigationSections } from '@/config/navigation';
import type { NavItem } from '@/config/navigation';
import {
  LayoutDashboard, Users, Wallet, FileCheck, Package, ShoppingCart,
  Factory, Warehouse, Settings, ChevronDown, UserCircle,
  ShoppingBag, ClipboardList, FileText, ArrowUpCircle, ArrowDownCircle,
  TrendingUp, CheckCircle, Receipt, BarChart3, Box, FolderTree,
  ArrowLeftRight, Calculator, Building2, FileSearch, ClipboardCheck,
  PackageMinus, Timer, PackagePlus, MapPin, PackageSearch, PackageCheck,
  MoveHorizontal, Building, Sliders, Plug, BookOpen, Scale,
  Radio, Wifi, Tag, Activity,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Wallet, FileCheck, Package, ShoppingCart,
  Factory, Warehouse, Settings, UserCircle, ShoppingBag, ClipboardList,
  FileText, ArrowUpCircle, ArrowDownCircle, TrendingUp, CheckCircle,
  Receipt, BarChart3, Box, FolderTree, ArrowLeftRight, Calculator,
  Building2, FileSearch, ClipboardCheck, PackageMinus, Timer, PackagePlus,
  MapPin, PackageSearch, PackageCheck, MoveHorizontal, Building, Sliders,
  Plug, BookOpen, Scale, Radio, Wifi, Tag, Activity,
};

function NavItemComponent({ item, sidebarCollapsed, isActive, isParentActive, expandedItems, toggleExpanded }: {
  item: NavItem;
  sidebarCollapsed: boolean;
  isActive: (href: string) => boolean;
  isParentActive: (href: string) => boolean;
  expandedItems: string[];
  toggleExpanded: (title: string) => void;
}) {
  const Icon = iconMap[item.icon];
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.includes(item.title);
  const isItemActive = isActive(item.href) || isParentActive(item.href);

  const navButton = (
    <button
      onClick={() => hasChildren ? toggleExpanded(item.title) : undefined}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        isItemActive
          ? 'bg-sidebar-accent text-sidebar-primary'
          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
      )}
    >
      {isItemActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary"
          style={{ height: '20px', animation: 'sidebar-indicator 0.2s ease-out' }}
        />
      )}
      {Icon && (
        <Icon className={cn(
          'h-[18px] w-[18px] shrink-0 transition-colors duration-200',
          isItemActive ? 'text-primary' : 'group-hover:text-primary/70'
        )} />
      )}
      {!sidebarCollapsed && (
        <>
          <span className="flex-1 text-left truncate">{item.title}</span>
          {hasChildren && (
            <ChevronDown className={cn(
              'h-3.5 w-3.5 transition-transform duration-200',
              isExpanded ? 'rotate-0' : '-rotate-90'
            )} />
          )}
        </>
      )}
    </button>
  );

  const navLink = (
    <Link
      to={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive(item.href)
          ? 'bg-sidebar-accent text-sidebar-primary'
          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
      )}
    >
      {isActive(item.href) && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary"
          style={{ height: '20px', animation: 'sidebar-indicator 0.2s ease-out' }}
        />
      )}
      {Icon && (
        <Icon className={cn(
          'h-[18px] w-[18px] shrink-0 transition-colors duration-200',
          isActive(item.href) ? 'text-primary' : 'group-hover:text-primary/70'
        )} />
      )}
      {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );

  const wrappedElement = sidebarCollapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        {hasChildren ? navButton : navLink}
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        {item.title}
      </TooltipContent>
    </Tooltip>
  ) : (
    hasChildren ? navButton : navLink
  );

  return (
    <li>
      {wrappedElement}
      {hasChildren && !sidebarCollapsed && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-200 ease-in-out',
            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <ul className="ml-5 mt-0.5 space-y-0.5 border-l border-sidebar-border/50 pl-3">
            {item.children?.map((child) => {
              const ChildIcon = iconMap[child.icon];
              return (
                <li key={child.title}>
                  <Link
                    to={child.href}
                    className={cn(
                      'group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-all duration-150',
                      isActive(child.href)
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-sidebar-foreground/50 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/80'
                    )}
                  >
                    {ChildIcon && <ChildIcon className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">{child.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed } = useAppStore();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Dashboard']);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (href: string) => location.pathname.startsWith(href);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
        style={{ boxShadow: '4px 0 24px -4px hsl(222 33% 8% / 0.3)' }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
          {sidebarCollapsed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 transition-transform duration-200 hover:scale-110">
              <img src={logoUseSistemas} alt="Use Sistemas" className="h-7 w-7 object-contain" />
            </div>
          ) : (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <img src={logoUseSistemas} alt="Use Sistemas" className="h-9 w-9 object-contain" />
              </div>
              <div>
                <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">Use Sistemas</h1>
                <p className="text-[11px] font-semibold text-primary">ERP e WMS</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin py-3 px-2">
          <div className="space-y-4">
            {navigationSections.map((section, sectionIndex) => (
              <div key={section.label || sectionIndex}>
                {/* Section label */}
                {section.label && !sidebarCollapsed && (
                  <div className="px-3 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/30">
                      {section.label}
                    </span>
                  </div>
                )}
                {section.label && sidebarCollapsed && (
                  <div className="mx-auto my-1 w-6 border-t border-sidebar-border/40" />
                )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavItemComponent
                      key={item.title}
                      item={item}
                      sidebarCollapsed={sidebarCollapsed}
                      isActive={isActive}
                      isParentActive={isParentActive}
                      expandedItems={expandedItems}
                      toggleExpanded={toggleExpanded}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </TooltipProvider>
  );
}
