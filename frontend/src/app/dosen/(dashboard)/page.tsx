import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { Users, FileCheck, Layers } from "lucide-react";

export default async function DosenDashboardPage() {
  const supabase = createAdminSupabaseClient();
  const session = await getSession();

  // Basic stats for dosen (can be refined later if specific per class)
  const { count: studentCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "praktikan");

  const { count: asprakCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "asprak");

  return (
    <div style={{ padding: "0 0 40px 0" }}>
      <h2 style={{ fontSize: "var(--text-display)", fontWeight: 700, marginBottom: "8px", letterSpacing: "-0.02em" }}>
        Halo, {session?.nama || "Dosen"}
      </h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: "40px", fontSize: "16px" }}>
        Dashboard utama untuk memantau performa dan manajemen keseluruhan kelas praktikum.
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
              <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Total Mahasiswa</div>
            </div>
            <div style={{ fontSize: "48px", fontWeight: 800, color: "var(--color-black)", lineHeight: "1" }}>{studentCount || 0}</div>
            <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
              Semua praktikan terdaftar
            </div>
          </div>
        </div>

        {/* Double Bezel Card 2 */}
        <div style={{ padding: "8px", background: "var(--color-surface-sunken)", borderRadius: "24px" }}>
          <div style={{ background: "var(--color-surface-elevated)", padding: "32px", borderRadius: "16px", height: "100%", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ padding: "12px", background: "var(--color-green-light)", color: "var(--color-green)", borderRadius: "12px" }}>
                <FileCheck size={24} />
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Total Asprak</div>
            </div>
            <div style={{ fontSize: "48px", fontWeight: 800, color: "var(--color-black)", lineHeight: "1" }}>{asprakCount || 0}</div>
            <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
              Asisten aktif
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
