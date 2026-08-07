import type { NavSection } from '../types';

export const logisticaSection: NavSection = {
  label: 'Supply Chain & WMS',
  items: [
    {
      title: 'WMS Avançado',
      href: '/wms',
      icon: 'Warehouse',
      children: [
        { title: 'Dashboard WMS', href: '/wms/dashboard', icon: 'LayoutDashboard' },
        { title: 'Matriz Multi-Loja', href: '/wms/matriz-estoque', icon: 'LayoutGrid' },
        { title: 'Recebimento & Put-away', href: '/wms/recebimento', icon: 'PackagePlus' },
        { title: 'Picking & Ondas', href: '/wms/separacao', icon: 'PackageSearch' },
        { title: 'Packing & Conferência', href: '/wms/embalagem', icon: 'PackageCheck' },
        { title: 'Docas & Yard', href: '/wms/docas', icon: 'DoorOpen' },
        { title: 'Reabastecimento', href: '/wms/ressuprimento', icon: 'RefreshCw' },
        { title: 'IA WMS / Slotting', href: '/wms/ia', icon: 'Brain' },
      ],
    },
    {
      title: 'TMS - Transportes',
      href: '/tms',
      icon: 'Truck',
      children: [
        { title: 'Gestão de Frotas', href: '/tms/veiculos', icon: 'Truck' },
        { title: 'Rotas & Last Mile', href: '/tms/rotas', icon: 'MapPin' },
        { title: 'Rastreamento Live', href: '/tms/live', icon: 'Navigation' },
      ],
    },
    {
      title: 'RFID & IoT',
      href: '/rfid',
      icon: 'Radio',
      children: [
        { title: 'Status Leitores', href: '/rfid/leitores', icon: 'Wifi' },
        { title: 'Monitor de Tags', href: '/rfid/tags', icon: 'Tag' },
      ],
    },
  ],
};
