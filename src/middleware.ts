import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Простой In-Memory Rate Limiter для Middleware Edge-функций Next.js
// В продакшене используем Upstash Redis (Redis.lrange, ZADD и т.д.)
const rateLimitMap = new Map<{ ip: string }, { count: number, timestamp: number }>();

export function middleware(request: NextRequest) {
  // Rate-limiting только для эндпоинтов верификации PIN-кода и аутентификации
  if (request.nextUrl.pathname.startsWith('/api/verify-pin') || request.nextUrl.pathname.startsWith('/api/auth')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Fallback: Map keys in JS are strictly objects, so we stringify IP as key
    const current = rateLimitMap.get(ip as any) || { count: 0, timestamp: Date.now() };
    
    // Clear limit after 60 seconds
    if (Date.now() - current.timestamp > 60000) {
      current.count = 0;
      current.timestamp = Date.now();
    }
    
    current.count++;
    rateLimitMap.set(ip as any, current);

    // Максимум 5 попыток ввода в минуту. 
    // Защита от Bruteforce на PIN-коды мертвецов (ст. 21 Конституции РК)
    if (current.count > 5) {
      return new NextResponse('Too Many Requests. Brute-force защита активирована. (Rate Limit)', { 
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }
  }

  return NextResponse.next();
}

// Config указывает на каких роутах работает middleware
export const config = {
  matcher: ['/api/verify-pin', '/api/auth/:path*'],
};
