const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'dist');
const files = [];
function walk(dir) { for (const entry of fs.readdirSync(dir,{withFileTypes:true})) { const file=path.join(dir,entry.name); if(entry.isDirectory()) walk(file); else files.push(file); } }
walk(root);
let equations=0;
for(const file of files.filter(f=>f.endsWith('.html'))) {
  const html=fs.readFileSync(file,'utf8');
  if(html.includes('katex-error')) throw new Error('Unrendered math in '+file);
  equations+=(html.match(/class="katex"/g)||[]).length;
  for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if(/^(https?:|mailto:|data:|#)/.test(url)) continue;
    const target=path.resolve(path.dirname(file),url.split('#')[0]);
    if(!fs.existsSync(target)) throw new Error('Missing local asset or route: '+url+' in '+file);
  }
}
for(const file of files.filter(f=>f.endsWith('.css'))) {
  for(const [,url] of fs.readFileSync(file,'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if(!fs.existsSync(path.resolve(path.dirname(file),url))) throw new Error('Missing font '+url);
  }
}
// Drafts may leave no published equations; only check what is generated.
console.log('Checked all local links and assets; '+equations+' equations are pre-rendered.');
