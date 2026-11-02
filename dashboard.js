App.start('Dashboard', (ctx, main, nav) => {
  const { esc } = App;
  const intro = {
    SUPERADMIN: 'You can manage all modules, approve new accounts and designate Admins.',
    ADMIN: 'You can manage all modules and assign user rights.',
    USER: nav.mods.length ? 'You can use the modules your rights allow.' : 'No modules are assigned to you yet. Ask an Admin to give you rights.',
  }[ctx.profile.role];
  const tiles = [...nav.mods, ...nav.admin];
  main.innerHTML = `<section class="banner"><h2>Welcome back, ${esc(ctx.profile.full_name)}</h2><p>${esc(intro)}</p></section>
    <div class="tiles">${tiles.map((t) => `<section class="tile"><h3>${esc(t.label)}</h3><p>${esc(t.blurb)}</p>
      <a class="btn-sm secondary" href="${t.href}">Open ${esc(t.label)}</a></section>`).join('')}</div>`;
});
