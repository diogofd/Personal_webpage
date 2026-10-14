// Offline tests: synthetic Notion responses, temporary files, no real tokens or network.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {FIELDS,settings,bookFromPage,imageExtension,sync} = require('./sync-library.cjs');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
const rich = value=>[{plain_text:value}];
const row = (id,title,changes={}) => ({object:'page',id,properties:{
  Name:{type:'title',title:rich(title)}, Author:{type:'multi_select',multi_select:[]},
  Tags:{type:'multi_select',multi_select:[]}, Rating:{type:'number',number:null},
  'Last Read':{type:'date',date:null}, 'One-liner':{type:'rich_text',rich_text:[]},
  'Cover Image':{type:'files',files:[]}, ...changes,
  'Private Review':{type:'rich_text',rich_text:rich('DO NOT EXPORT')}
}});
const response = data=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
const source = '11111111-2222-3333-4444-555555555555';
const oldBook = {title:'Book',authors:['Supplement Author'],tags:['History'],rating:4,lastRead:'2024-01-01',note:'Old note',cover:'assets/library-covers/book-sourced.jpg'};

function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'library-sync-test-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'content'));fs.mkdirSync(path.join(root,'assets/library-covers'),{recursive:true});
  fs.writeFileSync(path.join(root,oldBook.cover),png);
  fs.writeFileSync(path.join(root,'content/library.json'),JSON.stringify({updated:'2024-01-01',books:[oldBook]}));
  fs.writeFileSync(path.join(root,'content/library-sources.json'),JSON.stringify({entries:[{title:'Book',authors:['Supplement Author'],tags:['History'],cover:oldBook.cover}]}));
  return root;
}
function api(batches, image=()=>new Response(png)) {
  let n=0; const calls=[];
  const fetcher=async(url,options)=>{
    calls.push({url,options});
    if (!url.startsWith('https://api.notion.com/')) { assert.equal(options.headers,undefined); return image(url,options); }
    assert.equal(options.headers.Authorization,'Bearer fake-token');
    assert.equal(options.headers['Notion-Version'],'2025-09-03');
    if (url.includes('/query')) {
      const parsed=new URL(url);
      assert.deepEqual(parsed.searchParams.getAll('filter_properties[]'),Object.keys(FIELDS));
      assert.equal(JSON.parse(options.body).page_size,100);
      const batch=batches[n++]; if (batch instanceof Response) return batch;
      return response({results:batch,has_more:n<batches.length,next_cursor:n<batches.length?'cursor-'+n:null});
    }
    return response({properties:Object.fromEntries(Object.entries(FIELDS).map(([name,type])=>[name,{type}]))});
  };
  return {fetcher,calls};
}
const run = (root,fetcher)=>sync({root,token:'fake-token',dataSource:source,fetcher,log:()=>{}});
const snapshot = root=>fs.readFileSync(path.join(root,'content/library.json'),'utf8');

