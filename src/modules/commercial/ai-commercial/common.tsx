import { Card, CardContent } from '@/ui/base/card';
import { Skeleton } from '@/ui/base/skeleton';
import { Users } from 'lucide-react';

export function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, message }: { icon: typeof Users; message: string }) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Icon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
