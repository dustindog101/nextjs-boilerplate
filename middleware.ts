import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    const hostname = req.headers.get('host') || '';
    const url = req.nextUrl.clone();
    const pathname = url.pathname;

    // Never rewrite Route Handlers — e.g. manny.localhost:3000/api/... must hit app/api/**, not /r/manny/api/...
    if (pathname === '/api' || pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // List of hosts that are NOT reseller subdomains
    const mainDomains = [
        'localhost:3000',
        'idpirate.com',
        'www.idpirate.com',
    ];

    const isMainDomain =
        mainDomains.some((d) => hostname === d) ||
        hostname.endsWith('.vercel.app') ||
        // Cover localhost on any port (3000, 3001, 3002, …)
        hostname === 'localhost' ||
        /^localhost:\d+$/.test(hostname);

    if (!isMainDomain) {
        // e.g. "manny.idpirate.com" → subdomain = "manny"
        const subdomain = hostname.split('.')[0];

        if (subdomain) {
            // Prevent common/dev subdomains from hitting the reseller checkout
            const reservedSubdomains = ['www', 'admin', 'api', 'dev', 'staging', 'test'];

            if (!reservedSubdomains.includes(subdomain)) {
                // Silently rewrite to /r/[subdomain] — browser URL stays as subdomain
                url.pathname = `/r/${subdomain}${url.pathname === '/' ? '' : url.pathname}`;
                const requestHeaders = new Headers(req.headers);
                requestHeaders.set('x-idpirate-reseller-host', '1');
                return NextResponse.rewrite(url, {
                    request: { headers: requestHeaders },
                });
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Exclude API routes so subdomain rewrites never intercept fetch() to /api/* (HTML 404s).
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
