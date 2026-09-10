import { useNavigate } from 'react-router-dom';
import { PackageCheck, RefreshCw, ArrowLeftRight, Boxes, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { cn } from '@/lib/utils';

export interface QuickAction {
  label: string;
  href: string;
  icon: typeof PackageCheck;
}

export const defaultQuickActions: QuickAction[] = [
  { label: 'Pedir reposição', href: '/operacional/rede/ressuprimento', icon: RefreshCw },
  { label: 'Receber mercadoria', href: '/operacional/rede/receber', icon: PackageCheck },
  { label: 'Transferir mercadoria', href: '/operacional/rede/transferencias', icon: ArrowLeftRight },
  { label: 'Consultar estoque', href: '/estoque/saldos', icon: Boxes },
  { label: 'Ver lojas', href: '/operacional/loja/central', icon: Store },
];

interface QuickActionsProps {
  actions?: QuickAction[];
  className?: string;
}

export function QuickActions({ actions = defaultQuickActions, className }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <Card className={cn('border-border/60', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Ações rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href + action.label}
                variant="outline"
                className="gap-2"
                onClick={() => navigate(action.href)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
