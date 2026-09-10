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

/** Ações orientadas à tarefa — o usuário novo não sabe o nome do módulo. */
const taskActions = [
  { title: 'Receber mercadoria', href: '/operacional/rede/receber', icon: 'PackageCheck', keywords: 'receber recebimento chegou carga entrada conferir mercadoria' },
  { title: 'Transferir mercadoria', href: '/operacional/rede/transferencias', icon: 'ArrowLeftRight', keywords: 'transferir transferencia enviar mandar remessa loja cd fabrica' },
  { title: 'Pedir reposição', href: '/operacional/rede/ressuprimento', icon: 'Package', keywords: 'reposicao repor ressuprimento abastecer pedir falta ruptura' },
  { title: 'Consultar estoque', href: '/estoque/saldos', icon: 'Calculator', keywords: 'estoque saldo quanto tenho disponivel reservado transito' },
  { title: 'Ver pendências', href: '/pendencias', icon: 'Activity', keywords: 'pendencia atencao problema resolver alerta' },
  { title: 'Ver lojas', href: '/operacional/loja/central', icon: 'Building', keywords: 'loja lojas unidade filial minha loja' },
  { title: 'Novo pedido de compra', href: '/compras/pedidos', icon: 'ShoppingCart', keywords: 'comprar compra fornecedor pedido' },
  { title: 'Vender no PDV', href: '/comercial/pdv', icon: 'ShoppingBag', keywords: 'venda vender pdv caixa frente de loja' },
];

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
      const isK = e.key === 'k' || e.key === 'K' || e.code === 'KeyK';
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        setOpen((o) => !o);
      }
    };
    // Capture phase + window ensures we catch the event before any focused
    // element (inputs, editors) can swallow it, and works reliably in headless.
    window.addEventListener('keydown', down, true);
    return () => window.removeEventListener('keydown', down, true);
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
      <CommandInput placeholder="O que você quer fazer?" />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="O que você quer fazer?">
          {taskActions.map((action) => {
            const Icon = iconMap[action.icon] || Activity;
            return (
              <CommandItem
                key={action.href + action.title}
                value={`${action.title} ${action.keywords}`}
                onSelect={() => handleSelect(action.href)}
                className="gap-2"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span>{action.title}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
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
