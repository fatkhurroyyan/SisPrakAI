import { getSession } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";

export default async function PraktikanDashboard() {
  const session = await getSession();
  if (!session || !session.nim) {
    redirect("/login");
  }

  const supabase = createAdminSupabaseClient();
  
  // Ambil data user
  const { data: user } = await supabase
    .from('users')
    .select('id, nama, kelas_id')
    .eq('nim', session.nim)
    .single();

  let kehadiranPercentage = 100;
  let uncompletedTasks: { pertemuan: number, jenis: string, deadline: Date, title: string, isPast: boolean }[] = [];
  
  if (user) {
    // Ambil data absensi mahasiswa tersebut
    const { data: absensi } = await supabase
      .from('absensi')
      .select('status')
      .eq('mahasiswa_id', user.id);

    if (absensi && absensi.length > 0) {
      const hadirCount = absensi.filter(a => a.status === 'HADIR' || a.status === 'TERLAMBAT').length;
      kehadiranPercentage = Math.round((hadirCount / absensi.length) * 100);
    }

    // Ambil data pengaturan tugas untuk kelas ini
    const { data: pengaturan } = await supabase
      .from('tugas_pengaturan')
      .select('pertemuan, batas_hasil_praktikum, batas_tugas_rumah')
      .eq('kelas_id', user.kelas_id);

    // Cek tugas yang sudah dikumpulkan oleh user
    const { data: pengumpulan } = await supabase
      .from('pengumpulan_tugas')
      .select('pertemuan, jenis')
      .eq('mahasiswa_id', user.id);

    const pengumpulanSet = new Set(pengumpulan?.map(p => `${p.pertemuan}-${p.jenis}`));

    if (pengaturan && pengaturan.length > 0) {
      const nowTime = new Date().getTime();

      for (const p of pengaturan) {
        // Cek Hasil Praktikum
        if (p.batas_hasil_praktikum) {
          const isUploaded = pengumpulanSet.has(`${p.pertemuan}-HASIL_PRAKTIKUM`);
          if (!isUploaded) {
            const time = new Date(p.batas_hasil_praktikum).getTime();
            uncompletedTasks.push({ 
              pertemuan: p.pertemuan, 
              jenis: 'HASIL_PRAKTIKUM', 
              deadline: new Date(time), 
              title: 'Hasil Praktikum',
              isPast: time < nowTime 
            });
          }
        }
        
        // Cek Tugas Rumah
        if (p.batas_tugas_rumah) {
          const isUploaded = pengumpulanSet.has(`${p.pertemuan}-TUGAS_RUMAH`);
          if (!isUploaded) {
            const time = new Date(p.batas_tugas_rumah).getTime();
            uncompletedTasks.push({ 
              pertemuan: p.pertemuan, 
              jenis: 'TUGAS_RUMAH', 
              deadline: new Date(time), 
              title: 'Tugas Rumah',
              isPast: time < nowTime 
            });
          }
        }
      }
    }

    // Urutkan dari deadline terdekat (baik masa lalu maupun masa depan)
    uncompletedTasks.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-6)" }}>Selamat Datang, {user?.nama || "Praktikan"}!</h2>
      <div style={{ display: "grid", gap: "var(--space-6)", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {/* Tugas Terdekat Card */}
        <div style={{ 
          padding: "var(--space-6)", 
          background: "var(--color-surface-elevated)", 
          border: "1px solid var(--color-border)", 
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)"
        }}>
          <div style={{ fontSize: "var(--text-h3)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={20} color="var(--color-gold)" />
            Tugas Belum Selesai
          </div>
          
          {uncompletedTasks.length === 0 ? (
            <div style={{ 
              background: "var(--color-green-light)", 
              border: `1px solid var(--color-green)`,
              padding: "var(--space-4)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)"
            }}>
              <CheckCircle size={28} color="var(--color-green)" />
              <div style={{ color: "var(--color-green)", fontSize: "var(--text-body-medium)", fontWeight: 500, lineHeight: 1.4 }}>
                Yeay bagus, kamu sudah ngumpul semua tugas nih, keren! 🎉
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
              {uncompletedTasks.map((task, idx) => (
                <div key={idx} style={{ 
                  background: task.isPast ? "var(--color-danger-light)" : "var(--color-warning-light)", 
                  border: `1px solid ${task.isPast ? "var(--color-danger)" : "var(--color-warning)"}`,
                  padding: "var(--space-4)",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: task.isPast ? "var(--color-danger)" : "var(--color-warning)", marginBottom: "4px" }}>
                        Modul {task.pertemuan} - {task.title}
                      </div>
                      <div style={{ fontSize: "var(--text-body-small)", color: "var(--color-text-secondary)" }}>
                        Tenggat: {task.deadline.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                        {task.isPast && <span style={{ color: "var(--color-danger)", marginLeft: "8px", fontWeight: 600 }}>(TERLAMBAT)</span>}
                      </div>
                    </div>
                    <AlertCircle size={24} color={task.isPast ? "var(--color-danger)" : "var(--color-warning)"} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                    <div style={{ color: task.isPast ? "var(--color-danger)" : "var(--color-warning)", fontSize: "var(--text-body-medium)", fontWeight: 500 }}>
                      Jangan lupa diupload ya!
                    </div>
                    <Link 
                      href="/praktikan/tugas" 
                      style={{
                        background: "var(--color-gold)",
                        color: "var(--color-black)",
                        padding: "6px 16px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "14px"
                      }}
                    >
                      Ke Tugas Saya <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kehadiran Card */}
        <div style={{ padding: "var(--space-6)", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", borderRadius: "12px" }}>
          <div style={{ fontSize: "var(--text-h3)", marginBottom: "var(--space-2)" }}>Kehadiran</div>
          <div style={{ fontSize: "var(--text-display)", fontWeight: 700, color: "var(--color-green)" }}>
            {kehadiranPercentage}%
          </div>
        </div>
      </div>
    </div>
  );
}
