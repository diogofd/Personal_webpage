// Content lives in content/. This small script produces ordinary static HTML.
const fs = require('node:fs');
const path = require('node:path');
const markdown = require('./markdown.cjs');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
const site = JSON.parse(read('content/site.json'));
const library = JSON.parse(read('content/library.json'));
const palette = JSON.parse(read('content/endmarks.json'));
if (!Array.isArray(palette.groups)) throw new Error('endmarks.json: add a groups array.');
const endmarks = palette.groups.flatMap(group => {
  if (typeof group.name !== 'string' || typeof group.symbols !== 'string') throw new Error('endmarks.json: each group needs a name and symbols string.');
  return group.symbols.trim().split(/\s+/).filter(Boolean);
});
if (!endmarks.length || endmarks.some(mark => [...mark].length !== 1 || /[\p{C}\p{M}]/u.test(mark))) throw new Error('endmarks.json: use visible, single-character symbols separated by spaces.');
if (new Set(endmarks).size !== endmarks.length) throw new Error('endmarks.json: remove duplicate symbols.');
const out = path.join(__dirname, 'dist');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function link(title, url, className = '') {
  if (!url) return escape(title);
  if (!/^(https?:\/\/|mailto:)/.test(url)) throw new Error('Unsupported content link: ' + url);
  return '<a class="' + className + '" href="' + escape(url) + '">' + escape(title) + '</a>';
}
function write(file, text) {
  const target = path.join(out, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
}
function page(title, description, content, prefix = './', route = '') {
  const canonical = site.url ? '<link rel="canonical" href="' + escape(new URL(route, site.url.endsWith('/') ? site.url : site.url + '/').href) + '">' : '';
  return '<!doctype html>\n<html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escape(title) + '</title><meta name="description" content="' + escape(description) + '">' + canonical +
    '<link rel="icon" type="image/svg+xml" href="' + prefix + 'assets/favicon.svg"><link rel="stylesheet" href="' + prefix + 'assets/style.css"><link rel="stylesheet" href="' + prefix + 'assets/katex/katex.min.css"><script defer src="' + prefix + 'assets/theme.js"></script><script defer src="' + prefix + 'assets/endmarks-data.js"></script><script defer src="' + prefix + 'assets/endmark.js"></script></head><body><div class="wrap"><header><a class="brand" href="' + prefix + '">' + escape(site.name) +
    '</a><nav aria-label="Main navigation"><a href="' + prefix + '#writing">Writing</a><a href="' + prefix + '#papers">Papers</a><a href="' + prefix + 'library/"' + (route === 'library/' ? ' aria-current="page"' : '') + '>Library</a><button type="button" data-theme-toggle aria-label="Switch to light background">Light</button></nav></header>' + content +
    '<div class="closing-mark" data-closing-mark aria-hidden="true">❦</div><footer><span>' + escape(site.name) + '</span><span>© ' + new Date().getUTCFullYear() + '</span></footer></div></body></html>\n';
}
// This is generated output only; never remove the source Markdown files.
fs.rmSync(path.join(out, 'writing'), { recursive: true, force: true });
const essays = fs.readdirSync(path.join(__dirname, 'content/writing')).filter(f => f.endsWith('.md')).map(file => {
  const text = read('content/writing/' + file);
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) throw new Error(file + ': add JSON metadata between --- lines.');
  const meta = JSON.parse(match[1]);
  if (meta.draft !== undefined && typeof meta.draft !== 'boolean') throw new Error(file + ': draft must be true or false, without quotes.');
  if (meta.draft === true) return null;
  const slug = file.slice(0, -3);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Use a simple lowercase filename for essays.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || Number.isNaN(Date.parse(meta.date))) throw new Error('Use an ISO date in ' + file);
  const body = markdown.render(match[2]);
  if (body.includes('katex-error')) throw new Error('Math failed in ' + file);
  const date = new Intl.DateTimeFormat('en-GB', {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(meta.date));
  write('writing/' + slug + '/index.html', page(meta.title + ' · ' + site.name, meta.summary,
    '<main class="essay"><a class="back" href="../../">Back to home</a><div class="essay-heading"><p class="metadata">' + escape(date) + ' · Mathematics</p><h1>' + escape(meta.title) + '</h1><p class="byline">' + escape(site.name) + '</p></div><article class="prose">' + body + '</article><script defer src="../../assets/margin-notes.js"></script>' +
    (meta.note ? '<p class="original-note">' + escape(meta.note) + '</p>' : '') + '</main>', '../../', 'writing/' + slug + '/'));
  return { ...meta, slug };
}).filter(Boolean).sort((a,b) => b.date.localeCompare(a.date));
const writing = essays.map(e => '<article class="paper"><div class="year">' + escape(e.date.slice(0,4)) + '</div><div><h3><a href="writing/' + e.slug + '/">' + escape(e.title) + '</a></h3><p class="authors">' + escape(e.summary) + '</p><p class="metadata">' + escape(e.context || '') + '</p><a class="resource" href="writing/' + e.slug + '/">Read essay</a></div></article>').join('');
const publications = site.publications.map(p => '<article class="paper"><div class="year">' + escape(p.year) + '</div><div><h3>' + link(p.title,p.url) + '</h3><p class="authors">' + escape(p.authors) + '</p><p class="metadata">' + escape(p.description) + '</p>' + (p.url ? link(p.linkLabel || 'Read',p.url,'resource') : '') + '</div></article>').join('');
const talks = site.talks.map(t => {
  const resources = '<div class="resources">' + (t.resources || []).map(r => link(r.label,r.url,'resource')).join('') + '</div>';
  return '<div class="activity"><span class="year">' + escape(t.year) + '</span><div><h3>' + link(t.title,t.url) + '</h3><p>' + escape(t.venue) + '</p>' +
    (t.abstract ? '<details class="abstract"><summary>Abstract</summary><div class="abstract-copy"><p>' + escape(t.abstract) + '</p>' + resources + '</div></details>' : resources) + '</div></div>';
}).join('');
const training = site.training.map(t => '<li>' + link(t.title,t.url) + ' · ' + escape(t.venue) + '</li>').join('');
const home = '<main><section class="intro"><div class="identity"><h1>' + escape(site.name) + '</h1></div><img class="portrait" src="' + escape(site.portrait) + '" alt="Portrait of ' + escape(site.name) + '" width="180" height="180"><div class="bio">' + markdown.render(read('content/about.md')) +
  '<div class="social" aria-label="Profile links">' + site.links.map(l => link(l.label,l.url)).join('') + '</div></div></section>' +
  '<section id="writing"><div class="section-title"><h2>Recent writing</h2></div>' + (writing || '<p class="metadata">Nothing published here yet.</p>') + '</section>' +
  '<section id="papers"><div class="section-title"><h2>Publications &amp; preprints</h2></div>' + publications + '</section>' +
  '<section class="activities"><div class="section-title"><h2>Teaching &amp; talks</h2></div>' + talks +
  '<details class="more-phd"><summary>More from my PhD</summary><div class="more"><p><strong>Research visits.</strong> ' + escape(site.researchVisits) + '</p><p><strong>Seminars.</strong> ' + markdown.renderInline(site.seminars) +
  '</p><strong>Research training</strong><ul class="training">' + training + '</ul></div></details></section></main>';
