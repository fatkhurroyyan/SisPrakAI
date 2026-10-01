import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export default async function AsprakDashboard() {
  const supabase = createAdminSupabaseClient();
  const session = await getSession();

  // Dapatkan kelas_id dari asprak yang sedang login
  const { data: asprakData } = await supabase
    .from("users")
    .select("kelas_id")
    .eq("nim", session?.nim)
    .single();

  let kelasName = "Tidak Ada";
  let studentCount = 0;

  if (asprakData?.kelas_id) {
    // Ambil nama kelas
    const { data: kelasInfo } = await supabase
      .from("kelas")
      .select("nama")
      .eq("id", asprakData.kelas_id)
      .single();
    if (kelasInfo) kelasName = kelasInfo.nama;

    // Ambil jumlah praktikan
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "praktikan")
      .eq("kelas_id", asprakData.kelas_id);
      
    studentCount = count || 0;
  }

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-6)" }}>Selamat Datang, {session?.nama || "Asprak"}!</h2>
      <div style={{ display: "grid", gap: "var(--space-6)", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
        <div style={{ padding: "var(--space-6)", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "var(--text-h3)", marginBottom: "var(--space-2)" }}>Total Praktikan</div>
          <div style={{ fontSize: "var(--text-display)", fontWeight: 700, color: "var(--color-gold)" }}>{studentCount}</div>
        </div>
        <div style={{ padding: "var(--space-6)", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "var(--text-h3)", marginBottom: "var(--space-2)" }}>Kelas Anda</div>
          <div style={{ fontSize: "var(--text-display)", fontWeight: 700, color: "var(--color-gold)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{kelasName}</div>
        </div>
        <div style={{ padding: "var(--space-6)", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "var(--text-h3)", marginBottom: "var(--space-2)" }}>Modul</div>
          <div style={{ fontSize: "var(--text-display)", fontWeight: 700, color: "var(--color-gold)" }}>12</div>
        </div>
      </div>
    </div>
  );
}
