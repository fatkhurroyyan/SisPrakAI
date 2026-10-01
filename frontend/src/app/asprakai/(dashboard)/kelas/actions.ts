"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";

export async function getAbsensi(kelasId: string, pertemuan: number) {
  const supabase = createAdminSupabaseClient();
  
  // Get all users in this class
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("kelas_id", kelasId)
    .eq("role", "praktikan");

  if (usersError || !users) {
    throw new Error("Failed to fetch users for class");
  }

  const userIds = users.map(u => u.id);

  if (userIds.length === 0) return {};

  const { data: absensi, error } = await supabase
    .from("absensi")
    .select("mahasiswa_id, status, keterlambatan")
    .eq("pertemuan", pertemuan)
    .in("mahasiswa_id", userIds);

  if (error) {
    console.error("Error fetching absensi:", error);
    throw new Error("Failed to fetch absensi");
  }

  const result: Record<string, { status: string, keterlambatan?: string }> = {};
  absensi.forEach(a => {
    result[a.mahasiswa_id] = {
      status: a.status,
      keterlambatan: a.keterlambatan || undefined
    };
  });

  return result;
}

export async function saveAbsensi(pertemuan: number, absensiData: Record<string, { status: string, keterlambatan?: string }>) {
  const supabase = createAdminSupabaseClient();
  
  const upsertData = Object.keys(absensiData).map(mhsId => ({
    mahasiswa_id: mhsId,
    pertemuan,
    status: absensiData[mhsId].status,
    keterlambatan: absensiData[mhsId].status === 'TERLAMBAT' ? absensiData[mhsId].keterlambatan : null,
    updated_at: new Date().toISOString()
  }));

  if (upsertData.length === 0) return { success: true };

  const { error } = await supabase
    .from("absensi")
    .upsert(upsertData, { onConflict: 'mahasiswa_id, pertemuan' });

  if (error) {
    console.error("Error saving absensi:", error);
    throw new Error("Failed to save absensi");
  }

  return { success: true };
}

export async function resetAbsensi(kelasId: string, pertemuan: number) {
  const supabase = createAdminSupabaseClient();
  
  // First, get the users for this class
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("kelas_id", kelasId)
    .eq("role", "praktikan");

  if (usersError || !users) {
    throw new Error("Failed to fetch users for class");
  }

  const userIds = users.map(u => u.id);

  if (userIds.length === 0) return { success: true };

  // Delete all absensi records for these users and this pertemuan
  const { error } = await supabase
    .from("absensi")
    .delete()
    .eq("pertemuan", pertemuan)
    .in("mahasiswa_id", userIds);

  if (error) {
    console.error("Error resetting absensi:", error);
    throw new Error("Failed to reset absensi");
  }

  return { success: true };
}
