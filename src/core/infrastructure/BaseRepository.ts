import { BaseService } from '@/services/shared/baseService';

/**
 * Legacy wrapper for BaseService to maintain compatibility.
 * @deprecated Use BaseService directly or domain services.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class BaseRepository<_T = unknown> extends BaseService<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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



