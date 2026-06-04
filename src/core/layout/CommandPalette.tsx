import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/ui/base/command';
import { navigationItems } from '@/config/navigation';
import {
  LayoutDashboard, Users, Wallet, FileCheck, Package, ShoppingCart,
  Factory, Warehouse, Settings, UserCircle, ShoppingBag, ClipboardList,
  FileText, ArrowUpCircle, ArrowDownCircle, TrendingUp, CheckCircle,
  Receipt, BarChart3, Box, FolderTree, ArrowLeftRight, Calculator,
  Building2, FileSearch, ClipboardCheck, PackageMinus, Timer, PackagePlus,
  MapPin, PackageSearch, PackageCheck, MoveHorizontal, Building, Sliders,
  Plug, BookOpen, Scale, Radio, Wifi, Tag, Activity,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Wallet, FileCheck, Package, ShoppingCart,
  Factory, Warehouse, Settings, UserCircle, ShoppingBag, ClipboardList,
  FileText, ArrowUpCircle, ArrowDownCircle, TrendingUp, CheckCircle,
  Receipt, BarChart3, Box, FolderTree, ArrowLeftRight, Calculator,
  Building2, FileSearch, ClipboardCheck, PackageMinus, Timer, PackagePlus,
  MapPin, PackageSearch, PackageCheck, MoveHorizontal, Building, Sliders,
  Plug, BookOpen, Scale, Radio, Wifi, Tag, Activity,
};

interface FlatItem {
  title: string;
  href: string;
  icon: string;
  group: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const flatItems = useMemo(() => {
    const items: FlatItem[] = [];
    navigationItems.forEach((item) => {
      if (!item.children || item.children.length === 0) {
        items.push({ title: item.title, href: item.href, icon: item.icon, group: 'Navegação' });
      } else {
        item.children.forEach((child) => {
          items.push({ title: child.title, href: child.href, icon: child.icon, group: item.title });
        });
      }
    });
    return items;
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, FlatItem[]>();
    flatItems.forEach((item) => {
      const list = map.get(item.group) || [];
      list.push(item);
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, [flatItems]);

  const handleSelect = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar módulo, tela ou funcionalidade..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {groups.map(([group, items], idx) => (
          <div key={group}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.group} ${item.title}`}
                    onSelect={() => handleSelect(item.href)}
                    className="gap-2"
                  >
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    <span>{item.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
