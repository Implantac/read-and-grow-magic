import { useEffect, useRef, useState } from 'react';
import logoUseSistemas from '@/assets/logo.png';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/hooks/system/useAuth';
import { useEnterprise } from '../auth/EnterpriseContext';
import { SEGMENTS } from '@/config/adaptive';

import { navigationSections } from '@/config/navigation';
import type { NavItem } from '@/config/navigation';
import { useCustomEntities } from '@/hooks/useCustomEntities';

import {
  LayoutDashboard, Users, Wallet, FileCheck, Package, ShoppingCart,
  Factory, Warehouse, Settings, ChevronDown, UserCircle,
  ShoppingBag, ClipboardList, FileText, ArrowUpCircle, ArrowDownCircle,
  TrendingUp, CheckCircle, Receipt, BarChart3, Box, FolderTree,
  ArrowLeftRight, Calculator, Building2, FileSearch, ClipboardCheck,
  PackageMinus, Timer, PackagePlus, MapPin, PackageSearch, PackageCheck,
  MoveHorizontal, Building, Sliders, Plug, BookOpen, Scale,
  Radio, Wifi, Tag, Activity, Brain, Gauge, Columns, ListOrdered,
  CalendarClock, Smartphone, Rows3, Wrench, Route, Layers, Zap,
  ShieldCheck, Search, Boxes, PieChart, CircleGauge, Sparkles, Cpu, Rocket,
  Filter, UserCheck, DollarSign, Target, Megaphone, Trophy, Bot,
  Eye, Truck, RefreshCw, Shield, Lock, Phone,
  ArrowDown, Database, ScanBarcode, DoorOpen, RotateCcw,
  Bell, Repeat, TrendingDown, LineChart, AlertTriangle,
  ShieldAlert, Upload, QrCode, FileCheck2, FileDown,
  Percent, Globe, ScrollText, ArrowRightLeft,
  BellRing, RotateCw, AlertOctagon, GitBranch, Siren, Scissors,
  LogOut, User as UserIcon, HelpCircle, ChevronRight, Inbox, Heart,
  Send, MessageSquare, Palette, BookOpenCheck, Crown, LayoutGrid, Split
} from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/base/tooltip';
import { Separator } from '@/ui/base/separator';
import { useIsMobile } from '@/hooks/use-mobile';


