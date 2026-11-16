/* Tetapan laman. Ubah di sini, bukan dalam app.js. */
window.KOKU_CONFIG = {
  // true = guna data rekaan dalam js/data.js. Tukar ke false bila Apps Script sudah siap.
  DEMO: true,

  // URL Apps Script Web App (diisi kemudian).
  API_URL: '',

  TAHUN_SEMASA: 2026,

  // Gambar aktiviti koku untuk latar belakang. Letak fail dalam assets/bg/ dan senaraikan di sini.
  // Saiz dicadangkan: lebar 1600px, JPG/WebP, bawah 250KB setiap satu.
  BG_IMAGES: [
    'assets/bg/contoh-1.svg',
    'assets/bg/contoh-2.svg',
    'assets/bg/contoh-3.svg'
  ],
  BG_INTERVAL_MS: 14000,

  RUMAH: {
    Fatah: { warna: 'merah' },
    Falah: { warna: 'hijau' },
    Najah: { warna: 'biru' },
    Solah: { warna: 'kuning' }
  },

  AKTIVITI_EKSTRA: {
    1: 'KHIDMAS (Khidmat Masyarakat)',
    2: 'Kem Asas',
    3: 'Ekspedisi',
    4: 'Wafdul Amin (Keusahawanan)',
    5: 'Eksplorasi'
  },

  KELAB: [
    'Persatuan Bahasa Arab Komunikasi', 'Persatuan Sejarah', 'Persatuan Seni Visual',
    'Persatuan Sains Matematik', 'Kelab Pelancongan', 'Kelab Debat', 'Kelab Masakan',
    'Kelab Digital', 'Kelab Landskap', 'Kelab Kembara MyCare', 'Kelab Usahawan 1',
    'Kelab Usahawan 2', 'Kelab Pencinta Hadis', 'Kelab Nasyid', 'Kelab Rakan Hidayah',
    'Kelab Inovasi & Robotik', 'Kelab Warisan', 'Kelab Kraftangan',
    'Kelab Memanah Tradisional (METRA)', 'Kelab Pengguna', 'Kelab Kitar Semula (Go Green)',
    'Kelab Bahasa Antarabangsa'
  ],

  SUKAN: [
    'Badminton', 'Bola Baling', 'Bola Jaring', 'Bola Keranjang', 'Bola Sepak', 'Bola Tampar',
    'Boling Tenpin', 'Catur', 'Golf', 'Memanah Moden', 'Olahraga', 'Ping Pong', 'Renang',
    'Merentas Desa', 'Takraw', 'Esport'
  ],

  KEBITARAAN: [
    'Pasukan Inovasi & Robotik', 'Pasukan Kesenian & Kebudayaan', 'Pasukan Debat Bahasa Arab',
    'Pasukan Debat Bahasa Inggeris', 'Pasukan Debat Bahasa Melayu'
  ],

  // SEMENTARA: senarai sebenar unit beruniform belum diterima.
  UNIFORM: [
    'Pengakap', 'Puteri Islam', 'Kadet Remaja Sekolah', 'Persatuan Bulan Sabit Merah',
    'Kadet Bomba', 'Kadet Polis'
  ],

  PERINGKAT: ['Sekolah', 'Daerah', 'Negeri', 'Kebangsaan', 'Antarabangsa'],
  PENCAPAIAN: ['Johan', 'Naib Johan', 'Ketiga', 'Keempat', 'Penyertaan']
};
