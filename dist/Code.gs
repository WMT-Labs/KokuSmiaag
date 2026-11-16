// DIJANA oleh scripts/bundle.js. Jangan sunting di sini; sunting backend/*.gs.

// ===== 1_Config.gs =====
/**
 * Config.gs — pemalar sistem Koku SMIAAG (rekod kokurikulum pelajar).
 *
 * Rahsia TIDAK disimpan di sini. Ia berada dalam Script Properties:
 *   SHEET_ID     ID Sheet utama (diisi oleh sediaSistem)
 *   ARKIB_ID     ID Sheet arkib (diisi oleh sediaSistem)
 *   KUNCI_ADMIN  kunci rahsia yang dikongsi dengan backend Profil Guru
 */
var MAKS_HASIL_CARIAN = 25;
var MIN_HURUF_CARIAN = 3;
var MAKS_MENUNGGU = 5;          // rekod pencapaian menunggu pengesahan bagi setiap pelajar
var MAKS_HANTAR_SEJAM = 300;    // had seluruh sistem, penahan banjir
var PIN_MAKS_CUBA = 5;          // percubaan PIN bagi setiap pelajar
var PIN_KUNCI_SAAT = 900;       // dikunci 15 minit selepas had percubaan
var PIN_HARI_LALAI = 7;         // PIN luput selepas 7 hari jika tidak dibatalkan
var TAHUN_SIMPAN_ARKIB = 3;     // arkib pelajar yang tamat disimpan 3 tahun

var PERINGKAT = ['Sekolah', 'Daerah', 'Negeri', 'Kebangsaan', 'Antarabangsa'];
var PENCAPAIAN = ['Johan', 'Naib Johan', 'Ketiga', 'Keempat', 'Penyertaan'];
var MEDAN_WAJIB = ['kelas', 'rumah', 'uniform', 'kelab', 'sukan_rasmi'];
var MEDAN_PELAJAR_BOLEH_UBAH = ['no_daftar', 'nama', 'jantina', 'tingkatan', 'kelas', 'rumah', 'uniform', 'pangkat', 'kelab', 'jawatan', 'sukan_rasmi'];

/** Struktur setiap tab. Urutan di sini ialah urutan lajur dalam Sheet. */
var SKEMA = {
  pelajar: ['id', 'no_daftar', 'nama', 'jantina', 'tingkatan', 'kelas', 'rumah', 'uniform', 'pangkat', 'kelab', 'jawatan', 'sukan_rasmi', 'dikemas_kini', 'oleh'],
  wakil: ['id', 'pelajar_id', 'tahun', 'sukan'],
  pencapaian: ['id', 'pelajar_id', 'tahun', 'sukan', 'kejohanan', 'peringkat', 'pencapaian', 'status', 'sumber', 'dihantar_pada', 'diputus_oleh', 'diputus_pada', 'catatan'],
  rekod_tahunan: ['tahun', 'pelajar_id', 'nama', 'tingkatan', 'kelas', 'rumah', 'uniform', 'pangkat', 'kelab', 'jawatan', 'sukan_rasmi', 'aktiviti_ekstra'],
  pin: ['pelajar_id', 'hash', 'salt', 'luput', 'dicipta_oleh', 'dicipta_pada'],
  guru_koku: ['susunan', 'kumpulan', 'nama', 'jawatan', 'foto_url', 'papar'],
  rujukan: ['jenis', 'nilai', 'tingkatan', 'warna'],
  tetapan: ['kunci', 'nilai'],
  log_audit: ['masa', 'oleh', 'aksi', 'sasaran', 'butiran']
};
/** Tab arkib (dalam fail Sheet berasingan). */
var SKEMA_ARKIB = {
  pelajar: ['tahun_tamat'].concat(SKEMA.pelajar),
  rekod_tahunan: SKEMA.rekod_tahunan,
  pencapaian: SKEMA.pencapaian,
  wakil: SKEMA.wakil
};

var RUJUKAN_LALAI = {
  rumah: [['Fatah', 'merah'], ['Falah', 'hijau'], ['Najah', 'biru'], ['Solah', 'kuning']],
  uniform: ['KRS', 'KASPA', 'BSMM', 'Puteri Islam'],
  kelab: ['Persatuan Bahasa Arab Komunikasi', 'Persatuan Sejarah', 'Persatuan Seni Visual', 'Persatuan Sains Matematik',
    'Kelab Pelancongan', 'Kelab Debat', 'Kelab Masakan', 'Kelab Digital', 'Kelab Landskap', 'Kelab Kembara MyCare',
    'Kelab Usahawan 1', 'Kelab Usahawan 2', 'Kelab Pencinta Hadis', 'Kelab Nasyid', 'Kelab Rakan Hidayah',
    'Kelab Inovasi & Robotik', 'Kelab Warisan', 'Kelab Kraftangan', 'Kelab Memanah Tradisional (METRA)',
    'Kelab Pengguna', 'Kelab Kitar Semula (Go Green)', 'Kelab Bahasa Antarabangsa'],
  sukan: ['Badminton', 'Bola Baling', 'Bola Jaring', 'Bola Keranjang', 'Bola Sepak', 'Bola Tampar', 'Boling Tenpin', 'Catur',
    'Golf', 'Memanah Moden', 'Olahraga', 'Ping Pong', 'Renang', 'Merentas Desa', 'Takraw', 'Esport'],
  kebitaraan: ['Pasukan Inovasi & Robotik', 'Pasukan Kesenian & Kebudayaan', 'Pasukan Debat Bahasa Arab',
    'Pasukan Debat Bahasa Inggeris', 'Pasukan Debat Bahasa Melayu'],
  kelas: { 1: ['Qurtubi', 'Ibnu Kathir', 'Arobi', 'Urwah', 'Tabari'], 2: ['Hassan', 'Maliki', 'Sufian', 'Hanbali', 'Uthman'],
    3: ['Hanafi', 'Syafie', 'Suyuthi', 'Ar-Razi'], 4: ['Imanuddin', 'Nuruddin', 'Salahuddin', 'Thariq', 'Saifuddin'],
    5: ['Saad', 'Said', 'Salman', 'Suhaib', 'Sofwan'] },
  aktiviti: { 1: 'KHIDMAS (Khidmat Masyarakat)', 2: 'Kem Asas', 3: 'Ekspedisi', 4: 'Wafdul Amin (Keusahawanan)', 5: 'Eksplorasi' }
};

// ===== 2_Util.gs =====
/** Util.gs — ralat, pembersihan input, hash, had kadar. */

/** Ralat yang selamat ditunjukkan kepada pengguna. Ralat lain dibalas dengan mesej umum. */
function Ralat(kod, mesej) { var e = new Error(mesej); e.kod = kod; e.awam = true; return e; }

