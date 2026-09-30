# PRD.md — Product Requirements Document

> SisPrakAI · Sistem Praktikum Kecerdasan Buatan
> Versi 1.0 · 29 September 2026

---

## 1. Ringkasan Produk

### Nama Produk
**SisPrakAI** — Sistem Informasi Praktikum Kecerdasan Buatan

### Satu Kalimat
Platform web yang memudahkan asisten praktikum mengelola nilai dan file, serta memberikan transparansi kepada mahasiswa praktikan.

### Masalah yang Diselesaikan

| Stakeholder | Masalah Saat Ini |
|-------------|-----------------|
| **Asisten Praktikum (Asprak)** | Mengelola nilai 136 mahasiswa di 5 kelas secara manual via spreadsheet. Sulit melacak siapa yang sudah/belum mengumpulkan file praktikum. Tidak ada sistem tenggat waktu otomatis. |
| **Praktikan (Mahasiswa)** | Tidak tahu nilai secara transparan. Tidak ada tempat resmi untuk mengumpulkan file. Harus bertanya langsung ke asprak untuk tahu status pengumpulan. |

### Konteks Akademik

| Atribut | Detail |
|---------|--------|
| Mata Kuliah | Kecerdasan Buatan (GHK2DAB4) — 4 SKS |
| Program Studi | D4 Teknologi Rekayasa Multimedia |
| Fakultas | Ilmu Terapan, Telkom University |
| Semester | Gasal 2025/2026 |
| Jumlah Kelas | 5 (D4SM-49-01 s.d. D4SM-49-05) |
| Total Mahasiswa | 136 |
| Jumlah Modul Praktikum | 11 modul (Modul 01 – Modul 11) |
| Durasi | 16 minggu |

---

## 2. Target Pengguna

### Persona 1: Asisten Praktikum (Asprak)

- **Siapa**: Mahasiswa senior yang bertugas membimbing praktikum
- **Jumlah**: 1 atau lebih per kelas (total ≤ 10 orang)
- **Kebutuhan utama**: Input nilai cepat untuk banyak mahasiswa, kelola file yang dikumpulkan, atur deadline
- **Frekuensi pakai**: Setiap minggu setelah sesi praktikum
- **Device**: Laptop/desktop (utama), jarang pakai mobile
- **Toleransi kompleksitas**: Sedang — mau belajar sedikit asal efisien

### Persona 2: Praktikan (Mahasiswa)

- **Siapa**: Mahasiswa semester 5 yang mengambil MK Kecerdasan Buatan
- **Jumlah**: 136 orang
- **Kebutuhan utama**: Lihat nilai sendiri, upload file praktikum dan tugas, cek status pengumpulan
- **Frekuensi pakai**: Setiap minggu saat ada tugas, sesekali cek nilai
- **Device**: Laptop dan mobile (50/50)
- **Toleransi kompleksitas**: Rendah — harus langsung paham tanpa panduan

---

## 3. Autentikasi & Otorisasi

### Model Autentikasi

| Aspek | Detail |
|-------|--------|
| **Metode** | Login hanya dengan NIM (tanpa password) |
| **Alasan** | Kemudahan akses. Data yang ditampilkan hanya nilai sendiri, bukan data sensitif yang memerlukan proteksi tingkat tinggi. |
| **Role detection** | Sistem menentukan role berdasarkan NIM yang diinput: jika NIM terdaftar sebagai asprak → masuk dashboard asprak. Jika NIM terdaftar sebagai praktikan → masuk dashboard praktikan. Jika NIM tidak dikenal → error. |

### Matrix Otorisasi

| Fitur | Asprak | Praktikan |
|-------|--------|-----------|
| Lihat daftar semua kelas | Ya | Tidak |
| Lihat semua mahasiswa per kelas | Ya | Tidak |
| Input/edit nilai | Ya | Tidak |
| Set tenggat waktu | Ya | Tidak |
| Lihat semua file yang dikumpulkan | Ya | Tidak |
| Download file mahasiswa | Ya | Tidak |
| Lihat nilai sendiri | — | Ya (hanya milik sendiri) |
| Upload/re-upload file | — | Ya (hanya milik sendiri) |
| Lihat daftar tugas | — | Ya (hanya milik sendiri) |
| Lihat status pengumpulan | — | Ya (hanya milik sendiri) |

---

## 4. Fitur Detail

### F-01: Login dengan NIM

**Deskripsi**: Pengguna memasukkan NIM untuk masuk ke sistem. Tidak ada password.

