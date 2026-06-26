import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') throw new Error('Forbidden: Admin role required');

    // Caller's tenant — used to scope every admin operation.
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();
    const callerCompanyId: string | null = callerProfile?.company_id ?? null;

    const assertSameCompany = async (targetUserId: string) => {
      if (!callerCompanyId) throw new Error('Forbidden');
      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('company_id')
        .eq('id', targetUserId)
        .maybeSingle();
      if (!targetProfile || targetProfile.company_id !== callerCompanyId) {
        throw new Error('Forbidden');
      }
    };

    const body = await req.json().catch(() => ({}));
    const { action, ...params } = (body ?? {}) as Record<string, unknown>;

    const ALLOWED_ACTIONS = new Set(['list', 'invite', 'delete', 'change_role', 'toggle_ban', 'reset_password']);
    if (typeof action !== 'string' || !ALLOWED_ACTIONS.has(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    const isEmail = (v: unknown): v is string => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
    const ALLOWED_ROLES = new Set(['admin', 'manager', 'operator', 'viewer']);
    const validationError = (msg: string) => new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    if (action === 'list') {
      let profilesQuery = supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (callerCompanyId) profilesQuery = profilesQuery.eq('company_id', callerCompanyId);
      const { data: profiles } = await profilesQuery;

      const profileIds = (profiles || []).map((p: any) => p.id);
      const { data: roles } = profileIds.length
        ? await supabaseAdmin.from('user_roles').select('*').in('user_id', profileIds)
        : { data: [] as any[] };

      const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });

      const usersWithRoles = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const authUser = authUsers?.find(u => u.id === profile.id);
        const isBanned = authUser?.banned_until && new Date(authUser.banned_until) > new Date();
        const status = isBanned
          ? 'blocked'
          : authUser?.email_confirmed_at
            ? 'active'
            : 'pending';

        return {
          ...profile,
          role: userRole?.role || 'viewer',
          user_role_id: userRole?.id,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          email_confirmed_at: authUser?.email_confirmed_at || null,
          banned_until: authUser?.banned_until || null,
          status,
        };
      });

      return new Response(JSON.stringify({ data: usersWithRoles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'invite') {
      const { email, name, role = 'viewer', phone, department, branch_id } = params as any;
      if (!isEmail(email)) return validationError('Valid email is required');
      if (typeof role !== 'string' || !ALLOWED_ROLES.has(role)) return validationError('Invalid role');
      if (name !== undefined && (typeof name !== 'string' || name.length > 120)) return validationError('Invalid name');
      if (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.length > 32)) return validationError('Invalid phone');
      if (department !== undefined && department !== null && (typeof department !== 'string' || department.length > 120)) return validationError('Invalid department');
      if (branch_id !== undefined && branch_id !== null && !isUuid(branch_id)) return validationError('Invalid branch_id');

      const origin = req.headers.get('origin') || Deno.env.get('SITE_URL') || '';

      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          name: name || '',
          phone: phone || '',
          department: department || '',
          branch_id: branch_id || null
        },
        redirectTo: `${origin}/login`,
      });
      if (error) throw error;

      if (data.user && callerCompanyId) {
        await supabaseAdmin
          .from('profiles')
          .update({ company_id: callerCompanyId })
          .eq('id', data.user.id);
      }

      if (role !== 'viewer' && data.user) {
        await supabaseAdmin
          .from('user_roles')
          .update({ role })
          .eq('user_id', data.user.id);
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const { user_id } = params as any;
      if (!isUuid(user_id)) return validationError('Invalid user_id');
      if (user_id === user.id) throw new Error('Cannot delete your own account');
      await assertSameCompany(user_id);

      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'change_role') {
      const { user_id, role, phone, department, branch_id } = params as any;
      if (!isUuid(user_id)) return validationError('Invalid user_id');
      if (role !== undefined && (typeof role !== 'string' || !ALLOWED_ROLES.has(role))) return validationError('Invalid role');
      if (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.length > 32)) return validationError('Invalid phone');
      if (department !== undefined && department !== null && (typeof department !== 'string' || department.length > 120)) return validationError('Invalid department');
      if (branch_id !== undefined && branch_id !== null && !isUuid(branch_id)) return validationError('Invalid branch_id');
      if (user_id === user.id && role) throw new Error('Cannot change your own role');
      await assertSameCompany(user_id);

      if (role) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .update({ role })
          .eq('user_id', user_id);
        if (roleError) throw roleError;
      }

      const profileUpdates: any = {};
      if (phone !== undefined) profileUpdates.phone = phone;
      if (department !== undefined) profileUpdates.department = department;
      if (branch_id !== undefined) profileUpdates.branch_id = branch_id;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user_id);
        if (profileError) throw profileError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'toggle_ban') {
      const { user_id, banned } = params as any;
      if (!isUuid(user_id)) return validationError('Invalid user_id');
      if (typeof banned !== 'boolean') return validationError('banned must be boolean');
      if (user_id === user.id) throw new Error('Cannot ban your own account');
      await assertSameCompany(user_id);

      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: banned ? '87600h' : 'none',
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    if (action === 'reset_password') {
      const { email } = params as any;
      if (!isEmail(email)) return validationError('Valid email is required');
      const origin = req.headers.get('origin') || Deno.env.get('SITE_URL') || '';

      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    throw new Error('Invalid action');
  } catch (error) {
    console.error('admin-users error:', error);
    const msg = (error as Error).message;
    // Preserve safe known validation messages, otherwise return generic
    const safe = msg === 'Invalid action' || msg === 'Forbidden' || msg === 'Unauthorized' ? msg : 'An internal error occurred. Please try again.';
    return new Response(JSON.stringify({ error: safe }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
