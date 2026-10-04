# personal website

A small, portable static website. No framework, database, account system, or browser-side math compilation. The generated pages work without JavaScript; the optional light/dark switch, reader-specific closing mark, and margin-note layout use small local scripts.

## Edit the website

| What you want to change | File |
| --- | --- |
| Introduction and advisors | `content/about.md` |
| Name, profile links, papers, talks, training events | `content/site.json` |
| Essays | `content/writing/*.md` |
| Closing symbols and their families | `content/endmarks.json` |
| Portrait | `assets/personal.png` |
| Typography, colours, spacing | `assets/style.css` |
| Page structure | `build.cjs` |

Edit the content files, then rebuild. Do not edit generated files in `dist/`.

## Closing marks

Each page ends with one quiet, centred mark. A random seed is saved only in the reader's browser, under `diogo-andrade:closing-mark-seed:v1`. The same seed and canonical hostname select the same mark on every page and return visit. No IP lookup, tracking request, or seed transmission is involved. Separate browsers or cleared storage may produce a different mark. If storage is blocked, a stable fallback is used; without JavaScript, the page shows a fleuron.

Edit `content/endmarks.json` to replace symbols, rename a family, or add/remove a whole family. Each family's `symbols` is a space-separated string. The build checks that marks are visible single characters and aren't duplicated. There are initially 300 marks, but the code uses the actual list length rather than a hard-coded limit.

Replace symbols in place to preserve the remaining indices. Changing the order or list length can change a returning reader's mark. Family names are organisational labels, not CSS classes. Saving this file with `npm run dev` running updates the preview like other content edits.

All symbol fonts are bundled locally and trimmed to the chosen characters (about 80 KB total). When adding new characters, run `node update-endmark-fonts.cjs` once, then rebuild. This authoring helper downloads updated subsets from Google Fonts; readers still load only your own local assets. It requires Node 18 or newer and internet access. Check that newly chosen symbols render before publishing, and commit the updated font files alongside the palette.

## Build and preview

Install Node.js (version 22 or newer). No package installation is required: the four libraries and all fonts are included.

```sh
node build.cjs
node check.cjs
node preview.cjs
```

Open http://127.0.0.1:4173. Stop the preview with Ctrl+C.

The commands `npm run build`, `npm run check`, and `npm run preview` also work if npm is installed.

## Add an essay

Create a file such as `content/writing/my-new-essay.md`. Its filename becomes the URL: `/writing/my-new-essay/`.

Start with JSON metadata between two `---` lines, followed by Markdown:

```md
---
{
  "title": "My new essay",
  "date": "2026-10-03",
  "summary": "One sentence for the homepage.",
  "context": "Notes"
}
---

A paragraph with inline mathematics: $E = mc^2$.

## A displayed equation

$$
\int_M A
$$
```

Articles appear on the homepage in newest-first order. KaTeX renders equations during the build, so readers never need a math-rendering script. This supports KaTeX's mathematical LaTeX subset, not arbitrary TeX packages or complete .tex documents. Put diagrams in `assets/` and reference them in Markdown.

Set `"draft": true` in an essay's JSON metadata to exclude both its page and homepage entry. Remove it or set `"draft": false` when ready. The source Markdown is preserved.

### Essay typography and margin notes

Essays use locally bundled Spectral (19px, line height 1.55), with an accent-coloured drop cap on the opening paragraph. Homepage text stays in Plex; its name stays in Cormorant Garamond. Adjust the `.prose` and `.essay-heading` rules in `assets/style.css` to change essay typography. The drop cap applies only when the article starts with a paragraph, not a heading or block of mathematics.

Use ordinary Markdown footnotes anywhere in an essay:

```md
We assemble the global object from local pieces.[^local]

[^local]: “Local” is doing quite a lot of work here.
```

The reference links to the note, and the return link takes readers back. Notes may contain Markdown and `$LaTeX$`; indent subsequent paragraphs by four spaces. At widths of 1180px and above, a small script places the same notes in the right margin alongside their first reference. Crowded notes stack without overlapping. Narrow screens, printing, and browsers without JavaScript keep numbered footnotes below the essay. No duplicate note content or IDs are created.

With `npm run dev` running, saving an essay updates its notes and preview automatically.

## Hosting and your domain

`dist/` contains the complete deployable website. Copy its contents to any static web host. The project has no Sites-specific runtime dependency.

For Sites, `.openai/hosting.json` holds this project's hosting identity. Ask Codex/Sites to build and publish the updated project. Sites has its own source mirror; storing the same project on GitHub does **not** establish automatic deployment from arbitrary GitHub pushes.

For GitHub Pages, deploy the contents of `dist/` using a Pages workflow. Relative asset and navigation paths also work under a repository subpath. Other static hosts can serve the same folder.

You can register a domain with a registrar of your choice later. Connecting it is a separate DNS step. Sites custom-domain support depends on account/workspace availability. Until then, use the assigned Sites address.

Set `url` in `content/site.json` to your eventual public address (including https://) to enable canonical URLs. It is blank initially to avoid treating a private review URL as your permanent public address.

## Included assets and licences

- `assets/personal.png`: the portrait supplied by Diogo.
- IBM Plex Sans 5.2.7: locally included font files; see `assets/licenses/IBM-Plex-Sans-LICENSE.txt`.
- Cormorant Garamond italic (500): local Latin font for the homepage name only; see `assets/licenses/Cormorant-Garamond-OFL.txt`. Adjust `.intro .identity h1` in `assets/style.css` to change its size or colour; other homepage text stays in Plex.
- Spectral (400, 500, 600 and 400 italic): local Latin fonts for essays; see `assets/licenses/Spectral-OFL.txt`.
- Noto Sans Symbols, Noto Sans Symbols 2, Noto Sans Math and Noto Serif: locally included closing-mark fonts; see their SIL Open Font License notices in `assets/licenses/`.
- KaTeX 0.19.0: `vendor/katex.cjs`, styles, and fonts; see `assets/licenses/KaTeX-LICENSE.txt`.
- markdown-it 14.1.0: `vendor/markdown-it.cjs`; see `vendor/markdown-it-LICENSE.txt`.
- markdown-it-texmath 1.0.0: `vendor/texmath.cjs`; see `vendor/texmath-LICENSE.txt`.
- markdown-it-footnote 4.0.0: `vendor/footnote.cjs`; see `vendor/footnote-LICENSE.txt`.

The third-party files are vendored from their published packages; keep their notices when redistributing. They are not custom-authored code. Your articles, site-specific source, and supplied assets are maintained separately.

The FCT report was used as background and is **not** included in the public site. The exact Multiverse Research logo is not included because it has not been supplied. A Scholar link and email address can be added to `links` once confirmed. Abstracts retained from the approved preview are condensed descriptions, with links to the original abstracts.
