import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { cn } from '@/lib/utils';
import { MapPin, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/base/tooltip';

interface ZoneData {
  zone: string;
  occupancy: number;
  totalLocations: number;
  type: string;
}

interface WarehouseMapProps {
  zones: ZoneData[];
  onZoneClick?: (zone: string) => void;
  selectedZone?: string | null;
  className?: string;
}

export function WarehouseMap({ zones, onZoneClick, selectedZone, className }: WarehouseMapProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Mapa Interativo do Armazém
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Clique em uma zona para ver detalhes ou filtrar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-[2/1] bg-muted/30 rounded-lg border-2 border-dashed border-muted p-4">
          <div className="grid grid-cols-4 grid-rows-2 gap-4 h-full">
            {zones.map((zoneData) => {
              const isSelected = selectedZone === zoneData.zone;
              const { occupancy } = zoneData;
              
              // Color based on occupancy
              const bgColor = occupancy > 90 
                ? 'bg-destructive/20 border-destructive/50' 
                : occupancy > 70 
                ? 'bg-orange-500/20 border-orange-500/50' 
                : 'bg-green-500/20 border-green-500/50';
                
              const indicatorColor = occupancy > 90 
                ? 'bg-destructive' 
                : occupancy > 70 
                ? 'bg-orange-500' 
                : 'bg-green-500';

              return (
                <button
                  key={zoneData.zone}
                  onClick={() => onZoneClick?.(zoneData.zone)}
                  className={cn(
                    "relative rounded-md border-2 transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1 group",
                    bgColor,
                    isSelected && "ring-2 ring-primary ring-offset-2 scale-[1.02] z-10"
                  )}
                >
                  <span className="text-xl font-bold font-mono group-hover:text-primary transition-colors">
                    {zoneData.zone}
                  </span>
                  <div className="w-4/5 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-500", indicatorColor)} 
                      style={{ width: `${occupancy}%` }} 
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {occupancy}% Ocupado
                  </span>
                  
                  {/* Status Indicator Dot */}
                  <div className={cn(
                    "absolute top-1 right-1 h-2 w-2 rounded-full",
                    indicatorColor
                  )} />
                </button>
              );
            })}
          </div>
          
          {/* Warehouse Features Labels */}
          <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
            <span>Docas de Recebimento</span>
            <span>Área de Expedição</span>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-green-500/20 border border-green-500/50" />
            <span className="text-[10px] text-muted-foreground">Ocupação Baixa</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-orange-500/20 border border-orange-500/50" />
            <span className="text-[10px] text-muted-foreground">Ocupação Média</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-destructive/20 border border-destructive/50" />
            <span className="text-[10px] text-muted-foreground">Ocupação Alta</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
