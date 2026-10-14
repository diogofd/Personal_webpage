// Local authoring tool only. No dependencies, Notion writes, or page-body requests.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {isIP} = require('node:net');
const FIELDS = {Name:'title', Author:'multi_select', Tags:'multi_select', Rating:'number', 'Last Read':'date', 'One-liner':'rich_text', 'Cover Image':'files'};
const API_VERSION = '2025-09-03';
const COVER_PATH = /^assets\/library-covers\/[a-z0-9-]+\.(jpg|png|webp|gif)$/;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const readJson = (file, fallback) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
const text = items => items.map(item => item.plain_text ?? item.text?.content ?? '').join('').trim();

function settings(root, env = process.env) {
  // A deliberately small .env reader: no shell execution or variable expansion.
  const values = {};
  const file = path.join(root, '.env.local');
  if (fs.existsSync(file)) for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(NOTION_TOKEN|NOTION_DATA_SOURCE_ID)\s*=\s*(.*?)\s*$/);
    if (match) values[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  const token = env.NOTION_TOKEN || values.NOTION_TOKEN;
  const dataSource = env.NOTION_DATA_SOURCE_ID || values.NOTION_DATA_SOURCE_ID;
  if (!token) throw new Error('Add NOTION_TOKEN to .env.local (copy .env.example first).');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dataSource || '')) throw new Error('NOTION_DATA_SOURCE_ID must be a data-source UUID, not a database URL.');
  return {token, dataSource};
}

async function request(url, options, fetcher) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try { response = await fetcher(url, {...options, redirect:'error', signal:AbortSignal.timeout(30000)}); }
    catch { throw new Error('Network request failed. No snapshot was changed; check your connection and retry.'); }
    if (response.ok) return response;
    if ([429,529].includes(response.status) && attempt < 2) {
      const seconds = Number(response.headers.get('retry-after') || 2 ** attempt);
      // Never retry before Retry-After; fail gracefully if the requested wait is long.
      if (!Number.isFinite(seconds) || seconds < 0 || seconds > 60) throw new Error('Service rate-limited. Wait a few minutes and run the sync again.');
      await sleep(seconds * 1000); continue;
    }
    const hint = {401:'Check your Notion token.',403:'Grant Read content access.',404:'Connect the database to your Notion integration and check the data-source ID.'}[response.status] || 'Retry later or check the Cover Image property.';
    // Do not print response bodies, tokens, or signed cover URLs.
    throw new Error('Request failed (HTTP '+response.status+'). '+hint);
  }
}

async function pages({token, dataSource, fetcher}) {
  const headers = {'Authorization':'Bearer '+token, 'Notion-Version':API_VERSION, 'Content-Type':'application/json'};
  const base = 'https://api.notion.com/v1/data_sources/'+dataSource;
  const schema = await (await request(base, {headers}, fetcher)).json();
  for (const [name,type] of Object.entries(FIELDS)) if (schema.properties?.[name]?.type !== type) throw new Error('Expected Notion property "'+name+'" of type '+type+'. Update FIELDS if you rename a column.');
  const query = new URL(base+'/query');
  for (const name of Object.keys(FIELDS)) query.searchParams.append('filter_properties[]', name);
  const rows = [], cursors = new Set();
  let cursor;
  do {
    const result = await (await request(query.href, {method:'POST', headers, body:JSON.stringify({page_size:100,...(cursor ? {start_cursor:cursor} : {})})}, fetcher)).json();
    if (!Array.isArray(result.results) || typeof result.has_more !== 'boolean' || result.request_status?.type === 'incomplete') throw new Error('Incomplete Notion response; refusing to replace the Library.');
    rows.push(...result.results);
    cursor = result.has_more ? result.next_cursor : null;
    if (result.has_more && (!cursor || cursors.has(cursor))) throw new Error('Invalid Notion pagination.');
    if (cursor) { cursors.add(cursor); await sleep(350); }
  } while (cursor);
  return rows;
}

function bookFromPage(page, supplement = {}) {
  const p = page.properties;
  for (const [name,type] of Object.entries(FIELDS)) if (p?.[name]?.type !== type) throw new Error('A Notion row has missing or incompatible properties.');
  const title = text(p.Name.title);
  const authors = p.Author.multi_select.map(x=>x.name);
  const tags = p.Tags.multi_select.map(x=>x.name);
  const note = text(p['One-liner'].rich_text);
  const rating = p.Rating.number;
  const lastRead = p['Last Read'].date?.start || '';
  if (rating !== null && (!Number.isFinite(rating) || rating < 0 || rating > 5)) throw new Error('Ratings must be between 0 and 5, or blank.');
  if (lastRead && Number.isNaN(Date.parse(lastRead))) throw new Error('Invalid Last Read date.');
  // Explicit public allowlist. Extra Notion properties and page bodies never enter JSON.
  return {title, authors:authors.length ? authors : supplement.authors || [], tags:tags.length ? tags : supplement.tags || [], rating, lastRead, note:/^TBD$/i.test(note) ? '' : note, cover:supplement.cover || ''};
}

function imageExtension(bytes) {
  if (bytes.subarray(0,3).equals(Buffer.from([255,216,255]))) return 'jpg';
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (/^GIF8[79]a$/.test(bytes.subarray(0,6).toString())) return 'gif';
  if (bytes.subarray(0,4).toString()==='RIFF' && bytes.subarray(8,12).toString()==='WEBP') return 'webp';
  throw new Error('Cover Image must be a JPEG, PNG, WebP, or GIF—not a PDF, SVG, or webpage.');
}

