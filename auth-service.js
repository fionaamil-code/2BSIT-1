// Central auth/API service. Pages call AuthService; only this file talks to Supabase.
(() => {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const REMEMBER_KEY = 'wms_remember';
  const BAD_LOGIN = 'Incorrect username/email or password.';

  // Captured before the Supabase client rewrites the URL (needed to detect reset links).
  const urlAtLoad = { hash: window.location.hash, search: window.location.search };

  const configured = Boolean(
    window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes('YOUR_') && !cfg.SUPABASE_ANON_KEY.includes('YOUR_')
  );

  // "Remember me" off keeps the session in sessionStorage (cleared when the tab closes).
  const pick = () => (localStorage.getItem(REMEMBER_KEY) === 'false' ? sessionStorage : localStorage);
  const storage = {
    getItem: (k) => sessionStorage.getItem(k) ?? localStorage.getItem(k),
    setItem: (k, v) => { const s = pick(); (s === localStorage ? sessionStorage : localStorage).removeItem(k); s.setItem(k, v); },
    removeItem: (k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); },
  };

  const db = configured
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { storage } })
    : null;

  const fail = (message, field) => { throw { message, field }; };
  function client() {
    if (!db) fail('Supabase isn’t configured yet. Add your project URL and anon key to config.js.');
    return db;
  }
  function friendly(error) {
    const msg = (error && error.message) || '';
    if ((error && error.status === 429) || /rate limit/i.test(msg)) return 'Too many attempts. Wait a few minutes and try again.';
    if (/failed to fetch|network/i.test(msg)) return 'Can’t reach the server. Check your connection and try again.';
    return msg || 'Something went wrong. Try again.';
  }

  async function login({ identifier, password, remember }) {
    const c = client();
    localStorage.setItem(REMEMBER_KEY, String(Boolean(remember)));

    let email = identifier;
    if (!identifier.includes('@')) {
      const { data, error } = await c.rpc('get_login_email', { p_identifier: identifier });
      if (error) fail(friendly(error));
      email = data;
    }
    if (!email) fail(BAD_LOGIN);

    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) {
      if (/not confirmed/i.test(error.message)) fail('Confirm your email address first. Check your inbox for the link.');
      fail(error.status === 400 ? BAD_LOGIN : friendly(error));
    }

    const { data: profile, error: profileError } = await c.from('profiles')
      .select('full_name, username, role, status').eq('id', data.user.id).single();
    if (profileError || !profile) {
      await c.auth.signOut();
      fail('Your profile could not be loaded. Contact an administrator.');
    }
    if (profile.status !== 'ACTIVE') {
      await c.auth.signOut();
      fail(profile.status === 'BLOCKED'
        ? 'Your account has been blocked. Contact an administrator.'
        : 'Your account is pending Superadmin approval. You can log in once it is approved.');
    }
    return { user: data.user, profile };
  }

  async function register({ fullName, username, email, password }) {
    const c = client();
    const { data: free, error: freeError } = await c.rpc('username_available', { p_username: username });
    if (freeError) fail(friendly(freeError));
    if (!free) fail('That username is already taken.', 'username');

    // Only name and username are sent. The database trigger sets role = USER and status = PENDING.
    const { data, error } = await c.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, username } },
    });
    if (error) {
      if (/already registered/i.test(error.message)) fail('An account with this email already exists.', 'email');
      fail(friendly(error));
    }
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      fail('An account with this email already exists.', 'email');
    }
    if (data.session) await c.auth.signOut(); // pending users must not stay signed in
    return { status: 'PENDING' };
  }

  async function requestPasswordReset(email) {
    const redirectTo = new URL('reset-password.html', window.location.href).href;
    const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo });
    if (error) fail(friendly(error));
    return { ok: true }; // same result whether or not the account exists
  }

  // True only when the page was opened from a valid password-reset link.
  async function hasRecoverySession() {
    const c = client();
    let recovery = false;
    c.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') recovery = true; });
    const { data } = await c.auth.getSession();
    if (/error=/.test(urlAtLoad.hash) || /error=/.test(urlAtLoad.search)) return false;
    const fromLink = /type=(recovery|invite)/.test(urlAtLoad.hash) || /[?&]code=/.test(urlAtLoad.search);
    return Boolean(data.session) && (recovery || fromLink);
  }

  async function updatePassword(password) {
    const c = client();
    const { error } = await c.auth.updateUser({ password });
    if (error) fail(friendly(error));
    await c.auth.signOut();
    return { ok: true };
  }

  // The signed-in user's profile plus their rights, or null when not signed in / not ACTIVE.
  async function currentUser() {
    const c = client();
    const { data: { session } } = await c.auth.getSession();
    if (!session) return null;
    const { data: profile, error } = await c.from('profiles')
      .select('id, full_name, username, email, role, status').eq('id', session.user.id).single();
    if (error || !profile || profile.status !== 'ACTIVE') { await c.auth.signOut(); return null; }
    let rights = [];
    if (profile.role === 'USER') {
      const { data } = await c.from('user_rights').select('right_code').eq('user_id', profile.id);
      rights = (data || []).map((r) => r.right_code);
    }
    return { profile, rights };
  }
  async function logout() { await client().auth.signOut(); }

  window.AuthService = { db: client, currentUser, logout, isConfigured: configured, login, register, requestPasswordReset, hasRecoverySession, updatePassword };
})();