function sekarang() { return new Date().toISOString(); }

/** Buang aksara kawalan, kemaskan ruang, hadkan panjang. */
function bersih(v, maks) {
  var s = String(v === null || v === undefined ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return s.slice(0, maks || 120);
}

/** Halang formula injection: nilai bermula = + - @ ditulis sebagai teks. Dipanggil untuk SETIAP sel yang ditulis. */
function untukSheet(v) {
  var s = String(v === null || v === undefined ? '' : v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function hashPin(pin, salt) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pin, Utilities.Charset.UTF_8);
  return raw.map(function (b) { return ((b + 256) % 256).toString(16).padStart(2, '0'); }).join('');
}

/** Perbandingan yang tidak berhenti awal, supaya masa jawapan tidak membocorkan kunci. */
function samaSelamat(a, b) {
  a = String(a || ''); b = String(b || '');
  var beza = a.length ^ b.length;
  for (var i = 0; i < a.length; i++) beza |= a.charCodeAt(i) ^ b.charCodeAt(i % (b.length || 1));
  return beza === 0 && a.length > 0;
}

/** Pembilang dalam CacheService. Pulangkan bilangan selepas ditambah. */
function kira(kunci, saat) {
  var c = CacheService.getScriptCache();
  var n = Number(c.get(kunci) || 0) + 1;
  c.put(kunci, String(n), saat);
  return n;
}
function bilangan(kunci) { return Number(CacheService.getScriptCache().get(kunci) || 0); }

function prop(k) { return PropertiesService.getScriptProperties().getProperty(k); }

function log(oleh, aksi, sasaran, butiran) {
  tambah('log_audit', { masa: sekarang(), oleh: bersih(oleh, 80), aksi: aksi, sasaran: bersih(sasaran, 80), butiran: bersih(butiran, 300) });
}

// ===== 3_Repo.gs =====
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

// ===== 4_Awam.gs =====
/**
 * Awam.gs — aksi untuk laman pelajar. Tiada log masuk.
 * Pangkat dan jawatan TIDAK dipulangkan di sini kecuali melalui aksiTerperinci (perlukan PIN).
 */

function aksiRujukan() {
  var r = rujukan();
  return { tahun: tahunSemasa(), kelas: r.kelas, rumah: r.rumah, sukan: r.sukan, kebitaraan: r.kebitaraan,
    peringkat: PERINGKAT, pencapaian: PENCAPAIAN, maksMenunggu: MAKS_MENUNGGU };
}

function aksiCari(p) {
  var q = bersih(p.q, 60).toLowerCase();
  if (q.length < MIN_HURUF_CARIAN) throw Ralat('CARIAN_PENDEK', 'Taip sekurang-kurangnya ' + MIN_HURUF_CARIAN + ' huruf nama.');
  var token = q.split(' '), t = Number(p.tingkatan) || 0, k = bersih(p.kelas, 40);
  var padanan = indeks().filter(function (x) {
    if (t && x[2] !== t) return false;
    if (k && x[3] !== k) return false;
    var nama = x[1].toLowerCase();
    return token.every(function (w) { return nama.indexOf(w) !== -1; });
  });
  function mula(x) { return x[1].toLowerCase().split(' ').some(function (w) { return w.indexOf(token[0]) === 0; }) ? 0 : 1; }
  padanan.sort(function (a, b) { return mula(a) - mula(b) || a[1].localeCompare(b[1]); });
  return { jumlah: padanan.length, senarai: padanan.slice(0, MAKS_HASIL_CARIAN).map(function (x) { return { id: x[0], nama: x[1], tingkatan: x[2], kelas: x[3] }; }) };
}

function _pelajar(id) {
  id = bersih(id, 60);
  var p = id ? baca('pelajar').filter(function (x) { return x.id === id; })[0] : null;
  if (!p) throw Ralat('TIADA', 'Rekod pelajar tidak dijumpai.');
  return p;
}
function _rekodPencapaian(x) {
  return { id: x.id, tahun: Number(x.tahun), sukan: x.sukan, kejohanan: x.kejohanan, peringkat: x.peringkat, pencapaian: x.pencapaian,
    status: x.status === 'disahkan' ? 'Disahkan' : x.status === 'ditolak' ? 'Ditolak' : 'Menunggu pengesahan' };
}
function _pencapaianPelajar(id, status) {
  return baca('pencapaian').filter(function (x) { return x.pelajar_id === id && x.status === status; })
    .map(_rekodPencapaian).sort(function (a, b) { return b.tahun - a.tahun; });
}

function aksiProfil(p) {
  var s = _pelajar(p.id), tahun = String(tahunSemasa());
  return {
    id: s.id, nama: s.nama, tingkatan: Number(s.tingkatan), kelas: s.kelas, rumah: s.rumah,
    uniform: s.uniform, kelab: s.kelab, sukanRasmi: s.sukan_rasmi,
    aktivitiEkstra: rujukan().aktiviti[s.tingkatan] || '',
    wakil: baca('wakil').filter(function (w) { return w.pelajar_id === s.id && w.tahun === tahun; }).map(function (w) { return w.sukan; }),
    pencapaian: _pencapaianPelajar(s.id, 'disahkan').map(function (x) { delete x.id; return x; })
  };
}

function aksiTerperinci(p) {
  var s = _pelajar(p.id), kunci = 'pin_' + s.id;
  if (bilangan(kunci) >= PIN_MAKS_CUBA) throw Ralat('PIN_DIKUNCI', 'Terlalu banyak percubaan. Cuba lagi selepas 15 minit.');
  var r = baca('pin').filter(function (x) { return x.pelajar_id === s.id; })[0];
  var pin = String(p.pin || '').replace(/\D/g, '').slice(0, 8);
  var sah = r && r.luput > sekarang() && pin.length >= 4 && samaSelamat(hashPin(pin, r.salt), r.hash);
  if (!sah) { kira(kunci, PIN_KUNCI_SAAT); throw Ralat('PIN_SALAH', 'PIN tidak sah atau sudah luput.'); }
  return {
    pangkat: s.pangkat, jawatan: s.jawatan,
    sejarah: baca('rekod_tahunan').filter(function (x) { return x.pelajar_id === s.id; }).map(function (x) {
      return { tahun: Number(x.tahun), tingkatan: Number(x.tingkatan), uniform: x.uniform, pangkat: x.pangkat, kelab: x.kelab, jawatan: x.jawatan, sukanRasmi: x.sukan_rasmi };
    }).sort(function (a, b) { return b.tahun - a.tahun; }),
    menunggu: _pencapaianPelajar(s.id, 'menunggu').map(function (x) { delete x.id; return x; })
  };
}

function aksiHantar(p) {
  var r = rujukan(), tahun = tahunSemasa();
  var sukan = padan(r.sukan.concat(r.kebitaraan), p.sukan), peringkat = padan(PERINGKAT, p.peringkat), capai = padan(PENCAPAIAN, p.pencapaian);
  var kejohanan = bersih(p.kejohanan, 100), thn = Number(p.tahun);
  if (!sukan || !peringkat || !capai || kejohanan.length < 3 || !(thn <= tahun && thn >= tahun - 2)) throw Ralat('TIDAK_LENGKAP', 'Sila lengkapkan semua ruangan.');
  if (p.akuSijil !== true) throw Ralat('TIADA_AKUAN', 'Sila sahkan bahawa anda ada sijil atau bukti.');
  if (bilangan('hantar_sejam') >= MAKS_HANTAR_SEJAM) throw Ralat('SIBUK', 'Terlalu banyak penghantaran sekarang. Cuba lagi kemudian.');
  return denganKunci(function () {
    var s = _pelajar(p.id);
    var tunggu = baca('pencapaian').filter(function (x) { return x.pelajar_id === s.id && x.status === 'menunggu'; }).length;
    if (tunggu >= MAKS_MENUNGGU) throw Ralat('HAD_MENUNGGU', 'Sudah ada ' + MAKS_MENUNGGU + ' rekod menunggu pengesahan. Tunggu guru semak dahulu.');
    tambah('pencapaian', { id: Utilities.getUuid(), pelajar_id: s.id, tahun: thn, sukan: sukan, kejohanan: kejohanan, peringkat: peringkat,
      pencapaian: capai, status: 'menunggu', sumber: 'pelajar', dihantar_pada: sekarang() });
    kira('hantar_sejam', 3600);
    return { ok: true };
  });
}

function aksiGuru() {
  return baca('guru_koku').filter(function (g) { return g.nama && g.papar.toLowerCase() !== 'tidak'; })
    .sort(function (a, b) { return (Number(a.susunan) || 999) - (Number(b.susunan) || 999); })
    .map(function (g) { return { kumpulan: g.kumpulan || 'Guru kokurikulum', nama: g.nama, jawatan: g.jawatan, foto: /^https:\/\//.test(g.foto_url) ? g.foto_url : '' }; });
}

// ===== 5_Admin.gs =====
/**
 * Admin.gs — aksi pentadbir. Hanya dipanggil oleh backend Profil Guru (server ke server)
 * dengan KUNCI_ADMIN. Semakan peranan pentadbir dibuat di sana sebelum panggilan dihantar.
 * `oleh` ialah nama/e-mel pentadbir yang dihantar oleh backend itu, untuk log audit.
 */

// ---------------- pengesahan medan ----------------
/** Sahkan medan pelajar. Pulangkan { ok: {medan bersih}, ralat: [mesej] }. Hanya medan yang wujud dalam `m` disemak. */
function _sahMedan(m, tingkatanSedia) {
  var r = rujukan(), ok = {}, ralat = [];
  function ada(k) { return Object.prototype.hasOwnProperty.call(m, k) && m[k] !== null && m[k] !== undefined; }
  function pilih(k, senarai, label) {
    if (!ada(k)) return;
    var v = bersih(m[k]);
    if (!v) { ok[k] = ''; return; }
    var p = padan(senarai, v);
    if (p) ok[k] = p; else ralat.push(label + ' "' + v + '" tiada dalam senarai');
  }
  if (ada('nama')) { var n = bersih(m.nama, 120); if (n.length < 3) ralat.push('Nama terlalu pendek'); else ok.nama = n; }
  if (ada('no_daftar')) ok.no_daftar = bersih(m.no_daftar, 30);
  if (ada('jantina')) {
    var j = bersih(m.jantina, 12).toLowerCase();
    var jj = !j ? '' : /^(l|lelaki|banin)$/.test(j) ? 'L' : /^(p|perempuan|banat)$/.test(j) ? 'P' : null;
    if (jj === null) ralat.push('Jantina mesti L atau P'); else ok.jantina = jj;
  }
  if (ada('tingkatan') && bersih(m.tingkatan) !== '') {
    var t = Number(String(m.tingkatan).replace(/\D/g, ''));
    if (t >= 1 && t <= 5) ok.tingkatan = t; else ralat.push('Tingkatan mesti 1 hingga 5');
  }
  if (ada('kelas')) {
    var k = bersih(m.kelas, 40).replace(/^\d\s+/, ''), ting = ok.tingkatan || Number(tingkatanSedia) || 0;
    if (!k) ok.kelas = '';
    else {
      var jumpa = null, tJumpa = 0;
      Object.keys(r.kelas).forEach(function (tt) { var p = padan(r.kelas[tt], k); if (p) { jumpa = p; tJumpa = Number(tt); } });
      if (!jumpa) ralat.push('Kelas "' + k + '" tiada dalam senarai');
      else if (ting && ting !== tJumpa) ralat.push('Kelas ' + jumpa + ' ialah kelas tingkatan ' + tJumpa + ', bukan ' + ting);
      else { ok.kelas = jumpa; if (!ting) ok.tingkatan = tJumpa; }
    }
  }
  pilih('rumah', Object.keys(r.rumah), 'Rumah sukan');
  pilih('uniform', r.uniform, 'Badan beruniform');
  pilih('kelab', r.kelab, 'Kelab');
  pilih('sukan_rasmi', r.sukan, 'Sukan');
  if (ada('pangkat')) ok.pangkat = bersih(m.pangkat, 60);
  if (ada('jawatan')) ok.jawatan = bersih(m.jawatan, 60);
  return { ok: ok, ralat: ralat };
}
function _belum(p) { return MEDAN_WAJIB.filter(function (k) { return !p[k]; }); }
function _cap(p, oleh) { p.dikemas_kini = sekarang(); p.oleh = bersih(oleh, 80); return p; }

// ---------------- rujukan, ringkasan, direktori ----------------
function adminRujukan() {
  var r = rujukan();
  return { tahun: tahunSemasa(), kelas: r.kelas, rumah: r.rumah, uniform: r.uniform, kelab: r.kelab, sukan: r.sukan,
    kebitaraan: r.kebitaraan, aktiviti: r.aktiviti, peringkat: PERINGKAT, pencapaian: PENCAPAIAN, medanWajib: MEDAN_WAJIB };
}

function adminRingkasan() {
  var semua = baca('pelajar'), belum = {}, rumah = {}, tingkatan = {}, lengkap = 0;
  MEDAN_WAJIB.forEach(function (k) { belum[k] = 0; });
  semua.forEach(function (p) {
    var b = _belum(p);
    if (!b.length) lengkap++;
    b.forEach(function (k) { belum[k]++; });
    rumah[p.rumah || '(belum diisi)'] = (rumah[p.rumah || '(belum diisi)'] || 0) + 1;
    tingkatan[p.tingkatan] = (tingkatan[p.tingkatan] || 0) + 1;
  });
  return { tahun: tahunSemasa(), jumlah: semua.length, lengkap: lengkap, tidakLengkap: semua.length - lengkap, belum: belum, rumah: rumah, tingkatan: tingkatan,
    menunggu: baca('pencapaian').filter(function (x) { return x.status === 'menunggu'; }).length };
}

/** Direktori pelajar dengan penapis. `belum` boleh jadi true (mana-mana medan) atau nama medan. */
function adminPelajarSenarai(p) {
  var q = bersih(p.q, 60).toLowerCase().split(' ').filter(String);
  var sama = ['kelas', 'rumah', 'uniform', 'kelab', 'sukan_rasmi', 'jantina'];
  var out = baca('pelajar').filter(function (s) {
    if (p.tingkatan && Number(s.tingkatan) !== Number(p.tingkatan)) return false;
    for (var i = 0; i < sama.length; i++) if (p[sama[i]] && s[sama[i]] !== p[sama[i]]) return false;
    if (p.belum === true && !_belum(s).length) return false;
    if (typeof p.belum === 'string' && p.belum && s[p.belum]) return false;
    var nama = (s.nama + ' ' + s.no_daftar).toLowerCase();
    return q.every(function (w) { return nama.indexOf(w) !== -1; });
  }).map(function (s) { var o = {}; SKEMA.pelajar.forEach(function (k) { o[k] = s[k]; }); o.tingkatan = Number(s.tingkatan); o.belum = _belum(s); return o; });
  out.sort(function (a, b) { return a.tingkatan - b.tingkatan || a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama); });
  return { jumlah: out.length, senarai: out };
}

// ---------------- simpan pelajar ----------------
function adminPelajarSimpan(p, oleh) {
  return denganKunci(function () {
    var semua = baca('pelajar'), s = p.id ? semua.filter(function (x) { return x.id === p.id; })[0] : null;
    if (p.id && !s) throw Ralat('TIADA', 'Rekod pelajar tidak dijumpai.');
    var v = _sahMedan(p, s && s.tingkatan);
    if (v.ralat.length) throw Ralat('TIDAK_SAH', v.ralat.join('; '));
    if (!s) {
      if (!v.ok.nama || !v.ok.tingkatan) throw Ralat('TIDAK_SAH', 'Nama dan tingkatan diperlukan.');
      s = { id: Utilities.getUuid() };
      semua.push(s);
    }
    Object.keys(v.ok).forEach(function (k) { s[k] = v.ok[k]; });
    _cap(s, oleh);
    tulis('pelajar', semua);
    log(oleh, 'PELAJAR_SIMPAN', s.id, s.nama);
    return { id: s.id };
  });
}

/**
 * Import pukal. baris: [{ no_daftar, nama, tingkatan, kelas, rumah, uniform, pangkat, kelab, jawatan, sukan_rasmi, jantina }]
 * Padanan dengan pelajar sedia ada: no_daftar jika ada, jika tidak nama penuh (mesti unik).
 * Ruangan kosong TIDAK memadam nilai sedia ada, jadi boleh import satu lajur sahaja (contoh: nama + rumah).
 * laksana=false hanya menyemak (pratonton); laksana=true menyimpan baris yang sah.
 */
function adminPelajarImport(p, oleh) {
  var baris = p.baris;
  if (!Array.isArray(baris) || !baris.length || baris.length > 1500) throw Ralat('TIDAK_SAH', 'Import mesti antara 1 dan 1500 baris.');
  return denganKunci(function () {
    var semua = baca('pelajar'), ikutNo = {}, ikutNama = {};
    semua.forEach(function (s) {
      if (s.no_daftar) ikutNo[s.no_daftar.toLowerCase()] = s;
      var n = s.nama.toLowerCase(); (ikutNama[n] = ikutNama[n] || []).push(s);
    });
    var ralat = [], baharu = 0, dikemas = 0, sama = 0;
    baris.forEach(function (b, i) {
      var isi = {};
      MEDAN_PELAJAR_BOLEH_UBAH.forEach(function (k) { if (b && bersih(b[k]) !== '') isi[k] = b[k]; });
      var no = bersih(isi.no_daftar, 30).toLowerCase(), nama = bersih(isi.nama, 120).toLowerCase(), s = null;
      if (no && ikutNo[no]) s = ikutNo[no];
      else if (nama && ikutNama[nama]) {
        if (ikutNama[nama].length > 1) { ralat.push({ baris: i + 1, mesej: 'Ada lebih daripada seorang bernama "' + bersih(isi.nama) + '". Guna no_daftar.' }); return; }
        s = ikutNama[nama][0];
      }
      var v = _sahMedan(isi, s && s.tingkatan);
      if (!s && (!v.ok.nama || !v.ok.tingkatan)) v.ralat.unshift('Pelajar baharu perlukan nama dan tingkatan');
      if (v.ralat.length) { ralat.push({ baris: i + 1, mesej: v.ralat.join('; ') }); return; }
      if (!s) {
        s = { id: Utilities.getUuid() };
        SKEMA.pelajar.forEach(function (k) { if (!(k in s)) s[k] = ''; });
        semua.push(s); baharu++;
        if (v.ok.no_daftar) ikutNo[v.ok.no_daftar.toLowerCase()] = s;
        (ikutNama[v.ok.nama.toLowerCase()] = ikutNama[v.ok.nama.toLowerCase()] || []).push(s);
      } else {
        var ubah = Object.keys(v.ok).some(function (k) { return String(s[k]) !== String(v.ok[k]); });
        if (ubah) dikemas++; else { sama++; return; }
      }
      Object.keys(v.ok).forEach(function (k) { s[k] = v.ok[k]; });
      _cap(s, oleh);
    });
    if (p.laksana === true && (baharu || dikemas)) {
      tulis('pelajar', semua);
      log(oleh, 'PELAJAR_IMPORT', '', baharu + ' baharu, ' + dikemas + ' dikemas kini, ' + ralat.length + ' ralat');
    }
    return { disimpan: p.laksana === true, baharu: baharu, dikemas: dikemas, tiadaPerubahan: sama, ralat: ralat };
  });
}

/** Tetapkan medan yang sama untuk ramai pelajar (contoh: 30 pelajar -> Kelab Digital). */
function adminPukalMedan(p, oleh) {
  if (!Array.isArray(p.ids) || !p.ids.length) throw Ralat('TIDAK_SAH', 'Tiada pelajar dipilih.');
  var m = {};
  ['kelas', 'rumah', 'uniform', 'pangkat', 'kelab', 'jawatan', 'sukan_rasmi'].forEach(function (k) { if (p.medan && k in p.medan) m[k] = p.medan[k]; });
  if (!Object.keys(m).length) throw Ralat('TIDAK_SAH', 'Tiada medan untuk dikemas kini.');
  return denganKunci(function () {
    var semua = baca('pelajar'), pilih = {}, n = 0;
    p.ids.forEach(function (id) { pilih[id] = true; });
    semua.forEach(function (s) {
      if (!pilih[s.id]) return;
      var v = _sahMedan(m, s.tingkatan);
      if (v.ralat.length) throw Ralat('TIDAK_SAH', s.nama + ': ' + v.ralat.join('; '));
      Object.keys(v.ok).forEach(function (k) { if (k !== 'tingkatan') s[k] = v.ok[k]; });
      _cap(s, oleh); n++;
    });
    tulis('pelajar', semua);
    log(oleh, 'PUKAL_MEDAN', n + ' pelajar', JSON.stringify(m));
    return { dikemas: n };
  });
}

function adminPelajarPadam(p, oleh) {
  return denganKunci(function () {
    var s = _pelajar(p.id);
    tulis('pelajar', baca('pelajar').filter(function (x) { return x.id !== s.id; }));
    ['wakil', 'pencapaian', 'rekod_tahunan', 'pin'].forEach(function (t) {
      var semua = baca(t), tinggal = semua.filter(function (x) { return x.pelajar_id !== s.id; });
      if (tinggal.length !== semua.length) tulis(t, tinggal);
    });
    log(oleh, 'PELAJAR_PADAM', s.id, s.nama);
    return { ok: true };
  });
}

// ---------------- wakil sekolah dan pencapaian ----------------
function adminWakilSimpan(p, oleh) {
  return denganKunci(function () {
    var s = _pelajar(p.pelajar_id), tahun = String(tahunSemasa()), r = rujukan(), senarai = [];
    (p.sukan || []).forEach(function (x) {
      var v = padan(r.sukan.concat(r.kebitaraan), x);
      if (!v) throw Ralat('TIDAK_SAH', 'Sukan "' + bersih(x) + '" tiada dalam senarai');
      if (senarai.indexOf(v) === -1) senarai.push(v);
    });
    var lain = baca('wakil').filter(function (w) { return !(w.pelajar_id === s.id && w.tahun === tahun); });
    tulis('wakil', lain.concat(senarai.map(function (v) { return { id: Utilities.getUuid(), pelajar_id: s.id, tahun: tahun, sukan: v }; })));
    log(oleh, 'WAKIL_SIMPAN', s.id, senarai.join(', '));
    return { sukan: senarai };
  });
}

function adminPencapaianSenarai(p) {
  var nama = {};
  baca('pelajar').forEach(function (s) { nama[s.id] = s; });
  var out = baca('pencapaian').filter(function (x) {
    return (!p.status || x.status === p.status) && (!p.pelajar_id || x.pelajar_id === p.pelajar_id);
  }).map(function (x) {
    var s = nama[x.pelajar_id] || {}, o = _rekodPencapaian(x);
    o.status = x.status; o.pelajar_id = x.pelajar_id; o.nama = s.nama || '(pelajar dipadam)'; o.tingkatan = Number(s.tingkatan) || 0; o.kelas = s.kelas || '';
    o.sumber = x.sumber; o.dihantar_pada = x.dihantar_pada; o.diputus_oleh = x.diputus_oleh; o.catatan = x.catatan;
    return o;
  });
  out.sort(function (a, b) { return String(b.dihantar_pada).localeCompare(String(a.dihantar_pada)); });
  return { jumlah: out.length, senarai: out };
}

/** Sahkan atau tolak rekod yang dihantar pelajar. */
function adminPencapaianPutus(p, oleh) {
  if (['disahkan', 'ditolak'].indexOf(p.keputusan) === -1) throw Ralat('TIDAK_SAH', 'Keputusan mesti disahkan atau ditolak.');
  return denganKunci(function () {
    var semua = baca('pencapaian'), x = semua.filter(function (r) { return r.id === p.id; })[0];
    if (!x) throw Ralat('TIADA', 'Rekod pencapaian tidak dijumpai.');
    x.status = p.keputusan; x.diputus_oleh = bersih(oleh, 80); x.diputus_pada = sekarang(); x.catatan = bersih(p.catatan, 200);
    tulis('pencapaian', semua);
    log(oleh, 'PENCAPAIAN_' + p.keputusan.toUpperCase(), x.id, x.kejohanan);
    return { ok: true };
  });
}

/** Guru tambah atau sunting rekod pencapaian terus (status disahkan). */
function adminPencapaianSimpan(p, oleh) {
  var r = rujukan(), sukan = padan(r.sukan.concat(r.kebitaraan), p.sukan), peringkat = padan(PERINGKAT, p.peringkat), capai = padan(PENCAPAIAN, p.pencapaian);
  var kejohanan = bersih(p.kejohanan, 100), thn = Number(p.tahun);
  if (!sukan || !peringkat || !capai || kejohanan.length < 3 || !(thn >= 2000 && thn <= tahunSemasa())) throw Ralat('TIDAK_SAH', 'Sila lengkapkan semua ruangan dengan nilai yang sah.');
  return denganKunci(function () {
    var semua = baca('pencapaian'), x = p.id ? semua.filter(function (q) { return q.id === p.id; })[0] : null;
    if (p.id && !x) throw Ralat('TIADA', 'Rekod pencapaian tidak dijumpai.');
    if (!x) { x = { id: Utilities.getUuid(), pelajar_id: _pelajar(p.pelajar_id).id, sumber: 'guru', dihantar_pada: sekarang() }; semua.push(x); }
    x.tahun = thn; x.sukan = sukan; x.kejohanan = kejohanan; x.peringkat = peringkat; x.pencapaian = capai;
    x.status = 'disahkan'; x.diputus_oleh = bersih(oleh, 80); x.diputus_pada = sekarang();
    tulis('pencapaian', semua);
    log(oleh, 'PENCAPAIAN_SIMPAN', x.id, kejohanan);
    return { id: x.id };
  });
}
function adminPencapaianPadam(p, oleh) {
  return denganKunci(function () {
    var semua = baca('pencapaian'), tinggal = semua.filter(function (x) { return x.id !== p.id; });
    if (tinggal.length === semua.length) throw Ralat('TIADA', 'Rekod pencapaian tidak dijumpai.');
    tulis('pencapaian', tinggal);
    log(oleh, 'PENCAPAIAN_PADAM', p.id, '');
    return { ok: true };
  });
}

// ---------------- PIN ----------------
/** Jana PIN 6 digit untuk seorang pelajar. PIN hanya dipulangkan SEKALI di sini; Sheet menyimpan hash sahaja. */
function adminPinJana(p, oleh) {
  return denganKunci(function () {
    var s = _pelajar(p.pelajar_id), hari = Math.min(Math.max(Number(p.hari) || PIN_HARI_LALAI, 1), 30);
    var pin = String(parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 10), 16) % 1000000).padStart(6, '0');
    var salt = Utilities.getUuid(), luput = new Date(Date.now() + hari * 86400000).toISOString();
    var lain = baca('pin').filter(function (x) { return x.pelajar_id !== s.id; });
    tulis('pin', lain.concat([{ pelajar_id: s.id, hash: hashPin(pin, salt), salt: salt, luput: luput, dicipta_oleh: bersih(oleh, 80), dicipta_pada: sekarang() }]));
    CacheService.getScriptCache().remove('pin_' + s.id);
    log(oleh, 'PIN_JANA', s.id, s.nama);
    return { pin: pin, luput: luput, nama: s.nama };
  });
}
function adminPinBatal(p, oleh) {
  return denganKunci(function () {
    var s = _pelajar(p.pelajar_id);
    tulis('pin', baca('pin').filter(function (x) { return x.pelajar_id !== s.id; }));
    log(oleh, 'PIN_BATAL', s.id, s.nama);
    return { ok: true };
  });
}

// ---------------- guru koku ----------------
function adminGuruSenarai() { return { senarai: baca('guru_koku') }; }
function adminGuruSimpan(p, oleh) {
  if (!Array.isArray(p.senarai) || p.senarai.length > 100) throw Ralat('TIDAK_SAH', 'Senarai guru tidak sah.');
  var baris = p.senarai.map(function (g, i) {
    var foto = bersih(g.foto_url, 300);
    if (foto && !/^https:\/\//.test(foto)) throw Ralat('TIDAK_SAH', 'Pautan gambar mesti bermula dengan https://');
    return { susunan: i + 1, kumpulan: bersih(g.kumpulan, 60), nama: bersih(g.nama, 120), jawatan: bersih(g.jawatan, 120), foto_url: foto, papar: g.papar === false || g.papar === 'tidak' ? 'tidak' : 'ya' };
  }).filter(function (g) { return g.nama; });
  return denganKunci(function () { tulis('guru_koku', baris); log(oleh, 'GURU_SIMPAN', '', baris.length + ' guru'); return { jumlah: baris.length }; });
}

// ---------------- kenaikan tahun dan arkib ----------------
/**
 * Kenaikan tahun. laksana=false memulangkan ringkasan sahaja.
 * laksana=true memerlukan sahkan === 'NAIK <tahun baharu>'.
 *  1. Rekod semua pelajar tahun ini disalin ke rekod_tahunan (snapshot).
 *  2. Pelajar tingkatan 5 dipindah ke Sheet arkib bersama rekod, pencapaian dan wakil mereka.
 *  3. Pelajar lain naik satu tingkatan; kelas dikosongkan (import kelas baharu selepas ini).
 *     Rumah, unit beruniform, pangkat, kelab, jawatan dan sukan rasmi DIKEKALKAN.
 *  4. Semua PIN dibatalkan dan tahun_semasa ditambah satu.
 */
function adminNaikTahun(p, oleh) {
  return denganKunci(function () {
    var tahun = tahunSemasa(), baharu = tahun + 1, semua = baca('pelajar'), akt = rujukan().aktiviti;
    var tamat = semua.filter(function (s) { return Number(s.tingkatan) >= 5; }), naik = semua.filter(function (s) { return Number(s.tingkatan) < 5; });
    var ringkas = { tahunSemasa: tahun, tahunBaharu: baharu, naik: naik.length, tamat: tamat.length, tidakLengkap: semua.filter(function (s) { return _belum(s).length; }).length };
    if (p.laksana !== true) return ringkas;
    if (p.sahkan !== 'NAIK ' + baharu) throw Ralat('TIDAK_SAH', 'Taip "NAIK ' + baharu + '" untuk mengesahkan.');
    var rekod = baca('rekod_tahunan');
    if (rekod.some(function (x) { return Number(x.tahun) === tahun; })) throw Ralat('SUDAH', 'Rekod tahunan ' + tahun + ' sudah wujud. Kenaikan tahun tidak dijalankan dua kali.');

    rekod = rekod.concat(semua.map(function (s) {
      return { tahun: tahun, pelajar_id: s.id, nama: s.nama, tingkatan: s.tingkatan, kelas: s.kelas, rumah: s.rumah, uniform: s.uniform, pangkat: s.pangkat,
        kelab: s.kelab, jawatan: s.jawatan, sukan_rasmi: s.sukan_rasmi, aktiviti_ekstra: akt[s.tingkatan] || '' };
    }));
    var keluar = {};
    tamat.forEach(function (s) { keluar[s.id] = true; });
    function asing(senarai) { return [senarai.filter(function (x) { return keluar[x.pelajar_id]; }), senarai.filter(function (x) { return !keluar[x.pelajar_id]; })]; }
    var aR = asing(rekod), aP = asing(baca('pencapaian')), aW = asing(baca('wakil'));

    // Tulis arkib DAHULU. Jika langkah ini gagal, Sheet utama belum disentuh.
    tambahBanyak('pelajar', tamat.map(function (s) { var o = {}; SKEMA.pelajar.forEach(function (k) { o[k] = s[k]; }); o.tahun_tamat = tahun; return o; }), true);
    tambahBanyak('rekod_tahunan', aR[0], true);
    tambahBanyak('pencapaian', aP[0], true);
    tambahBanyak('wakil', aW[0], true);

    naik.forEach(function (s) { s.tingkatan = Number(s.tingkatan) + 1; s.kelas = ''; _cap(s, oleh); });
    tulis('pelajar', naik);
    tulis('rekod_tahunan', aR[1]);
    tulis('pencapaian', aP[1]);
    tulis('wakil', aW[1]);
    tulis('pin', []);
    tulis('tetapan', baca('tetapan').filter(function (t) { return t.kunci !== 'tahun_semasa'; }).concat([{ kunci: 'tahun_semasa', nilai: baharu }]));
    _ruj = null;
    log(oleh, 'NAIK_TAHUN', String(baharu), naik.length + ' naik, ' + tamat.length + ' tamat dan diarkib');
    ringkas.selesai = true;
    return ringkas;
  });
}

/** Padam rekod arkib pelajar yang sudah tamat lebih daripada TAHUN_SIMPAN_ARKIB tahun. Tidak boleh dipulihkan. */
function adminArkibBersih(p, oleh) {
  var had = tahunSemasa() - TAHUN_SIMPAN_ARKIB;
  return denganKunci(function () {
    var v = tab('pelajar', true).getDataRange().getValues(), tajuk = v[0] || [];
    var iT = tajuk.indexOf('tahun_tamat'), iId = tajuk.indexOf('id'), buang = {}, n = 0;
    for (var i = 1; i < v.length; i++) if (Number(v[i][iT]) && Number(v[i][iT]) < had) { buang[String(v[i][iId])] = true; n++; }
    if (p.laksana !== true) return { akanDipadam: n, tamatSebelum: had };
    if (p.sahkan !== 'PADAM ARKIB') throw Ralat('TIDAK_SAH', 'Taip "PADAM ARKIB" untuk mengesahkan.');
    Object.keys(SKEMA_ARKIB).forEach(function (nama) {
      var s = tab(nama, true), d = s.getDataRange().getValues(), t = d[0] || [], kol = t.indexOf(nama === 'pelajar' ? 'id' : 'pelajar_id');
      var tinggal = d.filter(function (r, i) { return i === 0 || !buang[String(r[kol])]; });
      s.clearContents();
      s.getRange(1, 1, tinggal.length, t.length).setValues(tinggal.map(function (r) { return r.map(untukSheet); }));
    });
    log(oleh, 'ARKIB_BERSIH', '', n + ' pelajar tamat sebelum ' + had);
    return { dipadam: n, tamatSebelum: had };
  });
}

function adminLog(p) {
  var semua = baca('log_audit'), had = Math.min(Number(p.had) || 100, 500);
  return { senarai: semua.slice(-had).reverse() };
}

// ===== 6_Api.gs =====
/**
 * Api.gs — satu pintu masuk untuk semua permintaan.
 *
 * Permintaan (POST, badan JSON):
 *   Laman pelajar : { "action": "CARI", "params": { ... } }
 *   Pentadbir     : { "action": "A_...", "kunci": "<KUNCI_ADMIN>", "oleh": "nama pentadbir", "params": { ... } }
 * Jawapan: { "ok": true, "data": ... } atau { "ok": false, "code": "KOD", "message": "..." }
 *
 * SENARAI SEMUA AKSI. Semak di sini dahulu ketika audit keselamatan.
 * Aksi tanpa `admin: true` terbuka kepada umum, jadi ia hanya boleh memulangkan medan awam.
 */
function getActions() {
  return {
    RUJUKAN:    { handler: aksiRujukan },
    CARI:       { handler: aksiCari },
    PROFIL:     { handler: aksiProfil },
    TERPERINCI: { handler: aksiTerperinci },   // perlukan PIN pelajar
    HANTAR:     { handler: aksiHantar },       // rekod masuk sebagai "menunggu"
    GURU:       { handler: aksiGuru },

    A_RUJUKAN:            { admin: true, handler: adminRujukan },
    A_RINGKASAN:          { admin: true, handler: adminRingkasan },
    A_PELAJAR_SENARAI:    { admin: true, handler: adminPelajarSenarai },
    A_PELAJAR_SIMPAN:     { admin: true, handler: adminPelajarSimpan },
    A_PELAJAR_IMPORT:     { admin: true, handler: adminPelajarImport },
    A_PELAJAR_PADAM:      { admin: true, handler: adminPelajarPadam },
    A_PUKAL_MEDAN:        { admin: true, handler: adminPukalMedan },
    A_WAKIL_SIMPAN:       { admin: true, handler: adminWakilSimpan },
    A_PENCAPAIAN_SENARAI: { admin: true, handler: adminPencapaianSenarai },
    A_PENCAPAIAN_PUTUS:   { admin: true, handler: adminPencapaianPutus },
    A_PENCAPAIAN_SIMPAN:  { admin: true, handler: adminPencapaianSimpan },
    A_PENCAPAIAN_PADAM:   { admin: true, handler: adminPencapaianPadam },
    A_PIN_JANA:           { admin: true, handler: adminPinJana },
    A_PIN_BATAL:          { admin: true, handler: adminPinBatal },
    A_GURU_SENARAI:       { admin: true, handler: adminGuruSenarai },
    A_GURU_SIMPAN:        { admin: true, handler: adminGuruSimpan },
    A_NAIK_TAHUN:         { admin: true, handler: adminNaikTahun },
    A_ARKIB_BERSIH:       { admin: true, handler: adminArkibBersih },
    A_LOG:                { admin: true, handler: adminLog }
  };
}

function kendali(body) {
  try {
    var a = getActions()[String(body && body.action || '')];
    var params = body && typeof body.params === 'object' && body.params ? body.params : {};
    // Aksi tidak dikenali dan aksi admin tanpa kunci sah mendapat jawapan yang sama,
    // supaya orang luar tidak dapat meneka senarai aksi.
    if (!a || (a.admin && !samaSelamat(body.kunci, prop('KUNCI_ADMIN')))) return { ok: false, code: 'TIDAK_DIBENARKAN', message: 'Permintaan tidak dibenarkan.' };
    return { ok: true, data: a.handler(params, a.admin ? bersih(body.oleh, 80) || 'pentadbir' : '') };
  } catch (e) {
    if (e && e.awam) return { ok: false, code: e.kod, message: e.message };
    console.error(e && e.stack || e);
    return { ok: false, code: 'RALAT', message: 'Ralat sistem. Cuba lagi sebentar.' };
  }
}

function doPost(e) {
  var body = null;
  try { body = JSON.parse(e.postData.contents); } catch (err) { body = null; }
  return ContentService.createTextOutput(JSON.stringify(kendali(body))).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: { sistem: 'Koku SMIAAG' } })).setMimeType(ContentService.MimeType.JSON);
}

