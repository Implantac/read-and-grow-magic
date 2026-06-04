import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { Brain, Cpu, ShieldCheck, Scale, BarChart3, Factory, Warehouse, Search, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const specialists = [
  { role: 'CTO Global', icon: Cpu, color: 'text-blue-500' },
  { role: 'Arquiteto SAP S/4HANA', icon: BarChart3, color: 'text-orange-500' },
  { role: 'Especialista PCP/MRP/APS', icon: Factory, color: 'text-purple-500' },
  { role: 'Especialista WMS/TMS', icon: Warehouse, color: 'text-green-500' },
  { role: 'Especialista Fiscal Brasileiro', icon: Scale, color: 'text-red-500' },
  { role: 'Especialista IA Empresarial', icon: Brain, color: 'text-pink-500' },
  { role: 'Especialista UX Enterprise', icon: Search, color: 'text-yellow-500' },
  { role: 'Especialista Financeiro', icon: DollarSign, color: 'text-emerald-500' },
];

export function ExecutiveCouncilPanel() {
  const { executiveCouncil, segment } = useEnterprise();

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Conselho Executivo EEE</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">
            Arquitetura Enterprise Ativa
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {specialists.map((specialist) => {
            const Icon = specialist.icon;
            return (
              <div 
                key={specialist.role} 
                className="flex flex-col items-center text-center p-2 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all cursor-default group"
              >
                <div className={cn("mb-2 p-1.5 rounded-full bg-background ring-1 ring-border group-hover:ring-primary/30 transition-all", specialist.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-bold leading-tight uppercase opacity-70 group-hover:opacity-100 transition-opacity">
                  {specialist.role}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-2 rounded bg-primary/10 border border-primary/10 flex items-center justify-center gap-3">
          <p className="text-[10px] font-medium text-primary/80 italic text-center">
            "{executiveCouncil?.mission || 'Plataforma ERP Enterprise de próxima geração.'}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
