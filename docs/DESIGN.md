# DESIGN.md — Sistem Desain SisPrakAI

> Sistem Praktikum Kecerdasan Buatan · Telkom University
> Versi 1.0 · 29 September 2026

---

## 1. Filosofi Desain

### Prinsip Utama

1. **Fungsional di atas dekoratif.** Setiap elemen visual harus punya alasan. Tidak ada ornamen tanpa fungsi.
2. **Jelas tanpa penjelasan.** Asprak dan praktikan harus bisa langsung pakai tanpa panduan.
3. **Jujur.** Tampilkan data apa adanya. Tidak menyembunyikan informasi di balik animasi atau transisi berlebihan.
4. **Konsisten.** Satu pola untuk satu fungsi. Tidak ada dua cara berbeda untuk hal yang sama.

### Larangan Keras

| Dilarang | Alasan |
|----------|--------|
| Emoji di UI | Mengurangi kesan profesional akademik |
| Gradien warna | Terkesan "AI-generated", bukan buatan manusia |
| Animasi berlebihan | Mengalihkan dari tugas utama |
| Drop shadow bertumpuk | Clutter visual |
| Border radius > 8px | Menghindari kesan "bubbly" yang tidak sesuai konteks akademik |
| Warna di luar palet | Konsistensi visual |
| Placeholder content | Semua teks harus bermakna |

---

## 2. Palet Warna

### Warna Primer

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  #BC9601   Emas Tua        → Aksen utama, CTA, highlight       │
│  #46AB50   Hijau           → Status sukses, konfirmasi          │
│  #EEEEEE   Abu Terang      → Background, surface sekunder       │
│  #101010   Hitam            → Teks utama, background gelap       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Turunan Warna (Derived)

Turunan ini dihitung dari warna primer untuk kebutuhan state dan konteks.

| Token | Hex | Penggunaan |
|-------|-----|------------|
| `--color-gold` | `#BC9601` | Tombol primer, link aktif, ikon aksen |
| `--color-gold-hover` | `#A68401` | Hover state tombol primer |
| `--color-gold-light` | `#BC96011A` | Background highlight (10% opacity) |
| `--color-gold-subtle` | `#F5EDD4` | Badge background, tag |
| `--color-green` | `#46AB50` | Status berhasil, badge "Sudah Dikumpulkan" |
| `--color-green-hover` | `#3D9646` | Hover state tombol sukses |
| `--color-green-light` | `#46AB501A` | Background status sukses (10% opacity) |
| `--color-surface` | `#EEEEEE` | Background halaman, area konten |
| `--color-surface-elevated` | `#FFFFFF` | Card, modal, dropdown |
| `--color-surface-sunken` | `#E0E0E0` | Input field background, area sekunder |
| `--color-black` | `#101010` | Teks heading, ikon utama |
| `--color-text-primary` | `#101010` | Teks utama |
| `--color-text-secondary` | `#555555` | Teks pendukung, caption |
| `--color-text-tertiary` | `#888888` | Placeholder, teks nonaktif |
| `--color-border` | `#D0D0D0` | Border default |
| `--color-border-focus` | `#BC9601` | Border saat fokus |
| `--color-danger` | `#C0392B` | Error, hapus, peringatan kritis |
| `--color-danger-hover` | `#A93226` | Hover state danger |
| `--color-danger-light` | `#C0392B1A` | Background error (10% opacity) |
| `--color-warning` | `#E67E22` | Peringatan, deadline mendekat |
| `--color-warning-light` | `#E67E221A` | Background warning |

### Aturan Kontras

- Teks di atas `#EEEEEE` → gunakan `#101010` (rasio ≥ 10:1)
- Teks di atas `#101010` → gunakan `#EEEEEE` (rasio ≥ 10:1)
- Teks di atas `#BC9601` → gunakan `#101010` (rasio ≥ 4.6:1)
- Teks di atas `#46AB50` → gunakan `#FFFFFF` (rasio ≥ 4.5:1)
- Minimum WCAG AA: 4.5:1 untuk teks biasa, 3:1 untuk teks besar

---

## 3. Tipografi

### Font Stack