**Alur**:
1. Pengguna membuka halaman utama
2. Pengguna mengetik NIM di input field
3. Pengguna klik "Masuk"
4. Sistem cek NIM di database:
   - Jika NIM milik asprak → redirect ke dashboard asprak
   - Jika NIM milik praktikan → redirect ke dashboard praktikan
   - Jika NIM tidak ditemukan → tampilkan pesan error "NIM tidak terdaftar"
5. Sistem menyimpan session

**Kriteria Penerimaan**:
- [ ] Input NIM menerima hanya angka
- [ ] Validasi real-time: minimal 10 digit
- [ ] Error message jelas dan di bawah input
- [ ] Session bertahan sampai logout atau browser ditutup
- [ ] Tombol "Masuk sebagai Asisten Praktikum" tersedia sebagai link terpisah

---

### F-02: Dashboard Asprak

**Deskripsi**: Halaman utama asprak setelah login, menampilkan ringkasan keseluruhan.

**Data yang ditampilkan**:
- Jumlah kelas yang diampu
- Jumlah total mahasiswa
- Ringkasan per kelas:
  - Jumlah mahasiswa
  - Modul terakhir yang dinilai
  - Jumlah file yang belum diperiksa
  - Pengumpulan mendekati/melewati deadline

**Kriteria Penerimaan**:
- [ ] Semua data akurat dan real-time dari database
- [ ] Klik card kelas → navigasi ke halaman kelas tersebut
- [ ] Loading state saat data belum siap

---

### F-03: Manajemen Kelas & Mahasiswa

**Deskripsi**: Asprak dapat melihat daftar kelas dan mahasiswa per kelas.

**Fitur**:
- Daftar 5 kelas (D4SM-49-01 s.d. 05)
- Per kelas: tabel mahasiswa (No, NIM, Nama)
- Search/filter berdasarkan nama atau NIM
- Sort berdasarkan kolom

**Kriteria Penerimaan**:
- [ ] Menampilkan semua 136 mahasiswa dengan benar sesuai kelasnya
- [ ] Search real-time (filter saat mengetik)
- [ ] Klik baris mahasiswa → lihat detail (nilai, file, absensi)

---

### F-04: Input & Edit Nilai Praktikum

**Deskripsi**: Asprak memberikan skor 0–5 untuk setiap komponen penilaian per modul per mahasiswa.

**4 Komponen Penilaian per Modul**:

| Komponen | Bobot | Skor |
|----------|-------|------|
| Pelaksanaan Praktikum | 35% | 0–5 |
| Laporan Praktikum | 25% | 0–5 |
| Ketepatan Waktu | 25% | 0–5 |
| Kehadiran & Kedisiplinan | 15% | 0–5 |

**Perhitungan otomatis**:
```
Poin per komponen = (skor / 5) × bobot × 100
Nilai Modul = Σ poin semua komponen (max 100)
```

**Mode Input**:
1. **Per mahasiswa**: klik mahasiswa → isi skor per komponen per modul
2. **Per modul batch**: pilih modul → isi skor semua mahasiswa sekaligus (tabel)

**Kriteria Penerimaan**:
- [ ] Skor hanya bisa 0, 1, 2, 3, 4, atau 5 (dropdown atau stepper)
- [ ] Poin dan nilai total dihitung otomatis real-time
- [ ] Bisa edit nilai yang sudah diinput
- [ ] Perubahan tersimpan ke database (auto-save atau tombol simpan)
- [ ] Validasi: tidak bisa input skor di luar rentang 0–5
- [ ] Tooltip/keterangan rubrik saat hover pada komponen

---

### F-05: Absensi / Kehadiran

**Deskripsi**: Asprak mencatat kehadiran per pertemuan per mahasiswa.

**Status kehadiran**: HADIR, SAKIT, IZIN, ALFA

**Data**:
- 12 pertemuan praktikum (P1 – P12)
- Jumlah hadir otomatis dihitung
- Persentase kehadiran otomatis

**Kriteria Penerimaan**:
- [ ] Tabel absensi: baris = mahasiswa, kolom = P1–P12
- [ ] Pilih status via dropdown di setiap sel
- [ ] Jumlah hadir dan persentase dihitung otomatis
- [ ] Bisa edit status yang sudah diinput

---

### F-06: Manajemen Tenggat Waktu

**Deskripsi**: Asprak mengatur deadline pengumpulan file per modul.

**Data per deadline**:
- Modul terkait (Modul 01 – 11)
- Tipe (Praktikum / Tugas)
- Tanggal & waktu tenggat
- Status (Aktif / Kadaluarsa)

