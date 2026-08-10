import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if static asset or internal build file
  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.webmanifest');

  // Rate limit POST / API actions lightly, exempt standard GET page loads
  if (!isStaticAsset && request.method !== 'GET') {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateConfig = { limit: 60, windowMs: 60000 };
    const rateResult = checkRateLimit(clientIp, rateConfig);

    if (!rateResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few seconds.' },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
