# SECURITY.md — Dokumen Keamanan

> SisPrakAI · Sistem Praktikum Kecerdasan Buatan
> Versi 1.0 · 29 September 2026

---

## 1. Ringkasan Keamanan

SisPrakAI menggunakan model autentikasi yang **disederhanakan** (login hanya dengan NIM, tanpa password). Keputusan ini diambil secara sadar dengan pertimbangan:

1. **Data yang ditampilkan bersifat non-sensitif** — hanya nilai praktikum dan file tugas
2. **Setiap pengguna hanya bisa melihat data miliknya sendiri**
3. **Kemudahan akses lebih diprioritaskan** untuk konteks praktikum semester

Dokumen ini menjelaskan mitigasi risiko untuk model autentikasi tersebut dan langkah-langkah keamanan di setiap lapisan sistem.

---

## 2. Threat Model

### 2.1 Aset yang Dilindungi

| Aset | Klasifikasi | Dampak jika Bocor |
|------|-------------|-------------------|
| Nilai mahasiswa (milik sendiri) | Internal | Rendah — mahasiswa memang seharusnya tahu nilainya |
| Nilai mahasiswa (milik orang lain) | Internal | Sedang — privasi akademik |
| NIM + Nama mahasiswa | Internal | Rendah — data umum di lingkungan kampus |
| File tugas mahasiswa | Internal | Sedang — karya intelektual |
| Session token | Confidential | Tinggi — bisa digunakan untuk impersonation |
| Supabase credentials | Secret | Kritis — akses penuh ke database |

### 2.2 Threat Actors

| Actor | Motivasi | Kemampuan |
|-------|----------|-----------|
| Mahasiswa iseng | Melihat nilai teman | Rendah — coba-coba NIM teman |
| Mahasiswa teknis | Eksploitasi API | Menengah — bisa inspect network requests |
| External attacker | Data harvesting | Tinggi — automated tools |

### 2.3 Attack Surface

```
┌──────────────────────────────────────────────────────┐
│  Browser (Client)                                    │
│  ├── Login form → NIM enumeration                    │
│  ├── Client-side storage → session theft             │
│  ├── File upload → malicious file                    │
│  └── JavaScript → XSS                               │
│                                                      │
│  Next.js (Server / API Routes)                       │
│  ├── API endpoints → unauthorized access             │
│  ├── Server-side rendering → SSRF                    │
│  └── Environment variables → credential exposure     │
│                                                      │
│  Supabase (Backend)                                  │
│  ├── Database → SQL injection (mitigated by SDK)     │
│  ├── Storage → unauthorized file access              │
│  ├── RLS policies → bypass                           │
│  └── Service key → full database access              │
└──────────────────────────────────────────────────────┘
```

---

## 3. Autentikasi

### 3.1 Mekanisme Login

```
1. Praktikan/Asprak memasukkan NIM di form login
2. Client mengirim NIM ke API route (server-side)
3. Server mencari NIM di tabel users
4. Jika ditemukan → buat JWT token berisi { nim, role, kelas_id }
5. Token disimpan di httpOnly cookie (bukan localStorage)
6. Redirect ke dashboard sesuai role
```

### 3.2 Mengapa Tanpa Password (dan Mitigasinya)

| Risiko | Mitigasi |
|--------|----------|
| **NIM enumeration** — seseorang bisa coba NIM teman | 1. Rate limiting: max 10 login attempt / IP / menit<br>2. Tidak membedakan error "NIM tidak ditemukan" vs error lain<br>3. Cooldown 30 detik setelah 5 gagal berturut-turut |
| **Session hijacking** — token dicuri | 1. httpOnly + Secure + SameSite=Strict cookie<br>2. Session expire setelah 24 jam<br>3. Logout menghapus cookie + invalidate server-side |
| **Impersonation** — login sebagai orang lain | 1. Accepted risk: dampak rendah (hanya lihat nilai sendiri)<br>2. Tidak ada aksi finansial atau destruktif dari sisi praktikan<br>3. Asprak login terpisah dengan mekanisme tambahan (lihat 3.3) |

### 3.3 Login Asprak — Keamanan Tambahan

Karena asprak memiliki akses lebih luas (input nilai, lihat semua data), login asprak memiliki lapisan tambahan:

```
Opsi A (Rekomendasi): NIM + kode akses statis
  - Kode akses diberikan oleh admin/dosen
  - Disimpan di database sebagai hash (bcrypt)
  - Contoh: NIM = 707022500001, Kode = "asprak2026"

Opsi B (Alternatif): NIM + Magic Link via email
  - Asprak memasukkan NIM
  - Sistem kirim link login ke email terdaftar
  - Link expire setelah 15 menit
```

> Pilihan antara Opsi A dan B ditentukan saat implementasi. Opsi A lebih sederhana dan sesuai dengan semangat "kemudahan" dari client-need.txt.

---

## 4. Otorisasi — Row Level Security (RLS)

### 4.1 Prinsip

Semua akses data dikendalikan di level database melalui Supabase RLS. Bahkan jika client-side code dimanipulasi, database tidak akan mengembalikan data yang tidak berhak diakses.

