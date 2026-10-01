"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";

function calculateKehadiranSkor(status: string, keterlambatan: string | null) {
  if (status === "HADIR") return 5;
  if (status === "TERLAMBAT") {
    if (keterlambatan === "<= 10") return 4;
    if (keterlambatan === "11-30") return 3;
    if (keterlambatan === "31-60") return 2;
    if (keterlambatan === "> 60") return 1;
    return 1;
  }
  // SAKIT, IZIN, DISPEN, ALPA
  return 0;
}

export async function getPenilaian(kelasId: string, pertemuan: number) {
  const supabase = createAdminSupabaseClient();
  
  // Get all users in this class
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("kelas_id", kelasId)
    .eq("role", "praktikan");

  if (usersError || !users) {
    throw new Error("Failed to fetch users for class");
  }

  const userIds = users.map(u => u.id);

  if (userIds.length === 0) return {};

  // Fetch absensi (for kehadiran skor)
  const { data: absensi, error: absensiError } = await supabase
    .from("absensi")
    .select("mahasiswa_id, status, keterlambatan")
    .eq("pertemuan", pertemuan)
    .in("mahasiswa_id", userIds);

  if (absensiError) {
    throw new Error("Failed to fetch absensi");
  }

  const absensiMap: Record<string, {status: string, keterlambatan: string | null}> = {};
  absensi.forEach(a => {
    absensiMap[a.mahasiswa_id] = { status: a.status, keterlambatan: a.keterlambatan };
  });

  // Fetch penilaian
  const { data: penilaian, error: penilaianError } = await supabase
    .from("penilaian")
    .select("mahasiswa_id, pelaksanaan_skor, laporan_skor, waktu_skor")
    .eq("pertemuan", pertemuan)
    .in("mahasiswa_id", userIds);

  if (penilaianError) {
    throw new Error("Failed to fetch penilaian");
  }

  const penilaianMap: Record<string, any> = {};
  penilaian.forEach(p => {
    penilaianMap[p.mahasiswa_id] = {
      pelaksanaan_skor: p.pelaksanaan_skor,
      laporan_skor: p.laporan_skor,
      waktu_skor: p.waktu_skor,
    };
  });

  // Combine data
  const result: Record<string, any> = {};
  userIds.forEach(id => {
    const abs = absensiMap[id] || { status: "ALPA", keterlambatan: null };
    const pnl = penilaianMap[id] || { pelaksanaan_skor: 0, laporan_skor: 0, waktu_skor: 0 };
    const kehadiran_skor = calculateKehadiranSkor(abs.status, abs.keterlambatan);
    
    result[id] = {
      pelaksanaan_skor: pnl.pelaksanaan_skor,
      laporan_skor: pnl.laporan_skor,
      waktu_skor: pnl.waktu_skor,
      kehadiran_skor: kehadiran_skor,
      absensi_status: abs.status,
      total_skor: (pnl.pelaksanaan_skor * 0.35 * 20) + (pnl.laporan_skor * 0.25 * 20) + (pnl.waktu_skor * 0.25 * 20) + (kehadiran_skor * 0.15 * 20)
    };
  });

  return result;
}

export async function savePenilaian(pertemuan: number, penilaianData: Record<string, { pelaksanaan_skor: number, laporan_skor: number, waktu_skor: number }>) {
  const supabase = createAdminSupabaseClient();
  
  const upsertData = Object.keys(penilaianData).map(mhsId => ({
    mahasiswa_id: mhsId,
    pertemuan,
    pelaksanaan_skor: penilaianData[mhsId].pelaksanaan_skor,
    laporan_skor: penilaianData[mhsId].laporan_skor,
    waktu_skor: penilaianData[mhsId].waktu_skor,
    updated_at: new Date().toISOString()
  }));

  if (upsertData.length === 0) return { success: true };

  const { error } = await supabase
    .from("penilaian")
    .upsert(upsertData, { onConflict: 'mahasiswa_id, pertemuan' });

  if (error) {
    console.error("Error saving penilaian:", error);
    throw new Error("Failed to save penilaian");
  }

  return { success: true };
}
