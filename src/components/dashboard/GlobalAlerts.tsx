import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  module: string;
  message: string;
  timestamp: string;
}

interface GlobalAlertsProps {
  alerts: GlobalAlert[];
}

const alertIcons = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const alertColors = {
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  info: 'bg-info/10 text-info border-info/20',
  success: 'bg-success/10 text-success border-success/20',
};

export function GlobalAlerts({ alerts }: GlobalAlertsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4" />
          Alertas do Sistema
          {alerts.filter(a => a.type === 'error' || a.type === 'warning').length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {alerts.filter(a => a.type === 'error' || a.type === 'warning').length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = alertIcons[alert.type];
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3",
                    alertColors[alert.type]
                  )}
                >
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {alert.module}
                      </Badge>
                      <span className="text-xs opacity-70">{alert.timestamp}</span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
