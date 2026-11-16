/**
 * Config.gs — pemalar sistem Koku SMIAAG (rekod kokurikulum pelajar).
 *
 * Rahsia TIDAK disimpan di sini. Ia berada dalam Script Properties:
 *   SHEET_ID     ID Sheet utama (diisi oleh sediaSistem)
 *   ARKIB_ID     ID Sheet arkib (diisi oleh sediaSistem)
 *   KUNCI_ADMIN  kunci rahsia yang dikongsi dengan backend Profil Guru
 */
var MAKS_HASIL_CARIAN = 25;
var MIN_HURUF_CARIAN = 3;
var MAKS_MENUNGGU = 5;          // rekod pencapaian menunggu pengesahan bagi setiap pelajar
var MAKS_HANTAR_SEJAM = 300;    // had seluruh sistem, penahan banjir
var PIN_MAKS_CUBA = 5;          // percubaan PIN bagi setiap pelajar
var PIN_KUNCI_SAAT = 900;       // dikunci 15 minit selepas had percubaan
var PIN_HARI_LALAI = 7;         // PIN luput selepas 7 hari jika tidak dibatalkan
var TAHUN_SIMPAN_ARKIB = 3;     // arkib pelajar yang tamat disimpan 3 tahun

var PERINGKAT = ['Sekolah', 'Daerah', 'Negeri', 'Kebangsaan', 'Antarabangsa'];
var PENCAPAIAN = ['Johan', 'Naib Johan', 'Ketiga', 'Keempat', 'Penyertaan'];
var MEDAN_WAJIB = ['kelas', 'rumah', 'uniform', 'kelab', 'sukan_rasmi'];
var MEDAN_PELAJAR_BOLEH_UBAH = ['no_daftar', 'nama', 'jantina', 'tingkatan', 'kelas', 'rumah', 'uniform', 'pangkat', 'kelab', 'jawatan', 'sukan_rasmi'];

/** Struktur setiap tab. Urutan di sini ialah urutan lajur dalam Sheet. */
var SKEMA = {
  pelajar: ['id', 'no_daftar', 'nama', 'jantina', 'tingkatan', 'kelas', 'rumah', 'uniform', 'pangkat', 'kelab', 'jawatan', 'sukan_rasmi', 'dikemas_kini', 'oleh'],
  wakil: ['id', 'pelajar_id', 'tahun', 'sukan'],
  pencapaian: ['id', 'pelajar_id', 'tahun', 'sukan', 'kejohanan', 'peringkat', 'pencapaian', 'status', 'sumber', 'dihantar_pada', 'diputus_oleh', 'diputus_pada', 'catatan'],
  rekod_tahunan: ['tahun', 'pelajar_id', 'nama', 'tingkatan', 'kelas', 'rumah', 'uniform', 'pangkat', 'kelab', 'jawatan', 'sukan_rasmi', 'aktiviti_ekstra'],
  pin: ['pelajar_id', 'hash', 'salt', 'luput', 'dicipta_oleh', 'dicipta_pada'],
  guru_koku: ['susunan', 'kumpulan', 'nama', 'jawatan', 'foto_url', 'papar'],
  rujukan: ['jenis', 'nilai', 'tingkatan', 'warna'],
  tetapan: ['kunci', 'nilai'],
  log_audit: ['masa', 'oleh', 'aksi', 'sasaran', 'butiran']
};
/** Tab arkib (dalam fail Sheet berasingan). */
var SKEMA_ARKIB = {
  pelajar: ['tahun_tamat'].concat(SKEMA.pelajar),
  rekod_tahunan: SKEMA.rekod_tahunan,
  pencapaian: SKEMA.pencapaian,
  wakil: SKEMA.wakil
};

var RUJUKAN_LALAI = {
  rumah: [['Fatah', 'merah'], ['Falah', 'hijau'], ['Najah', 'biru'], ['Solah', 'kuning']],
  uniform: ['KRS', 'KASPA', 'BSMM', 'Puteri Islam'],
  kelab: ['Persatuan Bahasa Arab Komunikasi', 'Persatuan Sejarah', 'Persatuan Seni Visual', 'Persatuan Sains Matematik',
    'Kelab Pelancongan', 'Kelab Debat', 'Kelab Masakan', 'Kelab Digital', 'Kelab Landskap', 'Kelab Kembara MyCare',
    'Kelab Usahawan 1', 'Kelab Usahawan 2', 'Kelab Pencinta Hadis', 'Kelab Nasyid', 'Kelab Rakan Hidayah',
    'Kelab Inovasi & Robotik', 'Kelab Warisan', 'Kelab Kraftangan', 'Kelab Memanah Tradisional (METRA)',
    'Kelab Pengguna', 'Kelab Kitar Semula (Go Green)', 'Kelab Bahasa Antarabangsa'],
  sukan: ['Badminton', 'Bola Baling', 'Bola Jaring', 'Bola Keranjang', 'Bola Sepak', 'Bola Tampar', 'Boling Tenpin', 'Catur',
    'Golf', 'Memanah Moden', 'Olahraga', 'Ping Pong', 'Renang', 'Merentas Desa', 'Takraw', 'Esport'],
  kebitaraan: ['Pasukan Inovasi & Robotik', 'Pasukan Kesenian & Kebudayaan', 'Pasukan Debat Bahasa Arab',
    'Pasukan Debat Bahasa Inggeris', 'Pasukan Debat Bahasa Melayu'],
  kelas: { 1: ['Qurtubi', 'Ibnu Kathir', 'Arobi', 'Urwah', 'Tabari'], 2: ['Hassan', 'Maliki', 'Sufian', 'Hanbali', 'Uthman'],
    3: ['Hanafi', 'Syafie', 'Suyuthi', 'Ar-Razi'], 4: ['Imanuddin', 'Nuruddin', 'Salahuddin', 'Thariq', 'Saifuddin'],
    5: ['Saad', 'Said', 'Salman', 'Suhaib', 'Sofwan'] },
  aktiviti: { 1: 'KHIDMAS (Khidmat Masyarakat)', 2: 'Kem Asas', 3: 'Ekspedisi', 4: 'Wafdul Amin (Keusahawanan)', 5: 'Eksplorasi' }
};
