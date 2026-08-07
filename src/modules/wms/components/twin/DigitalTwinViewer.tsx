import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Box, Layers, Activity, Maximize2 } from 'lucide-react';

export default function DigitalTwinViewer() {
  return (
    <Card className="border-none bg-accent/20 overflow-hidden relative min-h-[400px]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4 z-10">
          <Layers className="h-16 w-16 text-primary mx-auto opacity-20 animate-pulse" />
          <div>
            <p className="text-lg font-bold">Digital Twin (Simulação 3D)</p>
            <p className="text-sm text-muted-foreground">Monitoramento de calor e fluxo em tempo real</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Maximize2 className="h-4 w-4" /> Abrir Tela Cheia
          </Button>
        </div>
        
        {/* Mock representation of warehouse grid */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-2 p-8 opacity-10">
          {Array.from({ length: 72 }).map((_, i) => (
            <div 
              key={i} 
              className={`rounded-sm border border-primary/20 ${
                Math.random() > 0.8 ? 'bg-red-500' : Math.random() > 0.5 ? 'bg-primary' : ''
              }`} 
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex gap-4">
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border text-[10px] font-bold">
          <Activity className="h-3 w-3 text-green-500" /> OCUPAÇÃO: 84%
        </div>
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border text-[10px] font-bold">
          <Activity className="h-3 w-3 text-amber-500" /> TEMPERATURA: 22°C
        </div>
      </div>
    </Card>
  );
}

import { Button } from '@/ui/base/button';
