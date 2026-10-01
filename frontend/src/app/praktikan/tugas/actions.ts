"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getTugasPraktikan() {
  const session = await getSession();
  if (!session || session.app_role !== "praktikan") {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminSupabaseClient();
  
  // Get kelas_id for the praktikan
  const { data: userData } = await supabase
    .from("users")
    .select("id, kelas_id")
    .eq("nim", session.nim)
    .single();

  if (!userData?.kelas_id) {
    throw new Error("Gagal mengambil data kelas praktikan");
  }

  // Get deadlines for this class
  const { data: pengaturan } = await supabase
    .from("tugas_pengaturan")
    .select("*")
    .eq("kelas_id", userData.kelas_id);

  // Get current submissions
  const { data: pengumpulan } = await supabase
    .from("pengumpulan_tugas")
    .select("*")
    .eq("mahasiswa_id", userData.id);

  return { 
    pengaturan: pengaturan || [], 
    pengumpulan: pengumpulan || [], 
    mahasiswa_id: userData.id 
  };
}

export async function submitTugas(formData: FormData) {
  const session = await getSession();
  if (!session || session.app_role !== "praktikan") {
    throw new Error("Unauthorized");
  }

  const pertemuan = parseInt(formData.get("pertemuan") as string);
  const jenis = formData.get("jenis") as "HASIL_PRAKTIKUM" | "TUGAS_RUMAH";
  const tipe = formData.get("tipe") as "FILE" | "LINK";
  let file_url = formData.get("file_url") as string;
  const file = formData.get("file") as File | null;

  const supabase = createAdminSupabaseClient();

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("nim", session.nim)
    .single();

  if (!userData) throw new Error("User not found");

  if (tipe === "FILE" && file && file.size > 0) {
    // Check file extension
    if (!file.name.endsWith('.ipynb')) {
      throw new Error("Hanya file .ipynb yang diperbolehkan");
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userData.id}/${pertemuan}_${jenis}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('tugas')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Gagal upload file: ${uploadError.message}`);
    }
    
    file_url = uploadData.path;
  }

  if (!file_url) {
    throw new Error("File atau Link tidak boleh kosong");
  }

  const { error } = await supabase
    .from("pengumpulan_tugas")
    .upsert({
      mahasiswa_id: userData.id,
      pertemuan,
      jenis,
      tipe,
      file_url,
      updated_at: new Date().toISOString()
    }, { onConflict: "mahasiswa_id, pertemuan, jenis" });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/praktikan/tugas");
  return { success: true };
}

export async function deleteTugas(pertemuan: number, jenis: "HASIL_PRAKTIKUM" | "TUGAS_RUMAH", currentUrl: string, tipe: "FILE" | "LINK") {
  const session = await getSession();
  if (!session || session.app_role !== "praktikan") {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminSupabaseClient();

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("nim", session.nim)
    .single();

  if (!userData) throw new Error("User not found");

  if (tipe === "FILE" && currentUrl) {
    // Attempt to delete from storage
    await supabase.storage.from('tugas').remove([currentUrl]);
  }

  const { error } = await supabase
    .from("pengumpulan_tugas")
    .delete()
    .eq("mahasiswa_id", userData.id)
    .eq("pertemuan", pertemuan)
    .eq("jenis", jenis);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/praktikan/tugas");
  return { success: true };
}

export async function getFileUrl(path: string) {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.storage.from('tugas').createSignedUrl(path, 60 * 60); // 1 hour
  return data?.signedUrl || null;
}
