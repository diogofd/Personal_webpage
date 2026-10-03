# personal website

A small, portable static website. No framework, database, account system, or browser-side math compilation. The generated pages work without JavaScript, except for the optional light/dark switch.

## Edit the website

| What you want to change | File |
| --- | --- |
| Introduction and advisors | `content/about.md` |
| Name, profile links, papers, talks, training events | `content/site.json` |
| Essays | `content/writing/*.md` |
| Portrait | `assets/personal.png` |
| Typography, colours, spacing | `assets/style.css` |
| Page structure | `build.cjs` |

Edit the content files, then rebuild. Do not edit generated files in `dist/`.

## Build and preview

Install Node.js (version 22 or newer). No package installation is required: the three small libraries and all fonts are included.

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

Only put public-ready writing in this directory: all .md files here are published.

## Hosting and your domain

`dist/` contains the complete deployable website. Copy its contents to any static web host. The project has no Sites-specific runtime dependency.

For Sites, `.openai/hosting.json` holds this project's hosting identity. Ask Codex/Sites to build and publish the updated project. Sites has its own source mirror; storing the same project on GitHub does **not** establish automatic deployment from arbitrary GitHub pushes.

For GitHub Pages, deploy the contents of `dist/` using a Pages workflow. Relative asset and navigation paths also work under a repository subpath. Other static hosts can serve the same folder.

You can register a domain with a registrar of your choice later. Connecting it is a separate DNS step. Sites custom-domain support depends on account/workspace availability. Until then, use the assigned Sites address.

Set `url` in `content/site.json` to your eventual public address (including https://) to enable canonical URLs. It is blank initially to avoid treating a private review URL as your permanent public address.

## Included assets and licences

- `assets/personal.png`: the portrait supplied by Diogo.
- IBM Plex Sans 5.2.7: locally included font files; see `assets/licenses/IBM-Plex-Sans-LICENSE.txt`.
- KaTeX 0.19.0: `vendor/katex.cjs`, styles, and fonts; see `assets/licenses/KaTeX-LICENSE.txt`.
- markdown-it 14.1.0: `vendor/markdown-it.cjs`; see `vendor/markdown-it-LICENSE.txt`.
- markdown-it-texmath 1.0.0: `vendor/texmath.cjs`; see `vendor/texmath-LICENSE.txt`.

The third-party files are vendored from their published packages; keep their notices when redistributing. They are not custom-authored code. Your articles, site-specific source, and supplied assets are maintained separately.

The FCT report was used as background and is **not** included in the public site. The exact Multiverse Research logo is not included because it has not been supplied. A Scholar link and email address can be added to `links` once confirmed. Abstracts retained from the approved preview are condensed descriptions, with links to the original abstracts.
