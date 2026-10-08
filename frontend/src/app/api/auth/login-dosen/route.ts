import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { kode_dosen } = await request.json();

    if (!kode_dosen) {
      return NextResponse.json({ error: 'Kode dosen wajib diisi' }, { status: 400 });
    }

    const dosenMap: Record<string, string> = {
      "YSN": "Yuli Sun Hariyani, S.T., M.T., Ph.D.",
      "DDS": "Dr. Duddy Soegiarto, S.T., M.T.",
      "FTS": "Fitri Susanti, S.T., M.T.",
      "AUP": "Prof. Agus Pratondo, S.T., M.T., Ph.D."
    };
    
    const kode = kode_dosen.toUpperCase();

    if (!dosenMap[kode]) {
      return NextResponse.json({ error: 'Kode dosen tidak valid' }, { status: 401 });
    }

    // Sign JWT cookie
    await createSession({
      nim: kode,
      role: 'dosen',
      nama: dosenMap[kode]
    });

    return NextResponse.json({ 
      success: true,
      redirectUrl: '/dosen'
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
