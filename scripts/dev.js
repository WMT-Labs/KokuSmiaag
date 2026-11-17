// Pelayan pembangunan: laman statik + backend sebenar (dist/Code.gs) di atas Sheet tiruan dalam memori.
// Jalankan: node scripts/bundle.js && node scripts/dev.js   kemudian buka http://localhost:8081
// Data hilang bila pelayan dihentikan. Kunci admin dicetak di terminal untuk menguji aksi A_... dengan curl.
const http = require('http'), fs = require('fs'), path = require('path');
const { ctx, props } = require('../tests/gas-tiruan')();
ctx.sediaSistem(); ctx.isiDataContoh();
const akar = path.join(__dirname, '..'), jenis = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api') {
    let b = '';
    req.on('data', c => { b += c; });
    req.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(ctx.kendali(j))); });
    return;
  }
  const f = path.normalize(path.join(akar, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]));
  if (!f.startsWith(akar) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('404'); }
  let isi = fs.readFileSync(f);
  if (req.url.startsWith('/js/config.js')) isi = String(isi).replace(/DEMO: (true|false)/, 'DEMO: false').replace(/API_URL: '[^']*'/, "API_URL: '/api'");
  res.setHeader('Content-Type', jenis[path.extname(f)] || 'application/octet-stream');
  res.end(isi);
}).listen(8081, () => console.log('http://localhost:8081\nKUNCI_ADMIN: ' + props.KUNCI_ADMIN));
