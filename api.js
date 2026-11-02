// Shared data-access helpers for every module service.
(() => {
  'use strict';
  const MESSAGES = {
    NOT_ALLOWED: 'You don’t have permission to do that.',
    NOT_FOUND: 'That record no longer exists. Refresh the page.',
    BAD_INPUT: 'Check the highlighted fields and try again.',
    DUPLICATE: 'That entry already exists.',
    IN_USE: 'This record is in use and cannot be deleted.',
  };
  function fail(error) {
    const text = (error && error.message) || '';
    const code = Object.keys(MESSAGES).find((k) => text.includes(k));
    throw { code, message: code ? MESSAGES[code] : (text || 'Something went wrong. Try again.') };
  }
  async function run(query) { const { data, error } = await query; if (error) fail(error); return data; }
  window.Api = { db: () => AuthService.db(), run, fail };
})();
