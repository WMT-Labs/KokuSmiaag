// Gabungkan backend/*.gs menjadi dist/Code.gs untuk ditampal ke editor Apps Script.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'backend');
const fail = fs.readdirSync(dir).filter(f => f.endsWith('.gs')).sort();
const out = '// DIJANA oleh scripts/bundle.js. Jangan sunting di sini; sunting backend/*.gs.\n\n' +
  fail.map(f => '// ===== ' + f + ' =====\n' + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
fs.mkdirSync(path.join(__dirname, '..', 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'dist', 'Code.gs'), out);
console.log('dist/Code.gs: ' + fail.length + ' fail, ' + out.split('\n').length + ' baris');
