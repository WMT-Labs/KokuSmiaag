// Jalankan: node scripts/bundle.js && node tests/uji.js
const assert = require('assert');
const { ctx, buku, props, cache } = require('./gas-tiruan')();
let lulus = 0;
function uji(nama, fn) { try { fn(); lulus++; console.log('  ok  ' + nama); } catch (e) { console.log('GAGAL ' + nama + '\n      ' + e.message); process.exitCode = 1; } }
const salin = x => JSON.parse(JSON.stringify(x)); // objek dari konteks vm ada prototaip berbeza
const awam = (action, params) => salin(ctx.kendali({ action, params }));
const admin = (action, params, kunci) => salin(ctx.kendali({ action, params, kunci: kunci === undefined ? props.KUNCI_ADMIN : kunci, oleh: 'Cikgu Ujian' }));
const baris = n => buku.utama.tabs[n].d.slice(1);

ctx.sediaSistem();
ctx.isiDataContoh();

uji('sediaSistem cipta semua tab, kunci dan arkib', () => {
  ['pelajar', 'wakil', 'pencapaian', 'rekod_tahunan', 'pin', 'guru_koku', 'rujukan', 'tetapan', 'log_audit'].forEach(t => assert(buku.utama.tabs[t], t));
  assert(props.KUNCI_ADMIN.length >= 64);
  assert(buku[props.ARKIB_ID].tabs.pelajar);
  assert.strictEqual(baris('pelajar').length, 72);
});

let id;
uji('CARI: minimum 3 huruf, pulang nama dan kelas sahaja', () => {
  assert.strictEqual(awam('CARI', { q: 'ai' }).code, 'CARIAN_PENDEK');
  const r = awam('CARI', { q: 'aiman' });
  assert(r.ok && r.data.jumlah > 0);
  assert.deepStrictEqual(Object.keys(r.data.senarai[0]).sort(), ['id', 'kelas', 'nama', 'tingkatan']);
  id = r.data.senarai[0].id;
  assert(awam('CARI', { q: 'contoh' }).data.senarai.length <= 25);
  const f = awam('CARI', { q: 'contoh', tingkatan: 3, kelas: 'Syafie' }).data;
  assert.strictEqual(f.jumlah, 3);
});

uji('PROFIL: tiada pangkat, jawatan atau no_daftar', () => {
  const r = awam('PROFIL', { id });
  assert(r.ok);
  const s = JSON.stringify(r.data);
  assert(!/pangkat|jawatan|no_daftar|Koperal|Setiausaha/.test(s), s);
  assert(r.data.aktivitiEkstra);
  assert.strictEqual(awam('PROFIL', { id: 'tiada' }).code, 'TIADA');
});

uji('aksi admin ditolak tanpa kunci yang betul, sama seperti aksi tidak wujud', () => {
  const a = admin('A_PELAJAR_SENARAI', {}, 'salah'), b = awam('A_PELAJAR_SENARAI', {}), c = awam('ENTAH', {}), d = admin('A_PELAJAR_SENARAI', {}, '');
  [a, b, c, d].forEach(x => assert.deepStrictEqual(x, { ok: false, code: 'TIDAK_DIBENARKAN', message: 'Permintaan tidak dibenarkan.' }));
  assert(admin('A_PELAJAR_SENARAI', {}).ok);
});

let pin;
uji('PIN: jana, hash disimpan, salah dikira, dikunci selepas 5 kali', () => {
  assert.strictEqual(awam('TERPERINCI', { id, pin: '123456' }).code, 'PIN_SALAH');
  delete cache['pin_' + id];
  pin = admin('A_PIN_JANA', { pelajar_id: id }).data.pin;
  assert(/^\d{6}$/.test(pin));
  assert(!JSON.stringify(baris('pin')).includes(pin), 'PIN tidak boleh disimpan sebagai teks biasa');
  const r = awam('TERPERINCI', { id, pin });
  assert(r.ok && 'pangkat' in r.data && 'jawatan' in r.data);
  for (let i = 0; i < 5; i++) assert.strictEqual(awam('TERPERINCI', { id, pin: '000000' }).code, 'PIN_SALAH');
  assert.strictEqual(awam('TERPERINCI', { id, pin }).code, 'PIN_DIKUNCI');
  delete cache['pin_' + id];
  admin('A_PIN_BATAL', { pelajar_id: id });
  assert.strictEqual(awam('TERPERINCI', { id, pin }).code, 'PIN_SALAH');
});

