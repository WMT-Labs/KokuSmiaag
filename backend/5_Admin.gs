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