```css
--font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

**Plus Jakarta Sans** dipilih karena:
- Sesuai dengan instruksi modifikasi dari pengguna.
- Terlihat modern, bersih, dan profesional.
- Tersedia di Google Fonts, gratis


### Skala Tipografi

| Token | Size | Weight | Line Height | Penggunaan |
|-------|------|--------|-------------|------------|
| `--text-display` | 28px | 700 | 1.2 | Judul halaman utama |
| `--text-h1` | 24px | 700 | 1.3 | Heading seksi |
| `--text-h2` | 20px | 600 | 1.3 | Sub-heading |
| `--text-h3` | 16px | 600 | 1.4 | Label grup, judul card |
| `--text-body` | 14px | 400 | 1.5 | Teks paragraf, konten utama |
| `--text-body-medium` | 14px | 500 | 1.5 | Label form, nama mahasiswa |
| `--text-small` | 12px | 400 | 1.4 | Caption, metadata, timestamp |
| `--text-tiny` | 11px | 500 | 1.3 | Badge, tag, keterangan minor |
| `--text-mono` | 14px | 400 | 1.5 | NIM, skor numerik |

### Aturan Tipografi

1. **NIM selalu pakai `font-variant-numeric: tabular-nums`** agar digit sejajar vertikal di tabel.
2. **Nama mahasiswa**: capitalize as-is dari database (sudah UPPERCASE), tampilkan apa adanya.
3. **Angka nilai**: rata kanan dalam tabel.
4. **Tidak ada italic** kecuali untuk placeholder text.
5. **Tidak ada underline** kecuali untuk link teks.

---

## 4. Spacing & Layout

### Skala Spacing

```
--space-1:   4px     Padding internal kecil
--space-2:   8px     Gap antar elemen inline
--space-3:  12px     Padding card internal
--space-4:  16px     Gap antar komponen
--space-5:  20px     Margin antar seksi kecil
--space-6:  24px     Padding card, gap kolom
--space-8:  32px     Margin antar seksi
--space-10: 40px     Margin antar blok besar
--space-12: 48px     Padding halaman
--space-16: 64px     Spacing hero/header
```

### Grid System

```
Sidebar:       260px fixed
Main Content:  1fr (fluid)
Max Width:     1200px
Gutter:        24px
```

### Breakpoints

| Token | Width | Target |
|-------|-------|--------|
| `--bp-mobile` | < 640px | Ponsel |
| `--bp-tablet` | 640px – 1024px | Tablet, laptop kecil |
| `--bp-desktop` | > 1024px | Desktop, monitor |

### Aturan Responsif

- **Mobile**: sidebar menjadi bottom navigation atau hamburger menu
- **Tablet**: sidebar collapse ke ikon saja (56px)
- **Desktop**: sidebar penuh dengan label teks

---

## 5. Komponen UI

### 5.1 Tombol (Button)

```
┌─────────────────────────────────────────────┐
│  Variant      │ Background    │ Text Color   │
│───────────────│───────────────│──────────────│
│  Primary      │ #BC9601       │ #101010      │
│  Secondary    │ transparent   │ #101010      │
│  Danger       │ #C0392B       │ #FFFFFF      │
│  Ghost        │ transparent   │ #555555      │
│  Success      │ #46AB50       │ #FFFFFF      │
└─────────────────────────────────────────────┘
```

- **Height**: 40px (default), 36px (compact), 48px (large)
- **Padding horizontal**: 16px (default), 12px (compact)
- **Border radius**: 6px
- **Border**: 1px solid untuk Secondary, tidak ada untuk yang lain
- **Hover**: darken 10% background
- **Disabled**: opacity 0.5, cursor not-allowed
- **Focus ring**: 2px solid `#BC9601`, offset 2px

### 5.2 Input Field

- **Height**: 40px
- **Background**: `#FFFFFF`
- **Border**: 1px solid `#D0D0D0`
- **Border radius**: 6px
- **Padding**: 0 12px
- **Focus**: border berubah ke `#BC9601`, shadow `0 0 0 3px #BC96013D`
- **Error**: border `#C0392B`, shadow `0 0 0 3px #C0392B3D`
- **Placeholder**: `#888888`, italic

### 5.3 Card

- **Background**: `#FFFFFF`
- **Border**: 1px solid `#D0D0D0`
- **Border radius**: 8px
- **Padding**: 24px
- **Shadow**: tidak ada (flat design)
- **Hover** (jika clickable): border `#BC9601`

### 5.4 Tabel

Tabel adalah komponen paling kritis di aplikasi ini (daftar mahasiswa, nilai, absensi).

- **Header row**: background `#101010`, teks `#EEEEEE`, font-weight 600
- **Body row**: background `#FFFFFF`, border-bottom 1px `#E0E0E0`
- **Alternating row** (opsional): `#F8F8F8`
- **Hover row**: background `#BC96010D` (gold 5%)
- **Cell padding**: 12px horizontal, 10px vertical
- **Kolom NIM**: `font-family: monospace`, `tabular-nums`
- **Kolom angka/nilai**: `text-align: right`
- **Kolom nama**: `text-align: left`, max-width dengan ellipsis jika overflow

