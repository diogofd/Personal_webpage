// Content lives in content/. This small script produces ordinary static HTML.
const fs = require('node:fs');
const path = require('node:path');
const katex = require('./vendor/katex.cjs');
const markdown = require('./vendor/markdown-it.cjs')({ html: false, linkify: true });
markdown.use(require('./vendor/texmath.cjs'), {
  engine: katex, delimiters: 'dollars',
  katexOptions: { throwOnError: true, trust: false }
});
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
const site = JSON.parse(read('content/site.json'));
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
    '<link rel="icon" type="image/svg+xml" href="' + prefix + 'assets/favicon.svg"><link rel="stylesheet" href="' + prefix + 'assets/style.css"><link rel="stylesheet" href="' + prefix + 'assets/katex/katex.min.css"><script defer src="' + prefix + 'assets/theme.js"></script></head><body><div class="wrap"><header><a class="brand" href="' + prefix + '">' + escape(site.name) +
    '</a><nav aria-label="Main navigation"><a href="' + prefix + '#writing">Writing</a><a href="' + prefix + '#papers">Papers</a><button type="button" data-theme-toggle aria-label="Switch to light background">Light</button></nav></header>' + content +
    '<footer><span>' + escape(site.name) + '</span><span>© ' + new Date().getUTCFullYear() + '</span></footer></div></body></html>\n';
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
    '<main class="essay"><a class="back" href="../../">Back to home</a><div class="essay-heading"><p class="metadata">' + escape(date) + ' · Mathematics</p><h1>' + escape(meta.title) + '</h1><p class="byline">' + escape(site.name) + '</p></div><article class="prose">' + body + '</article>' +
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
fs.cpSync(path.join(__dirname,'assets'), path.join(out,'assets'), { recursive: true });
console.log('Built homepage and ' + essays.length + ' essay(s). All assets are local.');
