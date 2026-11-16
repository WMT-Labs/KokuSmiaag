/* UI laman pelajar. Semua teks daripada data dipaparkan melalui textContent (tiada innerHTML). */
(function () {
  var C = window.KOKU_CONFIG;
  var API = window.KokuAPI;
  var $ = function (id) { return document.getElementById(id); };

  // Pembina elemen ringkas: el('div', {class:'x'}, 'teks' | node | [..])
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    });
    [].concat(kids === undefined ? [] : kids).forEach(function (k) {
      if (k === null || k === undefined || k === false) return;
      n.appendChild(typeof k === 'object' ? k : document.createTextNode(String(k)));
    });
    return n;
  }
  function kosongkan(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function isiSelect(sel, senarai, awalan) {
    kosongkan(sel);
    if (awalan) sel.appendChild(el('option', { value: '' }, awalan));
    senarai.forEach(function (s) {
      var v = typeof s === 'object' ? s : { v: s, t: s };
      sel.appendChild(el('option', { value: v.v }, v.t));
    });
  }

  function lencanaRumah(rumah) {
    if (!rumah) return el('span', { class: 'badge badge-near' }, 'Rumah belum diisi');
    var warna = (C.RUMAH[rumah] || {}).warna || '';
    return el('span', { class: 'house house-' + warna }, [el('i', { 'aria-hidden': 'true' }), rumah]);
  }
  function nilai(v) {
    return v ? el('span', { class: 'nilai' }, v) : el('span', { class: 'nilai belum' }, 'Belum diisi');
  }

  /* ---------- Carian ---------- */
  var giliran = 0, tunda = null;

  function jalankanCarian() {
    var q = $('q').value.trim();
    var status = $('cari-status'), hasil = $('cari-hasil');
    if (q.length < 3) {
      kosongkan(hasil);
      status.textContent = q.length ? 'Taip sekurang-kurangnya 3 huruf.' : '';
      return;
    }
    var saya = ++giliran;
    status.textContent = 'Mencari…';
    API.cariPelajar({ q: q, tingkatan: $('f-tingkatan').value, kelas: $('f-kelas').value })
      .then(function (r) {
        if (saya !== giliran) return;
        kosongkan(hasil);
        if (!r.jumlah) { status.textContent = 'Tiada pelajar sepadan. Semak ejaan atau buang penapis.'; return; }
        status.textContent = r.jumlah > r.senarai.length
          ? r.jumlah + ' padanan. Menunjukkan ' + r.senarai.length + ' yang pertama, tambah nama atau penapis untuk kecilkan.'
          : r.jumlah + ' padanan.';
        r.senarai.forEach(function (p) {
          hasil.appendChild(el('li', null, el('a', { class: 'result', href: '#/pelajar/' + p.id }, [
            el('span', { class: 'result-main' }, [
              el('strong', null, p.nama),
              el('small', null, p.tingkatan + ' ' + p.kelas)
            ])
          ])));
        });
      })
      .catch(function (e) { if (saya === giliran) { kosongkan(hasil); status.textContent = e.message; } });
  }
  function carianTertunda() { clearTimeout(tunda); tunda = setTimeout(jalankanCarian, 250); }

  /* ---------- Profil ---------- */
  var semasa = null; // profil yang sedang dibuka

  function kad(tajuk, isi, nota) {
    return el('div', { class: 'kad' }, [
      el('span', { class: 'kad-label' }, tajuk), isi, nota ? el('small', { class: 'kad-nota' }, nota) : null
    ]);
  }

  function jadualPencapaian(senarai, tunjukStatus) {
    var t = el('table', { class: 'data' });
    t.appendChild(el('thead', null, el('tr', null, [
      el('th', null, 'Tahun'), el('th', null, 'Sukan / pasukan'), el('th', null, 'Kejohanan'),
      el('th', null, 'Peringkat'), el('th', null, 'Pencapaian'), tunjukStatus ? el('th', null, 'Status') : null
    ])));
    var b = el('tbody');
    senarai.forEach(function (x) {
      b.appendChild(el('tr', null, [
        el('td', { 'data-l': 'Tahun' }, x.tahun), el('td', { 'data-l': 'Sukan' }, x.sukan),
        el('td', { 'data-l': 'Kejohanan' }, x.kejohanan), el('td', { 'data-l': 'Peringkat' }, x.peringkat),
        el('td', { 'data-l': 'Pencapaian' }, x.pencapaian),
        tunjukStatus ? el('td', { 'data-l': 'Status' }, el('span', { class: 'badge badge-near' }, x.status)) : null
      ]));
    });
    t.appendChild(b);
    return el('div', { class: 'card table-wrap' }, t);
  }

  function paparProfil(p) {
    semasa = p;
    var k = $('profil');
    kosongkan(k);

    k.appendChild(el('div', { class: 'profil-kepala' }, [
      el('div', null, [
        el('h1', { class: 'page-title' }, p.nama),
        el('p', { class: 'page-sub' }, 'Kelas ' + p.tingkatan + ' ' + p.kelas + ' · Sesi ' + C.TAHUN_SEMASA)
      ]),
      lencanaRumah(p.rumah)
    ]));

    k.appendChild(el('div', { class: 'grid' }, [
      kad('Badan beruniform', nilai(p.uniform)),
      kad('Kelab / persatuan', nilai(p.kelab)),
      kad('Sukan dan permainan', nilai(p.sukanRasmi), 'Pertemuan rasmi'),
      kad('Rumah sukan', p.rumah ? lencanaRumah(p.rumah) : nilai('')),
      kad('Aktiviti ekstra kokurikulum', nilai(p.aktivitiEkstra), 'Ditetapkan ikut tingkatan')
    ]));

    k.appendChild(el('h2', { class: 'sek-tajuk' }, 'Wakil sekolah'));
    k.appendChild(p.wakil.length
      ? el('div', { class: 'cip-baris' }, p.wakil.map(function (s) { return el('span', { class: 'cip' }, s); }))
      : el('p', { class: 'muted' }, 'Tiada rekod wakil sekolah.'));

    k.appendChild(el('h2', { class: 'sek-tajuk' }, 'Pencapaian'));
    k.appendChild(p.pencapaian.length
      ? jadualPencapaian(p.pencapaian, false)
      : el('p', { class: 'muted' }, 'Tiada rekod pencapaian yang disahkan.'));

    k.appendChild(el('div', { class: 'tindakan' }, [
      el('button', { class: 'btn', type: 'button', onclick: bukaHantar }, 'Hantar rekod pencapaian'),
      el('button', { class: 'btn btn-secondary', type: 'button', onclick: bukaPin }, 'Lihat rekod terperinci (PIN)')
    ]));
    k.appendChild(el('div', { id: 'terperinci' }));
  }

  function paparTerperinci(d) {
    var k = $('terperinci');
    kosongkan(k);
    var kotak = el('div', { class: 'terperinci' }, [
      el('div', { class: 'terperinci-kepala' }, [
        el('h2', null, 'Rekod terperinci'),
        el('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { kosongkan(k); } }, 'Tutup')
      ]),
      el('div', { class: 'grid' }, [
        kad('Pangkat (badan beruniform)', nilai(d.pangkat), semasa.uniform),
        kad('Jawatan (kelab / persatuan)', nilai(d.jawatan), semasa.kelab)
      ])
    ]);

    kotak.appendChild(el('h3', { class: 'sek-tajuk' }, 'Rekod tahun lepas'));
    if (d.sejarah.length) {
      var t = el('table', { class: 'data' });
      t.appendChild(el('thead', null, el('tr', null, ['Tahun', 'Tingkatan', 'Badan beruniform', 'Pangkat', 'Kelab', 'Jawatan', 'Sukan rasmi']
        .map(function (h) { return el('th', null, h); }))));
      var b = el('tbody');
      d.sejarah.forEach(function (s) {
        b.appendChild(el('tr', null, [
          el('td', { 'data-l': 'Tahun' }, s.tahun), el('td', { 'data-l': 'Tingkatan' }, s.tingkatan),
          el('td', { 'data-l': 'Beruniform' }, s.uniform || '—'), el('td', { 'data-l': 'Pangkat' }, s.pangkat || '—'),
          el('td', { 'data-l': 'Kelab' }, s.kelab || '—'), el('td', { 'data-l': 'Jawatan' }, s.jawatan || '—'),
          el('td', { 'data-l': 'Sukan rasmi' }, s.sukanRasmi || '—')
        ]));
      });
      t.appendChild(b);
      kotak.appendChild(el('div', { class: 'card table-wrap' }, t));
    } else {
      kotak.appendChild(el('p', { class: 'muted' }, 'Tiada rekod tahun lepas.'));
    }

    kotak.appendChild(el('h3', { class: 'sek-tajuk' }, 'Menunggu pengesahan guru'));
    kotak.appendChild(d.menunggu.length
      ? jadualPencapaian(d.menunggu, true)
      : el('p', { class: 'muted' }, 'Tiada rekod yang sedang menunggu pengesahan.'));

    k.appendChild(kotak);
    kotak.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Dialog ---------- */
  function bukaPin() {
    $('pin').value = ''; ralat('pin-err', '');
    $('dlg-pin').showModal(); $('pin').focus();
  }
  function bukaHantar() {
    $('form-hantar').reset(); ralat('hantar-err', '');
    $('dlg-hantar').showModal();
  }
  function ralat(id, msg) { var n = $(id); n.textContent = msg; n.hidden = !msg; }
  function toast(msg) {
    var lama = document.querySelector('.toast');
    if (lama) lama.remove();
    var t = el('div', { class: 'toast', role: 'status' }, msg);
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 6000);
  }

  function pasangDialog() {
    [].forEach.call(document.querySelectorAll('[data-close]'), function (b) {
      b.addEventListener('click', function () { b.closest('dialog').close(); });
    });

    $('form-pin').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!semasa) return;
      API.terperinci(semasa.id, $('pin').value)
        .then(function (d) { $('dlg-pin').close(); paparTerperinci(d); })
        .catch(function (er) { ralat('pin-err', er.message); });
    });

    var sel = $('h-sukan');
    kosongkan(sel);
    sel.appendChild(el('option', { value: '' }, 'Pilih…'));
    [['Sukan dan permainan', C.SUKAN], ['Pasukan kebitaraan', C.KEBITARAAN]].forEach(function (g) {
      var og = el('optgroup', { label: g[0] });
      g[1].forEach(function (s) { og.appendChild(el('option', { value: s }, s)); });
      sel.appendChild(og);
    });
    isiSelect($('h-peringkat'), C.PERINGKAT, 'Pilih…');
    isiSelect($('h-pencapaian'), C.PENCAPAIAN, 'Pilih…');
    isiSelect($('h-tahun'), [0, 1, 2].map(function (i) { return C.TAHUN_SEMASA - i; }));

    $('form-hantar').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!semasa) return;
      API.hantarPencapaian(semasa.id, {
        sukan: $('h-sukan').value, kejohanan: $('h-kejohanan').value, peringkat: $('h-peringkat').value,
        pencapaian: $('h-pencapaian').value, tahun: $('h-tahun').value, akuSijil: $('h-aku').checked
      }).then(function () {
        $('dlg-hantar').close();
        kosongkan($('terperinci'));
        toast('Rekod dihantar. Ia akan dipaparkan selepas guru sahkan. Simpan sijil anda sebagai bukti.');
      }).catch(function (er) { ralat('hantar-err', er.message); });
    });
  }

  /* ---------- Guru ---------- */
  function paparGuru(senarai) {
    var k = $('guru');
    kosongkan(k);
    var kumpulan = {};
    senarai.forEach(function (g) { (kumpulan[g.kumpulan] = kumpulan[g.kumpulan] || []).push(g); });
    Object.keys(kumpulan).forEach(function (nama) {
      k.appendChild(el('h2', { class: 'sek-tajuk' }, nama));
      k.appendChild(el('div', { class: 'guru-grid' }, kumpulan[nama].map(function (g) {
        var huruf = g.nama.replace(/^(Ustaz|Ustazah|Cikgu|Tuan|Puan)\s+/i, '').split(/\s+/).slice(0, 2)
          .map(function (w) { return w.charAt(0); }).join('').toUpperCase();
        var muka = g.foto
          ? el('img', { class: 'guru-foto', src: g.foto, alt: '', loading: 'lazy' })
          : el('span', { class: 'guru-foto guru-huruf', 'aria-hidden': 'true' }, huruf);
        return el('div', { class: 'guru-kad' }, [muka, el('div', null, [
          el('strong', null, g.nama), el('small', null, g.jawatan)
        ])]);
      })));
    });
  }

  /* ---------- Laluan (hash) ---------- */
  function tunjuk(view) {
    ['cari', 'profil', 'guru'].forEach(function (v) { $('view-' + v).hidden = v !== view; });
    [].forEach.call(document.querySelectorAll('[data-nav]'), function (a) {
      var aktif = a.getAttribute('data-nav') === (view === 'profil' ? 'cari' : view);
      if (aktif) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function laluan() {
    var h = location.hash.replace(/^#\/?/, '');
    var m = h.match(/^pelajar\/([A-Za-z0-9_-]{1,20})$/);
    if (m) {
      tunjuk('profil');
      kosongkan($('profil'));
      $('profil').appendChild(el('p', { class: 'status' }, 'Memuatkan rekod…'));
      API.profil(m[1]).then(paparProfil).catch(function (e) {
        kosongkan($('profil'));
        $('profil').appendChild(el('p', { class: 'status' }, e.message));
      });
      window.scrollTo(0, 0);
    } else if (h === 'guru') {
      tunjuk('guru');
      API.guru().then(paparGuru);
      window.scrollTo(0, 0);
    } else {
      semasa = null;
      tunjuk('cari');
    }
  }

  /* ---------- Mula ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (C.DEMO) $('demo-bar').hidden = false;

    isiSelect($('f-tingkatan'), [1, 2, 3, 4, 5].map(function (t) { return { v: t, t: 'Tingkatan ' + t }; }), 'Semua');
    API.senaraiKelas().then(function (peta) {
      function isiKelas() {
        var t = $('f-tingkatan').value, dulu = $('f-kelas').value, senarai = [];
        Object.keys(peta).forEach(function (ting) {
          if (t && t !== ting) return;
          peta[ting].forEach(function (k) { senarai.push({ v: k, t: ting + ' ' + k }); });
        });
        isiSelect($('f-kelas'), senarai, 'Semua');
        if (senarai.some(function (x) { return x.v === dulu; })) $('f-kelas').value = dulu;
      }
      isiKelas();
      $('f-tingkatan').addEventListener('change', function () { isiKelas(); jalankanCarian(); });
    });

    $('q').addEventListener('input', carianTertunda);
    $('f-kelas').addEventListener('change', jalankanCarian);
    $('form-cari').addEventListener('submit', function (e) { e.preventDefault(); jalankanCarian(); });

    pasangDialog();
    window.addEventListener('hashchange', laluan);
    laluan();
  });
})();
