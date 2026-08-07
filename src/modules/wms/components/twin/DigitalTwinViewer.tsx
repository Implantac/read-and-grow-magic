import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Box, Layers, Activity, Maximize2 } from 'lucide-react';

export default function DigitalTwinViewer() {
  return (
    <Card className="border-none bg-accent/20 overflow-hidden relative min-h-[500px] group">
      {/* Background Grid - Warehouse Layout */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-2 p-8 opacity-20 pointer-events-none">
        {Array.from({ length: 72 }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "rounded-sm border border-primary/20 transition-all duration-700",
              i % 7 === 0 ? "bg-red-500/40 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]" : 
              i % 5 === 0 ? "bg-primary/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]" : 
              "bg-muted/10"
            )} 
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-6 z-10 bg-background/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl transition-transform group-hover:scale-105">
          <div className="relative">
            <Layers className="h-20 w-20 text-primary mx-auto opacity-80 animate-bounce" />
            <div className="absolute -top-2 -right-2">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-black tracking-tighter uppercase">Digital Twin Engine</h3>
            <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
              Simulação 3D de alta fidelidade integrada a sensores IoT em tempo real.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="default" className="gap-2 font-bold shadow-lg shadow-primary/20">
              <Maximize2 className="h-4 w-4" /> Expandir Visualização 3D
            </Button>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Latency: 12ms | V-Sync Active</p>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Badge variant="outline" className="bg-background/80 backdrop-blur border-primary/20 text-xs py-1">
          <Activity className="h-3 w-3 mr-2 text-green-500" /> LIVE TELEMETRY
        </Badge>
      </div>

      <div className="absolute bottom-6 left-6 flex gap-4">
        <div className="flex flex-col gap-1 bg-background/80 backdrop-blur p-3 rounded-lg border border-primary/10 shadow-xl">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Capacidade Total</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[84%]" />
            </div>
            <span className="text-xs font-black">84%</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-1 bg-background/80 backdrop-blur p-3 rounded-lg border border-primary/10 shadow-xl">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Temp. Média</span>
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-amber-500" />
            <span className="text-xs font-black">22.4°C</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

import { Button } from '@/ui/base/button';
