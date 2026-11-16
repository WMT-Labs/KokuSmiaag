# Koku SMIAAG

Laman semakan rekod kokurikulum pelajar SMIAAG (paparan pelajar sahaja). Pengisian data dibuat oleh pentadbir melalui sistem profil guru.

## Status

Peringkat 1: frontend dengan data rekaan (700 pelajar dummy). Belum disambung ke Google Sheet / Apps Script.

## Jalankan

Laman statik biasa, tiada build step.

```bash
python3 -m http.server 8080
```

## Struktur

- `index.html`, `css/style.css` — paparan
- `js/config.js` — tetapan: senarai kelab, sukan, rumah sukan, gambar latar, mod demo
- `js/data.js` — data rekaan (dibuang bila backend siap)
- `js/api.js` — lapisan data; satu-satunya fail yang perlu ditukar untuk sambung ke Apps Script
- `js/app.js` — logik UI
- `assets/bg/` — gambar aktiviti untuk latar belakang
- `assets/guru/` — gambar guru koku

## Peraturan paparan

- Umum: nama, tingkatan, kelas, rumah sukan, badan beruniform, kelab, sukan rasmi, wakil sekolah, pencapaian yang disahkan, aktiviti ekstra.
- Dengan PIN: pangkat, jawatan, rekod tahun lepas, pencapaian yang menunggu pengesahan.
- Carian perlukan sekurang-kurangnya 3 huruf nama dan dihadkan kepada 25 hasil.
