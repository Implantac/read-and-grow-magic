import { BaseService } from '@/services/shared/baseService';

/**
 * Legacy wrapper for BaseService to maintain compatibility.
 * @deprecated Use BaseService directly or domain services.
 */
export class BaseRepository<T extends any> extends BaseService<any> {
  constructor(tableName: any) {
    super(tableName);
  }

  async getAllCompat(companyId?: string) {
    return super.getAll({ filters: companyId ? { company_id: companyId } : undefined });
  }

  // Compatibility for older code expecting .then() on query directly
  async getAllLegacy(companyId?: string) {
    const data = await this.getAllCompat(companyId);
    return { data, error: null };
  }
}



