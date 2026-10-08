"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export async function getRekapDosen() {
  const session = await getSession();
  if (!session || session.app_role !== "dosen") {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminSupabaseClient();
  
  // 1. Get all students
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, nim, nama, kelas_id, kelas:kelas_id(nama)")
    .eq("role", "praktikan")
    .order("nim");

  if (usersError) throw new Error(usersError.message);

  // 2. Get all modules
  const { data: moduls, error: modulsError } = await supabase
    .from("modul")
    .select("id, judul, nomor")
    .order("nomor");
  if (modulsError) throw new Error(modulsError.message);

  // 3. Get all attendance
  const { data: absensi, error: absError } = await supabase
    .from("absensi")
    .select("*");
  if (absError) throw new Error(absError.message);

  // 4. Get all grades
  const { data: penilaian, error: penError } = await supabase
    .from("penilaian")
    .select("*");
  if (penError) throw new Error(penError.message);

  // Compile the data
  const result = users?.map(user => {
    // Absensi logic
    const userAbsensi = absensi?.filter(a => a.mahasiswa_id === user.id) || [];
    let skorAbsensiTotal = 0;
    
    // Nilai logic
    const userPenilaian = penilaian?.filter(p => p.mahasiswa_id === user.id) || [];
    let totalPelaksanaan = 0;
    let totalLaporan = 0;
    let totalKetepatan = 0;

    const rekapPerModul: Record<string, any> = {};

    moduls?.forEach(modul => {
      // Modul Absensi
      const absenModul = userAbsensi.find(a => a.pertemuan === modul.nomor);
      let skorAbsen = 0;
      if (absenModul) {
        if (absenModul.status === 'HADIR') skorAbsen = 5;
        else if (absenModul.status === 'TERLAMBAT') {
            if (absenModul.keterlambatan === '<= 10') skorAbsen = 4;
            else if (absenModul.keterlambatan === '11-30') skorAbsen = 3;
            else if (absenModul.keterlambatan === '31-60') skorAbsen = 2;
            else if (absenModul.keterlambatan === '> 60') skorAbsen = 1;
            else skorAbsen = 1;
        }
        skorAbsensiTotal += skorAbsen;
      }

      // Modul Penilaian
      const penModul = userPenilaian.find(p => p.pertemuan === modul.nomor);
      let nilaiModulAkhir = 0;
      if (penModul) {
        totalPelaksanaan += penModul.pelaksanaan_skor || 0;
        totalLaporan += penModul.laporan_skor || 0;
        totalKetepatan += penModul.waktu_skor || 0;

        const np = ((penModul.pelaksanaan_skor || 0) / 5) * 100;
        const nl = ((penModul.laporan_skor || 0) / 5) * 100;
        const nk = ((penModul.waktu_skor || 0) / 5) * 100;
        const na = (skorAbsen / 5) * 100;
        nilaiModulAkhir = (np * 0.35) + (nl * 0.25) + (nk * 0.25) + (na * 0.15);
      }

      rekapPerModul[modul.id] = {
        statusAbsen: absenModul?.status || "-",
        menitKeterlambatan: absenModul?.keterlambatan || "",
        skorAbsen,
        nilaiPelaksanaan: penModul?.pelaksanaan_skor || 0,
        nilaiLaporan: penModul?.laporan_skor || 0,
        nilaiKetepatan: penModul?.waktu_skor || 0,
        totalNilaiModul: Math.round(nilaiModulAkhir)
      };
    });

    const totalRecorded = userAbsensi.length;
    const persentaseKehadiran = totalRecorded > 0 ? ((userAbsensi.filter(a => a.status === 'HADIR' || a.status === 'TERLAMBAT').length) / totalRecorded) * 100 : 0;
    const nilaiAbsen = totalRecorded > 0 ? (skorAbsensiTotal / (totalRecorded * 5)) * 100 : 0;

    const totalTugas = userPenilaian.length;
    const avgPelaksanaan = totalTugas > 0 ? (totalPelaksanaan / (totalTugas * 5)) * 100 : 0;
    const avgLaporan = totalTugas > 0 ? (totalLaporan / (totalTugas * 5)) * 100 : 0;
    const avgKetepatan = totalTugas > 0 ? (totalKetepatan / (totalTugas * 5)) * 100 : 0;
    const nilaiAkhir = (avgPelaksanaan * 0.35) + (avgLaporan * 0.25) + (avgKetepatan * 0.25) + (nilaiAbsen * 0.15);

    return {
      nim: user.nim,
      nama: user.nama,
      kelas: (user.kelas as any)?.nama || "-",
      rekapKeseluruhan: {
        hadir: userAbsensi.filter(a => a.status === 'HADIR' || a.status === 'TERLAMBAT').length,
        alpa: userAbsensi.filter(a => a.status === 'ALPA').length,
        izin: userAbsensi.filter(a => a.status === 'IZIN').length,
        sakit: userAbsensi.filter(a => a.status === 'SAKIT').length,
        persentaseKehadiran: Math.round(persentaseKehadiran),
        nilaiAbsen: Math.round(nilaiAbsen),
        avgPelaksanaan: Math.round(avgPelaksanaan),
        avgLaporan: Math.round(avgLaporan),
        avgKetepatan: Math.round(avgKetepatan),
        nilaiAkhir: Math.round(nilaiAkhir)
      },
      rekapPerModul
    };
  }) || [];

  return {
    mahasiswaList: result,
    modulList: moduls || []
  };
}
