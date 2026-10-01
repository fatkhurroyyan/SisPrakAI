import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { nim } = await request.json();

    if (!nim) {
      return NextResponse.json({ error: 'NIM wajib diisi' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('nim, nama, role')
      .eq('nim', nim)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'NIM tidak terdaftar' }, { status: 401 });
    }

    if (user.role === 'asprak') {
      return NextResponse.json({ error: 'Asisten Praktikum harus login melalui /asprakai/login' }, { status: 403 });
    }

    // Sign JWT cookie
    await createSession({
      nim: user.nim,
      role: user.role,
      nama: user.nama
    });

    return NextResponse.json({ 
      success: true,
      redirectUrl: '/praktikan'
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
