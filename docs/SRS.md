# SRS.md — Software Requirements Specification

> SisPrakAI · Sistem Praktikum Kecerdasan Buatan
> Versi 1.0 · 29 September 2026
> Berdasarkan IEEE 830-1998 (disederhanakan)

---

## 1. Pendahuluan

### 1.1 Tujuan Dokumen

Dokumen ini mendefinisikan kebutuhan perangkat lunak (software requirements) untuk sistem **SisPrakAI** secara teknis dan terukur. Ditujukan untuk pengembang, penguji, dan stakeholder yang terlibat dalam pembangunan sistem.

### 1.2 Ruang Lingkup

SisPrakAI adalah aplikasi web yang:
- Mengelola nilai praktikum 136 mahasiswa di 5 kelas
- Mengelola upload/download file hasil praktikum dan tugas
- Memberikan transparansi nilai kepada mahasiswa
- Mencatat kehadiran per pertemuan
- Mengatur tenggat waktu pengumpulan

### 1.3 Definisi & Istilah

| Istilah | Definisi |
|---------|----------|
| **Asprak** | Asisten Praktikum — pengguna dengan hak mengelola kelas, nilai, dan file |
| **Praktikan** | Mahasiswa yang mengikuti praktikum |
| **NIM** | Nomor Induk Mahasiswa — identifier unik mahasiswa |
| **Modul** | Unit praktikum (Modul 01–11) |
| **Komponen Penilaian** | 4 aspek penilaian: Pelaksanaan (35%), Laporan (25%), Ketepatan Waktu (25%), Kehadiran (15%) |
| **Skor** | Nilai integer 0–5 per komponen |
| **Poin** | Hasil perhitungan (skor/5 × bobot × 100) |
| **Nilai Modul** | Jumlah poin dari 4 komponen (max 100) |
| **Supabase** | Backend-as-a-Service yang menyediakan database PostgreSQL, auth, dan storage |

### 1.4 Referensi

