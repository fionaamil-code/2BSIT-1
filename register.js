(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('registerForm');
  const btn = $('submitBtn'), btnText = $('btnText'), toastEl = $('toast');

  // ---- Toast ----
  let toastTimer;
  function toast(message, type = 'info') {
    toastEl.textContent = message;
    toastEl.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 5000);
  }

  // ---- Validation ----
  const rules = {
    fullName: (v) => {
      if (!v) return 'Enter your full name.';
      if (v.length < 2) return 'Full name must be at least 2 characters.';
      return '';
    },
    username: (v) => {
      if (!v) return 'Enter a username.';
      if (!/^[A-Za-z0-9_]{3,20}$/.test(v)) return 'Use 3–20 letters, numbers, or underscores.';
      return '';
    },
    email: (v) => {
      if (!v) return 'Enter your email address.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
      return '';
    },
    password: (v) => {
      if (!v) return 'Enter a password.';
      if (v.length < 8) return 'Password must be at least 8 characters.';
      if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Password must include a letter and a number.';
      return '';
    },
    confirmPassword: (v) => {
      if (!v) return 'Confirm your password.';
      if (v !== $('password').value) return 'Passwords do not match.';
      return '';
    },
  };
  const fieldNames = Object.keys(rules);
  const trimmed = new Set(['fullName', 'username', 'email']);
  const getValue = (name) => (trimmed.has(name) ? $(name).value.trim() : $(name).value);

  function showError(name, message) {
    $(name + 'Error').textContent = message;
    $(name).setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  function validateField(name) {
    const message = rules[name](getValue(name));
    showError(name, message);
    return !message;
  }
  function validateAll() {
    let firstInvalid = null;
    fieldNames.forEach((name) => {
      if (!validateField(name) && !firstInvalid) firstInvalid = $(name);
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  fieldNames.forEach((name) => {
    $(name).addEventListener('input', () => {
      showError(name, '');
      // Keep the confirmation message current if the password changes after it was filled.
      if (name === 'password' && $('confirmPassword').value) validateField('confirmPassword');
    });
    $(name).addEventListener('blur', () => { if ($(name).value) validateField(name); });
  });

  // ---- Show / hide password (both fields) ----
  document.querySelectorAll('[data-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = $(button.dataset.toggle);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.textContent = show ? 'Hide' : 'Show';
      button.setAttribute('aria-pressed', String(show));
    });
  });

  // ---- Registration request (handled by auth-service.js, which talks to Supabase) ----
  const registerRequest = (payload) => AuthService.register(payload);

  function setLoading(on) {
    btn.disabled = on;
    btn.classList.toggle('loading', on);
    btnText.textContent = on ? 'Registering…' : 'Register';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);
    try {
      const result = await registerRequest({
        fullName: getValue('fullName'),
        username: getValue('username'),
        email: getValue('email'),
        password: getValue('password'),
        // confirmPassword, role and status are intentionally not sent.
      });
      $('statusBadge').textContent = 'Status: ' + (result.status || 'PENDING');
      form.hidden = true;
      $('successPanel').hidden = false;
      toast('Registration submitted. Your account needs Superadmin approval before you can log in.', 'success');
    } catch (err) {
      if (err && err.field && $(err.field)) {
        showError(err.field, err.message);
        $(err.field).focus();
      }
      toast((err && err.message) || 'Something went wrong. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  });
})();
