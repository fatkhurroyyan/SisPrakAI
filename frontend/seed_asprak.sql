-- Script ini akan menghapus data lama (jika ada) dan memasukkan data baru dengan aman
-- Memperbaiki pencarian kelas menggunakan LIKE '%49-01%' karena nama/kode di database mungkin berbeda format (misal D4SM-49-01)

DO $$
DECLARE
    id_49_01 UUID;
    id_49_02 UUID;
    id_49_03 UUID;
    id_49_04 UUID;
    id_49_05 UUID;
BEGIN
    -- Dapatkan ID masing-masing kelas (berdasarkan nama atau kode)
    SELECT id INTO id_49_01 FROM kelas WHERE nama LIKE '%49-01%' OR kode LIKE '%49-01%' LIMIT 1;
    SELECT id INTO id_49_02 FROM kelas WHERE nama LIKE '%49-02%' OR kode LIKE '%49-02%' LIMIT 1;
    SELECT id INTO id_49_03 FROM kelas WHERE nama LIKE '%49-03%' OR kode LIKE '%49-03%' LIMIT 1;
    SELECT id INTO id_49_04 FROM kelas WHERE nama LIKE '%49-04%' OR kode LIKE '%49-04%' LIMIT 1;
    SELECT id INTO id_49_05 FROM kelas WHERE nama LIKE '%49-05%' OR kode LIKE '%49-05%' LIMIT 1;

    -- Hapus asprak jika sudah ada sebelumnya agar tidak terjadi bentrok
    DELETE FROM users WHERE nim IN (
        '707082300052', 
        '707082300164', 
        '707082300162', 
        '707082400110', 
        '707082400093'
    );

    -- Masukkan Data Baru dengan aman
    INSERT INTO users (nim, nama, role, kelas_id, kode_asprak)
    VALUES 
        ('707082300052', 'Keisha Naiza Djalle', 'asprak', id_49_01, 'KND'),
        ('707082300164', 'Margaretha Gratia Yollanda Stephanie', 'asprak', id_49_02, 'MGY'),
        ('707082300162', 'Dafi Fadhliah Sony', 'asprak', id_49_03, 'DFS'),
        ('707082400110', 'Muhammad Ibrahimmovic', 'asprak', id_49_04, 'MIB'),
        ('707082400093', 'Mochamad Ar Ravel Derisyanto Putra', 'asprak', id_49_05, 'MAR');
END $$;
