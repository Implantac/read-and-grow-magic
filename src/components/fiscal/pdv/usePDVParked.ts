import { useCallback, useState } from 'react';
import { loadParked, removeParked, type ParkedSale } from '../pdvParkedStorage';

export function usePDVParked() {
  const [parkedList, setParkedList] = useState<ParkedSale[]>(() => loadParked());
  const [showParked, setShowParked] = useState(false);
  const refreshParked = useCallback(() => setParkedList(loadParked()), []);
  const discardParked = (id: string) => { removeParked(id); refreshParked(); };
  return { parkedList, refreshParked, showParked, setShowParked, discardParked };
}
