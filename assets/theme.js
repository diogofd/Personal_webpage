(() => {
  const button = document.querySelector('[data-theme-toggle]');
  function update(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    button.textContent = dark ? 'Light' : 'Dark';
    button.setAttribute('aria-label', dark ? 'Switch to light background' : 'Switch to dark background');
  }
  let dark = true;
  try { const saved = localStorage.getItem('theme'); if (saved) dark = saved === 'dark'; } catch {}
  update(dark);
  button.addEventListener('click', () => {
    dark = !dark;
    update(dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
  });
})();
