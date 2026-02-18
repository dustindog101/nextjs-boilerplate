"use client";

import React from 'react';
import Link from 'next/link';

interface FooterProps {
    className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => (
    <footer className={`border-t border-white/[0.06] py-8 px-4 ${className}`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-500">
                &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
            </p>
            <nav className="flex items-center gap-5">
                <Link href="/order" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Order
                </Link>
                <Link href="/track" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Track
                </Link>
                <Link href="/account" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Account
                </Link>
                <Link href="/terms" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Terms
                </Link>
                <Link href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Privacy
                </Link>
            </nav>
        </div>
    </footer>
);