### 4.2 Kebijakan RLS

#### Tabel `users`

```sql
-- Asprak bisa lihat semua user
CREATE POLICY "Asprak can view all users"
ON users FOR SELECT
USING (
  (SELECT role FROM users WHERE nim = current_setting('app.current_nim')) = 'asprak'
);

-- Praktikan hanya bisa lihat data sendiri
CREATE POLICY "Praktikan can only view self"
ON users FOR SELECT
USING (nim = current_setting('app.current_nim'));
```

#### Tabel `nilai`

```sql
-- Asprak bisa CRUD semua nilai
CREATE POLICY "Asprak full access to nilai"
ON nilai FOR ALL
USING (
  (SELECT role FROM users WHERE nim = current_setting('app.current_nim')) = 'asprak'
);

-- Praktikan hanya bisa SELECT nilai sendiri
CREATE POLICY "Praktikan can view own nilai"
ON nilai FOR SELECT
USING (
  mahasiswa_id = (SELECT id FROM users WHERE nim = current_setting('app.current_nim'))
);
```

#### Tabel `absensi`

```sql
-- Asprak bisa CRUD semua absensi
CREATE POLICY "Asprak full access to absensi"
ON absensi FOR ALL
USING (
  (SELECT role FROM users WHERE nim = current_setting('app.current_nim')) = 'asprak'
);

-- Praktikan hanya bisa lihat absensi sendiri
CREATE POLICY "Praktikan can view own absensi"
ON absensi FOR SELECT
USING (
  mahasiswa_id = (SELECT id FROM users WHERE nim = current_setting('app.current_nim'))
);
```

#### Tabel `file_upload`

```sql
-- Asprak bisa lihat dan download semua file
CREATE POLICY "Asprak can view all files"
ON file_upload FOR SELECT
USING (
  (SELECT role FROM users WHERE nim = current_setting('app.current_nim')) = 'asprak'
);

-- Praktikan bisa CRUD file sendiri
CREATE POLICY "Praktikan can manage own files"
ON file_upload FOR ALL
USING (
  mahasiswa_id = (SELECT id FROM users WHERE nim = current_setting('app.current_nim'))
);
```

#### Tabel `deadline`

```sql
-- Asprak bisa CRUD deadline
CREATE POLICY "Asprak can manage deadlines"
ON deadline FOR ALL
USING (
  (SELECT role FROM users WHERE nim = current_setting('app.current_nim')) = 'asprak'
);

-- Praktikan bisa lihat deadline (read-only)
CREATE POLICY "Praktikan can view deadlines"
ON deadline FOR SELECT
USING (true);  -- Semua praktikan bisa lihat deadline
```

---

## 5. Keamanan Data

### 5.1 Data in Transit

| Aspek | Implementasi |
|-------|-------------|
| Protokol | HTTPS (TLS 1.2+) wajib |
| Certificate | Dikelola oleh Vercel / hosting provider |
| Supabase connection | SSL enforced |
| API calls | Melalui Supabase SDK (HTTPS) |

### 5.2 Data at Rest

| Aspek | Implementasi |
|-------|-------------|
| Database | Supabase managed PostgreSQL — encrypted at rest oleh GCP/AWS |
| File storage | Supabase Storage — encrypted at rest |
| Backups | Supabase managed backups (daily, 7-day retention di free tier) |

### 5.3 Data Sensitivity Classification

| Data | Level | Handling |
|------|-------|---------|
| NIM | Low | Ditampilkan langsung, tidak di-mask |
| Nama | Low | Ditampilkan langsung |
| Nilai | Medium | Hanya ditampilkan ke pemilik dan asprak |
| File tugas | Medium | Hanya diakses via signed URL |
| Session token | High | httpOnly cookie, tidak accessible via JS |
| Supabase keys | Critical | Environment variables, tidak di-commit ke git |

---

## 6. Keamanan Aplikasi

### 6.1 Pencegahan XSS (Cross-Site Scripting)

| Vektor | Mitigasi |
|--------|----------|
| User input (nama, NIM) | Data dari database, bukan user-input langsung. React auto-escapes by default. |
| File upload nama file | Rename file ke format standar: `{NIM}_{modul}_{tipe}.{ext}` |
| URL parameters | Validasi server-side, type-check |
| Content Security Policy | `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.supabase.co` |

### 6.2 Pencegahan CSRF (Cross-Site Request Forgery)

| Mitigasi | Implementasi |
|----------|-------------|
| SameSite cookie | `SameSite=Strict` pada session cookie |
| Origin validation | Cek `Origin` header di API routes |
| State-changing requests | Hanya via POST/PUT/DELETE, bukan GET |

### 6.3 Pencegahan SQL Injection

| Mitigasi | Implementasi |
|----------|-------------|
| Parameterized queries | Supabase SDK otomatis menggunakan parameterized queries |
| No raw SQL | Tidak menulis raw SQL di client. Semua via SDK. |
| Server-side validation | Validasi tipe data sebelum kirim ke database |

