import { Link } from 'react-router-dom';
import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/base/tooltip';
import { useCustomEntities } from '@/hooks/useCustomEntities';
import { iconMap } from './iconMap';

export function CustomEntitiesNav({
  sidebarCollapsed,
  isActive,
}: {
  sidebarCollapsed: boolean;
  isActive: (href: string) => boolean;
}) {
  const { data: entities = [] } = useCustomEntities();
  const active = entities.filter((e) => e.is_active);
  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      {!sidebarCollapsed && (
        <div className="flex items-center justify-between px-3 mb-1">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/55">
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
                'group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                itemActive
                  ? 'bg-sidebar-accent text-sidebar-foreground shadow-sm ring-1 ring-sidebar-primary/45 before:absolute before:left-0 before:top-1/2 before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-sidebar-primary'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/75 hover:text-sidebar-foreground'
              )}
              aria-current={itemActive ? 'page' : undefined}
            >
              <Icon className={cn('h-[18px] w-[18px] shrink-0', itemActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/65 group-hover:text-sidebar-foreground')} />
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