const rekod = { sukan: 'catur', kejohanan: 'Kejohanan Catur MSSD', peringkat: 'Daerah', pencapaian: 'Johan', tahun: new Date().getFullYear(), akuSijil: true };
uji('HANTAR: perlukan akuan sijil, had 5 menunggu, tidak dipapar sebelum disahkan', () => {
  assert.strictEqual(awam('HANTAR', { id, ...rekod, akuSijil: false }).code, 'TIADA_AKUAN');
  assert.strictEqual(awam('HANTAR', { id, ...rekod, sukan: 'Sukan Rekaan' }).code, 'TIDAK_LENGKAP');
  for (let i = 0; i < 5; i++) assert(awam('HANTAR', { id, ...rekod }).ok);
  assert.strictEqual(awam('HANTAR', { id, ...rekod }).code, 'HAD_MENUNGGU');
  assert.strictEqual(awam('PROFIL', { id }).data.pencapaian.length, 0);
  assert.strictEqual(baris('pencapaian')[0][3], 'Catur', 'ejaan dibetulkan ikut rujukan');
});

uji('formula injection: nilai bermula = ditulis sebagai teks', () => {
  assert(awam('HANTAR', { id: awam('CARI', { q: 'balqis' }).data.senarai[0].id, ...rekod, kejohanan: '=HYPERLINK("http://jahat")' }).ok);
  assert(baris('pencapaian').some(r => r[4] === '=HYPERLINK("http://jahat")'));
});

uji('pengesahan guru: disahkan muncul di profil, ditolak tidak', () => {
  const s = admin('A_PENCAPAIAN_SENARAI', { status: 'menunggu', pelajar_id: id }).data.senarai;
  assert.strictEqual(s.length, 5);
  assert(admin('A_PENCAPAIAN_PUTUS', { id: s[0].id, keputusan: 'disahkan' }).ok);
  assert(admin('A_PENCAPAIAN_PUTUS', { id: s[1].id, keputusan: 'ditolak', catatan: 'tiada sijil' }).ok);
  const p = awam('PROFIL', { id }).data.pencapaian;
  assert.strictEqual(p.length, 1);
  assert.strictEqual(p[0].status, 'Disahkan');
  assert(awam('HANTAR', { id, ...rekod }).ok, 'ada ruang semula selepas dua rekod diputuskan');
});

uji('import pukal: pratonton, ralat ikut baris, ruangan kosong tidak memadam', () => {
  const sasaran = admin('A_PELAJAR_SENARAI', { q: 'C0002' }).data.senarai[0];
  const data = [
    { no_daftar: 'C0002', rumah: 'najah' },
    { nama: 'Pelajar Baharu bin Ujian', tingkatan: 1, kelas: '1 qurtubi', uniform: 'krs', sukan_rasmi: 'Bola Sepak' },
    { nama: 'Tiada Tingkatan binti Ujian' },
    { no_daftar: 'C0003', kelab: 'Kelab Tak Wujud' }
  ];
  const semak = admin('A_PELAJAR_IMPORT', { baris: data }).data;
  assert.deepStrictEqual([semak.disimpan, semak.baharu, semak.ralat.length], [false, 1, 2]);
  assert.strictEqual(baris('pelajar').length, 72, 'pratonton tidak menyimpan');
  const simpan = admin('A_PELAJAR_IMPORT', { baris: data, laksana: true }).data;
  assert.deepStrictEqual(simpan.ralat.map(r => r.baris), [3, 4]);
  assert.strictEqual(baris('pelajar').length, 73);
  const lepas = admin('A_PELAJAR_SENARAI', { q: 'C0002' }).data.senarai[0];
  assert.strictEqual(lepas.rumah, 'Najah');
  assert.strictEqual(lepas.kelab, sasaran.kelab, 'kelab tidak terpadam');
  const baharu = admin('A_PELAJAR_SENARAI', { q: 'pelajar baharu' }).data.senarai[0];
  assert.deepStrictEqual([baharu.kelas, baharu.uniform], ['Qurtubi', 'KRS']);
  assert(baharu.belum.includes('rumah') && baharu.belum.includes('kelab'));
  assert(awam('CARI', { q: 'pelajar baharu' }).data.jumlah === 1, 'indeks carian dikemas kini');
});

uji('pukal medan, kelas salah tingkatan ditolak, ringkasan belum diisi', () => {
  const t1 = admin('A_PELAJAR_SENARAI', { tingkatan: 1, kelas: 'Urwah' }).data.senarai.map(s => s.id);
  assert.strictEqual(admin('A_PUKAL_MEDAN', { ids: t1, medan: { kelab: 'kelab digital', jawatan: 'AJK' } }).data.dikemas, 3);
  assert.strictEqual(admin('A_PUKAL_MEDAN', { ids: t1, medan: { kelas: 'Saad' } }).code, 'TIDAK_SAH');
  assert.strictEqual(admin('A_PELAJAR_SENARAI', { kelab: 'Kelab Digital', kelas: 'Urwah' }).data.jumlah, 3);
  const r = admin('A_RINGKASAN', {}).data;
  assert.strictEqual(r.jumlah, 73);
  assert(r.belum.uniform > 0 && r.belum.sukan_rasmi > 0 && r.menunggu > 0);
  assert.strictEqual(admin('A_PELAJAR_SENARAI', { belum: 'uniform' }).data.jumlah, r.belum.uniform);
});

