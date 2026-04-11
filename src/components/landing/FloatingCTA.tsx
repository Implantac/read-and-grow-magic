import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props { onWhatsApp: () => void }

export default function FloatingCTA({ onWhatsApp }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 transition-all duration-300',
      visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
    )}>
      <Button
        size="lg"
        className="h-14 w-14 md:w-auto md:px-6 rounded-full shadow-elevation-4 gap-2 hover:shadow-glow hover:scale-105 transition-all duration-300"
        onClick={onWhatsApp}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="hidden md:inline font-semibold">WhatsApp</span>
      </Button>
    </div>
  );
}
