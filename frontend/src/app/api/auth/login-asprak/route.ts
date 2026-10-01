import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { nim, kode_asprak } = await request.json();

    if (!nim || !kode_asprak) {
      return NextResponse.json({ error: 'NIM dan Kode Asprak wajib diisi' }, { status: 400 });
    }

    if (kode_asprak.length !== 3 || kode_asprak !== kode_asprak.toUpperCase()) {
      return NextResponse.json({ error: 'Kode Asprak harus 3 huruf besar' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('nim, nama, role, kode_asprak')
      .eq('nim', nim)
      .eq('role', 'asprak')
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'NIM Asisten tidak terdaftar' }, { status: 401 });
    }

    if (user.kode_asprak !== kode_asprak) {
      return NextResponse.json({ error: 'Kode Asprak salah' }, { status: 401 });
    }

    // Sign JWT cookie
    await createSession({
      nim: user.nim,
      role: user.role,
      nama: user.nama
    });

    return NextResponse.json({ 
      success: true,
      redirectUrl: '/asprakai'
    });
  } catch (error) {
    console.error('Login asprak error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
