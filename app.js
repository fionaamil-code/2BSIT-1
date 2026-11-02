// Shared app shell: sign-in guard, sidebar, top bar, toast, dialogs. Pages call App.start().
(() => {
  'use strict';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ROLE_LABEL = { SUPERADMIN: 'Superadmin', ADMIN: 'Admin', USER: 'User' };

  // `prefix` ties a menu item to the rights that start with it (see supabase/sprint1.sql).
  const MODULES = [
    { label: 'Customers', prefix: 'customer.', href: 'customers.html', blurb: 'Who we sell to and their payment terms.' },
    { label: 'Products', prefix: 'product.', href: 'products.html', blurb: 'The catalogue and each price over time.' },
    { label: 'Human Resources', prefix: 'hr.', href: 'coming-soon.html?m=Human%20Resources', blurb: 'Employees, jobs and departments.' },
    { label: 'Sales', prefix: 'sale.', href: 'coming-soon.html?m=Sales', blurb: 'Sales and the products on each one.' },
    { label: 'Reports', prefix: 'report.', href: 'coming-soon.html?m=Reports', blurb: 'Summaries to print or save as PDF.' },
  ];
  const ADMIN_ITEM = { label: 'User Management', href: 'users.html', blurb: 'Accounts, blocking and rights.' };

  // ---- Toast ----
  let toastEl, toastTimer;
  function toast(message, type = 'info') {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.append(toastEl); }
    toastEl.textContent = message;
    toastEl.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 5000);
  }

  // ---- Dialogs (close with Esc) ----
  function modal({ title, body, actions = [], wide = false }) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `<div class="dialog${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="dlgTitle">
      <h2 id="dlgTitle">${esc(title)}</h2><div class="dialog-body"></div><div class="dialog-actions"></div></div>`;
    const bodyEl = overlay.querySelector('.dialog-body');
    if (typeof body === 'string') bodyEl.innerHTML = body; else bodyEl.append(body);
    const previous = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape' && [...document.querySelectorAll('.overlay')].pop() === overlay) close(); };
    function close() { overlay.remove(); document.removeEventListener('keydown', onKey); if (previous && previous.focus) previous.focus(); }
    actions.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn-sm ' + (a.kind || 'secondary'); b.textContent = a.label;
      b.addEventListener('click', async () => {
        if (!a.onClick) return close();
        b.disabled = true;
        try { await a.onClick(close); } finally { b.disabled = false; }
      });
      overlay.querySelector('.dialog-actions').append(b);
    });
    document.addEventListener('keydown', onKey);
    document.body.append(overlay);
    const first = overlay.querySelector('input, select, button.primary, button.danger, button');
    if (first) first.focus();
    return { close, el: overlay };
  }
  function confirmDialog({ title, message, confirmLabel, danger = false }) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      const m = modal({
        title, body: `<p>${esc(message)}</p>`,
        actions: [
          { label: 'Cancel', onClick: (close) => { finish(false); close(); } },
          { label: confirmLabel, kind: danger ? 'danger' : 'primary', onClick: (close) => { finish(true); close(); } },
        ],
      });
      new MutationObserver((_, obs) => { if (!document.body.contains(m.el)) { finish(false); obs.disconnect(); } }).observe(document.body, { childList: true });
    });
  }

  // ---- Shell ----
  function navItems(ctx) {
    const mods = MODULES.filter((m) => ctx.isStaff || ctx.rights.some((r) => r.startsWith(m.prefix)));
    return { mods, admin: ctx.isStaff ? [ADMIN_ITEM] : [] };
  }

  async function start(title, render) {
    const root = document.getElementById('app');
    if (!AuthService.isConfigured) { root.innerHTML = '<p class="boot">Supabase isn’t configured yet. Add your project URL and anon key to config.js.</p>'; return; }
    let ctx;
    try { ctx = await AuthService.currentUser(); } catch (e) { root.innerHTML = '<p class="boot">Can’t reach the server. Check your connection and refresh.</p>'; return; }
    if (!ctx) { window.location.replace('login.html'); return; }

    ctx.isSuper = ctx.profile.role === 'SUPERADMIN';
    ctx.isStaff = ctx.isSuper || ctx.profile.role === 'ADMIN';
    const { mods, admin } = navItems(ctx);
    const here = location.pathname.split('/').pop() || 'dashboard.html';
    const link = (i) => `<a class="menu-item${here === i.href.split('?')[0] ? ' active' : ''}" href="${i.href}">${esc(i.label)}</a>`;

    root.innerHTML = `<div class="shell">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><span class="logo" aria-hidden="true">H</span><span class="brand-name">Hope, Inc. ERP</span></div>
        <nav aria-label="Main menu">
          ${link({ label: 'Dashboard', href: 'dashboard.html' })}
          ${mods.map(link).join('')}
          ${admin.length || ctx.isSuper ? '<div class="menu-group">Administration</div>' : ''}
          ${admin.map(link).join('')}
          ${ctx.isSuper ? link({ label: 'System Settings', href: 'coming-soon.html?m=System%20Settings' }) : ''}
        </nav>
      </aside>
      <div class="shell-main">
        <header class="topbar">
          <button class="menu-btn btn-sm secondary" id="menuBtn" aria-controls="sidebar" aria-expanded="false">Menu</button>
          <h1 class="page-title">${esc(title)}</h1>
          <div class="topbar-user"><span>${esc(ctx.profile.full_name)}</span><span class="badge role">${ROLE_LABEL[ctx.profile.role]}</span>
            <button class="btn-sm secondary" id="logoutBtn">Log out</button></div>
        </header>
        <main class="content" id="content"></main>
      </div></div>`;

    document.getElementById('menuBtn').addEventListener('click', (e) => {
      const open = document.getElementById('sidebar').classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', String(open));
    });
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      try { await AuthService.logout(); } finally { window.location.replace('login.html'); }
    });
    await render(ctx, document.getElementById('content'), { mods, admin });
  }

  window.App = { start, toast, modal, confirm: confirmDialog, esc, ROLE_LABEL };
})();