**Kriteria Penerimaan**:
- [ ] Asprak bisa set deadline per modul per kelas
- [ ] Date-time picker untuk memilih tanggal & waktu
- [ ] Sistem otomatis menandai status file berdasarkan deadline:
  - Upload sebelum deadline → "Tepat Waktu"
  - Upload setelah deadline → "Terlambat" (+ hitung selisih hari)
  - Tidak upload → "Belum Dikumpulkan"
- [ ] Asprak bisa edit deadline yang sudah ditetapkan

---

### F-07: Upload File oleh Praktikan

**Deskripsi**: Praktikan mengunggah file hasil praktikum dan tugas.

**Spesifikasi**:
- Upload per modul (1 file praktikum + 1 file tugas per modul, jika ada)
- Format: PDF, IPYNB, ZIP, PY, DOCX (bisa dikonfigurasi)
- Ukuran maks: 25 MB per file
- Bisa upload ulang (re-upload) — file lama ditimpa

**Kriteria Penerimaan**:
- [ ] Drag-and-drop area + tombol browse
- [ ] Validasi tipe file dan ukuran sebelum upload
- [ ] Progress bar selama upload
- [ ] Konfirmasi sebelum re-upload: "File sebelumnya akan diganti. Lanjutkan?"
- [ ] Timestamp upload tersimpan (untuk perhitungan ketepatan waktu)
- [ ] Setelah deadline, masih bisa upload tapi ditandai "Terlambat"

---

### F-08: Dashboard Praktikan

**Deskripsi**: Halaman utama praktikan setelah login dengan NIM.

**Data yang ditampilkan**:
- Nama dan NIM
- Kelas
- Ringkasan nilai per modul (jika sudah dinilai)
- Daftar tugas/modul yang perlu dikumpulkan
- Status pengumpulan per modul
- Deadline terdekat

**Kriteria Penerimaan**:
- [ ] Hanya menampilkan data milik NIM yang login
- [ ] Nilai yang belum diinput asprak tampil sebagai "-"
- [ ] Highlight deadline yang < 3 hari ke depan
- [ ] Tidak ada akses ke data mahasiswa lain

---

### F-09: Transparansi Nilai Praktikan

**Deskripsi**: Praktikan melihat nilai detail per modul.

**Data per modul**:
- Skor per komponen (Pelaksanaan, Laporan, Ketepatan Waktu, Kehadiran)
- Poin per komponen
- Nilai total modul
- Rubrik kriteria (penjelasan setiap skor)

**Tampilan tambahan**:
- Rekapitulasi semua modul dalam tabel
- Rata-rata nilai semua modul
- Persentase kehadiran

**Kriteria Penerimaan**:
- [ ] Semua skor dan poin sesuai dengan yang diinput asprak
- [ ] Formula perhitungan transparan (tooltip atau expandable)
- [ ] Read-only — praktikan tidak bisa edit
- [ ] Rubrik bisa dilihat sebagai referensi

---

### F-10: Lihat & Kelola File yang Dikumpulkan (Asprak)

**Deskripsi**: Asprak melihat semua file yang telah dikumpulkan mahasiswa.

**Fitur**:
- Filter per kelas, per modul
- Daftar: Nama mahasiswa, NIM, file, waktu upload, status (tepat waktu / terlambat)
- Download file individual
- Download semua file per modul per kelas (bulk download sebagai ZIP)

**Kriteria Penerimaan**:
- [ ] Tabel dengan kolom yang bisa di-sort
- [ ] Indikator visual untuk status pengumpulan
- [ ] Download individual dan bulk
- [ ] Preview nama file dan ukuran

---

## 5. Struktur Data (Ringkasan)

### Entitas Utama

```
Kelas
├── id, nama (D4SM-49-01, dst), kode
│
├── Mahasiswa[]
│   ├── id, nim, nama, kelas_id, role (praktikan/asprak)
│   │
│   ├── Absensi[]
│   │   ├── id, mahasiswa_id, pertemuan (P1-P12), status (HADIR/SAKIT/IZIN/ALFA)
│   │
│   ├── Nilai[]
│   │   ├── id, mahasiswa_id, modul_id
│   │   ├── skor_pelaksanaan (0-5)
│   │   ├── skor_laporan (0-5)
│   │   ├── skor_ketepatan_waktu (0-5)
│   │   ├── skor_kehadiran (0-5)
│   │   ├── poin_total (computed)
│   │
│   └── File[]
│       ├── id, mahasiswa_id, modul_id, tipe (praktikum/tugas)
│       ├── filename, url, size, uploaded_at
│
└── Modul[]
    ├── id, nomor (01-11), judul, minggu
    │
    └── Deadline[]
        ├── id, modul_id, kelas_id, tipe (praktikum/tugas)
        ├── tanggal_tenggat, created_by (asprak_id)
```

