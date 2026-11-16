/**
 * Repo.gs — SATU-SATUNYA tempat yang membaca dan menulis Sheet.
 * Setiap nilai yang ditulis melalui untukSheet() (penahan formula injection).
 */
var _ss = {}, _baca = {};

function buku(arkib) {
  var k = arkib ? 'ARKIB_ID' : 'SHEET_ID';
  if (!_ss[k]) {
    var id = prop(k);
    if (!id) throw new Error('Sistem belum disediakan. Jalankan sediaSistem() dahulu.');
    _ss[k] = SpreadsheetApp.openById(id);
  }
  return _ss[k];
}
function tab(nama, arkib) {
  var s = buku(arkib).getSheetByName(nama);
  if (!s) throw new Error('Tab "' + nama + '" tiada. Jalankan sediaSistem() semula.');
  return s;
}

/** Semua baris tab sebagai objek { lajur: nilai }. Semua nilai ialah teks. */
function baca(nama) {
  if (_baca[nama]) return _baca[nama];
  var v = tab(nama).getDataRange().getValues();
  var tajuk = (v[0] || []).map(function (h) { return String(h).trim(); });
  var out = [];
  for (var i = 1; i < v.length; i++) {
    var o = {}, ada = false;
    for (var j = 0; j < tajuk.length; j++) {
      if (!tajuk[j]) continue;
      var x = v[i][j];
      o[tajuk[j]] = x instanceof Date ? x.toISOString() : String(x === null || x === undefined ? '' : x).trim();
      if (o[tajuk[j]]) ada = true;
    }
    if (ada) out.push(o);
  }
  _baca[nama] = out;
  return out;
}

function _baris(lajur, o) { return lajur.map(function (c) { return untukSheet(o[c]); }); }

/** Ganti seluruh kandungan tab dengan `baris`. */
function tulis(nama, baris, arkib) {
  var lajur = (arkib ? SKEMA_ARKIB : SKEMA)[nama];
  var s = tab(nama, arkib);
  var data = [lajur].concat(baris.map(function (o) { return _baris(lajur, o); }));
  s.clearContents();
  s.getRange(1, 1, data.length, lajur.length).setValues(data);
  if (!arkib) { _baca[nama] = null; if (nama === 'pelajar') buangIndeks(); }
}

/** Tambah baris di hujung tab. */
function tambah(nama, o, arkib) {
  var lajur = (arkib ? SKEMA_ARKIB : SKEMA)[nama];
  tab(nama, arkib).appendRow(_baris(lajur, o));
  if (!arkib) { _baca[nama] = null; if (nama === 'pelajar') buangIndeks(); }
}
function tambahBanyak(nama, senarai, arkib) {
  if (!senarai.length) return;
  var lajur = (arkib ? SKEMA_ARKIB : SKEMA)[nama];
  var s = tab(nama, arkib);
  s.getRange(s.getLastRow() + 1, 1, senarai.length, lajur.length).setValues(senarai.map(function (o) { return _baris(lajur, o); }));
  if (!arkib) { _baca[nama] = null; if (nama === 'pelajar') buangIndeks(); }
}

/** Jalankan fn dengan kunci skrip, supaya dua penulisan serentak tidak bertindih. */
function denganKunci(fn) {
  var k = LockService.getScriptLock();
  if (!k.tryLock(20000)) throw Ralat('SIBUK', 'Sistem sedang sibuk. Cuba lagi sebentar.');
  try { _baca = {}; return fn(); } finally { k.releaseLock(); }
}

// ---------------- rujukan dan tetapan ----------------
function tahunSemasa() {
  var t = baca('tetapan').filter(function (r) { return r.kunci === 'tahun_semasa'; })[0];
  return t ? Number(t.nilai) : new Date().getFullYear();
}
var _ruj = null;
function rujukan() {
  if (_ruj) return _ruj;
  var r = { rumah: {}, uniform: [], kelab: [], sukan: [], kebitaraan: [], kelas: {}, aktiviti: {} };
  baca('rujukan').forEach(function (x) {
    if (!x.nilai) return;
    if (x.jenis === 'rumah') r.rumah[x.nilai] = { warna: x.warna };
    else if (x.jenis === 'kelas') (r.kelas[x.tingkatan] = r.kelas[x.tingkatan] || []).push(x.nilai);
    else if (x.jenis === 'aktiviti') r.aktiviti[x.tingkatan] = x.nilai;
    else if (r[x.jenis]) r[x.jenis].push(x.nilai);
  });
  _ruj = r;
  return r;
}
/** Padankan nilai dengan senarai rujukan tanpa kira huruf besar/kecil. Pulangkan ejaan rasmi, atau null. */
function padan(senarai, nilai) {
  var n = bersih(nilai).toLowerCase();
  for (var i = 0; i < senarai.length; i++) if (String(senarai[i]).toLowerCase() === n) return senarai[i];
  return null;
}

// ---------------- indeks carian (cache 10 minit) ----------------
function indeks() {
  var c = CacheService.getScriptCache();
  var s = c.get('indeks');
  if (s) return JSON.parse(s);
  var idx = baca('pelajar').filter(function (p) { return p.id && p.nama; })
    .map(function (p) { return [p.id, p.nama, Number(p.tingkatan), p.kelas]; });
  try { c.put('indeks', JSON.stringify(idx), 600); } catch (e) { /* melebihi had saiz cache: teruskan tanpa cache */ }
  return idx;
}
function buangIndeks() { CacheService.getScriptCache().remove('indeks'); }
