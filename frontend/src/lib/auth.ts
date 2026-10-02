import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'super-secret-jwt-key-for-development';
const encodedKey = new TextEncoder().encode(secretKey);

export type UserSession = {
  nim: string;
  role: 'asprak' | 'praktikan' | 'dosen';
  nama: string;
};

export async function createSession(user: UserSession) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await new SignJWT({ 
    ...user,
    role: 'authenticated', // required by Supabase RLS
    app_role: user.role, // store original role here
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
    
  (await cookies()).set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  (await cookies()).delete('session');
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as UserSession & { role: string; app_role: 'asprak' | 'praktikan' | 'dosen' };
  } catch (error) {
    return null;
  }
}
