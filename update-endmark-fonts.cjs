// Authoring helper only. Readers never contact Google Fonts.
const fs = require('node:fs');
const path = require('node:path');
async function update() {
  const palette = JSON.parse(fs.readFileSync(path.join(__dirname,'content/endmarks.json'),'utf8'));
  const text = [...new Set(palette.groups.flatMap(group => group.symbols.trim().split(/\s+/)))].join('');
  const families = [
    ['Noto Sans Symbols 2','noto-sans-symbols-2.ttf'],
    ['Noto Sans Symbols','noto-sans-symbols.ttf'],
    ['Noto Sans Math','noto-sans-math.ttf'],
    ['Noto Serif','noto-serif-marks.ttf']
  ];
  for (const [family,file] of families) {
    const css = await fetch('https://fonts.googleapis.com/css2?family=' + encodeURIComponent(family) + '&text=' + encodeURIComponent(text));
    if (!css.ok) throw new Error('Could not request ' + family);
    const match = (await css.text()).match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)\s+format\('truetype'\)/);
    if (!match) throw new Error('Expected a TrueType font for ' + family);
    const font = await fetch(match[1]);
    if (!font.ok) throw new Error('Could not download ' + family);
    fs.writeFileSync(path.join(__dirname,'assets/fonts',file), Buffer.from(await font.arrayBuffer()));
    console.log('Updated ' + file);
  }
}
update().catch(error => { console.error(error.message); process.exitCode = 1; });
