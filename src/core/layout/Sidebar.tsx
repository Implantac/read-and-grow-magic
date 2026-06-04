import { useState } from 'react';
import logoUseSistemas from '@/assets/logo.png';
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
  Radio, Wifi, Tag, Activity, Brain, Gauge, Columns, ListOrdered,
  CalendarClock, Smartphone, Rows3, Wrench, Route, Layers, Zap,
  ShieldCheck, Search, Boxes, PieChart, CircleGauge, Sparkles, Cpu, Rocket,
  Filter, UserCheck, DollarSign, Target, Megaphone, Trophy, Bot,
  Eye, Truck, RefreshCw, Shield, Lock, Phone,
  ArrowDown, Database, ScanBarcode, DoorOpen, RotateCcw,
  Bell, Repeat, TrendingDown, LineChart, AlertTriangle,
  ShieldAlert, Upload, QrCode, FileCheck2, FileDown,
  Percent, Globe, ScrollText, ArrowRightLeft,
  BellRing, RotateCw, AlertOctagon, GitBranch, Siren,
  LogOut, User as UserIcon, HelpCircle, ChevronRight
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/base/tooltip';
import { Separator } from '@/ui/base/separator';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Wallet, FileCheck, Package, ShoppingCart,
  Factory, Warehouse, Settings, UserCircle, ShoppingBag, ClipboardList,
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
  BellRing, RotateCw, AlertOctagon, GitBranch, Siren,
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
    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 outline-none',
    isItemActive
      ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
  );

  const indicator = isItemActive && (
    <span
      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary"
      style={{ height: '18px', animation: 'sidebar-indicator 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
    />
  );


  const iconElement = Icon && (
    <Icon className={cn(
      'h-[18px] w-[18px] shrink-0 transition-all duration-200',
      isItemActive ? 'text-primary' : 'text-sidebar-foreground/40 group-hover:text-primary/70'
    )} />
  );

  const navButton = (
    <button
      onClick={() => hasChildren ? toggleExpanded(item.title) : undefined}
      className={baseClasses}
    >
      {indicator}
      {iconElement}
      {!sidebarCollapsed && (
        <>
          <span className="flex-1 text-left truncate font-medium">{item.title}</span>
          {hasChildren && (
            <ChevronRight className={cn(
              'h-3.5 w-3.5 opacity-50 transition-transform duration-300',
              isExpanded ? 'rotate-90 opacity-100' : 'rotate-0'
            )} />
          )}
        </>
      )}
    </button>
  );

  const navLink = (
    <Link to={item.href} className={baseClasses}>
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
          className={cn(
            'grid transition-all duration-300 ease-in-out',
            isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          )}
        >
          <div className="overflow-hidden">
            <ul className="ml-5 space-y-1 border-l border-sidebar-border/60 pl-3">
              {item.children?.map((child) => {
                const ChildIcon = iconMap[child.icon];
                const isChildActive = isActive(child.href);
                return (
                  <li key={child.title} className="list-none">
                    <Link
                      to={child.href}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] transition-all duration-150',
                        isChildActive
                          ? 'bg-primary/5 text-primary font-semibold'
                          : 'text-sidebar-foreground/50 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/80'
                      )}
                    >
                      {ChildIcon && <ChildIcon className={cn("h-3.5 w-3.5 shrink-0", isChildActive ? "text-primary" : "text-sidebar-foreground/30 group-hover:text-primary/50")} />}
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

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, user } = useAppStore();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Dashboard', 'Operacional', 'Financeiro']);

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

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
        style={{ 
          boxShadow: '1px 0 0 0 hsl(var(--sidebar-border)), 4px 0 24px -4px hsl(222 33% 8% / 0.5)',
          background: 'linear-gradient(180deg, hsl(var(--sidebar-background)) 0%, hsl(var(--sidebar-background) / 0.98) 100%)'
        }}
      >
        {/* Header/Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border/40 px-4">
          {sidebarCollapsed ? (
            <div className="flex w-full justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 hover:scale-105 hover:bg-primary/20 ring-1 ring-primary/20">
                <img src={logoUseSistemas} alt="Use Sistemas" className="h-7 w-7 object-contain" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3.5 px-1 animate-fade-in">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shadow-inner ring-1 ring-primary/20">
                <img src={logoUseSistemas} alt="Use Sistemas" className="h-8 w-8 object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-[15px] font-bold text-sidebar-foreground leading-tight tracking-tight">Use Sistemas</h1>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest">ERP & WMS</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin px-3 py-4 space-y-6">
          {navigationSections.map((section, sectionIndex) => (
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
                    <button className="p-2 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
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
                  <button className="p-2 text-sidebar-foreground/40 hover:text-primary hover:bg-sidebar-accent/50 rounded-lg transition-colors">
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