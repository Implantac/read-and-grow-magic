import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props { onWhatsApp: () => void }

export default function FloatingCTA({ onWhatsApp }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className={cn(
      'fixed bottom-5 right-5 z-50 transition-all duration-500',
      visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-90 pointer-events-none'
    )}>
      <Button
        size="lg"
        className="h-13 w-13 md:w-auto md:h-12 md:px-5 rounded-full shadow-xl shadow-primary/25 gap-2 hover:shadow-2xl hover:scale-105 transition-all duration-300"
        onClick={onWhatsApp}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden md:inline text-sm font-semibold">WhatsApp</span>
      </Button>
    </div>
  );
}
