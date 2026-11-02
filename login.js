(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('loginForm'), idInput = $('identifier'), pwInput = $('password');
  const btn = $('submitBtn'), btnText = $('btnText'), toastEl = $('toast');

  // ---- Toast ----
  let toastTimer;
  function toast(message, type = 'info') {
    toastEl.textContent = message;
    toastEl.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4000);
  }

  // ---- Validation ----
  function setError(input, errorEl, message) {
    errorEl.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  function validate() {
    const id = idInput.value.trim(), pw = pwInput.value;
    let firstInvalid = null;

    let idMsg = '';
    if (!id) idMsg = 'Enter your username or email.';
    else if (id.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) idMsg = 'Enter a valid email address.';
    setError(idInput, $('identifierError'), idMsg);
    if (idMsg) firstInvalid = idInput;

    let pwMsg = '';
    if (!pw) pwMsg = 'Enter your password.';
    else if (pw.length < 8) pwMsg = 'Password must be at least 8 characters.';
    setError(pwInput, $('passwordError'), pwMsg);
    if (pwMsg && !firstInvalid) firstInvalid = pwInput;

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }
  idInput.addEventListener('input', () => setError(idInput, $('identifierError'), ''));
  pwInput.addEventListener('input', () => setError(pwInput, $('passwordError'), ''));

  // ---- Password visibility ----
  $('togglePw').addEventListener('click', (e) => {
    const show = pwInput.type === 'password';
    pwInput.type = show ? 'text' : 'password';
    e.currentTarget.textContent = show ? 'Hide' : 'Show';
    e.currentTarget.setAttribute('aria-pressed', String(show));
  });

  // ---- Auth request (handled by auth-service.js, which talks to Supabase) ----
  const loginRequest = (payload) => AuthService.login(payload);

  function setLoading(on) {
    btn.disabled = on;
    btn.classList.toggle('loading', on);
    btnText.textContent = on ? 'Logging in…' : 'Log in';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await loginRequest({
        identifier: idInput.value.trim(),
        password: pwInput.value,
        remember: $('remember').checked,
      });
      toast('Login successful. Redirecting…', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    } catch (err) {
      toast(err.message || 'Something went wrong. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  });

})();
