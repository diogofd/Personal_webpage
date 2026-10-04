// Local editing only. No dependencies; nothing is added to published pages.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const client = `(() => {
  let version;
  async function check() {
    try {
      const response = await fetch('/__dev/version', {cache: 'no-store'});
      if (!response.ok) return;
      const next = await response.text();
      if (version !== undefined && next !== version) location.reload();
      version = next;
    } catch {} // Keep the page open if the server is temporarily unavailable.
  }
  check();
  setInterval(check, 500);
})();`;

function start(root = __dirname, port = Number(process.env.PORT || 4173)) {
  const output = path.join(root, 'dist');
  const types = {'.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.woff':'font/woff', '.ttf':'font/ttf', '.pdf':'application/pdf'};
  let revision = 0;
  function build() {
    const result = spawnSync(process.execPath, [path.join(root, 'build.cjs')], {cwd:root, stdio:'inherit'});
    if (result.error || result.status !== 0) {
      console.error('Build failed. Fix the error and save again; no browser reload was sent.');
      return;
    }
    revision++;
    console.log('Preview updated.');
  }
  // Polling also catches editor atomic saves and changes across WSL mounts.
  function fingerprint() {
    const entries = [];
    function scan(file) {
      if (!fs.existsSync(file)) return;
      const stat = fs.lstatSync(file);
      if (stat.isSymbolicLink()) return;
      if (stat.isDirectory()) {
        for (const name of fs.readdirSync(file).sort()) scan(path.join(file, name));
      } else entries.push(file + ':' + stat.mtimeMs + ':' + stat.ctimeMs + ':' + stat.size);
    }
    for (const name of ['content', 'assets', 'vendor', 'build.cjs', 'markdown.cjs']) scan(path.join(root, name));
    return entries.join('\n');
  }
  build();
  let previous = fingerprint();
  let pending;
  const watcher = setInterval(() => {
    try {
      const next = fingerprint();
      if (next === previous) return;
      previous = next;
      clearTimeout(pending);
      pending = setTimeout(build, 150);
    } catch (error) { console.error('Watcher:', error.message); }
  }, 400);

  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400).end(); return; }
    if (pathname === '/__dev/version') {
      res.writeHead(200, {'Content-Type':'text/plain'}).end(String(revision)); return;
    }
    if (pathname === '/__dev/reload.js') {
      res.writeHead(200, {'Content-Type':'text/javascript'}).end(req.method === 'HEAD' ? '' : client); return;
    }
    try {
      let file = path.resolve(output, '.' + pathname);
      if (file !== output && !file.startsWith(output + path.sep)) { res.writeHead(403).end(); return; }
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      file = fs.realpathSync(file);
      const realOutput = fs.realpathSync(output);
      if (!file.startsWith(realOutput + path.sep)) { res.writeHead(403).end(); return; }
      const extension = path.extname(file);
      let body = fs.readFileSync(file);
      if (extension === '.html') body = Buffer.from(body.toString().replace('</body>', '<script src="/__dev/reload.js"></script></body>'));
      res.writeHead(200, {'Content-Type':types[extension] || 'application/octet-stream'});
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(404).end('Not found'); }
  });
  function stopWatching() { clearInterval(watcher); clearTimeout(pending); }
  server.on('close', stopWatching);
  server.on('error', error => {
    stopWatching();
    console.error(error.code === 'EADDRINUSE' ? 'Port already in use. Stop the old preview with Ctrl+C, or choose a different PORT.' : error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => console.log('Live preview: http://127.0.0.1:' + server.address().port));
  return server;
}
if (require.main === module) start();
module.exports = {start};
