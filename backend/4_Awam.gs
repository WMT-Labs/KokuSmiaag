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
