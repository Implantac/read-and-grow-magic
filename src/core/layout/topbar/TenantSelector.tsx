import { useState } from 'react';
import { Building2, Check, ChevronDown, Factory, Landmark, Loader2, Package, Store, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/ui/base/badge';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/ui/base/dropdown-menu';
import { cn } from '@/lib/utils';
import { normalizeUnitType } from '@/core/auth/operationalContext';

const unitLabels = {
  STORE: 'Loja',
  INDUSTRY: 'Indústria',
  DISTRIBUTION_CENTER: 'Centro de distribuição',
  OFFICE: 'Administrativo',
  WHOLESALE: 'Atacado',
} as const;

export function TenantSelector() {
  const [unitSearch, setUnitSearch] = useState('');
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
    if (id === currentCompany?.id) return;
    try { await setCompany(id); } catch { toast.error('Não foi possível trocar a empresa. Tente novamente.'); }
  };

  const handleSelectBranch = async (id: string | null) => {
    if (id === currentBranch?.id || (id === null && scope === 'CONSOLIDATED')) return;
    try { await setBranch(id); } catch { toast.error('Não foi possível trocar a unidade. Tente novamente.'); }
  };

  if (isLoading && !currentCompany) return <div className="h-9 w-48 animate-pulse bg-sidebar-accent/20 rounded-lg" aria-label="Carregando empresas e unidades" />;

  const unitTypeLabel = unitLabels[activeUnitType ?? 'OFFICE'];

  const channelLabel = activeChannel === 'VAREJO_PDV'
    ? 'Varejo / PDV'
    : activeChannel === 'ATACADO_INDUSTRIA'
      ? 'Indústria / Atacado'
      : 'Visão consolidada';
  const matchingBranches = allBranches.filter((branch) =>
    `${branch.name} ${branch.code ?? ''} ${unitLabels[normalizeUnitType(branch.tipo)]}`
      .toLocaleLowerCase('pt-BR').includes(unitSearch.trim().toLocaleLowerCase('pt-BR'))
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" disabled={isLoading || isSwitching || allowedCompanies.length === 0} aria-label={`Empresa ativa: ${currentCompany?.name || 'nenhuma selecionada'}. Trocar empresa`} className="group flex min-w-0 items-center gap-1.5 h-9 px-2 sm:px-3 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/20 text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent/50 hover:border-primary/30 text-sm font-medium transition-all">
            <Building2 className="h-3.5 w-3.5 text-primary/70 group-hover:text-primary shrink-0" aria-hidden="true" />
            <span className="hidden max-w-[180px] truncate sm:inline">{currentCompany?.name || 'Empresa'}</span>
            {isSwitching ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50 transition-transform group-data-[state=open]:rotate-180" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto bg-sidebar border-sidebar-border">
          <DropdownMenuLabel className="text-sidebar-foreground/60 text-xs">Empresa ativa · {allowedCompanies.length} {allowedCompanies.length === 1 ? 'disponível' : 'disponíveis'}</DropdownMenuLabel>
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
               <span className="min-w-0 flex-1 truncate">{company.name}</span>
               {currentCompany?.id === company.id && <Check className="ml-2 h-4 w-4 shrink-0" aria-label="Selecionada" />}
            </DropdownMenuItem>
           ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu onOpenChange={(open) => { if (!open) setUnitSearch(''); }}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" disabled={isLoading || isSwitching || (!isMatrixManager && allBranches.length === 0)} aria-label={`Unidade ativa na empresa ${currentCompany?.name || 'não selecionada'}: ${currentBranch?.name || 'Visão consolidada'}. Trocar unidade`} className="group flex min-w-0 items-center gap-1.5 h-9 px-1 sm:px-3 rounded-lg text-sidebar-foreground/60 hover:text-primary hover:bg-sidebar-accent/50 text-sm transition-all">
            <span className="hidden text-sidebar-foreground/40 sm:inline">/</span>
             {activeUnitType === 'INDUSTRY' && <Factory className="h-3.5 w-3.5 opacity-70 group-hover:text-primary" />}
             {activeUnitType === 'DISTRIBUTION_CENTER' && <Warehouse className="h-3.5 w-3.5 opacity-70 group-hover:text-primary" />}
             {activeUnitType === 'OFFICE' && <Landmark className="h-3.5 w-3.5 opacity-70 group-hover:text-primary" />}
             {activeUnitType === 'WHOLESALE' && <Package className="h-3.5 w-3.5 opacity-70 group-hover:text-primary" />}
             {(!activeUnitType || activeUnitType === 'STORE') && <Store className="h-3.5 w-3.5 opacity-70 group-hover:text-primary" />}
             <span className="max-w-[80px] min-w-0 truncate min-[400px]:max-w-[120px] sm:max-w-[180px]">
              {currentBranch ? (
                 <span className="flex min-w-0 items-center gap-1.5">
                   <span className="truncate">{currentBranch.name}</span>
                </span>
               ) : 'Visão consolidada'}
            </span>
             {isSwitching ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" /> : <ChevronDown className="h-3 w-3 shrink-0 opacity-50 transition-transform group-data-[state=open]:rotate-180" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto bg-sidebar border-sidebar-border">
          <DropdownMenuLabel className="text-sidebar-foreground/60 text-xs truncate">Unidades de {currentCompany?.name || 'empresa selecionada'}</DropdownMenuLabel>
          {allBranches.length > 5 && (
            <div className="px-2 py-1" onKeyDown={(event) => event.stopPropagation()}>
              <Input
                aria-label="Buscar unidade por nome, código ou tipo"
                placeholder="Buscar unidade..."
                value={unitSearch}
                onChange={(event) => setUnitSearch(event.target.value)}
                className="h-8 border-sidebar-border bg-sidebar-accent/30 text-sidebar-foreground"
              />
            </div>
          )}
          <DropdownMenuSeparator className="bg-sidebar-border" />
           {isMatrixManager && (
             <>
               <DropdownMenuItem
                 onClick={() => handleSelectBranch(null)}
                 className={cn('text-sidebar-foreground/80 hover:text-primary focus:text-primary',
                   scope === 'CONSOLIDATED' && 'text-primary bg-sidebar-accent font-bold')}
               >
                 Visão consolidada
                 {scope === 'CONSOLIDATED' && <Check className="ml-auto h-4 w-4" aria-label="Selecionada" />}
               </DropdownMenuItem>
               <DropdownMenuSeparator className="bg-sidebar-border/50" />
             </>
           )}
           {allBranches.length === 0 && <DropdownMenuLabel className="text-xs text-sidebar-foreground/60">Nenhuma unidade ativa nesta empresa</DropdownMenuLabel>}
           {allBranches.length > 0 && matchingBranches.length === 0 && <DropdownMenuLabel className="text-xs text-sidebar-foreground/60">Nenhuma unidade encontrada</DropdownMenuLabel>}
           {matchingBranches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => handleSelectBranch(branch.id)}
              className={cn('text-sidebar-foreground/80 hover:text-primary focus:text-primary',
                currentBranch?.id === branch.id && 'text-primary bg-sidebar-accent')}
            >
               <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                   <span className="truncate font-medium">{branch.name}</span>
                  {branch.tipo && (
                     <Badge variant="outline" className="shrink-0 text-[10px] px-1 leading-none">
                       {unitLabels[normalizeUnitType(branch.tipo)]}
                    </Badge>
                  )}
                </div>
               {currentBranch?.id === branch.id && <Check className="ml-2 h-4 w-4 shrink-0" aria-label="Selecionada" />}
                {branch.code && <span className="text-[10px] opacity-50">{branch.code}</span>}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

       <Badge variant="outline" className="hidden 2xl:inline-flex h-7 gap-1.5 border-sidebar-border/60 text-sidebar-foreground/60">
        <span>{scope === 'CONSOLIDATED' ? 'Rede' : unitTypeLabel}</span>
        <span aria-hidden="true">•</span>
        <span>{channelLabel}</span>
      </Badge>
    </>
  );
}
