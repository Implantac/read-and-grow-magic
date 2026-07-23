import { Phone, MapPin, FileText, ShoppingCart, StickyNote, Clock, AlertTriangle, Handshake, RotateCcw, Star, TrendingUp, Target } from 'lucide-react';

export const EVENT_ICONS: Record<string, React.ReactNode> = {
  contact: <Phone className="h-3.5 w-3.5" />,
  visit: <MapPin className="h-3.5 w-3.5" />,
  negotiation: <Handshake className="h-3.5 w-3.5" />,
  proposal: <FileText className="h-3.5 w-3.5" />,
  order: <ShoppingCart className="h-3.5 w-3.5" />,
  return: <RotateCcw className="h-3.5 w-3.5" />,
  issue: <AlertTriangle className="h-3.5 w-3.5" />,
  note: <StickyNote className="h-3.5 w-3.5" />,
  followup: <Clock className="h-3.5 w-3.5" />,
};

export const SCORE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  high: { label: 'Alto Potencial', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <Star className="h-3 w-3" /> },
  medium: { label: 'Médio', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <TrendingUp className="h-3 w-3" /> },
  low: { label: 'Baixo', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: <Target className="h-3 w-3" /> },
};
