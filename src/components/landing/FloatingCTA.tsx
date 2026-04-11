import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface Props { onWhatsApp: () => void }

export default function FloatingCTA({ onWhatsApp }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="lg"
        className="h-14 w-14 md:w-auto md:px-6 rounded-full shadow-2xl shadow-primary/30 gap-2 animate-bounce hover:animate-none"
        onClick={onWhatsApp}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="hidden md:inline font-semibold">WhatsApp</span>
      </Button>
    </div>
  );
}
