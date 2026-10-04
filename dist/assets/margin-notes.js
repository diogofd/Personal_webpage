// The same footnotes become margin notes only when there's room beside the essay.
// Without JS (or on small screens), they remain conventional linked endnotes.
(() => {
  const article = document.querySelector('.essay .prose');
  if (!article) return;
  const notes = [...article.querySelectorAll('.footnote-item')];
  if (!notes.length) return;
  const wide = window.matchMedia('(min-width: 1180px)');
  const pairs = notes.map(note => ({
    note,
    reference: [...article.querySelectorAll('.footnote-ref a')]
      .find(link => link.getAttribute('href') === '#' + note.id)
  }));

  function layout() {
    article.style.minHeight = '';
    article.classList.toggle('has-margin-notes', wide.matches);
    if (!wide.matches) {
      notes.forEach(note => { note.style.top = ''; });
      return;
    }
    const top = article.getBoundingClientRect().top;
    const bodyHeight = article.getBoundingClientRect().height;
    let bottom = 0;
    for (const { note, reference } of pairs) {
      // Push crowded notes down instead of letting them overlap.
      const position = Math.max(bottom, reference ? reference.getBoundingClientRect().top - top : 0);
      note.style.top = Math.round(position) + 'px';
      bottom = position + note.getBoundingClientRect().height + 18;
    }
    if (bottom > bodyHeight) article.style.minHeight = Math.ceil(bottom) + 'px';
  }

  let frame;
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(layout);
  }
  wide.addEventListener('change', schedule);
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  article.addEventListener('load', schedule, true); // Images inside an essay.
  if (document.fonts) document.fonts.ready.then(schedule);
  schedule();
})();
