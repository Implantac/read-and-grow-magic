import { Activity as ActivityIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RecentActivities() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon className="h-5 w-5" />
          Atividades Recentes
        </CardTitle>
        <CardDescription>Últimas ações no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Nenhuma atividade registrada</p>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
