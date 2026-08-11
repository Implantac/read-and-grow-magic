import { supabase } from '@/integrations/supabase/client';
const dynamicTable = (table) => supabase.from(table);
/**
 * Base Service with generic CRUD operations, typed by table name.
 */
export class BaseService {
    tableName;
    constructor(tableName) {
        this.tableName = tableName;
    }
    async getAll(options = {}) {
        const { orderBy = 'created_at', ascending = false, limit = 1000, filters } = options;
        let query = dynamicTable(this.tableName).select('*');
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query = query.eq(key, value);
                }
            });
        }
        query = query.order(orderBy, { ascending });
        if (limit)
            query = query.limit(limit);
        const { data, error } = (await query);
        if (error)
            throw error;
        return (data || []);
    }
    async getById(id) {
        const { data, error } = await dynamicTable(this.tableName)
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return (data ?? null);
    }
    async create(item) {
        const { data, error } = await dynamicTable(this.tableName)
            .insert(item)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async update(id, updates) {
        const payload = { ...updates, updated_at: new Date().toISOString() };
        const { data, error } = await dynamicTable(this.tableName)
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async delete(id) {
        const { error } = await dynamicTable(this.tableName)
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
}
