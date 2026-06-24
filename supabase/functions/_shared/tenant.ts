// Shared helpers to enforce multi-tenant isolation and safe error responses
// across edge functions. Use with `requireAuth` from ./require-auth.ts.
//
// Pattern:
//   const auth = await requireAuth(req, { roles: [...] });
//   if (!auth.ok) return jsonError(auth.message, auth.status);
//   const companyId = requireCompany(auth);
//   if (!companyId) return jsonError('Forbidden', 403);
//   await supabase.from('table').select('*').eq('company_id', companyId);

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

export interface CallerWithCompany {
  ok: true;
  companyId: string | null;
  userId: string | null;
}

/** Returns the caller's company_id or null when running via cron */
export function requireCompany(
  auth: { ok: true; companyId: string | null },
): string | null {
  return auth.companyId ?? null;
}

/** 403 if the resolved row does not belong to the caller's tenant */
export function assertSameCompany(
  rowCompanyId: string | null | undefined,
  callerCompanyId: string | null,
): boolean {
  if (!callerCompanyId) return false;
  return rowCompanyId === callerCompanyId;
}

/** Generic client-facing error; logs the original server-side. */
export function safeError(
  err: unknown,
  context: string,
  status = 500,
): Response {
  // Never leak driver/schema details
  console.error(`[${context}]`, err);
  return new Response(
    JSON.stringify({ error: 'Erro interno. Tente novamente.' }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
