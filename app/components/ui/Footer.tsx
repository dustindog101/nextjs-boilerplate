"use client";

import React from 'react';

interface FooterProps {
    className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => (
    <footer className={`py-8 text-gray-500 text-sm text-center ${className}`}>
        &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
    </footer>
);
