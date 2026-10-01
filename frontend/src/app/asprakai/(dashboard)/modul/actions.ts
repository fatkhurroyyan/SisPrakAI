"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export async function getAllTugasPengaturan() {
  const session = await getSession();
  if (!session || session.app_role !== "asprak") {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminSupabaseClient();
  
  const { data, error } = await supabase
    .from("tugas_pengaturan")
    .select("*")
    .order("pertemuan", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return { pengaturan: data || [] };
}

export async function saveTugasPengaturan(
  kelas_id: string,
  pertemuan: number,
  batas_hasil: string | null,
  batas_tugas: string | null
) {
  const session = await getSession();
  if (!session || session.app_role !== "asprak") {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminSupabaseClient();
  
  const { error } = await supabase
    .from("tugas_pengaturan")
    .upsert({
      kelas_id,
      pertemuan,
      batas_hasil_praktikum: batas_hasil,
      batas_tugas_rumah: batas_tugas
    }, {
      onConflict: "kelas_id, pertemuan"
    });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function resetTugasPengaturan(kelas_id: string, pertemuan: number) {
  const session = await getSession();
  if (!session || session.app_role !== "asprak") {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminSupabaseClient();
  
  const { error } = await supabase
    .from("tugas_pengaturan")
    .delete()
    .eq("kelas_id", kelas_id)
    .eq("pertemuan", pertemuan);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function getSubmissions(kelas_id: string, pertemuan: number) {
  const session = await getSession();
  if (!session || session.app_role !== "asprak") {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminSupabaseClient();

  // Get deadlines for calculating lateness
  const { data: pengaturan } = await supabase
    .from("tugas_pengaturan")
    .select("batas_hasil_praktikum, batas_tugas_rumah")
    .eq("kelas_id", kelas_id)
    .eq("pertemuan", pertemuan)
    .maybeSingle();

  // Get all praktikan in this class
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, nim, nama")
    .eq("kelas_id", kelas_id)
    .eq("role", "praktikan")
    .order("nim");

  if (usersError) throw new Error(usersError.message);
  if (!users || users.length === 0) return { submissions: [], pengaturan };

  const userIds = users.map(u => u.id);

  // Get submissions for this meeting
  const { data: submissions, error: subError } = await supabase
    .from("pengumpulan_tugas")
    .select("*")
    .eq("pertemuan", pertemuan)
    .in("mahasiswa_id", userIds);

  if (subError) throw new Error(subError.message);

  // Group submissions by user
  const result = users.map(user => {
    const userSubs = submissions?.filter(s => s.mahasiswa_id === user.id) || [];
    const hp = userSubs.find(s => s.jenis === "HASIL_PRAKTIKUM");
    const tr = userSubs.find(s => s.jenis === "TUGAS_RUMAH");

    return {
      mahasiswa: user,
      hasil_praktikum: hp || null,
      tugas_rumah: tr || null
    };
  });

  return { submissions: result, pengaturan };
}
