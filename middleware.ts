import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Auth is handled client-side via AdminProvider/AdminNav
  // Supabase JS v2 stores auth tokens in localStorage (not cookies),
  // so server-side cookie checks don't work reliably.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
