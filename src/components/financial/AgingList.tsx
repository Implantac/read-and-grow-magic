import { Card, CardContent } from '@/ui/base/card';
import { FileText } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { formatBRL } from '@/lib/formatters';
import { AccountReceivable } from '@/types/financial';

interface Props {
  accounts: AccountReceivable[];
}

export function AgingList({ accounts }: Props) {
  const now = new Date();
  const overdueItems = accounts.filter(a => 
    a.status !== 'paid' && 
    a.status !== 'cancelled' && 
    new Date(a.due_date) < now
  );

  const totalOverdue = overdueItems.reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0);
  
  if (totalOverdue <= 0) return null;

  const buckets = [
    { label: '1-7d', min: 1, max: 7, className: 'bg-warning/60' },
    { label: '8-15d', min: 8, max: 15, className: 'bg-warning' },
    { label: '16-30d', min: 16, max: 30, className: 'bg-orange-500' },
    { label: '31-60d', min: 31, max: 60, className: 'bg-destructive/70' },
    { label: '+60d', min: 61, max: 9999, className: 'bg-destructive' },
  ];

  const bucketData = buckets.map(b => {
    const items = overdueItems.filter(a => { 
      const d = differenceInDays(now, new Date(a.due_date)); 
      return d >= b.min && d <= b.max; 
    });
    return { ...b, value: items.reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0), count: items.length };
  }).filter(b => b.value > 0);

  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Aging List
          </p>
          <p className="text-sm font-bold text-destructive">{formatBRL(totalOverdue)}</p>
        </div>
        <div className="flex h-5 w-full rounded-full overflow-hidden">
          {bucketData.map((b, i) => (
            <div 
              key={i} 
              className={`${b.className} relative group`} 
              style={{ width: `${(b.value / totalOverdue) * 100}%` }} 
              title={`${b.label}: ${formatBRL(b.value)} (${b.count} títulos)`}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {b.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-1.5 flex-wrap">
          {bucketData.map((b, i) => (
            <span key={i} className="text-[10px] text-muted-foreground">
              {b.label}: {formatBRL(b.value)} ({b.count})
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