// ===== 7_Setup.gs =====
/**
 * Setup.gs — penyediaan sekali dan menu dalam Sheet.
 * Skrip ini mesti dibuka dari Sheet utama (Extensions > Apps Script) supaya menu muncul.
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Koku SMIAAG')
    .addItem('1. Sediakan sistem', 'menuSedia')
    .addItem('2. Semak tab pelajar', 'menuSemakPelajar')
    .addItem('Tunjuk kunci admin', 'menuKunci')
    .addSeparator()
    .addItem('Isi data contoh (ujian sahaja)', 'menuDataContoh')
    .addToUi();
}
function menuSedia() { SpreadsheetApp.getUi().alert(sediaSistem()); }
function menuSemakPelajar() { SpreadsheetApp.getUi().alert(semakTabPelajar()); }
function menuKunci() { SpreadsheetApp.getUi().alert('KUNCI_ADMIN (jangan kongsi, jangan letak dalam frontend):\n\n' + prop('KUNCI_ADMIN')); }
function menuDataContoh() { SpreadsheetApp.getUi().alert(isiDataContoh()); }

function _sediaTab(buku, nama, lajur) {
  var s = buku.getSheetByName(nama) || buku.insertSheet(nama);
  // Format teks supaya Sheet tidak menukar "001" jadi 1 atau teks jadi tarikh.
  s.getRange(1, 1, s.getMaxRows(), Math.max(lajur.length, 1)).setNumberFormat('@');
  if (s.getLastRow() === 0) s.getRange(1, 1, 1, lajur.length).setValues([lajur]);
  s.setFrozenRows(1);
  return s;
}

/** Cipta semua tab, isi rujukan lalai, jana kunci admin dan Sheet arkib. Selamat dijalankan berulang kali. */
function sediaSistem() {
  var P = PropertiesService.getScriptProperties(), nota = [];
  var utama = SpreadsheetApp.getActiveSpreadsheet();
  P.setProperty('SHEET_ID', utama.getId());
  Object.keys(SKEMA).forEach(function (n) { _sediaTab(utama, n, SKEMA[n]); });

  if (!P.getProperty('ARKIB_ID')) {
    var arkib = SpreadsheetApp.create('Arkib ' + utama.getName());
    P.setProperty('ARKIB_ID', arkib.getId());
    nota.push('Sheet arkib dicipta: ' + arkib.getUrl());
  }
  var bukuArkib = SpreadsheetApp.openById(P.getProperty('ARKIB_ID'));
  Object.keys(SKEMA_ARKIB).forEach(function (n) { _sediaTab(bukuArkib, n, SKEMA_ARKIB[n]); });

  if (!P.getProperty('KUNCI_ADMIN')) {
    P.setProperty('KUNCI_ADMIN', (Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''));
    nota.push('Kunci admin dijana. Lihat melalui menu "Tunjuk kunci admin".');
  }
  _ss = {}; _baca = {}; _ruj = null;
  if (!baca('rujukan').length) {
    var L = RUJUKAN_LALAI, baris = [];
    L.rumah.forEach(function (r) { baris.push({ jenis: 'rumah', nilai: r[0], warna: r[1] }); });
    ['uniform', 'kelab', 'sukan', 'kebitaraan'].forEach(function (j) { L[j].forEach(function (v) { baris.push({ jenis: j, nilai: v }); }); });
    Object.keys(L.kelas).forEach(function (t) { L.kelas[t].forEach(function (k) { baris.push({ jenis: 'kelas', nilai: k, tingkatan: t }); }); });
    Object.keys(L.aktiviti).forEach(function (t) { baris.push({ jenis: 'aktiviti', nilai: L.aktiviti[t], tingkatan: t }); });
    tulis('rujukan', baris);
    nota.push('Senarai rujukan diisi (' + baris.length + ' baris).');
  }
  if (!baca('tetapan').length) tulis('tetapan', [{ kunci: 'tahun_semasa', nilai: new Date().getFullYear() }]);
  return 'Sistem sedia.\n' + nota.join('\n');
}