---

## 6. Modul Praktikum (Data Tetap)

Berikut 11 modul yang perlu ada di sistem:

| No | Kode | Judul Modul | Minggu |
|----|------|-------------|--------|
| 1 | MOD-01 | Menggunakan Google Colab dan Membaca Data | 2 |
| 2 | MOD-02 | Model Machine Learning dengan Random Forest | 3 |
| 3 | MOD-03 | Random Forest dengan Data Numerikal dan Kategorikal | 4 |
| 4 | MOD-04 | Stratified K-Fold Cross Validation | 6 |
| 5 | MOD-05 | Stratified K-Fold CV dengan KNN | 7 |
| 6 | MOD-06 | Stratified K-Fold CV dengan SVM | 8 |
| 7 | MOD-07 | Stratified K-Fold CV dengan Neural Network (MLP) | 9 |
| 8 | MOD-08 | Pengolahan Citra Digital | 11 |
| 9 | MOD-09 | Klasifikasi Gambar MNIST dengan CNN | 12 |
| 10 | MOD-10 | Klasifikasi Citra dengan VGG16 dan 5-Fold Cross Validation | 13 |
| 11 | MOD-11 | Membangun chatbot sederhana | 14 |

---

## 7. Asesmen & Bobot Nilai Akhir

Selain nilai per modul, ada 3 asesmen utama:

| Asesmen | Bobot | Minggu | Keterangan |
|---------|-------|--------|------------|
| Asesmen 1 | 30% | Minggu 5 | Mencakup Modul 01–03 (CLO-1) |
| Asesmen 2 | 30% | Minggu 10 | Mencakup Modul 04–07 (CLO-2) |
| Tugas Besar | 40% | Minggu 15–16 | Mencakup Modul 08–11 (CLO-3) |

> Catatan: Nilai asesmen diinput terpisah oleh asprak, bukan dihitung dari rata-rata modul.

---

## 8. Persyaratan Non-Fungsional

| Aspek | Requirement |
|-------|-------------|
| **Performa** | Halaman load < 2 detik pada koneksi 4G |
| **Skalabilitas** | Menampung 136 mahasiswa + 10 asprak secara bersamaan |
| **Ketersediaan** | Uptime 99% selama semester berjalan |
| **Browser** | Chrome, Firefox, Safari, Edge (2 versi terakhir) |
| **Responsif** | Usable di mobile (min 360px width) |
| **Bahasa UI** | Bahasa Indonesia |
| **Timezone** | WIB (UTC+7) |

---

## 9. Out of Scope (Versi 1.0)

Fitur-fitur berikut **tidak** termasuk dalam versi pertama:

- Notifikasi email/push untuk deadline
- Chat antara asprak dan praktikan
- Integrasi dengan sistem akademik universitas (SIAKAD)
- Multi mata kuliah (hanya untuk Kecerdasan Buatan)
- Laporan cetak / export PDF nilai
- Grading otomatis berdasarkan file yang dikumpulkan
- Versi mobile app native
- Dark mode

---

## 10. Milestone & Prioritas

### Fase 1 — Foundation (Sprint 1–2)
- [x] Dokumen perencanaan (DESIGN, PRD, SRS, SECURITY, ARCHITECTURE)
- [ ] Setup Next.js + Supabase
- [ ] Skema database + seed data mahasiswa
- [ ] Halaman login
- [ ] Layout dasar (sidebar, routing)

### Fase 2 — Core Asprak (Sprint 3–4)
- [ ] Dashboard asprak
- [ ] Manajemen kelas & daftar mahasiswa
- [ ] Input/edit nilai per modul
- [ ] Absensi

### Fase 3 — Core Praktikan (Sprint 5–6)
- [ ] Dashboard praktikan
- [ ] Transparansi nilai
- [ ] Upload file
- [ ] Status pengumpulan

### Fase 4 — Advanced (Sprint 7–8)
- [ ] Tenggat waktu (deadline system)
- [ ] Bulk download file
- [ ] Rekap nilai & absensi
- [ ] Polish UI/UX, bug fixing

---

## 11. Metrik Keberhasilan

| Metrik | Target |
|--------|--------|
| Waktu login → dashboard | < 3 detik |
| Waktu input nilai 1 mahasiswa (4 komponen) | < 30 detik |
| Waktu upload file | < 10 detik (file ≤ 10MB) |
| Error rate | < 1% dari total request |
| Adopsi pengguna | 100% mahasiswa terdaftar bisa login dalam minggu pertama |
