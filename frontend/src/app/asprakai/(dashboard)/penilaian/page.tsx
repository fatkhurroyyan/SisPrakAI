import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import PenilaianClient from "./PenilaianClient";

export default async function PenilaianPage() {
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
  let mahasiswaData: any[] = [];
  let mhsError = null;

  if (asprakData?.kelas_id) {
    // Fetch HANYA kelas yang dipegang oleh asprak tersebut
    const resKelas = await supabase
      .from("kelas")
      .select("id, kode, nama")
      .eq("id", asprakData.kelas_id)
      .order("kode");
    kelasData = resKelas.data || [];
    kelasError = resKelas.error;

    // Fetch HANYA praktikan yang ada di kelas tersebut
    const resMhs = await supabase
      .from("users")
      .select("id, nim, nama, kelas_id")
      .eq("role", "praktikan")
      .eq("kelas_id", asprakData.kelas_id)
      .order("nim");
    mahasiswaData = resMhs.data || [];
    mhsError = resMhs.error;
  }

  if (kelasError || mhsError) {
    return (
      <div style={{ padding: "var(--space-6)", color: "var(--color-danger)" }}>
        Terjadi kesalahan saat mengambil data dari database.<br/>
        Error Kelas: {kelasError?.message}<br/>
        Error Mahasiswa: {mhsError?.message}
      </div>
    );
  }

  return (
    <PenilaianClient 
      kelasList={kelasData || []} 
      mahasiswaList={mahasiswaData || []} 
    />
  );
}
