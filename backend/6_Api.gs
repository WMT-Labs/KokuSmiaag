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
