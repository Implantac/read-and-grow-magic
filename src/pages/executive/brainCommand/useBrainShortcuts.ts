import { useEffect, RefObject } from 'react';
import { toast } from 'sonner';

export function useBrainShortcuts(
  textareaRef: RefObject<HTMLTextAreaElement>,
  clear: () => void,
  setInput: (v: string) => void,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (e.key === '/' && !inField) {
        e.preventDefault();
        textareaRef.current?.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        clear();
        toast.success('Conversa limpa');
      } else if (e.key === 'Escape' && document.activeElement === textareaRef.current) {
        setInput('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clear, setInput, textareaRef]);
}
