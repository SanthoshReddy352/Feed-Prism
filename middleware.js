import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Rate-limit helper — dynamically imports Upstash only for /api/v1/* routes.
 * If Upstash credentials are missing (local dev without Redis), skips limiting.
 */
async function applyRateLimit(request) {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Skip rate limiting if Upstash is not configured (graceful fallback)
  if (!redisUrl || !redisToken) {
    return NextResponse.next();
  }

  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');

    const redis = new Redis({ url: redisUrl, token: redisToken });

    // 60 requests per 1 minute sliding window
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
    });

    const apiKey = request.headers.get('x-api-key');

    // Use API key as identifier, fallback to IP for unauthenticated probes
    const identifier = apiKey
      ? `apikey_${apiKey}`
      : `unauth_${request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1'}`;

    const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { status: 'error', error: 'Rate limit exceeded. Maximum 60 requests per minute.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }
  } catch (err) {
    // If rate-limiting fails (Redis down, etc.), let the request through
    console.error('Rate limit error (non-blocking):', err.message);
  }

  return NextResponse.next();
}

export async function middleware(request) {
  // Public API routes — apply rate limiting, skip Supabase session
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    return applyRateLimit(request);
  }

  // All other routes — update Supabase auth session
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
