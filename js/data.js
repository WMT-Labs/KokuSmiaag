/* DATA REKAAN untuk mod demo sahaja. Fail ini dibuang bila sistem disambung ke Apps Script.
   700 pelajar dijana secara tetap (seed sama = data sama setiap kali). */
(function () {
  var C = window.KOKU_CONFIG;

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var r = rng(20260116);
  function pick(arr) { return arr[Math.floor(r() * arr.length)]; }

  var BANIN = ['Ahmad', 'Muhammad', 'Aiman', 'Danish', 'Hakim', 'Irfan', 'Luqman', 'Haziq', 'Amir', 'Syafiq',
    'Adam', 'Harith', 'Izzat', 'Faris', 'Umar', 'Zafran', 'Afiq', 'Naufal', 'Rayyan', 'Thaqif',
    'Anas', 'Hafiz', 'Imran', 'Khairul', 'Wafiq', 'Ikhwan', 'Aqil', 'Mikhail', 'Yusuf', 'Zikri'];
  var BANAT = ['Nur', 'Siti', 'Aisyah', 'Fatimah', 'Hannah', 'Balqis', 'Damia', 'Insyirah', 'Khadijah', 'Maryam',
    'Alya', 'Batrisyia', 'Husna', 'Iman', 'Qistina', 'Sofea', 'Safiyyah', 'Zahra', 'Amni', 'Athirah',
    'Farhana', 'Humaira', 'Irdina', 'Nabilah', 'Raihanah', 'Sumayyah', 'Syifa', 'Wardah', 'Yasmin', 'Zulaikha'];
  var KEDUA_L = ['Danial', 'Hazim', 'Iskandar', 'Firdaus', 'Aqmal', 'Zuhair', 'Syahmi', 'Arif', 'Fahmi', 'Nabil', ''];
  var KEDUA_P = ['Aina', 'Najwa', 'Syazwani', 'Izzati', 'Hidayah', 'Amirah', 'Afiqah', 'Nadhirah', 'Solehah', 'Madihah', ''];
  var BAPA = ['Abdullah', 'Rosli', 'Ismail', 'Zulkifli', 'Hashim', 'Razak', 'Othman', 'Yusof', 'Mahmud', 'Salleh',
    'Kamaruddin', 'Azman', 'Roslan', 'Hamzah', 'Jamaluddin', 'Shukor', 'Ghazali', 'Nordin', 'Halim', 'Sulaiman',
    'Mokhtar', 'Zainal', 'Fauzi', 'Rahim', 'Idris', 'Bakar', 'Hassan', 'Latif', 'Majid', 'Tahir'];

  // SEMENTARA: nama kelas sebenar belum diterima.
  var KELAS = ['Amanah', 'Bestari', 'Cekal', 'Dedikasi', 'Ehsan'];
  var RUMAH = Object.keys(C.RUMAH);
  var PANGKAT = ['Ahli', 'Ahli', 'Ahli', 'Ahli', 'Lans Koperal', 'Koperal', 'Sarjan', 'Ketua Platun'];
  var JAWATAN = ['Ahli', 'Ahli', 'Ahli', 'Ahli', 'Ahli', 'AJK', 'AJK', 'Bendahari', 'Setiausaha', 'Naib Pengerusi', 'Pengerusi'];
  var KEJOHANAN = ['Kejohanan MSSD', 'Kejohanan MSSS', 'Kejohanan Antara Sekolah Agama', 'Kejohanan Tertutup Sekolah',
    'Karnival Sukan Sekolah Islam', 'Kejohanan Jemputan'];

  var pelajar = [];
  var n = 0;
  for (var t = 1; t <= 5; t++) {
    for (var k = 0; k < KELAS.length; k++) {
      for (var i = 0; i < 28; i++) {
        n++;
        var banin = r() < 0.5;
        var nama = banin
          ? (pick(BANIN) + ' ' + pick(KEDUA_L)).trim() + ' bin ' + pick(BAPA)
          : (pick(BANAT) + ' ' + pick(KEDUA_P)).trim() + ' binti ' + pick(BAPA);

        var p = {
          id: 'P' + String(n).padStart(4, '0'),
          nama: nama,
          jantina: banin ? 'L' : 'P',
          tingkatan: t,
          kelas: KELAS[k],
          rumah: pick(RUMAH),
          uniform: pick(C.UNIFORM),
          pangkat: pick(PANGKAT),
          kelab: pick(C.KELAB),
          jawatan: pick(JAWATAN),
          sukanRasmi: pick(C.SUKAN),
          wakil: [],
          pencapaian: [],
          sejarah: []
        };

        // Sebahagian kecil pelajar sengaja dibiar tidak lengkap untuk uji paparan "Belum diisi".
        var kosong = r();
        if (kosong < 0.03) { p.uniform = ''; p.pangkat = ''; }
        else if (kosong < 0.06) { p.kelab = ''; p.jawatan = ''; }
        else if (kosong < 0.09) { p.sukanRasmi = ''; }
        else if (kosong < 0.11) { p.rumah = ''; }

        // Kira-kira 1 daripada 4 pelajar ialah wakil sekolah.
        if (r() < 0.26) {
          var bil = 1 + Math.floor(r() * 2);
          for (var w = 0; w < bil; w++) {
            var s = r() < 0.85 ? pick(C.SUKAN) : pick(C.KEBITARAAN);
            if (p.wakil.indexOf(s) === -1) p.wakil.push(s);
          }
          p.wakil.forEach(function (s) {
            var rekod = 1 + Math.floor(r() * 2);
            for (var a = 0; a < rekod; a++) {
              p.pencapaian.push({
                sukan: s,
                kejohanan: pick(KEJOHANAN) + ' ' + s.replace('Pasukan ', ''),
                peringkat: pick(C.PERINGKAT.slice(0, 4)),
                pencapaian: pick(C.PENCAPAIAN),
                tahun: C.TAHUN_SEMASA - Math.floor(r() * Math.min(t, 3)),
                status: 'Disahkan'
              });
            }
          });
          p.pencapaian.sort(function (a, b) { return b.tahun - a.tahun; });
        }

        // Rekod tahun-tahun lepas (unit dan kelab dikekalkan, pangkat/jawatan boleh berubah).
        for (var y = 1; y < t; y++) {
          p.sejarah.push({
            tahun: C.TAHUN_SEMASA - y,
            tingkatan: t - y,
            uniform: p.uniform, pangkat: p.uniform ? pick(PANGKAT.slice(0, 6)) : '',
            kelab: p.kelab, jawatan: p.kelab ? pick(JAWATAN.slice(0, 8)) : '',
            sukanRasmi: p.sukanRasmi
          });
        }
        pelajar.push(p);
      }
    }
  }

  var guru = [
    { kumpulan: 'Pengurusan Kokurikulum', nama: 'Ustaz Contoh Satu', jawatan: 'Penolong Kanan Kokurikulum', foto: '' },
    { kumpulan: 'Pengurusan Kokurikulum', nama: 'Ustazah Contoh Dua', jawatan: 'Setiausaha Kokurikulum', foto: '' },
    { kumpulan: 'Pengurusan Kokurikulum', nama: 'Cikgu Contoh Tiga', jawatan: 'Setiausaha Sukan', foto: '' },
    { kumpulan: 'Penyelaras', nama: 'Cikgu Contoh Empat', jawatan: 'Penyelaras Badan Beruniform', foto: '' },
    { kumpulan: 'Penyelaras', nama: 'Ustazah Contoh Lima', jawatan: 'Penyelaras Kelab dan Persatuan', foto: '' },
    { kumpulan: 'Penyelaras', nama: 'Ustaz Contoh Enam', jawatan: 'Penyelaras Sukan dan Permainan', foto: '' },
    { kumpulan: 'Penyelaras', nama: 'Cikgu Contoh Tujuh', jawatan: 'Penyelaras Rumah Sukan', foto: '' },
    { kumpulan: 'Penyelaras', nama: 'Ustaz Contoh Lapan', jawatan: 'Penyelaras Aktiviti Ekstra Kokurikulum', foto: '' }
  ];

  window.KOKU_DUMMY = { pelajar: pelajar, guru: guru, kelas: KELAS, PIN_DEMO: '2468' };
})();
