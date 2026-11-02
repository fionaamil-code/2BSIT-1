// Edge Function: admin-create-user
// Lets an Admin or Superadmin add a person. The person gets an email invite and sets their own password.
// Needs the service-role key, which only exists on the server (Supabase provides it to functions automatically).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'NOT_ALLOWED' }, 401);

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: me } = await admin.from('profiles').select('role, status').eq('id', user.id).single();
    if (!me || me.status !== 'ACTIVE' || !['ADMIN', 'SUPERADMIN'].includes(me.role)) return json({ error: 'NOT_ALLOWED' }, 403);

    const b = await req.json();
    const firstName = String(b.firstName ?? '').trim(), lastName = String(b.lastName ?? '').trim();
    const email = String(b.email ?? '').trim().toLowerCase();
    if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'BAD_INPUT' }, 400);
    // Only a Superadmin can designate an Admin. Nobody can create a Superadmin here.
    const role = b.role === 'ADMIN' && me.role === 'SUPERADMIN' ? 'ADMIN' : 'USER';

    // Username: made from the email name, made unique with a number if needed.
    let base = email.split('@')[0].replace(/[^A-Za-z0-9_]/g, '').slice(0, 16);
    if (base.length < 3) base = (base + 'user').slice(0, 16);
    let username = base;
    for (let i = 2; i < 100; i++) {
      const { data: hit } = await admin.from('profiles').select('id').ilike('username', username).maybeSingle();
      if (!hit) break;
      username = `${base}${i}`;
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: typeof b.redirectTo === 'string' ? b.redirectTo : undefined,
      data: { full_name: `${firstName} ${lastName}`, username },
    });
    if (error || !data.user) {
      return json({ error: /already|registered|exists/i.test(error?.message ?? '') ? 'EMAIL_TAKEN' : (error?.message ?? 'Unable to create the account.') }, 400);
    }
    // The sign-up trigger made a PENDING User row. Accounts added by staff are approved straight away.
    await admin.from('profiles').update({ status: 'ACTIVE', role }).eq('id', data.user.id);
    await admin.from('audit_log').insert({ actor_id: user.id, action: 'ADD_USER', target_id: data.user.id, detail: { role } });
    return json({ ok: true });
  } catch (_e) {
    return json({ error: 'Unable to create the account.' }, 500);
  }
});