### 5.5 Badge / Status Tag

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Sudah Dikumpulkan | `#46AB501A` | `#2E7D32` | none |
| Belum Dikumpulkan | `#C0392B1A` | `#C0392B` | none |
| Terlambat | `#E67E221A` | `#E67E22` | none |
| HADIR | `#46AB501A` | `#2E7D32` | none |
| SAKIT | `#E67E221A` | `#E67E22` | none |
| ALFA | `#C0392B1A` | `#C0392B` | none |
| IZIN | `#BC96011A` | `#BC9601` | none |

- **Padding**: 2px 8px
- **Border radius**: 4px
- **Font size**: 11px, font-weight 500, uppercase

### 5.6 Sidebar Navigation

- **Width**: 260px
- **Background**: `#101010`
- **Nav item text**: `#EEEEEE`
- **Nav item active**: background `#BC960126`, border-left 3px solid `#BC9601`, teks `#BC9601`
- **Nav item hover**: background `#FFFFFF0D`
- **Section divider**: 1px solid `#333333`
- **Logo/judul area**: padding 24px, font-size 16px bold

### 5.7 Modal / Dialog

- **Overlay**: `#10101080` (50% opacity)
- **Container**: `#FFFFFF`, border-radius 8px, max-width 520px
- **Header**: font `--text-h2`, border-bottom 1px `#E0E0E0`
- **Footer**: rata kanan, gap 8px antar tombol
- **Padding**: 24px

### 5.8 Toast / Notifikasi

- **Posisi**: top-right, 16px dari edge
- **Background**: `#101010`
- **Text**: `#EEEEEE`
- **Border-left**: 4px solid (warna sesuai tipe: hijau/merah/kuning)
- **Border radius**: 6px
- **Auto-dismiss**: 4 detik
- **Animasi**: slide-in dari kanan, fade-out

### 5.9 File Upload Area

- **Border**: 2px dashed `#D0D0D0`
- **Background**: `#F8F8F8`
- **Border radius**: 8px
- **Padding**: 32px
- **Hover/drag-over**: border `#BC9601`, background `#BC96010D`
- **Teks**: "Seret file ke sini atau klik untuk memilih" — `#888888`
- **Accepted file indicator**: nama file + ukuran + tombol hapus

### 5.10 Progress / Score Bar

Untuk visualisasi skor 0–5 per komponen penilaian:

- **Track**: height 8px, background `#E0E0E0`, border-radius 4px
- **Fill**: background `#BC9601`, border-radius 4px
- **Width**: proporsional (skor/5 × 100%)
- **Label**: di atas bar, menunjukkan "4/5" atau "80%"

---

## 6. Ikonografi

### Sumber Ikon

Gunakan **Lucide Icons** (fork dari Feather Icons):
- Konsisten, minimalis, stroke-based
- Ukuran default: 20px
- Stroke width: 1.5px
- Warna: inherit dari parent

### Ikon yang Digunakan

| Konteks | Ikon Lucide | Nama |
|---------|-------------|------|
| Dashboard | `LayoutDashboard` | layout-dashboard |
| Mahasiswa | `Users` | users |
| Upload file | `Upload` | upload |
| Download file | `Download` | download |
| Nilai | `ClipboardList` | clipboard-list |
| Absensi | `CalendarCheck` | calendar-check |
| Modul praktikum | `BookOpen` | book-open |
| Tenggat waktu | `Clock` | clock |
| Edit | `Pencil` | pencil |
| Hapus | `Trash2` | trash-2 |
| Simpan | `Check` | check |
| Batal | `X` | x |
| Cari / search | `Search` | search |
| Filter | `Filter` | filter |
| Logout | `LogOut` | log-out |
| Settings | `Settings` | settings |
| Chevron (expand) | `ChevronDown` | chevron-down |
| External link | `ExternalLink` | external-link |
| File | `File` | file |
| Alert | `AlertTriangle` | alert-triangle |

---

## 7. Layout Halaman

### 7.1 Layout Asprak (Desktop)

```
┌──────────────────────────────────────────────────────┐
│ Sidebar (260px)  │  Main Content Area                │
│                  │                                    │
│  [Logo]          │  ┌─ Header Bar ─────────────────┐ │
│  ──────────      │  │ Page Title     [Search] [👤]  │ │
│  Dashboard       │  └─────────────────────────────┘  │
│  Kelas           │                                    │
│   ├ 49-01        │  ┌─ Content ───────────────────┐  │
│   ├ 49-02        │  │                              │  │
│   ├ 49-03        │  │  (Tabel / Form / Detail)     │  │
│   ├ 49-04        │  │                              │  │
│   └ 49-05        │  │                              │  │
│  Modul           │  │                              │  │
│  Penilaian       │  └──────────────────────────────┘  │
│  ──────────      │                                    │
│  Pengaturan      │                                    │
│  Logout          │                                    │
└──────────────────────────────────────────────────────┘
```

