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
