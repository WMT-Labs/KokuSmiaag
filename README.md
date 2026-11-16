# Jabatan Kokurikulum SMIAAG

Laman semakan rekod kokurikulum pelajar SMIAAG. Repo ini mengandungi dua bahagian:

- **Laman pelajar** (`index.html`, `css/`, `js/`): laman statik untuk Netlify.
- **Backend** (`backend/*.gs`): Google Apps Script di atas Google Sheet. Melayan laman pelajar, dan menyediakan API pentadbir untuk sistem Profil Guru (halaman isian dibina di repo `smiaag-teacher-profile`).

## Status

- Laman pelajar: siap, masih dalam mod demo (`DEMO: true` dalam `js/config.js`).
- Backend: siap dan diuji dengan Sheet tiruan (`npm test`). Belum dipasang pada Sheet sebenar.
- Halaman isian pentadbir: belum dibina (di repo Profil Guru). Rujuk `docs/API-PENTADBIR.md`.

## Pasang backend pada Google Sheet

1. Cipta satu Google Sheet baharu, contohnya "Koku SMIAAG". Jangan kongsi dengan sesiapa selain pentadbir, dan jangan guna "Publish to web".
2. Dalam Sheet itu: Extensions > Apps Script. Padam kod sedia ada dan tampal seluruh kandungan `dist/Code.gs`.
3. Project Settings > tanda "Show appsscript.json manifest file", kemudian ganti kandungan `appsscript.json` dengan `backend/appsscript.json`.
4. Muat semula Sheet. Menu **Koku SMIAAG** akan muncul. Pilih **1. Sediakan sistem** dan benarkan akses. Ini mencipta semua tab, senarai rujukan, Sheet arkib dan kunci admin.
5. (Pilihan) **Isi data contoh** untuk menguji sebelum data sebenar dimasukkan.
6. Dalam editor Apps Script: Deploy > New deployment > Web app. Execute as: **Me**. Who has access: **Anyone**. Salin alamat yang berakhir dengan `/exec`.
7. Dalam `js/config.js`: isi `API_URL` dengan alamat itu dan tukar `DEMO` kepada `false`. Push, dan Netlify akan deploy.

Setiap kali `backend/` berubah: `npm run bundle`, tampal semula `dist/Code.gs`, kemudian Deploy > Manage deployments > Edit > New version (alamat kekal sama).

## Tab dalam Sheet

| Tab | Kandungan |
|---|---|
| `pelajar` | Satu baris seorang pelajar: nama, tingkatan, kelas, rumah, unit beruniform + pangkat, kelab + jawatan, sukan rasmi |
| `wakil` | Sukan atau pasukan yang pelajar wakili, ikut tahun |
| `pencapaian` | Rekod pencapaian. Status: `menunggu`, `disahkan`, `ditolak` |
| `rekod_tahunan` | Salinan rekod pelajar setiap tahun, dibuat semasa kenaikan tahun |
| `pin` | PIN pelajar (hash sahaja) dan tarikh luput |
| `guru_koku` | Senarai untuk tab Kenali Guru Koku |
| `rujukan` | Senarai rumah, unit beruniform, kelab, sukan, pasukan kebitaraan, kelas, aktiviti ekstra. Boleh disunting terus |
| `tetapan` | `tahun_semasa` |
| `log_audit` | Siapa ubah apa dan bila |

Pentadbir boleh menaip atau menampal terus ke tab `pelajar` (biarkan lajur `id` kosong), kemudian jalankan menu **2. Semak tab pelajar**. Ia memberi id, membetulkan ejaan ikut tab `rujukan`, dan melaporkan baris bermasalah.

## Peraturan paparan dan keselamatan

- Hasil carian: nama dan kelas sahaja. Perlu sekurang-kurangnya 3 huruf, maksimum 25 hasil.
- Profil umum: kelas, rumah sukan, unit beruniform, kelab, sukan rasmi, wakil sekolah, pencapaian yang disahkan, aktiviti ekstra.
- Dengan PIN: pangkat, jawatan, rekod tahun lepas, pencapaian yang menunggu. PIN 6 digit dijana pentadbir, luput selepas 7 hari, dikunci 15 minit selepas 5 percubaan salah.
- Pelajar boleh hantar pencapaian tanpa PIN: maksimum 5 rekod menunggu bagi setiap pelajar, mesti akui ada sijil.
- Aksi pentadbir (`A_...`) memerlukan `KUNCI_ADMIN`, yang hanya disimpan dalam Script Properties dan di backend Profil Guru. Ia tidak boleh berada dalam mana-mana fail frontend.
- Semua nilai yang ditulis ke Sheet ditapis daripada formula injection (`backend/3_Repo.gs`).
- Had yang diketahui: Apps Script tidak memberi alamat IP pemanggil, jadi tiada had kadar bagi setiap pelawat untuk carian. Had yang ada ialah bagi setiap pelajar (PIN, rekod menunggu) dan satu had penghantaran untuk seluruh sistem.

## Kenaikan tahun dan arkib

Aksi `A_NAIK_TAHUN`: rekod tahun semasa disalin ke `rekod_tahunan`; pelajar tingkatan 5 dipindah ke Sheet arkib bersama semua rekod mereka; pelajar lain naik satu tingkatan dengan kelas dikosongkan (import kelas baharu selepas itu). Rumah, unit, pangkat, kelab, jawatan dan sukan rasmi dikekalkan sepanjang lima tahun.

Aksi `A_ARKIB_BERSIH` memadam rekod arkib pelajar yang sudah tamat lebih daripada 3 tahun. Ia tidak berjalan sendiri dan perlukan pengesahan.

## Pembangunan

```bash
npm test
```

```bash
npm run dev
```

`npm run dev` menjalankan laman pada http://localhost:8081 dengan backend sebenar di atas Sheet tiruan dalam memori. Tiada build step untuk laman; `python3 -m http.server` pun cukup untuk mod demo.

## Struktur

- `js/config.js` — tetapan dan senarai mod demo
- `js/api.js` — lapisan data (demo atau Apps Script)
- `js/app.js` — logik UI
- `js/data.js` — data rekaan, dimuat dalam mod demo sahaja
- `css/tokens.css` — palet, disalin daripada `smiaag-teacher-profile`
- `backend/` — sumber Apps Script; `dist/Code.gs` ialah gabungan untuk ditampal
- `tests/` — ujian backend dengan tiruan Apps Script
