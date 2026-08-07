import { Building2, ChevronDown, Store, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { Button } from '@/ui/base/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/ui/base/dropdown-menu';
import { cn } from '@/lib/utils';

export function TenantSelector() {
  const queryClient = useQueryClient();
  const { 
    currentCompany, 
    currentBranch, 
    allBranches, 
    setCompany, 
    setBranch,
    isLoading 
  } = useEnterprise();

  const handleSelectCompany = async (id: string) => {
    await setCompany(id);
    queryClient.clear();
  };

  const handleSelectBranch = (id: string | null) => {
    setBranch(id);
    queryClient.clear();
  };

  if (isLoading) return <div className="h-9 w-32 animate-pulse bg-sidebar-accent/20 rounded-lg" />;

  return (
    <>
      <span className="hidden lg:inline-block text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/40 mr-1">
        Contexto
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="group flex items-center gap-2 h-9 px-2 sm:px-3 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/20 text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent/50 hover:border-primary/30 text-sm font-medium transition-all">
            <Building2 className="h-3.5 w-3.5 text-primary/70 group-hover:text-primary shrink-0" aria-hidden="true" />
            <span className="max-w-[110px] sm:max-w-[180px] truncate">{currentCompany?.name || 'Empresa'}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 bg-sidebar border-sidebar-border">
          <DropdownMenuLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">Empresas</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-sidebar-border" />
          {currentCompany && (
            <DropdownMenuItem
              onClick={() => handleSelectCompany(currentCompany.id)}
              className={cn('text-sidebar-foreground/80 hover:text-primary focus:text-primary', 'text-primary bg-sidebar-accent')}
            >
              {currentCompany.name}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="group flex items-center gap-2 h-9 px-3 rounded-lg text-sidebar-foreground/60 hover:text-primary hover:bg-sidebar-accent/50 text-sm transition-all">
            <span className="text-sidebar-foreground/40">/</span>
            <Store className="h-3.5 w-3.5 opacity-70 group-hover:text-primary" />
            <span className="max-w-[120px] truncate">
              {currentBranch ? (
                <span className="flex items-center gap-1.5">
                  {currentBranch.tipo === 'FACTORY' && <Building2 className="h-3 w-3 text-amber-500" />}
                  {currentBranch.tipo === 'DISTRIBUTION_CENTER' && <Package className="h-3 w-3 text-blue-500" />}
                  {currentBranch.tipo === 'STORE' && <Store className="h-3 w-3 text-green-500" />}
                  {currentBranch.name}
                </span>
              ) : 'TODAS AS UNIDADES'}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 bg-sidebar border-sidebar-border">
          <DropdownMenuLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">Unidades Operacionais</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-sidebar-border" />
          <DropdownMenuItem
            onClick={() => handleSelectBranch(null)}
            className={cn('text-sidebar-foreground/80 hover:text-primary focus:text-primary',
              !currentBranch && 'text-primary bg-sidebar-accent font-bold')}
          >
            Visão Global (Todas)
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-sidebar-border/50" />
          {allBranches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => handleSelectBranch(branch.id)}
              className={cn('text-sidebar-foreground/80 hover:text-primary focus:text-primary',
                currentBranch?.id === branch.id && 'text-primary bg-sidebar-accent')}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{branch.name}</span>
                  {branch.tipo && (
                    <Badge variant="outline" className="text-[8px] px-1 h-3.5 leading-none">
                      {branch.tipo}
                    </Badge>
                  )}
                </div>
                {branch.code && <span className="text-[10px] opacity-50">{branch.code}</span>}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