write('index.html', page(site.name, site.description, home));
// Only the approved public properties live in this snapshot; no Notion page bodies.
const books = library.books.slice().sort((a,b) => (b.lastRead || '').localeCompare(a.lastRead || '') || a.title.localeCompare(b.title));
const subjects = [...new Set(books.flatMap(book => book.tags))].sort();
const bookRows = books.map(book => {
  if (!book.title || !Array.isArray(book.authors) || !Array.isArray(book.tags)) throw new Error('Invalid book metadata in library.json');
  if (book.cover && !/^assets\/library-covers\/[a-z0-9-]+\.jpg$/.test(book.cover)) throw new Error('Use a local library cover path.');
  const cover = book.cover ? '<img class="library-cover" src="../' + escape(book.cover) + '" alt="Cover of ' + escape(book.title) + '" loading="lazy" width="48" height="72">' : '<span class="library-cover-gap" aria-hidden="true"></span>';
  const rating = book.rating === null ? '' : '<span class="library-rating" aria-label="Rating ' + escape(book.rating) + '"><span aria-hidden="true">★ </span>' + escape(book.rating) + '</span>';
  let date = '';
  if (book.lastRead) {
    if (Number.isNaN(Date.parse(book.lastRead))) throw new Error('Invalid Last Read date for ' + book.title);
    date = '<time class="library-date" datetime="' + escape(book.lastRead) + '">' + new Intl.DateTimeFormat('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(book.lastRead)) + '</time>';
  }
  const search = [book.title,...book.authors,...book.tags,book.note || ''].join(' ');
  return '<article class="library-row" data-library-book data-search="' + escape(search) + '" data-tags="' + escape(JSON.stringify(book.tags)) + '"><div class="library-book">' + cover + '<div><h2>' + escape(book.title) + '</h2>' + (book.authors.length ? '<p class="library-author">' + escape(book.authors.join(', ')) + '</p>' : '') + (book.note ? '<p class="library-note">' + escape(book.note) + '</p>' : '') + '</div></div><div class="library-rating-cell">' + rating + '</div><div class="library-date-cell">' + date + '</div></article>';
}).join('');
const libraryPage = '<main class="library"><section class="library-heading"><h1>Library</h1><div class="library-description">' + markdown.render(read('content/library.md')) + '</div></section>' +
  '<form class="library-tools" data-library-controls role="search" hidden><label><span class="sr-only">Find a book or author</span><input type="search" data-library-search placeholder="Find a book or author"></label><label><span class="sr-only">Filter by subject</span><select data-library-subject><option value="">All subjects</option>' + subjects.map(subject => '<option>' + escape(subject) + '</option>').join('') + '</select></label></form>' +
  '<p class="library-count" data-library-count aria-live="polite">' + books.length + ' books</p><div class="library-columns" aria-hidden="true"><span>Book / author</span><span>Rating</span><span>Last read</span></div><div data-library-list>' + bookRows + '</div><p class="library-empty" data-library-empty hidden>No matching books.</p></main><script defer src="../assets/library.js"></script>';
write('library/index.html', page('Library · ' + site.name, 'Reviews and data for the books I have read and the ones I am reading.', libraryPage, '../', 'library/'));
fs.cpSync(path.join(__dirname,'assets'), path.join(out,'assets'), { recursive: true });
write('assets/endmarks-data.js', 'window.ANDRADE_ENDMARKS = ' + JSON.stringify(endmarks) + ';\nwindow.ANDRADE_ENDMARK_HOST = ' + JSON.stringify(site.url ? new URL(site.url).hostname : '') + ';\n');
console.log('Built homepage and ' + essays.length + ' essay(s). All assets are local.');
