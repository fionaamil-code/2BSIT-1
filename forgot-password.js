(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('forgotForm'), emailInput = $('email');
  const btn = $('submitBtn'), btnText = $('btnText'), toastEl = $('toast');

  let toastTimer;
  function toast(message, type = 'info') {
    toastEl.textContent = message;
    toastEl.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 5000);
  }

  function showError(message) {
    $('emailError').textContent = message;
    emailInput.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  function validate() {
    const v = emailInput.value.trim();
    let message = '';
    if (!v) message = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) message = 'Enter a valid email address.';
    showError(message);
    if (message) emailInput.focus();
    return !message;
  }
  emailInput.addEventListener('input', () => showError(''));

  // ---- Request (handled by auth-service.js, which talks to Supabase) ----
  const forgotRequest = (email) => AuthService.requestPasswordReset(email);

  function setLoading(on) {
    btn.disabled = on;
    btn.classList.toggle('loading', on);
    btnText.textContent = on ? 'Sending…' : 'Send reset link';
  }

  async function send(isResend) {
    setLoading(true);
    $('resendBtn').disabled = true;
    try {
      const email = emailInput.value.trim();
      await forgotRequest(email);
      $('sentTo').textContent = email;
      form.hidden = true;
      $('successPanel').hidden = false;
      toast(isResend ? 'Reset link sent again.' : 'Reset link sent. Check your email.', 'success');
    } catch (err) {
      toast(err.message || 'Something went wrong. Try again.', 'error');
    } finally {
      setLoading(false);
      $('resendBtn').disabled = false;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validate()) send(false);
  });
  $('resendBtn').addEventListener('click', () => send(true));
})();
