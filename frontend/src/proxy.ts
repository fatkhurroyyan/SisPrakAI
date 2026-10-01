import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  const session = await decrypt(sessionToken);

  const { pathname } = request.nextUrl;

  // Protect /asprak routes
  if (pathname.startsWith('/asprakai')) {
    // Exception for the login page itself
    if (pathname === '/asprakai/login') {
      if (session) {
        if (session.app_role === 'asprak') return NextResponse.redirect(new URL('/asprakai', request.url));
        else return NextResponse.redirect(new URL('/praktikan', request.url));
      }
      // Let unauthenticated users access the login page
    } else {
      if (!session) {
        return NextResponse.redirect(new URL('/asprakai/login', request.url));
      }
      if (session.app_role !== 'asprak') {
        return NextResponse.redirect(new URL('/praktikan', request.url));
      }
    }
  }

  // Protect /praktikan routes
  if (pathname.startsWith('/praktikan')) {
    if (!session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (session.app_role !== 'praktikan') {
      return NextResponse.redirect(new URL('/asprakai', request.url));
    }
  }

  // Redirect from login if already authenticated
  if (pathname === '/') {
    if (session) {
      if (session.app_role === 'asprak') {
        return NextResponse.redirect(new URL('/asprakai', request.url));
      } else {
        return NextResponse.redirect(new URL('/praktikan', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
