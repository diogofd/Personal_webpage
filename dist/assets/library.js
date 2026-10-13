// Filter already-rendered books locally. No Notion connection or network requests.
(() => {
  const library = document.querySelector('.library');
  if (!library) return;
  const controls = library.querySelector('[data-library-controls]');
  const input = library.querySelector('[data-library-search]');
  const subject = library.querySelector('[data-library-subject]');
  const count = library.querySelector('[data-library-count]');
  const empty = library.querySelector('[data-library-empty]');
  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
  const books = [...library.querySelectorAll('[data-library-book]')].map(row => ({
    row, search: normalize(row.dataset.search), tags: JSON.parse(row.dataset.tags)
  }));
  function filter() {
    const words = normalize(input.value).trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const book of books) {
      book.row.hidden = !((!subject.value || book.tags.includes(subject.value)) && words.every(word => book.search.includes(word)));
      if (!book.row.hidden) visible++;
    }
    count.textContent = visible === books.length ? visible + ' books' : visible + ' of ' + books.length + ' books';
    empty.hidden = visible !== 0;
  }
  controls.hidden = false;
  controls.addEventListener('submit', event => event.preventDefault());
  input.addEventListener('input', filter);
  subject.addEventListener('change', filter);
  window.addEventListener('pageshow', filter);
  filter();
})();
