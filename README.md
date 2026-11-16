# Jabatan Kokurikulum SMIAAG

Laman semakan rekod kokurikulum pelajar SMIAAG (paparan pelajar sahaja). Pengisian data dibuat oleh pentadbir melalui sistem profil guru.

## Status

Peringkat 1: frontend dengan data rekaan (696 pelajar dummy, 24 kelas). Belum disambung ke Google Sheet / Apps Script.

## Jalankan

Laman statik biasa, tiada build step.

```bash
python3 -m http.server 8080
```

## Struktur

- `index.html`, `css/style.css` — paparan
- `css/tokens.css` — palet dan ukuran, disalin daripada projek smiaag-teacher-profile supaya rupa kedua-dua sistem sama
- `js/config.js` — tetapan: senarai kelab, sukan, unit beruniform, kelas, rumah sukan, mod demo
- `js/data.js` — data rekaan (dibuang bila backend siap)
- `js/api.js` — lapisan data; satu-satunya fail yang perlu ditukar untuk sambung ke Apps Script
- `js/app.js` — logik UI
- `assets/` — logo sekolah

## Peraturan paparan

- Hasil carian: nama dan kelas sahaja.
- Profil umum: nama, kelas, rumah sukan, badan beruniform, kelab, sukan rasmi, wakil sekolah, pencapaian yang disahkan, aktiviti ekstra.
- Dengan PIN: pangkat, jawatan, rekod tahun lepas, pencapaian yang menunggu pengesahan.
- Carian perlukan sekurang-kurangnya 3 huruf nama dan dihadkan kepada 25 hasil.
- Pelajar boleh hantar rekod pencapaian tanpa PIN, maksimum 5 rekod menunggu pengesahan, dan mesti akui ada sijil atau bukti.