/**
 * Untuk pentadbir yang menaip atau menampal terus ke tab `pelajar`:
 * beri id kepada baris tanpa id, betulkan ejaan ikut senarai rujukan, dan laporkan baris bermasalah.
 */
function semakTabPelajar() {
  return denganKunci(function () {
    var semua = baca('pelajar'), ralat = [], idBaharu = 0;
    semua.forEach(function (s, i) {
      if (!s.id) { s.id = Utilities.getUuid(); idBaharu++; }
      var m = {};
      MEDAN_PELAJAR_BOLEH_UBAH.forEach(function (k) { m[k] = s[k] || ''; });
      var v = _sahMedan(m, 0);
      if (!v.ok.tingkatan) v.ralat.push('Tingkatan kosong');
      Object.keys(v.ok).forEach(function (k) { s[k] = v.ok[k]; });
      if (v.ralat.length) ralat.push('Baris ' + (i + 2) + ' (' + (s.nama || '?') + '): ' + v.ralat.join('; '));
    });
    tulis('pelajar', semua);
    return semua.length + ' pelajar disemak, ' + idBaharu + ' id baharu diberi.\n' +
      (ralat.length ? ralat.length + ' baris bermasalah:\n' + ralat.slice(0, 30).join('\n') : 'Tiada masalah.');
  });
}