### 6.4 File Upload Security

| Risiko | Mitigasi |
|--------|----------|
| Malicious file (executable) | Whitelist ekstensi: `.pdf`, `.ipynb`, `.zip`, `.py`, `.docx` |
| File bomb (zip bomb) | Max file size 25 MB enforced di client DAN server |
| Path traversal | Supabase Storage mengelola path secara internal |
| Direct access | File diakses via signed URL (expire 1 jam), bukan direct path |

### 6.5 Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Login (`/api/auth/login`) | 10 requests / IP / menit |
| API queries | 60 requests / user / menit |
| File upload | 5 requests / user / menit |
| Bulk download | 3 requests / user / menit |

Implementasi: via Next.js middleware atau Vercel Edge Config.

---

## 7. Keamanan Infrastruktur

### 7.1 Environment Variables

```env
# JANGAN pernah commit ke repository
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...        # Public, safe to expose
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...             # CRITICAL — server-side only
JWT_SECRET=your-jwt-secret                       # Server-side only
```

**Aturan**:
- `SUPABASE_SERVICE_ROLE_KEY` dan `JWT_SECRET` TIDAK BOLEH ada di client bundle
- Gunakan `.env.local` untuk development
- Gunakan environment variables di hosting platform untuk production
- `.env.local` HARUS ada di `.gitignore`

### 7.2 .gitignore Security Rules

```gitignore
# Environment variables
.env
.env.local
.env.production
.env*.local

# Supabase
supabase/.env

# Node
node_modules/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

### 7.3 Dependency Security

- `npm audit` dijalankan sebelum setiap deployment
- Dependensi di-lock via `package-lock.json`
- Tidak menggunakan dependensi yang tidak di-maintain (last update > 1 tahun)
- Minimal dependensi — hanya yang benar-benar dibutuhkan

---

## 8. Logging & Monitoring

### 8.1 Event yang Di-log

| Event | Level | Data yang Di-log |
|-------|-------|-----------------|
| Login berhasil | INFO | NIM, timestamp, IP |
| Login gagal | WARN | NIM yang dicoba, timestamp, IP |
| Nilai diubah | INFO | asprak NIM, mahasiswa NIM, modul, old/new value |
| File diupload | INFO | mahasiswa NIM, modul, filename, size |
| File dihapus/overwrite | INFO | mahasiswa NIM, modul, old filename |
| Rate limit hit | WARN | IP, endpoint |
| RLS violation attempt | ERROR | User NIM, query attempted |

### 8.2 Data yang TIDAK Di-log

- Password atau kode akses (hanya hash)
- Full file content
- Supabase service role key
- JWT token content

### 8.3 Log Storage

- Development: console output
- Production: Vercel Logs atau Supabase Logs (managed)
- Retention: 7 hari (free tier)

---

## 9. Incident Response Plan

### Jika Terjadi Pelanggaran Data

1. **Identifikasi** — apa yang bocor, siapa yang terpengaruh
2. **Containment** — revoke Supabase keys, rotate secrets
3. **Notification** — beritahu mahasiswa yang terpengaruh dan dosen pengampu
4. **Recovery** — restore dari backup jika data dimodifikasi
5. **Post-mortem** — analisis root cause, perbaiki

### Jika Terjadi NIM Abuse (Seseorang Login sebagai Orang Lain)

1. Dampak rendah: hanya bisa melihat nilai (read-only dari sisi praktikan)
2. Monitor log untuk pola login abnormal (banyak NIM berbeda dari 1 IP)
3. Jika eskalasi: aktifkan mekanisme password/OTP

---

## 10. Compliance & Privacy

| Aspek | Status |
|-------|--------|
| Data pribadi (NIM, Nama) | Bukan data sensitif tinggi dalam konteks akademik |
| Persetujuan pengguna | Implisit — mahasiswa terdaftar di kelas secara resmi |
| Hak akses data | Mahasiswa hanya bisa akses data sendiri |
| Retensi data | Data disimpan selama semester berlangsung. Penghapusan di akhir semester. |
| Portabilitas data | Tidak ada fitur export data personal di v1.0 |

---

## 11. Security Checklist (Pre-Launch)

- [ ] HTTPS enforced di semua route
- [ ] Supabase RLS policies aktif dan teruji
- [ ] `SUPABASE_SERVICE_ROLE_KEY` tidak muncul di client bundle
- [ ] `.env.local` ada di `.gitignore`
- [ ] Session cookie: httpOnly, Secure, SameSite=Strict
- [ ] Rate limiting aktif di login endpoint
- [ ] File upload validasi di client DAN server
- [ ] CSP header terpasang
- [ ] `npm audit` clean (0 high/critical vulnerabilities)
- [ ] Login asprak memiliki lapisan tambahan (kode akses)
- [ ] Test: praktikan tidak bisa akses data praktikan lain
- [ ] Test: praktikan tidak bisa akses endpoint asprak
- [ ] Test: direct API call tanpa session ditolak
- [ ] Test: file upload dengan ekstensi terlarang ditolak
- [ ] Test: file upload > 25 MB ditolak
