import { useAtpCheck } from '@/hooks/commercial/useAtpCheck';
import { AtpBadge } from '@/modules/commercial/orders/AtpBadge';

interface Props {
  productId?: string | null;
  quantity: number;
  dueDate?: string | null;
}

export function AtpLineIndicator({ productId, quantity, dueDate }: Props) {
  const { data, isLoading } = useAtpCheck(productId, quantity, dueDate);
  if (!productId || quantity <= 0) return null;
  return <AtpBadge result={data} loading={isLoading} />;
}
