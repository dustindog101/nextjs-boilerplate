import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    const hostname = req.headers.get('host') || '';
    const url = req.nextUrl.clone();

    // List of hosts that are NOT reseller subdomains
    const mainDomains = [
        'localhost:3000',
        'idpirate.com',
        'www.idpirate.com',
    ];

    const isMainDomain = mainDomains.some(d => hostname === d) || hostname.endsWith('.vercel.app');

    if (!isMainDomain) {
        // e.g. "manny.idpirate.com" → subdomain = "manny"
        const subdomain = hostname.split('.')[0];

        if (subdomain && subdomain !== 'www' && subdomain !== 'admin' && subdomain !== 'api') {
            // Silently rewrite to /r/[subdomain] — browser URL stays as subdomain
            url.pathname = `/r/${subdomain}${url.pathname === '/' ? '' : url.pathname}`;
            return NextResponse.rewrite(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Run on all paths except Next.js internals and static files
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
