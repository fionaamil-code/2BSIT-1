(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('resetForm'), btn = $('submitBtn'), btnText = $('btnText'), toastEl = $('toast');

  let toastTimer;
  function toast(message, type = 'info') {
    toastEl.textContent = message;
    toastEl.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 5000);
  }

  // A missing or expired token means the form cannot be used.
  function showInvalidLink() {
    form.hidden = true;
    $('invalidPanel').hidden = false;
  }
  // The form only works when the page was opened from a valid reset link.
  btn.disabled = true;
  AuthService.hasRecoverySession()
    .then((valid) => { if (valid) btn.disabled = false; else showInvalidLink(); })
    .catch((err) => { toast(err.message || 'Unable to verify the reset link.', 'error'); });

  // ---- Requirements indicator ----
  const checks = {
    length: (v) => v.length >= 8,
    letter: (v) => /[A-Za-z]/.test(v),
    number: (v) => /\d/.test(v),
  };
  function updateRequirements() {
    const v = $('password').value;
    document.querySelectorAll('[data-req]').forEach((li) => {
      li.classList.toggle('met', checks[li.dataset.req](v));
    });
  }

  function showError(name, message) {
    $(name + 'Error').textContent = message;
    $(name).setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  function validate() {
    const pw = $('password').value, confirm = $('confirmPassword').value;
    let first = null;

    let pwMsg = '';
    if (!pw) pwMsg = 'Enter a new password.';
    else if (!Object.values(checks).every((fn) => fn(pw))) pwMsg = 'Password doesn’t meet all requirements.';
    showError('password', pwMsg);
    if (pwMsg) first = $('password');

    let cMsg = '';
    if (!confirm) cMsg = 'Confirm your new password.';
    else if (confirm !== pw) cMsg = 'Passwords do not match.';
    showError('confirmPassword', cMsg);
    if (cMsg && !first) first = $('confirmPassword');

    if (first) first.focus();
    return !first;
  }

  $('password').addEventListener('input', () => {
    updateRequirements();
    showError('password', '');
    if ($('confirmPassword').value) showError('confirmPassword', '');
  });
  $('confirmPassword').addEventListener('input', () => showError('confirmPassword', ''));

  document.querySelectorAll('[data-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = $(button.dataset.toggle);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.textContent = show ? 'Hide' : 'Show';
      button.setAttribute('aria-pressed', String(show));
    });
  });

  // ---- Request (handled by auth-service.js, which talks to Supabase) ----
  const resetRequest = (payload) => AuthService.updatePassword(payload.password);

  function setLoading(on) {
    btn.disabled = on;
    btn.classList.toggle('loading', on);
    btnText.textContent = on ? 'Saving…' : 'Save new password';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await resetRequest({ password: $('password').value });
      form.hidden = true;
      $('successPanel').hidden = false;
      toast('Password updated. You can now log in.', 'success');
    } catch (err) {
      if (err && err.expired) showInvalidLink();
      else toast((err && err.message) || 'Something went wrong. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  });
})();
