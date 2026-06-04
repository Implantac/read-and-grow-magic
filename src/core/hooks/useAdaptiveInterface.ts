import { useEnterpriseStore } from '../stores/useEnterpriseStore';

export const useAdaptiveInterface = () => {
  const { config } = useEnterpriseStore();

  const getVisibleModules = () => {
    if (!config) return ['dashboard', 'admin'];

    const baseModules = ['dashboard', 'finance', 'commercial', 'admin'];

    switch (config.segment) {
      case 'textile':
        return [...baseModules, 'production', 'inventory', 'wms', 'textile-pack'];
      case 'pharma':
        return [...baseModules, 'production', 'inventory', 'quality', 'pharma-pack'];
      case 'distribution':
        return [...baseModules, 'inventory', 'wms', 'tms'];
      default:
        return baseModules;
    }
  };

  return {
    visibleModules: getVisibleModules(),
    isSegment: (segment: string) => config?.segment === segment,
  };
};
