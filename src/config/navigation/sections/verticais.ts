import type { NavSection } from '../types';

export const verticaisSection: NavSection = {
  label: 'Pacotes Verticais',
  items: [
    { title: 'Indústria Têxtil', href: '/vertical/textile', icon: 'Factory' },
    { title: 'Confecção & Moda', href: '/vertical/apparel', icon: 'Scissors' },
    { title: 'Fiação & Fios', href: '/vertical/spinning', icon: 'Repeat' },
    { title: 'Tecelagem', href: '/vertical/weaving', icon: 'Columns' },
    { title: 'Alimentos & Rações', href: '/vertical/food-feed', icon: 'Database' },
    { title: 'Farmacêutico', href: '/vertical/pharma', icon: 'ShieldCheck' },
    { title: 'Distribuição & Atacado', href: '/vertical/distribution', icon: 'Truck' },
    { title: 'Varejo & Redes', href: '/vertical/retail', icon: 'ShoppingBag' },
    { title: 'Franquias', href: '/vertical/franchise', icon: 'Building2' },
    { title: 'Holdings & Grupos', href: '/vertical/holding', icon: 'FolderTree' },
  ],
};
