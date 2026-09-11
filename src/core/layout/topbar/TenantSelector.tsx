import { Building2, ChevronDown, Factory, Landmark, Package, Store, Warehouse } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { Button } from '@/ui/base/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/ui/base/dropdown-menu';
import { cn } from '@/lib/utils';

export function TenantSelector() {
  const { 
    allowedCompanies,
    currentCompany, 
    currentBranch, 
    allBranches, 
    activeChannel,
    activeUnitType,
    scope,
    isMatrixManager,
    setCompany, 
    setBranch,
    isLoading,
    isSwitching,
  } = useEnterprise();

  const handleSelectCompany = async (id: string) => {
    await setCompany(id);
  };

  const handleSelectBranch = async (id: string | null) => {
    await setBranch(id);
  };

  if (isLoading || isSwitching) return <div className="h-9 w-48 animate-pulse bg-sidebar-accent/20 rounded-lg" aria-label="Atualizando contexto operacional" />;

  const unitTypeLabel = {
    STORE: 'Loja',
    INDUSTRY: 'Indústria',
    DISTRIBUTION_CENTER: 'CD',
    OFFICE: 'Administrativo',
    WHOLESALE: 'Atacado',
  }[activeUnitType ?? 'OFFICE'];

  const channelLabel = activeChannel === 'VAREJO_PDV'
    ? 'Varejo / PDV'
    : activeChannel === 'ATACADO_INDUSTRIA'
      ? 'Indústria / Atacado'
      : 'Visão consolidada';

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
           {allowedCompanies.map((company) => (
            <DropdownMenuItem
               key={company.id}
               onClick={() => handleSelectCompany(company.id)}
               className={cn(
                 'text-sidebar-foreground/80 hover:text-primary focus:text-primary',
                 currentCompany?.id === company.id && 'text-primary bg-sidebar-accent',
               )}
            >
               {company.name}
            </DropdownMenuItem>
           ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="group flex items-center gap-2 h-9 px-3 rounded-lg text-sidebar-foreground/60 hover:text-primary hover:bg-sidebar-accent/50 text-sm transition-all">
            <span className="text-sidebar-foreground/40">/</span>
             {activeUnitType === 'INDUSTRY' && <Factory className="h-3.5 w-3.5 opacity-70 group-hover:text-primary" />}
             {activeUnitType === 'DISTRIBUTION_CENTER' && <Warehouse className="h-3.5 w-3.5 opacity-70 group-hover:text-primary" />}
             {activeUnitType === 'OFFICE' && <Landmark className="h-3.5 w-3.5 opacity-70 group-hover:text-primary" />}
             {activeUnitType === 'WHOLESALE' && <Package className="h-3.5 w-3.5 opacity-70 group-hover:text-primary" />}
             {(!activeUnitType || activeUnitType === 'STORE') && <Store className="h-3.5 w-3.5 opacity-70 group-hover:text-primary" />}
            <span className="max-w-[120px] truncate">
              {currentBranch ? (
                <span className="flex items-center gap-1.5">
                  {currentBranch.tipo?.toUpperCase() === 'FACTORY' && <Building2 className="h-3 w-3 text-amber-500" />}
                  {currentBranch.tipo?.toUpperCase() === 'DISTRIBUTION_CENTER' && <Package className="h-3 w-3 text-blue-500" />}
                  {currentBranch.tipo?.toUpperCase() === 'STORE' && <Store className="h-3 w-3 text-green-500" />}
                  {currentBranch.tipo?.toUpperCase() === 'OFFICE' && <Building2 className="h-3 w-3 text-slate-500" />}
                  {currentBranch.name}
                </span>
               ) : 'Toda a rede'}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 bg-sidebar border-sidebar-border">
          <DropdownMenuLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">Unidades Operacionais</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-sidebar-border" />
           {isMatrixManager && (
             <>
               <DropdownMenuItem
                 onClick={() => handleSelectBranch(null)}
                 className={cn('text-sidebar-foreground/80 hover:text-primary focus:text-primary',
                   scope === 'CONSOLIDATED' && 'text-primary bg-sidebar-accent font-bold')}
               >
                 Visão consolidada
               </DropdownMenuItem>
               <DropdownMenuSeparator className="bg-sidebar-border/50" />
             </>
           )}
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

      <Badge variant="outline" className="hidden xl:inline-flex h-7 gap-1.5 border-sidebar-border/60 text-sidebar-foreground/60">
        <span>{scope === 'CONSOLIDATED' ? 'Rede' : unitTypeLabel}</span>
        <span aria-hidden="true">•</span>
        <span>{channelLabel}</span>
      </Badge>
    </>
  );
}