const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Wallet, FileCheck, Package, ShoppingCart,
  Factory, Warehouse, Settings, UserCircle, ShoppingBag, ClipboardList, Crown,
  FileText, ArrowUpCircle, ArrowDownCircle, TrendingUp, CheckCircle,
  Receipt, BarChart3, Box, FolderTree, ArrowLeftRight, Calculator,
  Building2, FileSearch, ClipboardCheck, PackageMinus, Timer, PackagePlus,
  MapPin, PackageSearch, PackageCheck, MoveHorizontal, Building, Sliders,
  Plug, BookOpen, Scale, Radio, Wifi, Tag, Activity, Brain, Gauge,
  Columns, ListOrdered, CalendarClock, Smartphone, Rows3, Wrench, Route,
  Layers, Zap, ShieldCheck, Search, Boxes, PieChart, CircleGauge,
  Sparkles, Cpu, Rocket, Filter, UserCheck, DollarSign, Target,
  Megaphone, Trophy, Bot, Eye, Truck, RefreshCw,
  Shield, Lock, Phone, ArrowDown, Database, ScanBarcode, DoorOpen, RotateCcw,
  Bell, Repeat, TrendingDown, LineChart, AlertTriangle, ShieldAlert, Upload, QrCode,
  FileCheck2, FileDown, Percent, Globe, ScrollText, ArrowRightLeft,
  BellRing, RotateCw, AlertOctagon, GitBranch, Siren, Scissors, Inbox, Heart,
  Send, MessageSquare, Palette, BookOpenCheck, LayoutGrid, Split,
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

  const baseClasses = cn(
    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium outline-none',
    'transition-[background-color,color,box-shadow,transform] duration-200 ease-out',
    'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
    isItemActive
      ? 'bg-primary/10 text-primary ring-1 ring-primary/20 shadow-[0_1px_0_0_hsl(var(--sidebar-border)/0.4),inset_0_1px_0_0_hsl(var(--primary)/0.08)]'
      : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground active:scale-[0.985]'
  );

  const indicator = isItemActive && (
    <span
      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-gradient-to-b from-primary to-primary-glow shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
      style={{ height: '18px', animation: 'sidebar-indicator 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
    />
  );


  const iconElement = Icon && (
    <Icon className={cn(
      'h-[18px] w-[18px] shrink-0 transition-all duration-200',
      isItemActive ? 'text-primary' : 'text-sidebar-foreground/45 group-hover:text-primary/80'
    )} />
  );


  const submenuId = `sidebar-submenu-${item.title.replace(/\s+/g, '-').toLowerCase()}`;

  const navButton = (
    <button
      type="button"
      onClick={() => hasChildren ? toggleExpanded(item.title) : undefined}
      className={baseClasses}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-controls={hasChildren ? submenuId : undefined}
      aria-current={isItemActive && !hasChildren ? 'page' : undefined}
    >
      {indicator}
      {iconElement}
      {!sidebarCollapsed && (
        <>
          <span className="flex-1 text-left truncate font-medium">{item.title}</span>
          {hasChildren && (
            <ChevronRight aria-hidden="true" className={cn(
              'h-3.5 w-3.5 opacity-50 transition-transform duration-300',
              isExpanded ? 'rotate-90 opacity-100' : 'rotate-0'
            )} />
          )}
        </>
      )}
    </button>
  );

  const navLink = (
    <Link
      to={item.href}
      className={baseClasses}
      aria-current={isItemActive ? 'page' : undefined}
    >
      {indicator}
      {iconElement}
      {!sidebarCollapsed && <span className="truncate font-medium">{item.title}</span>}
    </Link>
  );


  const wrappedElement = sidebarCollapsed ? (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        {hasChildren ? navButton : navLink}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="font-semibold bg-sidebar border-sidebar-border text-sidebar-foreground shadow-xl">
        {item.title}
      </TooltipContent>
    </Tooltip>
  ) : (
    hasChildren ? navButton : navLink
  );

  return (
    <li className="list-none">
      {wrappedElement}
      {hasChildren && !sidebarCollapsed && (
        <div
          id={submenuId}
          role="region"
          aria-label={`Submenu ${item.title}`}
          className={cn(
            'grid transition-all duration-300 ease-in-out',
            isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          )}
          aria-hidden={!isExpanded}
        >
          <div className="overflow-hidden">
            <ul className="ml-5 space-y-1 border-l border-sidebar-border/60 pl-3">
              {(item.children || []).map((child) => {
                if (!child) return null;

                const ChildIcon = iconMap[child.icon];
                const isChildActive = isActive(child.href);
                return (
                  <li key={child.title} className="list-none">
                    <Link
                      to={child.href}
                      aria-current={isChildActive ? 'page' : undefined}
                      tabIndex={isExpanded ? 0 : -1}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] transition-all duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                        isChildActive
                          ? 'bg-primary/5 text-primary font-semibold'
                          : 'text-sidebar-foreground/50 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/80'
                      )}
                    >
                      {ChildIcon && <ChildIcon aria-hidden="true" className={cn("h-3.5 w-3.5 shrink-0", isChildActive ? "text-primary" : "text-sidebar-foreground/30 group-hover:text-primary/50")} />}
                      <span className="truncate">{child.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

      )}
    </li>
  );
}

function CustomEntitiesNav({ sidebarCollapsed, isActive }: { sidebarCollapsed: boolean; isActive: (href: string) => boolean }) {
  const { data: entities = [] } = useCustomEntities();
  const active = entities.filter((e) => e.is_active);
  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      {!sidebarCollapsed && (
        <div className="flex items-center justify-between px-3 mb-1">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/30">
            Entidades Customizadas
          </h2>
        </div>
      )}
      {sidebarCollapsed && (
        <div className="flex justify-center mb-1">
          <div className="h-px w-6 bg-sidebar-border/50" />
        </div>
      )}
      <ul className="space-y-1">
        {active.map((entity) => {
          const href = `/custom/${entity.entity_key}`;
          const Icon = (entity.icon && iconMap[entity.icon]) || Database;
          const itemActive = isActive(href);
          const link = (
            <Link
              to={href}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 outline-none',
                itemActive
                  ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] shrink-0', itemActive ? 'text-primary' : 'text-sidebar-foreground/40 group-hover:text-primary/70')} />
              {!sidebarCollapsed && <span className="truncate font-medium">{entity.label_plural || entity.label}</span>}
            </Link>
          );
          return (
            <li key={entity.id} className="list-none">
              {sidebarCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10} className="font-semibold bg-sidebar border-sidebar-border text-sidebar-foreground shadow-xl">
                    {entity.label_plural || entity.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                link
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}


export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed: rawCollapsed, sidebarMobileOpen, setSidebarMobileOpen, user } = useAppStore();
  const isMobile = useIsMobile();
  // On mobile drawer, always show full sidebar (labels visible), ignore collapsed setting
  const sidebarCollapsed = isMobile ? false : rawCollapsed;
  const { signOut } = useAuth({ initialize: false });
  const { segment } = useEnterprise();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  // Auto-expand any parent whose child matches the current route so users
  // see where they are within the sidebar hierarchy.
  useEffect(() => {
    const toExpand: string[] = [];
    for (const section of navigationSections) {
      for (const item of section.items) {
        if (item.children && item.children.length > 0) {
          const hit = item.children.some((c) => c && location.pathname.startsWith(c.href));
          if (hit) toExpand.push(item.title);
        }
      }
    }
    if (toExpand.length > 0) {
      setExpandedItems((prev) => Array.from(new Set([...prev, ...toExpand])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    if (sidebarMobileOpen) setSidebarMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Focus trap + focus restoration for mobile drawer
  const asideRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isMobile) return;

    if (sidebarMobileOpen) {
      // Save the element that opened the drawer
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

      // Move focus to first focusable item inside the drawer
      const aside = asideRef.current;
      if (aside) {
        const first = aside.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        // Defer to next frame so the slide-in transition doesn't fight the focus
        requestAnimationFrame(() => first?.focus());
      }

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSidebarMobileOpen(false);
          return;
        }
        if (e.key !== 'Tab') return;
        const aside = asideRef.current;
        if (!aside) return;

        const focusables = Array.from(
          aside.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
          )
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (focusables.length === 0) return;
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (active === firstEl || !aside.contains(active)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (active === lastEl || !aside.contains(active)) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      };

      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    } else {
      // Restore focus to the trigger that opened the drawer.
      // Prefer the saved reference; fall back to the element with aria-controls="app-sidebar"
      // (the hamburger button in the Topbar) if the ref was lost (e.g. re-render/HMR).
      const prev = previouslyFocusedRef.current;
      const fallback = document.querySelector<HTMLElement>('[aria-controls="app-sidebar"]');
      const target = (prev && document.body.contains(prev) ? prev : fallback) || null;
      if (target && typeof target.focus === 'function') {
        // Double rAF: waits for React commit + route transition before restoring focus,
        // so it survives closes triggered by nav-item clicks or backdrop clicks.
        requestAnimationFrame(() => requestAnimationFrame(() => target.focus()));
      }
      previouslyFocusedRef.current = null;
    }

  }, [sidebarMobileOpen, isMobile, setSidebarMobileOpen]);



  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile backdrop */}
      <div
        onClick={() => setSidebarMobileOpen(false)}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden transition-opacity duration-300',
          sidebarMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />
      <aside
        id="app-sidebar"
        ref={asideRef}
        aria-label="Navegação principal"
        role={isMobile ? 'dialog' : undefined}
        aria-modal={isMobile && sidebarMobileOpen ? true : undefined}
        aria-hidden={isMobile && !sidebarMobileOpen ? true : undefined}


        className={cn(
          'fixed left-0 top-0 z-40 flex h-dvh flex-col overflow-hidden bg-sidebar transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          'w-64',
          sidebarCollapsed ? 'md:w-16' : 'md:w-64',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0'
        )}
        style={{
          boxShadow: '1px 0 0 0 hsl(var(--sidebar-border) / 0.6), 6px 0 32px -8px hsl(222 33% 4% / 0.55)',
          background: 'var(--gradient-sidebar)'
        }}
      >



        {/* Header/Logo */}
        <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border/40 px-3">
          {sidebarCollapsed ? (
            <div className="flex w-full justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/25 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_16px_hsl(var(--primary)/0.35)]">
                <img src={logoUseSistemas} alt="Use Sistemas" className="h-6 w-6 object-contain" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-1 animate-fade-in">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/25 shadow-inner">
                <img src={logoUseSistemas} alt="Use Sistemas" className="h-7 w-7 object-contain" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-bold text-sidebar-foreground leading-tight tracking-tight truncate">Use Sistemas</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.8)] animate-pulse" aria-hidden="true" />
                  <p className="text-[9px] font-bold text-primary/85 uppercase tracking-[0.14em]">ERP & WMS</p>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Navigation Content */}
        <nav aria-label="Módulos do sistema" className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin px-3 py-4 space-y-6">
          {navigationSections.filter(section => {
            if (!segment) return true;
            
            // Adaptive logic based on business vertical (Pillar 3 — ERP ADAPTATIVO)
            const segmentConfig = SEGMENTS[segment] || SEGMENTS.general;
            const allowedSections = segmentConfig.allowedSections;
            
            if (section.label && !allowedSections.includes(section.label)) {
              return false;
            }

            return true;
          }).map((section, sectionIndex) => (
            section && (
              <div key={section.label || sectionIndex} className="space-y-2">
                {!sidebarCollapsed && section.label && (
                  <div className="flex items-center justify-between px-3 mb-1">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/30">
                      {section.label}
                    </h2>
                  </div>
                )}
                
                {sidebarCollapsed && section.label && (
                  <div className="flex justify-center mb-1">
                    <div className="h-px w-6 bg-sidebar-border/50" />
                  </div>
                )}

                <ul className="space-y-1">
                  {(section.items || []).filter(item => {
                    if (!item) return false;
                    // Segment-specific item filtering
                    if (segment === 'services' && (item.title === 'Estoque' || item.title === 'Produção' || item.title === 'WMS')) return false;
                    if (segment === 'retail' && item.title === 'WMS') return true; // Retail might need WMS if it has a warehouse
                    
                    // Hide Vertical Packs that don't match the segment (except for Admin)
                    if (section.label === 'Pacotes Verticais') {
                      if (segment === 'textile' && item.title !== 'Indústria Têxtil') return false;
                      if (segment === 'pharma' && item.title !== 'Farmacêutico') return false;
                      if (segment === 'food_factory' && !item.title.includes('Alimentos')) return false;
                    }

                    return true;
                  }).map((item) => (
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
            )
          ))}

          <CustomEntitiesNav sidebarCollapsed={sidebarCollapsed} isActive={isActive} />
        </nav>


        {/* Footer / User Profile */}
        <div className="shrink-0 border-t border-sidebar-border/40 p-3 bg-sidebar-accent/10">
          {!sidebarCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/30 p-2 ring-1 ring-sidebar-border/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold shadow-sm">
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-semibold text-sidebar-foreground truncate">{user?.name || 'Usuário'}</span>
                  <span className="text-[10px] text-sidebar-foreground/40 truncate">{user?.email || 'admin@usesistemas.com.br'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between px-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-2 text-sidebar-foreground/40 hover:text-primary hover:bg-sidebar-accent/50 rounded-lg transition-colors">
                      <Settings className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Configurações</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-2 text-sidebar-foreground/40 hover:text-primary hover:bg-sidebar-accent/50 rounded-lg transition-colors">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Suporte</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => {
                        signOut().then(() => window.location.href = '/login');

                      }}
                      className="p-2 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Sair do Sistema</TooltipContent>
                </Tooltip>

              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold cursor-pointer hover:bg-primary/20 transition-all ring-1 ring-primary/20">
                    {user?.name?.[0] || 'U'}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{user?.name}</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => {
                      signOut().then(() => window.location.href = '/login');

                    }}
                    className="p-2 text-sidebar-foreground/40 hover:text-primary hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sair</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}