test('environment settings load locally; shell-like values are never executed',t=>{
  const root=fixture(t);
  fs.writeFileSync(path.join(root,'.env.local'),'NOTION_TOKEN="local-token"\nNOTION_DATA_SOURCE_ID='+source+'\nUNRELATED=ignored\n');
  assert.deepEqual(settings(root,{}),{token:'local-token',dataSource:source});
  assert.equal(settings(root,{NOTION_TOKEN:'override'}).token,'override');
  assert.throws(()=>settings(root,{NOTION_DATA_SOURCE_ID:'bad'}),/UUID/);
  fs.unlinkSync(path.join(root,'.env.local'));
  assert.throws(()=>settings(root,{}),/NOTION_TOKEN/);
});
test('Notion fields win; empty fields retain only curated supplements; no private text',()=>{
  const book=bookFromPage(row('1','Book',{
    Author:{type:'multi_select',multi_select:[{name:'Notion Author'}]},
    Rating:{type:'number',number:0},'One-liner':{type:'rich_text',rich_text:rich('TBD')}
  }),oldBook);
  assert.deepEqual(book.authors,['Notion Author']);assert.deepEqual(book.tags,['History']);
  assert.equal(book.rating,0);assert.equal(book.lastRead,'');assert.equal(book.note,'');
  assert.doesNotMatch(JSON.stringify(book),/DO NOT EXPORT|Private Review/);
  assert.deepEqual(Object.keys(book),['title','authors','tags','rating','lastRead','note','cover']);
});
test('pagination, new books, archived/blank rows, local covers, backup and repeat sync',async t=>{
  const root=fixture(t);
  const file={type:'file',file:{url:'https://covers.example.org/cover.png?private-signed-url=secret'}};
  const book=row('1','Book',{'Cover Image':{type:'files',files:[file]}});
  const mock=api([[book,row('2','')],[row('3','New book'),{...row('4','Archived'),archived:true}]]);
  const data=await run(root,mock.fetcher);
  assert.equal(data.books.length,2);assert.match(data.books[0].cover,/^assets\/library-covers\/notion-[a-f0-9]{20}\.png$/);
  assert.ok(fs.existsSync(path.join(root,data.books[0].cover)));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'.library-sync/library.previous.json'))).books,[oldBook]);
  assert.doesNotMatch(snapshot(root),/private-signed-url|fake-token|DO NOT EXPORT|covers\.example/);
  assert.deepEqual(JSON.parse(mock.calls[2].options.body).start_cursor,'cursor-1');
  const before=snapshot(root);
  await run(root,api([[book,row('3','New book')]]).fetcher);
  assert.equal(snapshot(root),before);
  assert.ok(fs.existsSync(path.join(root,oldBook.cover))); // No destructive cover cleanup.
});
test('supplements follow a renamed title after the first successful sync',async t=>{
  const root=fixture(t);await run(root,api([[row('1','Book')]]).fetcher);
  const result=await run(root,api([[row('1','Renamed Book')]]).fetcher);
  assert.equal(result.books[0].title,'Renamed Book');assert.deepEqual(result.books[0].authors,['Supplement Author']);
  assert.equal(result.books[0].cover,oldBook.cover);
});
test('a failed later page cannot overwrite the previous snapshot',async t=>{
  const root=fixture(t), before=snapshot(root);
  await assert.rejects(run(root,api([[row('1','Book')],new Response('',{status:403})]).fetcher),/403/);
  assert.equal(snapshot(root),before);assert.equal(fs.existsSync(path.join(root,'.library-sync/lock')),false);
});
test('a failed cover download leaves all old public files untouched',async t=>{
  const root=fixture(t), before=snapshot(root);
  const files={type:'files',files:[{type:'external',external:{url:'https://covers.example.org/missing.jpg'}}]};
  await assert.rejects(run(root,api([[row('1','Book',{'Cover Image':files})]],()=>new Response('',{status:404})).fetcher),/404/);
  assert.equal(snapshot(root),before);assert.equal(fs.readdirSync(path.join(root,'assets/library-covers')).length,1);
});
test('empty and duplicate-title exports are rejected without changing the snapshot',async t=>{
  const root=fixture(t), before=snapshot(root);
  await assert.rejects(run(root,api([[]]).fetcher),/no titled books/);
  await assert.rejects(run(root,api([[row('1','Book'),row('2','Book')]]).fetcher),/Duplicate/);
  assert.equal(snapshot(root),before);
});
test('schema changes fail before querying or touching the snapshot',async t=>{
  const root=fixture(t), before=snapshot(root);
  await assert.rejects(run(root,async()=>response({properties:{}})),/Expected Notion property/);
  assert.equal(snapshot(root),before);
});
test('unsafe cover URLs and non-image responses are rejected',async t=>{
  const root=fixture(t);
  for(const url of ['http://covers.example.org/x','https://localhost/x','https://127.0.0.1/x']) {
    const files={type:'files',files:[{type:'external',external:{url}}]};
    await assert.rejects(run(root,api([[row('1','Book',{'Cover Image':files})]]).fetcher),/public HTTPS/);
  }
  assert.equal(imageExtension(png),'png');
  assert.throws(()=>imageExtension(Buffer.from('<svg>bad</svg>')),/not a PDF, SVG/);
  assert.throws(()=>bookFromPage(row('1','Book',{Rating:{type:'number',number:10}})),/Ratings/);
});
test('a second sync cannot run concurrently',async t=>{
  const root=fixture(t);fs.mkdirSync(path.join(root,'.library-sync'));
  fs.writeFileSync(path.join(root,'.library-sync/lock'),'');
  await assert.rejects(run(root,api([[row('1','Book')]]).fetcher),/already running/);
});
