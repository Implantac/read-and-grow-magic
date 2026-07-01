import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/base/breadcrumb';
import { navigationSections } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  href?: string;
}

/**
 * Build a lookup { href -> {title, parentTitle, parentHref} } from the
 * central navigation config so breadcrumbs always match the sidebar labels.
 */
function buildRouteIndex() {
  const index = new Map<string, { title: string; parentTitle?: string; parentHref?: string }>();
  for (const section of navigationSections) {
    for (const item of section.items) {
      index.set(item.href, { title: item.title });
      if (item.children) {
        for (const child of item.children) {
          index.set(child.href, {
            title: child.title,
            parentTitle: item.title,
            parentHref: item.href,
          });
        }
      }
    }
  }
  return index;
}

const ROUTE_INDEX = buildRouteIndex();

function humanize(segment: string) {
  const decoded = decodeURIComponent(segment).replace(/[-_]/g, ' ');
  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

function isIdSegment(segment: string) {
  // uuid, numeric, or long hash
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
    /^\d+$/.test(segment) ||
    (segment.length >= 16 && /^[a-z0-9]+$/i.test(segment) && !/[aeiou]{2}/i.test(segment))
  );
}

export function Breadcrumbs({ className }: { className?: string }) {
  const { pathname } = useLocation();

  const crumbs = useMemo<Crumb[]>(() => {
    if (pathname === '/' || pathname === '/dashboard') return [];

    // Try exact match first — cheapest and most accurate.
    const exact = ROUTE_INDEX.get(pathname);
    if (exact) {
      const list: Crumb[] = [];
      if (exact.parentTitle && exact.parentHref) {
        list.push({ label: exact.parentTitle, href: exact.parentHref });
      }
      list.push({ label: exact.title });
      return list;
    }

    // Fallback: walk the URL segments and enrich known prefixes.
    const parts = pathname.split('/').filter(Boolean);
    const list: Crumb[] = [];
    let acc = '';
    parts.forEach((part, idx) => {
      acc += '/' + part;
      const isLast = idx === parts.length - 1;
      const known = ROUTE_INDEX.get(acc);
      let label: string;
      if (known) label = known.title;
      else if (isIdSegment(part)) label = 'Detalhes';
      else label = humanize(part);
      list.push({ label, href: isLast ? undefined : acc });
    });
    return list;
  }, [pathname]);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className={cn('mb-4', className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="flex items-center gap-1 text-muted-foreground hover:text-primary">
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Início</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((c, i) => (
          <div key={`${c.label}-${i}`} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {c.href ? (
                <BreadcrumbLink asChild>
                  <Link to={c.href} className="text-muted-foreground hover:text-primary">
                    {c.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-foreground font-medium">{c.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default Breadcrumbs;
