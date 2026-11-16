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
