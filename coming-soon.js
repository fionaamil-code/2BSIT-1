App.start(new URLSearchParams(location.search).get('m') || 'Module', (ctx, main) => {
  const name = App.esc(new URLSearchParams(location.search).get('m') || 'This module');
  main.innerHTML = `<section class="banner"><h2>${name}</h2><p>This screen is part of a later sprint and has not been built yet.</p></section>
    <p><a class="btn-sm secondary" href="dashboard.html">Back to Dashboard</a></p>`;
});