uji('wakil sekolah dan senarai guru', () => {
  assert.deepStrictEqual(admin('A_WAKIL_SIMPAN', { pelajar_id: id, sukan: ['renang', 'Pasukan Debat Bahasa Arab'] }).data.sukan, ['Renang', 'Pasukan Debat Bahasa Arab']);
  assert.deepStrictEqual(awam('PROFIL', { id }).data.wakil, ['Renang', 'Pasukan Debat Bahasa Arab']);
  assert.strictEqual(admin('A_GURU_SIMPAN', { senarai: [{ nama: 'A', foto_url: 'javascript:alert(1)' }] }).code, 'TIDAK_SAH');
  assert(admin('A_GURU_SIMPAN', { senarai: [{ kumpulan: 'Pengurusan', nama: 'Ustaz A', jawatan: 'PK Koku' }, { nama: 'Cikgu B', papar: false }] }).ok);
  assert.strictEqual(awam('GURU', {}).data.length, 1);
});

uji('kenaikan tahun: snapshot, T5 diarkib, pangkat dan jawatan kekal, kelas dikosongkan', () => {
  const tahun = ctx.tahunSemasa(), sebelum = admin('A_PELAJAR_SENARAI', { q: 'C0001' }).data.senarai[0];
  const semak = admin('A_NAIK_TAHUN', {}).data;
  assert.deepStrictEqual([semak.naik, semak.tamat], [58, 15]);
  assert.strictEqual(admin('A_NAIK_TAHUN', { laksana: true, sahkan: 'ya' }).code, 'TIDAK_SAH');
  assert(admin('A_NAIK_TAHUN', { laksana: true, sahkan: 'NAIK ' + (tahun + 1) }).data.selesai);
  assert.strictEqual(ctx.tahunSemasa(), tahun + 1);
  assert.strictEqual(baris('pelajar').length, 58);
  assert.strictEqual(baris('rekod_tahunan').length, 58);
  assert.strictEqual(buku[props.ARKIB_ID].tabs.pelajar.d.length - 1, 15);
  assert.strictEqual(buku[props.ARKIB_ID].tabs.rekod_tahunan.d.length - 1, 15);
  const lepas = admin('A_PELAJAR_SENARAI', { q: 'C0001' }).data.senarai[0];
  assert.deepStrictEqual([lepas.tingkatan, lepas.kelas, lepas.pangkat, lepas.jawatan, lepas.uniform],
    [sebelum.tingkatan + 1, '', sebelum.pangkat, sebelum.jawatan, sebelum.uniform]);
  assert.strictEqual(baris('pin').length, 0);
  assert(awam('PROFIL', { id }).data.pencapaian.length === 1, 'pencapaian pelajar yang kekal tidak hilang');
  assert.strictEqual(awam('PROFIL', { id }).data.wakil.length, 0, 'wakil ikut tahun');
});

uji('arkib dibersihkan hanya selepas 3 tahun dan dengan pengesahan', () => {
  assert.strictEqual(admin('A_ARKIB_BERSIH', {}).data.akanDipadam, 0);
  buku.utama.tabs.tetapan.d[1][1] = String(ctx.tahunSemasa() + 4);
  ctx._baca = {};
  assert.strictEqual(admin('A_ARKIB_BERSIH', {}).data.akanDipadam, 15);
  assert.strictEqual(admin('A_ARKIB_BERSIH', { laksana: true }).code, 'TIDAK_SAH');
  assert.strictEqual(admin('A_ARKIB_BERSIH', { laksana: true, sahkan: 'PADAM ARKIB' }).data.dipadam, 15);
  assert.strictEqual(buku[props.ARKIB_ID].tabs.pelajar.d.length, 1);
});

uji('log audit merekod tindakan pentadbir', () => {
  const l = admin('A_LOG', {}).data.senarai;
  assert(l.length > 8 && l.every(x => x.oleh && x.aksi));
  assert(l.some(x => x.aksi === 'NAIK_TAHUN'));
});

uji('semakTabPelajar beri id dan betulkan ejaan untuk baris yang ditaip terus', () => {
  buku.utama.tabs.pelajar.d.push(['', 'X1', 'Taip Terus bin Ujian', 'l', '2', 'hassan', 'fatah', 'kaspa', '', '', '', 'catur', '', '']);
  ctx._baca = {};
  const lapor = ctx.semakTabPelajar();
  assert(/1 id baharu/.test(lapor), lapor);
  const s = admin('A_PELAJAR_SENARAI', { q: 'taip terus' }).data.senarai[0];
  assert.deepStrictEqual([s.jantina, s.kelas, s.rumah, s.uniform, s.sukan_rasmi], ['L', 'Hassan', 'Fatah', 'KASPA', 'Catur']);
});

console.log('\n' + lulus + ' ujian lulus' + (process.exitCode ? ', ADA YANG GAGAL' : ''));
