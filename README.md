# SisPrakAI - Sistem Praktikum Kecerdasan Buatan

Sistem Praktikum berbasis web untuk memfasilitasi asisten praktikum (asprak) dan mahasiswa praktikan pada mata kuliah Kecerdasan Buatan di Telkom University.

Proyek ini menggunakan **Next.js (App Router)** untuk *frontend* dan *API*, serta **Supabase (PostgreSQL)** untuk *database*.

---

## 🚀 Panduan Menjalankan Secara Lokal (Local Development)

### 1. Prasyarat Sistem

Pastikan Anda sudah menginstal:

- [Node.js](https://nodejs.org/en/) (v18 ke atas)
- [Git](https://git-scm.com/)

### 2. Kloning Repositori & Instalasi

Buka terminal dan jalankan perintah berikut:

```bash
# Clone repositori (jika belum)
git clone <url-repo-anda>
cd SisPrakAI

# Masuk ke folder frontend tempat Next.js berada
cd frontend

# Install semua dependensi
npm install
```

### 3. Konfigurasi Variabel Lingkungan (.env)

Di dalam folder `frontend`, buat file bernama `.env.local`:

```bash
# Salin format dari konfigurasi di bawah
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (Dapatkan dari Supabase)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (Dapatkan dari Supabase)
JWT_SECRET=super-secret-jwt-key-for-development
```

### 4. Menjalankan Server Lokal

Pastikan Anda berada di folder `frontend` dan jalankan:

```bash
npm run dev
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Setup Database (Supabase)

Proyek ini telah dilengkapi dengan *script* migrasi yang lengkap.

### Panduan Setup via Supabase Cloud (Dashboard)

1. Buat akun dan proyek baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Pergi ke menu **SQL Editor**.
3. Buka folder `backend/` pada proyek ini, dan salin isi dari ketiga file berikut secara berurutan lalu jalankan (klik tombol **RUN**) di SQL Editor Supabase:
   - `001_create_tables.sql` (Membuat skema tabel dasar)
   - `002_create_rls_policies.sql` (Mengatur keamanan akses baris/RLS)
   - `003_seed_data.sql` (Memasukkan data *seed* praktikan kelas D4SM, modul, dan asprak dummy).
4. Masuk ke **Project Settings** > **API**.
5. Salin `Project URL` ke dalam `NEXT_PUBLIC_SUPABASE_URL` di `.env.local` Anda.
6. Salin `anon` `public` key ke dalam `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
7. Salin `service_role` `secret` key ke dalam `SUPABASE_SERVICE_ROLE_KEY`.

### Struktur Akun Bawaan (Dari Data Seed)

- **Login Asprak**:
  - Masukkan NIM: `ASPRAK01`
- **Login Praktikan**:
  - Anda dapat melihat salah satu NIM dari data file Excel atau dari tabel `users` di Supabase untuk masuk ke portal mahasiswa. Tidak ada penggunaan *password* di portal ini.

---

## ☁️ Panduan Deploy ke Vercel

Aplikasi ini dirancang menggunakan arsitektur monolith modular dan *Edge functions* sehingga dioptimalkan secara langsung untuk di-*deploy* ke Vercel.

### Langkah-Langkah:

1. Pastikan seluruh kode Anda sudah di-*push* ke repositori Git online (GitHub / GitLab / Bitbucket).
2. Masuk ke [Vercel](https://vercel.com/) dan buat proyek baru dengan menekan tombol **"Add New..."** -> **"Project"**.
3. Lakukan *Import* pada repositori SisPrakAI Anda.
4. Pada bagian **"Configure Project"**:7
   - **Framework Preset**: Biarkan terdeteksi otomatis sebagai `Next.js`.
   - **Root Directory**: Edit/Ubah menjadi `frontend`. (Vercel perlu diarahkan ke folder ini karena instalasi dan *package.json* berada di dalam `frontend`).
   - **Environment Variables**: Salin konfigurasi kredensial `Supabase` Anda seperti di bawah ini:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `JWT_SECRET` (Silakan isi dengan string *hash* rahasia/acak untuk mengamankan *cookies* otentikasi di sisi produksi).
5. Klik **Deploy**.

Vercel akan otomatis melakukan proses *build*. Setelah selesai, proyek dapat langsung diakses melalui URL Vercel yang diberikan. Setiap kali Anda melakukan perubahan dan melakukan *push* ke branch `main`, Vercel akan memperbarui aplikasi Anda (Auto-deployment).

---

## Struktur Direktori Utama

- `/frontend` - Kode sumber aplikasi web Next.js (komponen React, Server Actions, Middleware, Styling CSS).
- `/backend` - Skrip manajemen Supabase, dan file-file SQL (*migrations*, *seed*, RLS).
- `/docs` - Dokumen Sistem (PRD, SRS, Arsitektur, Keamanan, Panduan Desain).
- `/data` - Data *raw* berformat Excel / sumber daftar mahasiswa awal.
