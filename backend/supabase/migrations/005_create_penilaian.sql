-- Create penilaian table
CREATE TABLE penilaian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mahasiswa_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pertemuan INT NOT NULL CHECK (pertemuan >= 1 AND pertemuan <= 12),
    pelaksanaan_skor INT NOT NULL DEFAULT 0 CHECK (pelaksanaan_skor >= 0 AND pelaksanaan_skor <= 5),
    laporan_skor INT NOT NULL DEFAULT 0 CHECK (laporan_skor >= 0 AND laporan_skor <= 5),
    waktu_skor INT NOT NULL DEFAULT 0 CHECK (waktu_skor >= 0 AND waktu_skor <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mahasiswa_id, pertemuan)
);

-- Enable RLS
ALTER TABLE penilaian ENABLE ROW LEVEL SECURITY;

-- Policies for penilaian (following the same pattern as absensi)
CREATE POLICY "Praktikan can view their own grades"
    ON penilaian FOR SELECT
    USING (auth.jwt()->>'role' = 'praktikan' AND auth.uid() = mahasiswa_id);

CREATE POLICY "Asprak can view all grades in their class"
    ON penilaian FOR SELECT
    USING (auth.jwt()->>'role' = 'asprak' AND EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = penilaian.mahasiswa_id AND u.kelas_id = (
            SELECT kelas_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Asprak can insert/update grades in their class"
    ON penilaian FOR ALL
    USING (auth.jwt()->>'role' = 'asprak' AND EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = penilaian.mahasiswa_id AND u.kelas_id = (
            SELECT kelas_id FROM users WHERE id = auth.uid()
        )
    ));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_penilaian_modtime
    BEFORE UPDATE ON penilaian
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
