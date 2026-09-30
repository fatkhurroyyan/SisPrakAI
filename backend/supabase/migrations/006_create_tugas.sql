-- Table: tugas_pengaturan (Asprak configures deadlines per class per pertemuan)
CREATE TABLE tugas_pengaturan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    pertemuan INT NOT NULL CHECK (pertemuan >= 1 AND pertemuan <= 12),
    batas_hasil_praktikum TIMESTAMPTZ,
    batas_tugas_rumah TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kelas_id, pertemuan)
);

-- Table: pengumpulan_tugas (Praktikan uploads)
CREATE TABLE pengumpulan_tugas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mahasiswa_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pertemuan INT NOT NULL CHECK (pertemuan >= 1 AND pertemuan <= 12),
    jenis VARCHAR(50) NOT NULL CHECK (jenis IN ('HASIL_PRAKTIKUM', 'TUGAS_RUMAH')),
    tipe VARCHAR(50) NOT NULL CHECK (tipe IN ('FILE', 'LINK')),
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mahasiswa_id, pertemuan, jenis)
);

-- RLS for tugas_pengaturan
ALTER TABLE tugas_pengaturan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tugas_pengaturan"
    ON tugas_pengaturan FOR SELECT
    USING (true); -- Both praktikan and asprak need to see the deadlines

CREATE POLICY "Asprak can manage tugas_pengaturan for their class"
    ON tugas_pengaturan FOR ALL
    USING (auth.jwt()->>'role' = 'asprak' AND kelas_id = (SELECT kelas_id FROM users WHERE id = auth.uid()));

-- RLS for pengumpulan_tugas
ALTER TABLE pengumpulan_tugas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Praktikan can view their own submissions"
    ON pengumpulan_tugas FOR SELECT
    USING (auth.jwt()->>'role' = 'praktikan' AND auth.uid() = mahasiswa_id);

CREATE POLICY "Asprak can view submissions of their class"
    ON pengumpulan_tugas FOR SELECT
    USING (auth.jwt()->>'role' = 'asprak' AND EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = pengumpulan_tugas.mahasiswa_id AND u.kelas_id = (
            SELECT kelas_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Praktikan can insert their own submissions"
    ON pengumpulan_tugas FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'praktikan' AND auth.uid() = mahasiswa_id);

CREATE POLICY "Praktikan can update their own submissions"
    ON pengumpulan_tugas FOR UPDATE
    USING (auth.jwt()->>'role' = 'praktikan' AND auth.uid() = mahasiswa_id);

CREATE POLICY "Praktikan can delete their own submissions"
    ON pengumpulan_tugas FOR DELETE
    USING (auth.jwt()->>'role' = 'praktikan' AND auth.uid() = mahasiswa_id);

-- Storage bucket for 'tugas'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tugas', 'tugas', false) 
ON CONFLICT (id) DO NOTHING;

-- Since the bucket is private, and we use createAdminSupabaseClient on the server, 
-- we don't strictly need storage policies for the frontend. The server action handles it.