/** Data rekaan untuk menguji sistem sebelum data sebenar dimasukkan. Hanya berjalan jika tab pelajar kosong. */
function isiDataContoh() {
  if (baca('pelajar').length) return 'Tab pelajar tidak kosong. Data contoh tidak dimasukkan.';
  var r = rujukan(), rumah = Object.keys(r.rumah), n = 0, baris = [];
  var NAMA = ['Aiman', 'Balqis', 'Danish', 'Fatimah', 'Hakim', 'Insyirah', 'Luqman', 'Maryam'];
  Object.keys(r.kelas).forEach(function (t) {
    r.kelas[t].forEach(function (k) {
      for (var i = 0; i < 3; i++) {
        var lelaki = n % 2 === 0;
        baris.push({ id: Utilities.getUuid(), no_daftar: 'C' + String(++n).padStart(4, '0'),
          nama: 'Contoh ' + NAMA[n % NAMA.length] + ' ' + (lelaki ? 'bin' : 'binti') + ' Ujian ' + n, jantina: lelaki ? 'L' : 'P',
          tingkatan: t, kelas: k, rumah: rumah[n % rumah.length], uniform: n % 7 === 0 ? '' : r.uniform[n % 3], pangkat: n % 5 === 0 ? 'Koperal' : 'Ahli',
          kelab: r.kelab[n % r.kelab.length], jawatan: n % 9 === 0 ? 'Setiausaha' : 'Ahli', sukan_rasmi: n % 11 === 0 ? '' : r.sukan[n % r.sukan.length],
          dikemas_kini: sekarang(), oleh: 'data contoh' });
      }
    });
  });
  tulis('pelajar', baris);
  tulis('guru_koku', [{ susunan: 1, kumpulan: 'Pengurusan Kokurikulum', nama: 'Ustaz Contoh Satu', jawatan: 'Penolong Kanan Kokurikulum', papar: 'ya' },
    { susunan: 2, kumpulan: 'Penyelaras', nama: 'Cikgu Contoh Dua', jawatan: 'Penyelaras Sukan dan Permainan', papar: 'ya' }]);
  return baris.length + ' pelajar contoh dimasukkan.';
}
