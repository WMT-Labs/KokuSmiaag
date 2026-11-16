/* Lapisan data. UI (app.js) hanya panggil fungsi di sini.
   Mod demo (DEMO: true): baca data rekaan dari js/data.js dalam browser.
   Mod sebenar: setiap fungsi panggil Apps Script (backend/). Tapisan medan dibuat DI SERVER,
   jadi pangkat dan jawatan tidak pernah sampai ke browser tanpa PIN. */
window.KokuAPI = (function () {
  var C = window.KOKU_CONFIG;
  var D = null; // diisi oleh mula() dalam mod demo
  var MAX_HASIL = 25;
  var KEY_PENDING = 'koku_demo_pending';

  function tangguh(v) { return new Promise(function (ok) { setTimeout(function () { ok(v); }, 120); }); }
  function gagal(msg) { return new Promise(function (_, no) { setTimeout(function () { no(new Error(msg)); }, 120); }); }

  function bacaPending() {
    try { return JSON.parse(localStorage.getItem(KEY_PENDING) || '{}'); } catch (e) { return {}; }
  }
  function tulisPending(o) {
    try { localStorage.setItem(KEY_PENDING, JSON.stringify(o)); } catch (e) { /* abaikan */ }
  }

  function cari(id) {
    for (var i = 0; i < D.pelajar.length; i++) if (D.pelajar[i].id === id) return D.pelajar[i];
    return null;
  }

  // Medan yang boleh dilihat umum. Pangkat dan jawatan TIDAK termasuk.
  function awam(p) {
    return {
      id: p.id, nama: p.nama, tingkatan: p.tingkatan, kelas: p.kelas, rumah: p.rumah,
      uniform: p.uniform, kelab: p.kelab, sukanRasmi: p.sukanRasmi,
      aktivitiEkstra: C.AKTIVITI_EKSTRA[p.tingkatan],
      wakil: p.wakil.slice(),
      pencapaian: p.pencapaian.filter(function (x) { return x.status === 'Disahkan'; })
    };
  }

  var demo = {
    mula: function () {
      return new Promise(function (ok, no) {
        var t = document.createElement('script');
        t.src = 'js/data.js';
        t.onload = function () { D = window.KOKU_DUMMY; ok(); };
        t.onerror = function () { no(new Error('Data demo gagal dimuatkan.')); };
        document.head.appendChild(t);
      });
    },
    senaraiKelas: function () { return tangguh(C.KELAS); },

    cariPelajar: function (f) {
      var q = String(f.q || '').trim().toLowerCase();
      if (q.length < 3) return gagal('Taip sekurang-kurangnya 3 huruf nama.');
      var token = q.split(/\s+/);
      var padan = D.pelajar.filter(function (p) {
        if (f.tingkatan && p.tingkatan !== Number(f.tingkatan)) return false;
        if (f.kelas && p.kelas !== f.kelas) return false;
        var nama = p.nama.toLowerCase();
        return token.every(function (t) { return nama.indexOf(t) !== -1; });
      });
      // Nama yang ada perkataan bermula dengan carian diletak dahulu ("aim" -> Aiman sebelum Sulaiman).
      function mula(p) {
        return p.nama.toLowerCase().split(/\s+/).some(function (w) { return w.indexOf(token[0]) === 0; }) ? 0 : 1;
      }
      padan.sort(function (a, b) { return mula(a) - mula(b) || a.nama.localeCompare(b.nama); });
      return tangguh({
        jumlah: padan.length,
        senarai: padan.slice(0, MAX_HASIL).map(function (p) {
          return { id: p.id, nama: p.nama, tingkatan: p.tingkatan, kelas: p.kelas };
        })
      });
    },

    profil: function (id) {
      var p = cari(id);
      return p ? tangguh(awam(p)) : gagal('Rekod pelajar tidak dijumpai.');
    },

    // Rekod terperinci, perlukan PIN. Di server nanti: had percubaan + PIN di-hash.
    terperinci: function (id, pin) {
      var p = cari(id);
      if (!p) return gagal('Rekod pelajar tidak dijumpai.');
      if (String(pin) !== D.PIN_DEMO) return gagal('PIN tidak sah.');
      return tangguh({
        pangkat: p.pangkat, jawatan: p.jawatan,
        sejarah: p.sejarah.slice(),
        menunggu: (bacaPending()[id] || []).slice()
      });
    },

    hantarPencapaian: function (id, b) {
      if (!cari(id)) return gagal('Rekod pelajar tidak dijumpai.');
      var kejohanan = String(b.kejohanan || '').trim().slice(0, 100);
      var sah = (C.SUKAN.concat(C.KEBITARAAN)).indexOf(b.sukan) !== -1
        && C.PERINGKAT.indexOf(b.peringkat) !== -1
        && C.PENCAPAIAN.indexOf(b.pencapaian) !== -1
        && kejohanan.length >= 3;
      if (sah && !b.akuSijil) return gagal('Sila sahkan bahawa anda ada sijil atau bukti.');
      if (!sah) return gagal('Sila lengkapkan semua ruangan.');
      var semua = bacaPending();
      var senarai = semua[id] || [];
      if (senarai.length >= C.MAKS_MENUNGGU) return gagal('Sudah ada ' + C.MAKS_MENUNGGU + ' rekod menunggu pengesahan. Tunggu guru semak dahulu.');
      senarai.push({
        sukan: b.sukan, kejohanan: kejohanan, peringkat: b.peringkat, pencapaian: b.pencapaian,
        tahun: Number(b.tahun), status: 'Menunggu pengesahan'
      });
      semua[id] = senarai;
      tulisPending(semua);
      return tangguh({ ok: true });
    },

    guru: function () { return tangguh(D.guru.slice()); }
  };

  /* ---------- Mod sebenar: Apps Script ---------- */
  function panggil(action, params) {
    var kawal = new AbortController();
    var jam = setTimeout(function () { kawal.abort(); }, 25000);
    // text/plain supaya browser tidak hantar preflight (Apps Script tidak menjawab OPTIONS).
    return fetch(C.API_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow',
      body: JSON.stringify({ action: action, params: params || {} }), signal: kawal.signal
    }).then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(jam);
      if (!j || !j.ok) throw new Error((j && j.message) || 'Ralat sistem. Cuba lagi sebentar.');
      return j.data;
    }, function (e) {
      clearTimeout(jam);
      throw new Error('Tidak dapat menghubungi pelayan. Semak sambungan internet dan cuba lagi.');
    });
  }

  var sebenar = {
    // Ambil senarai rujukan (kelas, sukan, rumah, tahun) dari server supaya sama dengan Sheet.
    mula: function () {
      return panggil('RUJUKAN').then(function (r) {
        C.TAHUN_SEMASA = r.tahun; C.KELAS = r.kelas; C.RUMAH = r.rumah; C.SUKAN = r.sukan;
        C.KEBITARAAN = r.kebitaraan; C.PERINGKAT = r.peringkat; C.PENCAPAIAN = r.pencapaian;
      });
    },
    senaraiKelas: function () { return Promise.resolve(C.KELAS); },
    cariPelajar: function (f) { return panggil('CARI', { q: f.q, tingkatan: f.tingkatan, kelas: f.kelas }); },
    profil: function (id) { return panggil('PROFIL', { id: id }); },
    terperinci: function (id, pin) { return panggil('TERPERINCI', { id: id, pin: pin }); },
    hantarPencapaian: function (id, b) {
      return panggil('HANTAR', { id: id, sukan: b.sukan, kejohanan: b.kejohanan, peringkat: b.peringkat,
        pencapaian: b.pencapaian, tahun: Number(b.tahun), akuSijil: b.akuSijil === true });
    },
    guru: function () { return panggil('GURU'); }
  };

  return C.DEMO || !C.API_URL ? demo : sebenar;
})();
