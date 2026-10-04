// A decorative, browser-local seal. No requests, IP lookup, or analytics.
(() => {
  const element = document.querySelector('[data-closing-mark]');
  const symbols = window.ANDRADE_ENDMARKS;
  if (!element || !Array.isArray(symbols) || !symbols.length) return;

  const storageKey = 'diogo-andrade:closing-mark-seed:v1';
  let seed = 'storage-unavailable';
  try {
    let stored = localStorage.getItem(storageKey);
    if (!/^[a-f0-9]{32}$/.test(stored || '')) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      stored = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(storageKey, stored);
    }
    seed = stored;
  } catch {} // A stable fallback also works when browser storage is blocked.

  // Use the site's canonical hostname, not its hosting server or page path.
  const identity = seed + '|' + (window.ANDRADE_ENDMARK_HOST || location.hostname);
  let hash = 2166136261;
  for (let i = 0; i < identity.length; i++) {
    hash = Math.imul(hash ^ identity.charCodeAt(i), 16777619);
  }
  element.textContent = symbols[(hash >>> 0) % symbols.length] + '\uFE0E';
})();
