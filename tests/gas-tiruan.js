// Tiruan ringkas perkhidmatan Apps Script supaya dist/Code.gs boleh diuji dalam Node.
const crypto = require('crypto'), vm = require('vm'), fs = require('fs'), path = require('path');

class Sheet {
  constructor(nama) { this.nama = nama; this.d = []; }
  getLastRow() { return this.d.length; }
  getMaxRows() { return 1000; }
  setFrozenRows() {}
  clearContents() { this.d = []; }
  appendRow(r) { this.d.push(r.map(sel)); }
  getDataRange() { return { getValues: () => (this.d.length ? this.d.map(r => r.slice()) : [[]]) }; }
  getRange(r, c, nr, nc) {
    return { setNumberFormat() {}, setValues: v => { v.forEach((row, i) => { this.d[r - 1 + i] = row.map(sel); }); } };
  }
}
// Sheets menyimpan "'=x" sebagai teks "=x"; formula sebenar bermula "=" tanpa apostrof.
function sel(v) {
  const s = String(v);
  if (/^[=+\-@]/.test(s)) throw new Error('FORMULA INJECTION tidak ditapis: ' + s);
  return s.startsWith("'") ? s.slice(1) : s;
}
class Buku {
  constructor(id, nama) { this.id = id; this.nama = nama; this.tabs = {}; }
  getId() { return this.id; } getName() { return this.nama; } getUrl() { return 'https://sheet/' + this.id; }
  getSheetByName(n) { return this.tabs[n] || null; }
  insertSheet(n) { return (this.tabs[n] = new Sheet(n)); }
}

module.exports = function muat() {
  const buku = { utama: new Buku('utama', 'Koku SMIAAG') }, props = {}, cache = {};
  let n = 0;
  const ctx = {
    console, JSON, Math, Date, Object, Array, String, Number, Error, parseInt, RegExp,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => buku.utama,
      openById: id => buku[id],
      create: nama => (buku['arkib' + (++n)] = new Buku('arkib' + n, nama)),
      getUi: () => ({ alert() {}, createMenu: () => ({ addItem() { return this; }, addSeparator() { return this; }, addToUi() {} }) })
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = String(v); } }) },
    CacheService: { getScriptCache: () => ({ get: k => (k in cache ? cache[k] : null), put: (k, v) => { cache[k] = String(v); }, remove: k => { delete cache[k]; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (a, s) => [...crypto.createHash('sha256').update(s, 'utf8').digest()].map(b => (b > 127 ? b - 256 : b)),
      getUuid: () => crypto.randomUUID()
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: t => ({ t, setMimeType() { return this; } }) }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'dist', 'Code.gs'), 'utf8'), ctx);
  return { ctx, buku, props, cache };
};
