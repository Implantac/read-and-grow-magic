import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/base/tooltip';
import type { NavItem } from '@/config/navigation';
import { iconMap } from './iconMap';

type Props = {
  item: NavItem;
  sidebarCollapsed: boolean;
  isActive: (href: string) => boolean;
  isParentActive: (href: string) => boolean;
  expandedItems: string[];
  toggleExpanded: (title: string) => void;
};

export function NavItemComponent({
  item, sidebarCollapsed, isActive, isParentActive, expandedItems, toggleExpanded,
}: Props) {
  const Icon = iconMap[item.icon];
  const hasChildren = !!(item.children && item.children.length > 0);
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
    <Link to={item.href} className={baseClasses} aria-current={isItemActive ? 'page' : undefined}>
      {indicator}
      {iconElement}
      {!sidebarCollapsed && <span className="truncate font-medium">{item.title}</span>}
    </Link>
  );

  const wrappedElement = sidebarCollapsed ? (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{hasChildren ? navButton : navLink}</TooltipTrigger>
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
                      {ChildIcon && <ChildIcon aria-hidden="true" className={cn('h-3.5 w-3.5 shrink-0', isChildActive ? 'text-primary' : 'text-sidebar-foreground/30 group-hover:text-primary/50')} />}
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
