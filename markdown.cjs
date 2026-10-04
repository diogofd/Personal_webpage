// One Markdown renderer for the build and tests. Math is rendered locally.
const markdown = require('./vendor/markdown-it.cjs')({ html: false, linkify: true });
markdown.use(require('./vendor/texmath.cjs'), {
  engine: require('./vendor/katex.cjs'), delimiters: 'dollars',
  katexOptions: { throwOnError: true, trust: false }
});
markdown.use(require('./vendor/footnote.cjs'));

// Keep the plugin's numbered links, with accessible navigation labels.
for (const [rule, attributes] of Object.entries({
  footnote_ref: 'role="doc-noteref" aria-label="Read footnote"',
  footnote_anchor: 'aria-label="Return to reference"'
})) {
  const render = markdown.renderer.rules[rule];
  markdown.renderer.rules[rule] = (...args) => render(...args)
    .replace('<a ', '<a ' + attributes + ' ')
    .replace('>\u21a9\ufe0e</a>', '>back</a>');
}
const open = markdown.renderer.rules.footnote_open;
markdown.renderer.rules.footnote_open = (...args) => {
  const number = args[0][args[1]].meta.id + 1;
  return open(...args).replace('<li ', '<li data-note-number="' + number + '" ');
};
markdown.renderer.rules.footnote_block_open = () =>
  '<hr class="footnotes-sep">\n<section class="footnotes" aria-label="Footnotes"><ol class="footnotes-list">\n';

module.exports = markdown;
