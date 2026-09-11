import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const tenantAEmail = process.env.E2E_TENANT_A_EMAIL;
const tenantAPassword = process.env.E2E_TENANT_A_PASSWORD;
const tenantBEmail = process.env.E2E_TENANT_B_EMAIL;
const tenantBPassword = process.env.E2E_TENANT_B_PASSWORD;

function required(name: string, value?: string): string {
  if (!value) throw new Error(`${name} é obrigatório para o teste real de isolamento`);
  return value;
}

async function authenticatedClient(email: string, password: string) {
  const client = createClient(required('VITE_SUPABASE_URL', url), required('VITE_SUPABASE_PUBLISHABLE_KEY', anonKey), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  expect(error, `Falha ao autenticar ${email}`).toBeNull();
  expect(data.user).not.toBeNull();
  return client;
}

test.describe('Segurança - Isolamento de Tenant', () => {
  test('empresa B não lê filiais nem produtos da empresa A', async () => {
    const clientA = await authenticatedClient(
      required('E2E_TENANT_A_EMAIL', tenantAEmail),
      required('E2E_TENANT_A_PASSWORD', tenantAPassword),
    );
    const clientB = await authenticatedClient(
      required('E2E_TENANT_B_EMAIL', tenantBEmail),
      required('E2E_TENANT_B_PASSWORD', tenantBPassword),
    );

    const { data: profileA, error: profileError } = await clientA
      .from('profiles')
      .select('company_id')
      .single();
    expect(profileError).toBeNull();
    expect(profileA?.company_id).toBeTruthy();

    const companyA = required('company_id da empresa A', profileA?.company_id ?? undefined);
    const [branches, products] = await Promise.all([
      clientB.from('branches').select('id, company_id').eq('company_id', companyA),
      clientB.from('products').select('id, company_id').eq('company_id', companyA),
    ]);

    expect(branches.error).toBeNull();
    expect(products.error).toBeNull();
    expect(branches.data).toEqual([]);
    expect(products.data).toEqual([]);

    await Promise.all([clientA.auth.signOut(), clientB.auth.signOut()]);
  });
});