async function coverBytes(file, fetcher) {
  const raw = file.type === 'external' ? file.external?.url : file.type === 'file' ? file.file?.url : null;
  let url;
  try { url = new URL(raw); } catch { throw new Error('Invalid Cover Image URL.'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || isIP(host) || host==='localhost' || host.endsWith('.local') || host.endsWith('.localhost') || !host.includes('.')) throw new Error('Cover Image must use a public HTTPS URL.');
  // No Authorization header goes to an image host. Redirects are intentionally rejected.
  const response = await request(url.href, {}, fetcher);
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > 8*1024*1024) { await response.body.cancel().catch(()=>{}); throw new Error('Cover exceeds 8 MB. Upload a smaller image to Notion.'); }
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function atomicJson(file, data) {
  const temp = file+'.tmp';
  try { fs.writeFileSync(temp, JSON.stringify(data,null,2)+'\n', {mode:0o600}); fs.renameSync(temp,file); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}

async function sync({root=__dirname, token, dataSource, fetcher=fetch, log=console.log}) {
  const local = path.join(root,'.library-sync');
  fs.mkdirSync(local,{recursive:true});
  const lock = path.join(local,'lock');
  let handle;
  try { handle = fs.openSync(lock,'wx'); } catch { throw new Error('A sync is already running. If a previous sync crashed, remove .library-sync/lock after checking no sync process is running.'); }
  let stage;
  try {
    const target = path.join(root,'content/library.json');
    const previous = readJson(target,{books:[]});
    const supplements = readJson(path.join(root,'content/library-sources.json'),{entries:[]}).entries;
    const stateFile = path.join(local,'state.json');
    const oldState = readJson(stateFile,{}), state = {};
    const rows = await pages({token,dataSource,fetcher});
    stage = fs.mkdtempSync(path.join(local,'stage-'));
    const books = [], titles = new Set(), ids = new Set();
    for (const row of rows) {
      if (row.archived || row.in_trash) continue;
      if (row.object !== 'page' || typeof row.id !== 'string' || ids.has(row.id)) throw new Error('Invalid or repeated Notion row.');
      ids.add(row.id);
      const title = text(row.properties?.Name?.title || []);
      if (!title) continue;
      if (titles.has(title)) throw new Error('Duplicate book titles; disambiguate them in Notion before syncing.');
      titles.add(title);
      const supplementTitle = oldState[row.id]?.supplementTitle || title;
      const supplement = supplements.find(x=>x.title===supplementTitle) || supplements.find(x=>x.title===title) || {};
      const book = bookFromPage(row,supplement);
      const files = row.properties['Cover Image'].files;
      if (files.length) {
        const bytes = await coverBytes(files[0],fetcher);
        const extension = imageExtension(bytes);
        const hash = createHash('sha256').update(bytes).digest('hex').slice(0,20);
        book.cover = 'assets/library-covers/notion-'+hash+'.'+extension;
        fs.writeFileSync(path.join(stage,path.basename(book.cover)),bytes);
      }
      if (book.cover && (!COVER_PATH.test(book.cover) || (!files.length && !fs.existsSync(path.join(root,book.cover))))) throw new Error('A supplementary cover is missing or has an unsafe path.');
      books.push(book); state[row.id] = {supplementTitle:supplement.title || supplementTitle};
    }
    if (!books.length) throw new Error('Notion returned no titled books; refusing to erase your Library.');
    books.sort((a,b)=>a.title.localeCompare(b.title,'en'));
    const unchanged = JSON.stringify([...previous.books].sort((a,b)=>a.title.localeCompare(b.title,'en'))) === JSON.stringify(books);
    const snapshot = {updated:unchanged ? previous.updated : new Date().toISOString().slice(0,10), books};
    // Nothing public is changed until every page, metadata field, and cover succeeds.
    // Content-hashed filenames never overwrite existing covers; old files aren't deleted.
    const covers = path.join(root,'assets/library-covers'); fs.mkdirSync(covers,{recursive:true});
    for (const name of fs.readdirSync(stage)) if (!fs.existsSync(path.join(covers,name))) fs.copyFileSync(path.join(stage,name),path.join(covers,name));
    atomicJson(path.join(local,'library.previous.json'),previous);
    if (!unchanged) atomicJson(target,snapshot);
    try { atomicJson(stateFile,state); } catch { log('Warning: local rename cache could not be saved. Library data was saved successfully.'); }
    log('Library synced: '+books.length+' books, '+books.filter(b=>b.cover).length+' covers. '+(unchanged?'No content changes.':'Local snapshot updated.'));
    return snapshot;
  } finally {
    // stage is created by mkdtemp beneath this specific private sync directory.
    if (stage) fs.rmSync(stage,{recursive:true,force:true});
    fs.closeSync(handle); fs.unlinkSync(lock);
  }
}

if (require.main === module) {
  Promise.resolve().then(()=>sync({root:__dirname,...settings(__dirname)})).catch(error=>{
    console.error('Library sync: '+error.message); process.exitCode=1;
  });
}
module.exports = {FIELDS, settings, bookFromPage, imageExtension, sync};
