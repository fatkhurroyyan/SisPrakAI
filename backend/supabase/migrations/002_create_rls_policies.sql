-- Migration: 002_create_rls_policies.sql

-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE modul ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_upload ENABLE ROW LEVEL SECURITY;
ALTER TABLE asesmen ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Asprak can view all users"
ON users FOR SELECT
USING (
  (SELECT role FROM users WHERE nim = (auth.jwt()->>'nim')) = 'asprak'
);

CREATE POLICY "Praktikan can only view self"
ON users FOR SELECT
USING (nim = (auth.jwt()->>'nim'));

-- kelas (everyone can read)
CREATE POLICY "Everyone can read kelas"
ON kelas FOR SELECT USING (true);

-- modul (everyone can read)
CREATE POLICY "Everyone can read modul"
ON modul FOR SELECT USING (true);

-- nilai
CREATE POLICY "Asprak full access to nilai"
ON nilai FOR ALL
USING (
  (SELECT role FROM users WHERE nim = (auth.jwt()->>'nim')) = 'asprak'
);

CREATE POLICY "Praktikan can view own nilai"
ON nilai FOR SELECT
USING (
  mahasiswa_id = (SELECT id FROM users WHERE nim = (auth.jwt()->>'nim'))
);

-- absensi
CREATE POLICY "Asprak full access to absensi"
ON absensi FOR ALL
USING (
  (SELECT role FROM users WHERE nim = (auth.jwt()->>'nim')) = 'asprak'
);

CREATE POLICY "Praktikan can view own absensi"
ON absensi FOR SELECT
USING (
  mahasiswa_id = (SELECT id FROM users WHERE nim = (auth.jwt()->>'nim'))
);

-- file_upload
CREATE POLICY "Asprak can view all files"
ON file_upload FOR SELECT
USING (
  (SELECT role FROM users WHERE nim = (auth.jwt()->>'nim')) = 'asprak'
);

CREATE POLICY "Praktikan can manage own files"
ON file_upload FOR ALL
USING (
  mahasiswa_id = (SELECT id FROM users WHERE nim = (auth.jwt()->>'nim'))
);

-- deadline
CREATE POLICY "Asprak can manage deadlines"
ON deadline FOR ALL
USING (
  (SELECT role FROM users WHERE nim = (auth.jwt()->>'nim')) = 'asprak'
);

CREATE POLICY "Praktikan can view deadlines"
ON deadline FOR SELECT
USING (true);

-- asesmen
CREATE POLICY "Asprak full access to asesmen"
ON asesmen FOR ALL
USING (
  (SELECT role FROM users WHERE nim = (auth.jwt()->>'nim')) = 'asprak'
);

CREATE POLICY "Praktikan can view own asesmen"
ON asesmen FOR SELECT
USING (
  mahasiswa_id = (SELECT id FROM users WHERE nim = (auth.jwt()->>'nim'))
);
