// Shared Sales screen pieces: tab bar, money format, payment status badge.
(() => {
  'use strict';
  const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);
  const tabs = (active) => `<nav class="subtabs" aria-label="Sales">${[['sales', 'Sales', 'sales.html'], ['balances', 'Balances', 'balances.html']].map(([k, l, h]) =>
    `<a href="${h}" class="subtab${k === active ? ' active' : ''}"${k === active ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
  const payStatus = (r) => (Number(r.total) > 0 && Number(r.paid) >= Number(r.total) ? 'Paid' : Number(r.paid) > 0 ? 'Partly paid' : 'Unpaid');
  const payBadge = (r) => { const s = payStatus(r); return `<span class="badge ${s === 'Paid' ? 'active' : s === 'Unpaid' ? 'blocked' : 'pending'}">${s}</span>`; };
  const canSee = (ctx) => ctx.isStaff || ctx.rights.some((r) => r.startsWith('sale.'));
  const can = (ctx, c) => ctx.isStaff || ctx.rights.includes(c);
  window.SalesPages = { money, tabs, payStatus, payBadge, canSee, can };
})();
