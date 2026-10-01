import { getSession } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

export default async function NilaiPage() {
  const session = await getSession();
  if (!session || session.app_role !== "praktikan") {
    redirect("/");
  }

  const supabase = createAdminSupabaseClient();
  
  // Get user id from nim
  const { data: user } = await supabase
    .from("users")
    .select("id, kelas_id")
    .eq("nim", session.nim)
    .single();

  if (!user) {
    return <div style={{ padding: "24px" }}>Data user tidak ditemukan.</div>;
  }

  // Fetch all absensi for this user
  const { data: absensi } = await supabase
    .from("absensi")
    .select("pertemuan, status, keterlambatan")
    .eq("mahasiswa_id", user.id);

  // Fetch all penilaian for this user
  const { data: penilaian } = await supabase
    .from("penilaian")
    .select("pertemuan, pelaksanaan_skor, laporan_skor, waktu_skor")
    .eq("mahasiswa_id", user.id);

  const absensiMap: Record<number, any> = {};
  absensi?.forEach(a => {
    absensiMap[a.pertemuan] = a;
  });

  const penilaianMap: Record<number, any> = {};
  penilaian?.forEach(p => {
    penilaianMap[p.pertemuan] = p;
  });

  // Calculate totals and overall average
  let totalScoreSum = 0;
  let evaluatedModules = 0;

  const rows = Array.from({ length: 12 }, (_, i) => i + 1).map(pertemuan => {
    const abs = absensiMap[pertemuan] || { status: "ALPA", keterlambatan: null };
    const pnl = penilaianMap[pertemuan] || { pelaksanaan_skor: 0, laporan_skor: 0, waktu_skor: 0 };
    
    // Kehadiran (15%), Pelaksanaan (35%), Laporan (25%), Waktu (25%)
    // Each score is out of 5, so we multiply by 20 to get out of 100, then by percentage
    // Total = (Pelaksanaan*20*0.35) + (Laporan*20*0.25) + (Waktu*20*0.25) + (Kehadiran*20*0.15)
    
    const kehadiranSkor = calculateKehadiranSkor(abs.status, abs.keterlambatan);
    const total = (pnl.pelaksanaan_skor * 7) + (pnl.laporan_skor * 5) + (pnl.waktu_skor * 5) + (kehadiranSkor * 3);

    // If there is some activity (attended, or graded), we count it in average
    // Otherwise it stays 0 (and counts as 0 in average if we want, but let's just show it)
    totalScoreSum += total;
    evaluatedModules++;

    return {
      pertemuan,
      status: abs.status,
      keterlambatan: abs.keterlambatan,
      kehadiranSkor,
      pelaksanaanSkor: pnl.pelaksanaan_skor,
      laporanSkor: pnl.laporan_skor,
      waktuSkor: pnl.waktu_skor,
      total
    };
  });

  const averageScore = evaluatedModules > 0 ? (totalScoreSum / evaluatedModules) : 0;

  return (
    <div>
      <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 700, marginBottom: "var(--space-2)" }}>Rekap Nilai & Absensi Saya</h2>
          <p style={{ color: "var(--color-text-secondary)" }}>Transparansi nilai untuk setiap modul praktikum.</p>
        </div>
        <div style={{ background: "var(--color-surface-elevated)", padding: "12px 24px", borderRadius: "8px", border: "1px solid var(--color-border)", textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 600, marginBottom: "4px" }}>Rata-rata Total</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-gold)" }}>{averageScore.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", borderRadius: "8px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "900px" }}>
          <thead style={{ background: "var(--color-black)", color: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
            <tr>
              <th style={{ padding: "16px", fontWeight: 600, width: "100px" }}>Pertemuan</th>
              <th style={{ padding: "16px", fontWeight: 600 }}>Kehadiran</th>
              <th style={{ padding: "16px", fontWeight: 600, textAlign: "center" }}>Skor Kehadiran (15%)</th>
              <th style={{ padding: "16px", fontWeight: 600, textAlign: "center" }}>Skor Pelaksanaan (35%)</th>
              <th style={{ padding: "16px", fontWeight: 600, textAlign: "center" }}>Laporan Akhir (25%)</th>
              <th style={{ padding: "16px", fontWeight: 600, textAlign: "center" }}>Jurnal/Waktu (25%)</th>
              <th style={{ padding: "16px", fontWeight: 600, textAlign: "center" }}>Total Nilai</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.pertemuan} style={{ borderBottom: "1px solid var(--color-surface-sunken)" }}>
                <td style={{ padding: "16px", fontWeight: 600 }}>Modul {row.pertemuan}</td>
                <td style={{ padding: "16px" }}>
                  <div style={{ 
                    display: "inline-block",
                    padding: "4px 12px", 
                    borderRadius: "20px", 
                    fontSize: "12px",
                    fontWeight: 600,
                    background: row.status === "HADIR" ? "var(--color-success-light)" : row.status === "TERLAMBAT" ? "var(--color-warning-light)" : "var(--color-danger-light)",
                    color: row.status === "HADIR" ? "var(--color-success)" : row.status === "TERLAMBAT" ? "var(--color-warning)" : "var(--color-danger)"
                  }}>
                    {row.status} {row.status === "TERLAMBAT" && row.keterlambatan ? `(${row.keterlambatan}m)` : ""}
                  </div>
                </td>
                <td style={{ padding: "16px", textAlign: "center", fontWeight: 500 }} className="tabular-nums">{row.kehadiranSkor} / 5</td>
                <td style={{ padding: "16px", textAlign: "center", fontWeight: 500 }} className="tabular-nums">{row.pelaksanaanSkor} / 5</td>
                <td style={{ padding: "16px", textAlign: "center", fontWeight: 500 }} className="tabular-nums">{row.laporanSkor} / 5</td>
                <td style={{ padding: "16px", textAlign: "center", fontWeight: 500 }} className="tabular-nums">{row.waktuSkor} / 5</td>
                <td style={{ padding: "16px", textAlign: "center", fontWeight: 700, color: "var(--color-gold)" }} className="tabular-nums">{row.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