### 7.2 Layout Praktikan (Desktop)

```
┌──────────────────────────────────────────────────────┐
│ Sidebar (260px)  │  Main Content Area                │
│                  │                                    │
│  [NIM]           │  ┌─ Header Bar ─────────────────┐ │
│  [Nama]          │  │ Page Title             [👤]  │  │
│  ──────────      │  └─────────────────────────────┘  │
│  Dashboard       │                                    │
│  Tugas Saya      │  ┌─ Content ───────────────────┐  │
│  Nilai Saya      │  │                              │  │
│  ──────────      │  │  (List tugas / detail nilai) │  │
│  Logout          │  │                              │  │
│                  │  └──────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 7.3 Halaman Login (Full-width)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              ┌─────────────────────┐                 │
│              │                     │                 │
│              │  SisPrakAI          │                 │
│              │  ──────────────     │                 │
│              │                     │                 │
│              │  NIM: [________]    │                 │
│              │                     │                 │
│              │  [  Masuk  ]        │                 │
│              │                     │                 │
│              │  ──────────────     │                 │
│              │  Masuk sebagai      │                 │
│              │  Asisten Praktikum  │                 │
│              │                     │                 │
│              └─────────────────────┘                 │
│                                                      │
│  Kecerdasan Buatan · Telkom University               │
└──────────────────────────────────────────────────────┘
```

---

## 8. Pola Interaksi

### State Visual

| State | Perubahan Visual |
|-------|-----------------|
| Default | Sesuai spesifikasi komponen |
| Hover | Darken background 10%, cursor pointer |
| Focus | Ring `#BC9601` 2px, offset 2px |
| Active/Pressed | Darken background 15% |
| Disabled | Opacity 0.5, cursor not-allowed |
| Loading | Skeleton placeholder (pulse animation, `#E0E0E0` → `#F0F0F0`) |
| Error | Border merah, teks error di bawah field |
| Success | Border hijau, toast notifikasi |
| Empty state | Ikon abu + teks deskriptif + CTA jika ada |

### Transisi

- **Durasi standar**: 150ms
- **Easing**: `ease-out`
- **Property**: `background-color`, `border-color`, `box-shadow`, `opacity`
- **Tidak boleh**: transform scale, rotate, atau animasi bounce

### Feedback untuk Aksi

| Aksi | Feedback |
|------|----------|
| Simpan nilai | Toast hijau: "Nilai berhasil disimpan" |
| Upload file | Progress bar → Toast hijau |
| Hapus file | Modal konfirmasi → Toast merah |
| Login berhasil | Redirect ke dashboard |
| Login gagal (NIM tidak ditemukan) | Pesan error di bawah input |
| Set deadline | Toast hijau: "Tenggat waktu berhasil diatur" |

---

## 9. Data Display Conventions

### Format Angka

| Data | Format | Contoh |
|------|--------|--------|
| NIM | 12 digit, monospace | `707022500006` |
| Skor komponen | integer / 5 | `4 / 5` |
| Poin komponen | integer | `28` |
| Nilai total modul | integer (0–100) | `88` |
| Persentase kehadiran | persen, 0 desimal | `83%` |
| Jumlah hadir | integer / total | `10 / 12` |

### Format Tanggal & Waktu

| Konteks | Format | Contoh |
|---------|--------|--------|
| Tenggat waktu | DD MMM YYYY, HH:mm | 15 Okt 2026, 23:59 |
| Waktu upload | DD MMM YYYY, HH:mm | 14 Okt 2026, 21:30 |
| Keterangan relatif | "X hari yang lalu" / "dalam X hari" | "2 hari lagi" |

### Status Pengumpulan

Ditentukan secara otomatis berdasarkan kondisi:

```
Jika file sudah diupload DAN sebelum deadline → "Sudah Dikumpulkan" (hijau)
Jika file sudah diupload DAN setelah deadline  → "Terlambat" (kuning)
Jika file belum diupload DAN sebelum deadline   → "Belum Dikumpulkan" (netral)
Jika file belum diupload DAN setelah deadline    → "Belum Dikumpulkan" (merah)
```

---

## 10. Aksesibilitas

1. Semua elemen interaktif harus bisa diakses via keyboard (Tab, Enter, Escape).
2. Focus ring harus selalu visible saat navigasi keyboard.
3. Kontras warna minimum WCAG AA (4.5:1 teks biasa, 3:1 teks besar).
4. ARIA labels untuk ikon tanpa teks.
5. Tabel menggunakan `<thead>`, `<tbody>`, dan `scope` attribute.
6. Form error terhubung ke input via `aria-describedby`.
7. Toast notifikasi menggunakan `role="alert"`.
