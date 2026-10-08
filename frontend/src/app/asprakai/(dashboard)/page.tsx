import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { Users, BookOpen, Layers } from "lucide-react";

export default async function AsprakDashboard() {
  const supabase = createAdminSupabaseClient();
  const session = await getSession();

  // Dapatkan kelas_id dari asprak yang sedang login
  const { data: asprakData } = await supabase
    .from("users")
    .select("kelas_id")
    .eq("nim", session?.nim)
    .single();

  let kelasName = "Tidak Terdaftar";
  let studentCount = 0;

  if (asprakData?.kelas_id) {
    const { data: kelasInfo } = await supabase
      .from("kelas")
      .select("nama")
      .eq("id", asprakData.kelas_id)
      .single();
    if (kelasInfo) kelasName = kelasInfo.nama;

    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "praktikan")
      .eq("kelas_id", asprakData.kelas_id);
      
    studentCount = count || 0;
  }

  return (
    <div style={{ padding: "0 0 40px 0" }}>
      <h2 style={{ fontSize: "var(--text-display)", fontWeight: 700, marginBottom: "8px", letterSpacing: "-0.02em" }}>
        Halo, {session?.nama || "Asprak"}
      </h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: "40px", fontSize: "16px" }}>
        Berikut adalah ringkasan kelas dan praktikan Anda hari ini.
      </p>

      {/* Bento Grid */}
      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        
        {/* Double Bezel Card 1 */}
        <div style={{ padding: "8px", background: "var(--color-surface-sunken)", borderRadius: "24px" }}>
          <div style={{ background: "var(--color-surface-elevated)", padding: "32px", borderRadius: "16px", height: "100%", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ padding: "12px", background: "var(--color-gold-light)", color: "var(--color-gold)", borderRadius: "12px" }}>
                <Users size={24} />
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Total Praktikan</div>
            </div>
            <div style={{ fontSize: "48px", fontWeight: 800, color: "var(--color-black)", lineHeight: "1" }}>{studentCount}</div>
            <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
              {studentCount === 0 ? "Belum ada data praktikan" : "Mahasiswa aktif di kelas"}
            </div>
          </div>
        </div>

        {/* Double Bezel Card 2 */}
        <div style={{ padding: "8px", background: "var(--color-surface-sunken)", borderRadius: "24px" }}>
          <div style={{ background: "var(--color-surface-elevated)", padding: "32px", borderRadius: "16px", height: "100%", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ padding: "12px", background: "var(--color-green-light)", color: "var(--color-green)", borderRadius: "12px" }}>
                <BookOpen size={24} />
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Kelas Anda</div>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--color-black)", lineHeight: "1.1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {kelasName}
            </div>
            <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
              {kelasName === "Tidak Terdaftar" ? "Silakan lapor ke Dosen/Admin" : "Kelas penugasan Anda"}
            </div>
          </div>
        </div>

        {/* Double Bezel Card 3 */}
        <div style={{ padding: "8px", background: "var(--color-surface-sunken)", borderRadius: "24px" }}>
          <div style={{ background: "var(--color-surface-elevated)", padding: "32px", borderRadius: "16px", height: "100%", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ padding: "12px", background: "rgba(0,0,0,0.05)", color: "var(--color-black)", borderRadius: "12px" }}>
                <Layers size={24} />
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Modul Aktif</div>
            </div>
            <div style={{ fontSize: "48px", fontWeight: 800, color: "var(--color-black)", lineHeight: "1" }}>12</div>
            <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
              Total modul semester ini
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
