import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/hooks/system/useAuth';
import { useEnterprise } from '../auth/EnterpriseContext';
import { SEGMENTS } from '@/config/adaptive';

import { navigationSections } from '@/config/navigation';
import { TooltipProvider } from '@/ui/base/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/ui/base/input';

import { NavItemComponent } from './sidebar/NavItemComponent';
import { CustomEntitiesNav } from './sidebar/CustomEntitiesNav';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarFooter } from './sidebar/SidebarFooter';
import { useMobileFocusTrap } from './sidebar/useMobileFocusTrap';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed: rawCollapsed, sidebarMobileOpen, setSidebarMobileOpen, user } = useAppStore();
  const isMobile = useIsMobile();
  const sidebarCollapsed = isMobile ? false : rawCollapsed;
  const { signOut } = useAuth({ initialize: false });
  const { segment } = useEnterprise();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return navigationSections;

    const query = searchQuery.toLowerCase().trim();
    
    return navigationSections.map(section => {
      const filteredItems = section.items.filter(item => {
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesHref = item.href.toLowerCase().includes(query);
        const matchesChildren = item.children?.some(child => 
          child.title.toLowerCase().includes(query) || 
          child.href.toLowerCase().includes(query)
        );
        
        return matchesTitle || matchesHref || matchesChildren;
      });

      if (filteredItems.length === 0) return null;
      
      return {
        ...section,
        items: filteredItems
      };
    }).filter(Boolean) as typeof navigationSections;
  }, [searchQuery]);

  const flatItems = useMemo(() => {
    const items: any[] = [];
    filteredSections.forEach(section => {
      section.items.forEach(item => {
        items.push(item);
        if (item.children && expandedItems.includes(item.title)) {
          item.children.forEach(child => {
            items.push({ ...child, isChild: true });
          });
        }
      });
    });
    return items;
  }, [filteredSections, expandedItems]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  // Auto-expand items when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const toExpand: string[] = [];
      filteredSections.forEach(section => {
        section.items.forEach(item => {
          if (item.children && item.children.length > 0) {
            toExpand.push(item.title);
          }
        });
      });
      setExpandedItems(prev => Array.from(new Set([...prev, ...toExpand])));
    }
  }, [searchQuery, filteredSections]);

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  // Auto-expand any parent whose child matches the current route
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

  const asideRef = useMobileFocusTrap(isMobile, sidebarMobileOpen, setSidebarMobileOpen);

  const handleSignOut = () => {
    signOut().then(() => (window.location.href = '/login'));
  };

  // Shortcut Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (sidebarCollapsed) {
          useAppStore.getState().setSidebarCollapsed(false);
        }
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const item = flatItems[selectedIndex];
      if (item.href) {
        navigate(item.href);
        setSearchQuery('');
        setSelectedIndex(-1);
      } else if (item.children) {
        toggleExpanded(item.title);
      }
    }
  };

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
          background: 'var(--gradient-sidebar)',
        }}
      >
        <SidebarHeader collapsed={sidebarCollapsed} />

        {/* Search Bar */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 animate-fade-in">
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/30 group-focus-within:text-primary transition-colors" />
                <Input
                  ref={searchInputRef}
                  placeholder="Buscar menu ou rota... (Ctrl+K)"
                  value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="h-8 pl-8 pr-2 bg-sidebar-foreground/[0.03] border-sidebar-border/50 text-[12px] focus-visible:ring-primary/30 placeholder:text-sidebar-foreground/20 rounded-lg transition-all"
              />
            </div>
          </div>
        )}

        {/* Navigation Content */}
        <nav aria-label="Módulos do sistema" className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin px-3 py-2 space-y-6">
          {filteredSections.map((section, sectionIndex) => {
            const isVisible = !segment || (
              SEGMENTS[segment]?.allowedSections.includes(section.label || "") || 
              !section.label // Always show sections without labels if any
            );

            if (!isVisible && segment) return null;

            return section && (
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
                  {(section.items || []).filter((item) => {
                    if (!item) return false;
                    
                    // Segment-specific overrides
                    if (segment === 'services' && (item.title === 'Estoque' || item.title === 'Produção' || item.title === 'WMS')) return false;
                    
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
                      selectedIndex={selectedIndex}
                      flatItems={flatItems}
                    />
                  ))}
                </ul>
              </div>
            );
          })}

          <CustomEntitiesNav sidebarCollapsed={sidebarCollapsed} isActive={isActive} />
        </nav>

        <SidebarFooter collapsed={sidebarCollapsed} user={user} onSignOut={handleSignOut} />
      </aside>
    </TooltipProvider>
  );
}
