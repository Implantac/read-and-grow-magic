import React, { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/base/tooltip";
import { Info } from 'lucide-react';
import { Badge } from '@/ui/base/badge';

interface MicroOnboardingProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export const MicroOnboarding: React.FC<MicroOnboardingProps> = ({ 
  id, 
  title, 
  description, 
  children,
  position = "top"
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(`onboarding_${id}`);
    if (!hasSeen) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [id]);

  const handleDismiss = () => {
    localStorage.setItem(`onboarding_${id}`, 'true');
    setShow(false);
  };

  return (
    <TooltipProvider>
      <Tooltip open={show}>
        <TooltipTrigger asChild>
          <div className="relative inline-block w-full">
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={position} 
          className="p-4 max-w-[280px] bg-primary border-primary text-primary-foreground shadow-xl z-[100]"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <p className="font-bold text-sm uppercase tracking-wider">{title}</p>
            </div>
            <p className="text-xs leading-relaxed opacity-90">{description}</p>
            <div className="pt-2 flex justify-between items-center">
              <Badge variant="outline" className="text-[9px] border-primary-foreground/30 text-primary-foreground/70">Dica do Autopilot</Badge>
              <button 
                onClick={handleDismiss}
                className="text-[10px] font-bold underline hover:no-underline"
              >
                Entendi
              </button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