- [client-need.txt](file:///d:/SEM5/ASPRAK/Artificial%20Intelegence/SisPrakAI/client-need.txt) — Kebutuhan klien
- [DESIGN.md](file:///d:/SEM5/ASPRAK/Artificial%20Intelegence/SisPrakAI/DESIGN.md) — Sistem desain
- [PRD.md](file:///d:/SEM5/ASPRAK/Artificial%20Intelegence/SisPrakAI/PRD.md) — Product Requirements
- [Rubrik Penilaian.pdf](file:///d:/SEM5/ASPRAK/Artificial%20Intelegence/SisPrakAI/Rubrik%20Penilaian.pdf) — Rubrik penilaian resmi
- [Pemetaan_Materi_Kecerdasan_Buatan.xlsx](file:///d:/SEM5/ASPRAK/Artificial%20Intelegence/SisPrakAI/Pemetaan_Materi_Kecerdasan_Buatan.xlsx) — Silabus

---

## 2. Deskripsi Umum

### 2.1 Perspektif Produk

SisPrakAI adalah sistem standalone yang berjalan sebagai aplikasi web. Tidak terintegrasi dengan sistem akademik universitas (SIAKAD). Data mahasiswa di-seed manual dari file Excel yang telah disediakan.

### 2.2 Fungsi Utama Produk

```
┌────────────────────────────────────────────────────┐
│                    SisPrakAI                        │
│                                                    │
│  ┌──────────────┐         ┌──────────────────┐     │
│  │   Asprak     │         │    Praktikan     │     │
│  │              │         │                  │     │
│  │ - Login      │         │ - Login (NIM)    │     │
│  │ - Kelola     │         │ - Lihat Nilai    │     │
│  │   Kelas      │         │ - Upload File    │     │
│  │ - Input      │         │ - Lihat Status   │     │
│  │   Nilai      │         │   Pengumpulan    │     │
│  │ - Absensi    │         │ - Lihat Absensi  │     │
│  │ - Set        │         │                  │     │
│  │   Deadline   │         │                  │     │
│  │ - Kelola     │         │                  │     │
│  │   File       │         │                  │     │
│  └──────┬───────┘         └────────┬─────────┘     │
│         │                          │               │
│         └──────────┬───────────────┘               │
│                    │                               │
│            ┌───────▼────────┐                      │
│            │   Supabase     │                      │
│            │  - PostgreSQL  │                      │
│            │  - Storage     │                      │
│            │  - Auth (JWT)  │                      │
│            └────────────────┘                      │
└────────────────────────────────────────────────────┘
```

### 2.3 Karakteristik Pengguna

| Karakteristik | Asprak | Praktikan |
|---------------|--------|-----------|
| Jumlah | ≤ 10 | 136 |
| Frekuensi akses | 1–3x/minggu | 1–2x/minggu |
| Literasi teknologi | Menengah–Tinggi | Menengah |
| Device utama | Desktop/Laptop | Desktop + Mobile |

### 2.4 Batasan

- Database dan storage menggunakan Supabase (tidak self-hosted)
- Frontend menggunakan Next.js
- Autentikasi tanpa password (hanya NIM)
- Bahasa UI: Bahasa Indonesia
- Zona waktu: WIB (UTC+7)
- Tidak ada integrasi dengan sistem eksternal

### 2.5 Asumsi & Dependensi

- Supabase free tier cukup untuk skala 136 mahasiswa
- Data mahasiswa dari 5 file Excel sudah benar dan final
- Browser pengguna mendukung JavaScript modern (ES2020+)
- Koneksi internet tersedia (tidak ada mode offline)

---

## 3. Kebutuhan Fungsional

### FR-01: Autentikasi dengan NIM

| Atribut | Detail |
|---------|--------|
| **ID** | FR-01 |
| **Prioritas** | Wajib |
| **Input** | NIM (string numerik, 10–12 digit) |
| **Proses** | 1. Validasi format NIM (hanya angka, min 10 digit)<br>2. Cari NIM di tabel `users`<br>3. Tentukan role (`asprak` atau `praktikan`)<br>4. Buat session (JWT via Supabase Auth atau custom token) |
| **Output** | Redirect ke dashboard sesuai role |
| **Kondisi Error** | NIM tidak ditemukan → pesan "NIM tidak terdaftar dalam sistem"<br>Input kosong → "Silakan masukkan NIM"<br>Format salah → "NIM harus berupa angka" |

**Validasi NIM**:
```
Format: ^[0-9]{10,12}$
NIM valid examples: 707022500006, 7708213002
NIM invalid: abc123, 12345, 707022500006a
```

---

### FR-02: Dashboard Asprak

| Atribut | Detail |
|---------|--------|
| **ID** | FR-02 |
| **Prioritas** | Wajib |
| **Akses** | Role = asprak |
| **Data Ditampilkan** | - Total kelas: 5<br>- Total mahasiswa: 136<br>- Per kelas: jumlah mahasiswa, jumlah file belum diperiksa, deadline terdekat<br>- Quick actions: navigasi ke kelas, input nilai |
| **Trigger** | Otomatis saat login sebagai asprak |

---

### FR-03: Daftar Kelas

| Atribut | Detail |
|---------|--------|
| **ID** | FR-03 |
| **Prioritas** | Wajib |
| **Akses** | Role = asprak |
| **Data** | 5 kelas: D4SM-49-01 (31 mhs), D4SM-49-02 (25), D4SM-49-03 (28), D4SM-49-04 (24), D4SM-49-05 (28) |
| **Interaksi** | Klik kelas → lihat daftar mahasiswa |

---

### FR-04: Daftar Mahasiswa per Kelas

| Atribut | Detail |
|---------|--------|
| **ID** | FR-04 |
| **Prioritas** | Wajib |
| **Akses** | Role = asprak |
| **Data per Baris** | No, NIM, Nama Mahasiswa |
| **Fitur** | - Search by nama/NIM (real-time filter)<br>- Sort by kolom<br>- Klik baris → detail mahasiswa |
| **Validasi** | Data harus match persis dengan file Excel sumber |

**Jumlah mahasiswa per kelas**:
- D4SM-49-01: 31 mahasiswa
- D4SM-49-02: 25 mahasiswa
- D4SM-49-03: 28 mahasiswa
- D4SM-49-04: 24 mahasiswa
- D4SM-49-05: 28 mahasiswa
- **Total: 136 mahasiswa**

---

### FR-05: Input Nilai Praktikum

| Atribut | Detail |
|---------|--------|
| **ID** | FR-05 |
| **Prioritas** | Wajib |
| **Akses** | Role = asprak |
| **Input per Mahasiswa per Modul** | 4 skor integer (0–5):<br>- `skor_pelaksanaan`<br>- `skor_laporan`<br>- `skor_ketepatan_waktu`<br>- `skor_kehadiran` |
| **Computed Fields** | `poin_pelaksanaan` = skor/5 × 35<br>`poin_laporan` = skor/5 × 25<br>`poin_ketepatan_waktu` = skor/5 × 25<br>`poin_kehadiran` = Jika HADIR (5/5*15). Jika TERLAMBAT <=10mnt (4/5*15). Jika TERLAMBAT 11-30mnt (3/5*15). Jika TERLAMBAT 31-60mnt (2/5*15). Jika TERLAMBAT >60mnt (1/5*15). SAKIT/IZIN/DISPEN/ALPA = 0.<br>`nilai_total` = Σ poin (max 100) |
| **Mode Input** | 1. Individual: per mahasiswa per modul<br>2. Batch: semua mahasiswa untuk 1 modul (tabel editable) |
| **Validasi** | Skor harus integer 0–5. Skor di luar rentang ditolak. |
| **Persistensi** | Simpan ke database saat asprak klik "Simpan" atau saat berpindah baris (auto-save opsional) |

**Contoh perhitungan** (dari Rubrik Penilaian.pdf):

```
Mahasiswa A: skor = [4, 4, 5, 5]
  Pelaksanaan:      4/5 × 35 = 28
  Laporan:          4/5 × 25 = 20
  Ketepatan Waktu:  5/5 × 25 = 25
  Kehadiran:        5/5 × 15 = 15
  Total = 88

Mahasiswa B: skor = [5, 5, 2, 5]
  Pelaksanaan:      5/5 × 35 = 35
  Laporan:          5/5 × 25 = 25
  Ketepatan Waktu:  2/5 × 25 = 10
  Kehadiran:        5/5 × 15 = 15
  Total = 85
```

---

### FR-06: Absensi Kehadiran

| Atribut | Detail |
|---------|--------|
| **ID** | FR-06 |
| **Prioritas** | Wajib |
| **Akses** | Role = asprak |
| **Input** | Per mahasiswa per pertemuan: status ∈ {HADIR, SAKIT, IZIN, DISPEN, ALPA, TERLAMBAT}. Jika status TERLAMBAT, tambahkan input durasi: <= 10, 11-30, 31-60, > 60 |
| **Pertemuan** | P1 – P12 (12 pertemuan praktikum) |
| **Computed Fields** | `jumlah_hadir` = COUNT(status = 'HADIR')<br>`persentase_hadir` = jumlah_hadir / 12 × 100% |
| **Display** | Tabel: baris = mahasiswa, kolom = P1–P12, + kolom Jumlah + kolom Persentase |
| **Default** | Jika belum diisi, sel kosong (null) |

---

### FR-07: Tenggat Waktu (Deadline)

| Atribut | Detail |
|---------|--------|
| **ID** | FR-07 |
| **Prioritas** | Wajib |
| **Akses** | Set = asprak; Lihat = asprak + praktikan |
| **Data** | modul_id, kelas_id, tipe ('praktikum' \| 'tugas'), tanggal_tenggat (datetime), created_by |
| **Logika Status File** | `uploaded_at ≤ tanggal_tenggat` → Tepat Waktu<br>`uploaded_at > tanggal_tenggat` → Terlambat (hitung selisih hari)<br>`uploaded_at = null AND now() ≤ tanggal_tenggat` → Belum Dikumpulkan<br>`uploaded_at = null AND now() > tanggal_tenggat` → Belum Dikumpulkan (overdue) |
| **Validasi** | Tanggal tenggat harus di masa depan saat dibuat. Bisa diedit setelah dibuat. |

---

### FR-08: Upload File Praktikan

| Atribut | Detail |
|---------|--------|
| **ID** | FR-08 |
| **Prioritas** | Wajib |
| **Akses** | Role = praktikan |
| **Input** | File + modul_id + tipe ('praktikum' \| 'tugas') |
| **Validasi File** | Tipe: .pdf, .ipynb, .zip, .py, .docx<br>Ukuran: ≤ 25 MB<br>Nama file: akan di-rename ke format `{NIM}_{modul}_{tipe}.{ext}` |
| **Storage** | Supabase Storage bucket, path: `uploads/{kelas_id}/{modul_id}/{filename}` |
| **Re-upload** | Diizinkan. File lama dihapus dari storage. Konfirmasi modal sebelum overwrite. |
| **Metadata** | Upload timestamp disimpan untuk perhitungan ketepatan waktu |

---

### FR-09: Dashboard Praktikan

| Atribut | Detail |
|---------|--------|
| **ID** | FR-09 |
| **Prioritas** | Wajib |
| **Akses** | Role = praktikan |
| **Data** | - Informasi pribadi: NIM, Nama, Kelas<br>- Ringkasan nilai: tabel modul × nilai total<br>- Status pengumpulan per modul<br>- Deadline terdekat<br>- Persentase kehadiran |
| **Filter Data** | `WHERE nim = {session.nim}` — hanya data milik sendiri |

---

### FR-10: Transparansi Nilai

| Atribut | Detail |
|---------|--------|
| **ID** | FR-10 |
| **Prioritas** | Wajib |
| **Akses** | Role = praktikan |
| **Data per Modul** | - 4 skor komponen (read-only)<br>- 4 poin komponen (computed)<br>- Nilai total modul<br>- Rubrik kriteria (expandable/tooltip) |
| **Data Agregat** | - Tabel rekap semua modul<br>- Rata-rata nilai<br>- Persentase kehadiran (jumlah_hadir / 12) |
| **Constraint** | Tidak boleh menampilkan data mahasiswa lain |

---

### FR-11: Download File oleh Asprak

| Atribut | Detail |
|---------|--------|
| **ID** | FR-11 |
| **Prioritas** | Wajib |
| **Akses** | Role = asprak |
| **Fitur** | - Download file individual (direct link dari Supabase)<br>- Download bulk per modul per kelas (generate ZIP server-side atau client-side) |
| **Filter** | Per kelas, per modul, per tipe (praktikum/tugas) |

---

### FR-12: Logout

| Atribut | Detail |
|---------|--------|
| **ID** | FR-12 |
| **Prioritas** | Wajib |
| **Proses** | Hapus session → redirect ke halaman login |
| **Akses** | Semua role |

---

## 4. Kebutuhan Non-Fungsional

### NFR-01: Performa

| Metrik | Target |
|--------|--------|
| Time to First Byte (TTFB) | < 500ms |
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3s |
| API response time (average) | < 300ms |
| File upload throughput | ≥ 1 MB/s pada koneksi 10 Mbps |

### NFR-02: Skalabilitas

| Metrik | Target |
|--------|--------|
| Concurrent users | ≥ 50 (peak saat deadline) |
| Total registered users | 146 (136 praktikan + ≤ 10 asprak) |
| Total modul × kelas | 55 (11 modul × 5 kelas) |
| Total file upload slots | 1,496 (136 mhs × 11 modul, jika 1 file/modul) |
| Max storage | ≤ 40 GB (136 × 11 × 25 MB worst case) |

### NFR-03: Keamanan

Lihat [SECURITY.md](file:///d:/SEM5/ASPRAK/Artificial%20Intelegence/SisPrakAI/SECURITY.md) untuk detail.

| Aspek | Requirement |
|-------|-------------|
| Autentikasi | NIM-based session dengan JWT |
| Otorisasi | Row Level Security (RLS) di Supabase |
| Data isolation | Praktikan hanya bisa akses data sendiri |
| File access | Signed URL (expire setelah 1 jam) |
| SQL injection | Dicegah via Supabase client SDK (parameterized queries) |
| XSS | Sanitasi input, CSP header |
| CSRF | Token-based protection |

### NFR-04: Ketersediaan (Availability)

| Metrik | Target |
|--------|--------|
| Uptime | 99% selama semester |
| Planned downtime | Maks 1 jam per bulan, di luar jam kuliah |
| Error recovery | Auto-retry untuk failed API calls (max 3x) |

### NFR-05: Kompatibilitas

| Browser | Versi Minimum |
|---------|---------------|
| Chrome | 110+ |
| Firefox | 110+ |
| Safari | 16+ |
| Edge | 110+ |

| Device | Resolusi Minimum |
|--------|-----------------|
| Desktop | 1024 × 768 |
| Tablet | 768 × 1024 |
| Mobile | 360 × 640 |

### NFR-06: Usability

| Aspek | Requirement |
|-------|-------------|
| Learnability | Pengguna baru bisa menyelesaikan tugas utama tanpa panduan dalam < 5 menit |
| Error prevention | Konfirmasi sebelum aksi destruktif (hapus, overwrite) |
| Feedback | Setiap aksi menghasilkan feedback visual dalam < 1 detik |
| Accessibility | WCAG 2.1 Level AA minimum |
| Language | Semua UI text dalam Bahasa Indonesia |

### NFR-07: Maintainability

| Aspek | Requirement |
|-------|-------------|
| Code style | ESLint + Prettier enforced |
| Type safety | TypeScript strict mode |
| Component reuse | Design system dari DESIGN.md |
| Database migration | Via Supabase migration files |
| Version control | Git dengan conventional commits |

---

## 5. Constraint pada Database

### 5.1 Tabel `users`

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nim         TEXT UNIQUE NOT NULL,
  nama        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('asprak', 'praktikan')),
  kelas_id    UUID REFERENCES kelas(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Constraint: NIM unik
-- Constraint: role hanya 'asprak' atau 'praktikan'
-- Index: CREATE INDEX idx_users_nim ON users(nim);
```

### 5.2 Tabel `kelas`

```sql
CREATE TABLE kelas (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode  TEXT UNIQUE NOT NULL,  -- 'D4SM-49-01', dst.
  nama  TEXT NOT NULL
);
```

### 5.3 Tabel `modul`

```sql
CREATE TABLE modul (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor   INT UNIQUE NOT NULL CHECK (nomor BETWEEN 1 AND 11),
  kode    TEXT UNIQUE NOT NULL,  -- 'MOD-01', dst.
  judul   TEXT NOT NULL,
  minggu  INT NOT NULL
);
```

### 5.4 Tabel `nilai`

```sql
CREATE TABLE nilai (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id            UUID NOT NULL REFERENCES users(id),
  modul_id                UUID NOT NULL REFERENCES modul(id),
  skor_pelaksanaan        INT CHECK (skor_pelaksanaan BETWEEN 0 AND 5),
  skor_laporan            INT CHECK (skor_laporan BETWEEN 0 AND 5),
  skor_ketepatan_waktu    INT CHECK (skor_ketepatan_waktu BETWEEN 0 AND 5),
  skor_kehadiran          INT CHECK (skor_kehadiran BETWEEN 0 AND 5),
  updated_by              UUID REFERENCES users(id),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mahasiswa_id, modul_id)
);

-- Computed (di application layer atau generated column):
-- poin_pelaksanaan      = skor_pelaksanaan / 5.0 * 35
-- poin_laporan          = skor_laporan / 5.0 * 25
-- poin_ketepatan_waktu  = skor_ketepatan_waktu / 5.0 * 25
-- poin_kehadiran        = skor_kehadiran / 5.0 * 15
-- nilai_total           = SUM(semua poin)
```

### 5.5 Tabel `absensi`

```sql
CREATE TABLE absensi (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id  UUID NOT NULL REFERENCES users(id),
  pertemuan     INT NOT NULL CHECK (pertemuan BETWEEN 1 AND 12),
  status        TEXT NOT NULL CHECK (status IN ('HADIR', 'SAKIT', 'IZIN', 'DISPEN', 'ALPA', 'TERLAMBAT')),
  keterlambatan TEXT CHECK (keterlambatan IN ('<= 10', '11-30', '31-60', '> 60')),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mahasiswa_id, pertemuan)
);
```

### 5.6 Tabel `deadline`

```sql
CREATE TABLE deadline (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modul_id        UUID NOT NULL REFERENCES modul(id),
  kelas_id        UUID NOT NULL REFERENCES kelas(id),
  tipe            TEXT NOT NULL CHECK (tipe IN ('praktikum', 'tugas')),
  tanggal_tenggat TIMESTAMPTZ NOT NULL,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(modul_id, kelas_id, tipe)
);
```

### 5.7 Tabel `file_upload`

```sql
CREATE TABLE file_upload (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id  UUID NOT NULL REFERENCES users(id),
  modul_id      UUID NOT NULL REFERENCES modul(id),
  tipe          TEXT NOT NULL CHECK (tipe IN ('praktikum', 'tugas')),
  filename      TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  file_size     BIGINT NOT NULL CHECK (file_size <= 26214400), -- 25 MB
  uploaded_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mahasiswa_id, modul_id, tipe)
);

-- Constraint: 1 file per mahasiswa per modul per tipe
-- Re-upload = UPDATE existing row + replace file di storage
```

### 5.8 Tabel `asesmen` (opsional, untuk nilai asesmen terpisah)

```sql
CREATE TABLE asesmen (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id  UUID NOT NULL REFERENCES users(id),
  tipe          TEXT NOT NULL CHECK (tipe IN ('asesmen_1', 'asesmen_2', 'tugas_besar')),
  nilai         NUMERIC(5,2) CHECK (nilai BETWEEN 0 AND 100),
  updated_by    UUID REFERENCES users(id),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mahasiswa_id, tipe)
);
```

---

## 6. Kebutuhan Interface

### 6.1 User Interface

Semua halaman mengacu pada [DESIGN.md](file:///d:/SEM5/ASPRAK/Artificial%20Intelegence/SisPrakAI/DESIGN.md).

**Daftar Halaman**:

| No | Route | Judul | Akses |
|----|-------|-------|-------|
| 1 | `/` | Halaman Login | Publik |
| 2 | `/asprak` | Dashboard Asprak | asprak |
| 3 | `/asprak/kelas/[kelasId]` | Daftar Mahasiswa Kelas | asprak |
| 4 | `/asprak/kelas/[kelasId]/nilai` | Input Nilai per Modul | asprak |
| 5 | `/asprak/kelas/[kelasId]/absensi` | Absensi Kehadiran | asprak |
| 6 | `/asprak/kelas/[kelasId]/file` | File yang Dikumpulkan | asprak |
| 7 | `/asprak/kelas/[kelasId]/deadline` | Atur Tenggat Waktu | asprak |
| 8 | `/praktikan` | Dashboard Praktikan | praktikan |
| 9 | `/praktikan/nilai` | Nilai Saya (Detail) | praktikan |
| 10 | `/praktikan/tugas` | Tugas & Upload File | praktikan |

### 6.2 API Interface

Menggunakan Supabase Client SDK (JavaScript). Tidak membangun REST API terpisah.

**Operasi utama**:

| Operasi | Method | Table/Function |
|---------|--------|---------------|
| Login | SELECT | `users` WHERE nim = ? |
| Get kelas list | SELECT | `kelas` |
| Get students by class | SELECT | `users` WHERE kelas_id = ? |
| Get/set nilai | SELECT/UPSERT | `nilai` |
| Get/set absensi | SELECT/UPSERT | `absensi` |
| Set deadline | UPSERT | `deadline` |
| Upload file | INSERT/UPDATE | `file_upload` + Supabase Storage |
| Get student dashboard | SELECT | `nilai`, `absensi`, `file_upload`, `deadline` WHERE mahasiswa_id = ? |

### 6.3 Hardware Interface

Tidak ada. Sistem berjalan sepenuhnya di browser dan cloud (Supabase).

### 6.4 Software Interface

| Software | Interface |
|----------|-----------|
| Supabase PostgreSQL | `@supabase/supabase-js` SDK |
| Supabase Storage | `supabase.storage.from('uploads')` |
| Supabase Auth | Custom JWT atau magic link (simplified to NIM lookup) |
| Next.js | App Router (v14+) |
| Vercel / hosting | Deployment platform |

---

## 7. Traceability Matrix

Memetakan kebutuhan fungsional ke komponen sistem:

| Requirement | Login | Dashboard | Kelas | Nilai | Absensi | Deadline | File | RLS |
|-------------|-------|-----------|-------|-------|---------|----------|------|-----|
| FR-01 (Auth) | X | | | | | | | X |
| FR-02 (Dashboard Asprak) | | X | | | | | | |
| FR-03 (Daftar Kelas) | | | X | | | | | |
| FR-04 (Daftar Mahasiswa) | | | X | | | | | |
| FR-05 (Input Nilai) | | | | X | | | | |
| FR-06 (Absensi) | | | | | X | | | |
| FR-07 (Deadline) | | | | | | X | | |
| FR-08 (Upload File) | | | | | | | X | X |
| FR-09 (Dashboard Praktikan) | | X | | X | X | X | X | X |
| FR-10 (Transparansi Nilai) | | | | X | X | | | X |
| FR-11 (Download File) | | | | | | | X | |
| FR-12 (Logout) | X | | | | | | | |

---

## 8. Appendix: Data Seed

### A.1 Kelas

```
D4SM-49-01  (31 mahasiswa)
D4SM-49-02  (25 mahasiswa)
D4SM-49-03  (28 mahasiswa)
D4SM-49-04  (24 mahasiswa)
D4SM-49-05  (28 mahasiswa)
```

### A.2 Modul

```
MOD-01: Menggunakan Google Colab dan Membaca Data (Minggu 2)
MOD-02: Model Machine Learning dengan Random Forest (Minggu 3)
MOD-03: Random Forest dengan Data Numerikal dan Kategorikal (Minggu 4)
MOD-04: Stratified K-Fold Cross Validation (Minggu 6)
MOD-05: Stratified K-Fold CV dengan KNN (Minggu 7)
MOD-06: Stratified K-Fold CV dengan SVM (Minggu 8)
MOD-07: Stratified K-Fold CV dengan Neural Network MLP (Minggu 9)
MOD-08: Pengolahan Citra Digital (Minggu 11)
MOD-09: Klasifikasi Gambar MNIST dengan CNN (Minggu 12)
MOD-10: Klasifikasi Citra dengan VGG16 dan 5-Fold Cross Validation (Minggu 13)
MOD-11: Membangun chatbot sederhana (Minggu 14)
```

### A.3 Sumber Data Mahasiswa

Data mahasiswa di-seed dari file berikut:
- `D4SM-49-01.xlsx` → Sheet "Kelas 49-01"
- `D4SM-49-02.xlsx` → Sheet "Sheet1"
- `D4SM-49-03.xlsx` → Sheet "Sheet1"
- `D4SM-49-04.xlsx` → Sheet "Sheet1"
- `D4SM-49-05.xlsx` → Sheet "Daftar Mahasiswa"
