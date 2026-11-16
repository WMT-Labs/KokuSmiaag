# API pentadbir

Untuk halaman isian dalam sistem Profil Guru. Panggilan dibuat **dari backend Profil Guru**, bukan dari browser:

1. Browser pentadbir memanggil backend Profil Guru seperti biasa (dengan token sesi).
2. Backend Profil Guru menyemak peranan (`pentadbir` atau `superadmin`).
3. Backend Profil Guru memanggil Web App Koku dengan `KUNCI_ADMIN` dan memulangkan jawapannya.

`KUNCI_ADMIN` disimpan dalam Script Properties (atau secret Supabase selepas migrasi). Ia tidak boleh sampai ke browser.

## Bentuk

```
POST <API_URL>
{ "action": "A_...", "kunci": "<KUNCI_ADMIN>", "oleh": "<nama atau e-mel pentadbir>", "params": { ... } }
```

Jawapan: `{ "ok": true, "data": ... }` atau `{ "ok": false, "code": "KOD", "message": "..." }`. `oleh` direkod dalam `log_audit`.

Contoh dalam Apps Script:

```js
function panggilKoku(action, params, sesi) {
  var r = UrlFetchApp.fetch(PROP.getProperty('KOKU_API_URL'), {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ action: action, kunci: PROP.getProperty('KOKU_KUNCI_ADMIN'), oleh: sesi.nama, params: params })
  });
  return JSON.parse(r.getContentText());
}
```

## Aksi

| Aksi | Params | Pulangan |
|---|---|---|
| `A_RUJUKAN` | — | tahun, kelas ikut tingkatan, rumah, uniform, kelab, sukan, kebitaraan, aktiviti, peringkat, pencapaian, medanWajib |
| `A_RINGKASAN` | — | jumlah, lengkap, tidakLengkap, `belum` ikut medan, bilangan ikut rumah dan tingkatan, `menunggu` |
| `A_PELAJAR_SENARAI` | `q`, `tingkatan`, `kelas`, `rumah`, `uniform`, `kelab`, `sukan_rasmi`, `jantina`, `belum` (`true` atau nama medan) | `jumlah`, `senarai` (rekod penuh + `belum: [medan]`) |
| `A_PELAJAR_SIMPAN` | `id` (kosong = baharu), medan pelajar | `id` |
| `A_PELAJAR_IMPORT` | `baris: [{...}]`, `laksana` | `baharu`, `dikemas`, `tiadaPerubahan`, `ralat: [{baris, mesej}]`, `disimpan` |
| `A_PUKAL_MEDAN` | `ids: []`, `medan: {kelab, jawatan, ...}` | `dikemas` |
| `A_PELAJAR_PADAM` | `id` | — (memadam semua rekod pelajar itu) |
| `A_WAKIL_SIMPAN` | `pelajar_id`, `sukan: []` | `sukan` (untuk tahun semasa) |
| `A_PENCAPAIAN_SENARAI` | `status`, `pelajar_id` | `senarai` dengan nama dan kelas pelajar |
| `A_PENCAPAIAN_PUTUS` | `id`, `keputusan` (`disahkan`/`ditolak`), `catatan` | — |
| `A_PENCAPAIAN_SIMPAN` | `id` atau `pelajar_id`, `sukan`, `kejohanan`, `peringkat`, `pencapaian`, `tahun` | `id` (terus disahkan) |
| `A_PENCAPAIAN_PADAM` | `id` | — |
| `A_PIN_JANA` | `pelajar_id`, `hari` (1–30, lalai 7) | `pin` (ditunjuk sekali sahaja), `luput`, `nama` |
| `A_PIN_BATAL` | `pelajar_id` | — |
| `A_GURU_SENARAI` | — | `senarai` |
| `A_GURU_SIMPAN` | `senarai: [{kumpulan, nama, jawatan, foto_url, papar}]` (ganti semua, ikut urutan) | `jumlah` |
| `A_NAIK_TAHUN` | `laksana`, `sahkan: "NAIK <tahun baharu>"` | ringkasan; tanpa `laksana` hanya pratonton |
| `A_ARKIB_BERSIH` | `laksana`, `sahkan: "PADAM ARKIB"` | `akanDipadam` atau `dipadam` |
| `A_LOG` | `had` | `senarai` (terbaharu dahulu) |

## Nota import pukal

- Medan: `no_daftar`, `nama`, `jantina`, `tingkatan`, `kelas`, `rumah`, `uniform`, `pangkat`, `kelab`, `jawatan`, `sukan_rasmi`.
- Padanan dengan pelajar sedia ada: `no_daftar` jika ada, jika tidak nama penuh. Nama yang berganda ditolak dengan mesej supaya guna `no_daftar`.
- Ruangan kosong tidak memadam nilai sedia ada. Jadi import rumah sukan sahaja cukup dengan dua lajur: nama (atau `no_daftar`) dan `rumah`.
- Ejaan dipadankan dengan tab `rujukan` tanpa kira huruf besar atau kecil (`krs` jadi `KRS`, `1 qurtubi` jadi `Qurtubi`).
- Panggil dahulu tanpa `laksana` untuk pratonton, tunjukkan ralat kepada pentadbir, kemudian panggil dengan `laksana: true`. Baris yang ralat dilangkau; baris lain disimpan.
