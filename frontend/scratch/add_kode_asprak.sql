-- Jalankan SQL ini di SQL Editor Supabase Anda untuk menambahkan kolom kode_asprak
ALTER TABLE users ADD COLUMN kode_asprak VARCHAR(3);

-- Contoh cara mengatur kode asprak (opsional)
-- UPDATE users SET kode_asprak = 'ABC' WHERE nim = '1234567890' AND role = 'asprak';
