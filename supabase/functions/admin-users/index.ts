import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const body = await req.json();
    const { action, ...params } = body;

    if (action === 'list') {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('*');

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
      const { email, name, role = 'viewer', phone, department, branch_id } = params;
      if (!email) throw new Error('Email is required');

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

      // Update role if not viewer (trigger creates viewer by default for non-first users)
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
      const { user_id } = params;
      if (user_id === user.id) throw new Error('Cannot delete your own account');

      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'change_role') {
      const { user_id, role, phone, department, branch_id } = params;
      if (user_id === user.id && role) throw new Error('Cannot change your own role');

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
      const { user_id, banned } = params;
      if (user_id === user.id) throw new Error('Cannot ban your own account');

      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: banned ? '87600h' : 'none',
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reset_password') {
      const { email } = params;
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
