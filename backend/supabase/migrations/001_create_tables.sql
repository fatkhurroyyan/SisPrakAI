-- Migration: 001_create_tables.sql

CREATE TABLE kelas (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode  TEXT UNIQUE NOT NULL,  -- 'D4SM-49-01', dst.
  nama  TEXT NOT NULL
);

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nim         TEXT UNIQUE NOT NULL,
  nama        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('asprak', 'praktikan')),
  kelas_id    UUID REFERENCES kelas(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_nim ON users(nim);

CREATE TABLE modul (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor   INT UNIQUE NOT NULL CHECK (nomor BETWEEN 1 AND 11),
  kode    TEXT UNIQUE NOT NULL,  -- 'MOD-01', dst.
  judul   TEXT NOT NULL,
  minggu  INT NOT NULL
);

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

CREATE TABLE absensi (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id  UUID NOT NULL REFERENCES users(id),
  pertemuan     INT NOT NULL CHECK (pertemuan BETWEEN 1 AND 12),
  status        TEXT NOT NULL CHECK (status IN ('HADIR', 'SAKIT', 'IZIN', 'ALFA')),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mahasiswa_id, pertemuan)
);

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

CREATE TABLE asesmen (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id  UUID NOT NULL REFERENCES users(id),
  tipe          TEXT NOT NULL CHECK (tipe IN ('asesmen_1', 'asesmen_2', 'asesmen_3')),
  nilai         NUMERIC(5,2) CHECK (nilai BETWEEN 0 AND 100),
  updated_by    UUID REFERENCES users(id),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mahasiswa_id, tipe)
);
