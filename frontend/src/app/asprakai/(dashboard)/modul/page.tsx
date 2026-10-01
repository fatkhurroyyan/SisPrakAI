import { ModulClient } from "./ModulClient";
import { getAllTugasPengaturan } from "./actions";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Modul Praktikum | Asprak",
};

export default async function ModulPage() {
  const supabase = createAdminSupabaseClient();
  const session = await getSession();

  // Dapatkan kelas_id dari asprak yang sedang login
  const { data: asprakData } = await supabase
    .from("users")
    .select("kelas_id")
    .eq("nim", session?.nim)
    .single();

  let kelasData: any[] = [];
  let kelasError = null;

  if (asprakData?.kelas_id) {
    // Fetch HANYA kelas yang dipegang oleh asprak tersebut
    const resKelas = await supabase
      .from("kelas")
      .select("id, kode, nama")
      .eq("id", asprakData.kelas_id)
      .order("kode");
    kelasData = resKelas.data || [];
    kelasError = resKelas.error;
  }

  const { pengaturan } = await getAllTugasPengaturan();

  if (kelasError) {
    return (
      <div style={{ padding: "var(--space-6)", color: "var(--color-danger)" }}>
        Terjadi kesalahan saat mengambil data kelas dari database.<br/>
        Error: {kelasError.message}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-6)", padding: "0 var(--space-6)" }}>Manajemen Tugas & Tenggat Waktu</h2>
      <ModulClient kelasList={kelasData || []} allPengaturan={pengaturan} />
    </div>
  );
}
