import { Building2, ChevronDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Company, Branch } from '@/types';
import { useCompanies } from '@/hooks/system/useCompanies';
import { useAppStore } from '@/stores/useAppStore';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { Button } from '@/ui/base/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/ui/base/dropdown-menu';
import { cn } from '@/lib/utils';

export function TenantSelector() {
  const queryClient = useQueryClient();
  const { activeCompany, activeBranch, setActiveCompany, setActiveBranch } = useAppStore();
  const setActiveCompanyId = useEnterpriseStore((s) => s.setActiveCompanyId);
  const setActiveBranchId = useEnterpriseStore((s) => s.setActiveBranchId);
  const { companies } = useCompanies();

  const handleSelectCompany = (company: Company) => {
    const previousId = activeCompany?.id ?? null;
    setActiveCompany(company);
    setActiveCompanyId(company?.id ?? null);
    const firstBranch = Array.isArray(company?.branches) && company.branches.length > 0 ? company.branches[0] : null;
    setActiveBranchId(firstBranch?.id ?? null);
    if (previousId !== (company?.id ?? null)) queryClient.clear();
  };

  const handleSelectBranch = (branch: Branch) => {
    const previousId = activeBranch?.id ?? null;
    setActiveBranch(branch);
    setActiveBranchId(branch?.id ?? null);
    if (previousId !== (branch?.id ?? null)) queryClient.clear();
  };

  return (
    <>
      <span className="hidden lg:inline-block text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/40 mr-1">
        Contexto
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="group flex items-center gap-2 h-9 px-2 sm:px-3 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/20 text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent/50 hover:border-primary/30 text-sm font-medium transition-all">
            <Building2 className="h-3.5 w-3.5 text-primary/70 group-hover:text-primary shrink-0" aria-hidden="true" />
            <span className="max-w-[110px] sm:max-w-[180px] truncate">{activeCompany?.name || 'Empresa'}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 bg-sidebar border-sidebar-border">
          <DropdownMenuLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">Empresas</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-sidebar-border" />
          {(Array.isArray(companies) ? companies : []).map((company: any) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => handleSelectCompany(company)}
              className={cn('text-sidebar-foreground/80 hover:text-primary focus:text-primary',
                activeCompany?.id === company.id && 'text-primary bg-sidebar-accent')}
            >
              {company.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeCompany && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="group hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg text-sidebar-foreground/60 hover:text-primary hover:bg-sidebar-accent/50 text-sm transition-all">
              <span className="text-sidebar-foreground/40">/</span>
              <span className="max-w-[120px] truncate">{activeBranch?.name || 'Filial'}</span>
              <ChevronDown className="h-3 w-3 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-sidebar border-sidebar-border">
            <DropdownMenuLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">Filiais</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            {(activeCompany.branches || []).map((branch) => (
              <DropdownMenuItem
                key={branch.id}
                onClick={() => handleSelectBranch(branch)}
                className={cn('text-sidebar-foreground/80 hover:text-primary focus:text-primary',
                  activeBranch?.id === branch.id && 'text-primary bg-sidebar-accent')}
              >
                {branch.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
