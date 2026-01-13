// --- START OF FILE app/layout.tsx (Corrected for Global Styles and Layout) ---

// IMPORTANT: This must be the first import to fix the broken localStorage polyfill in dev mode
import "../lib/localStorage-polyfill";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Ensure this import is present for global styles
import { AuthProvider } from "./contexts/AuthContext";
import { UniversalHeader } from "./components/UniversalHeader";

// Load Inter font via next/font for optimal performance
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "ID Pirate",
  description: "Fast, Private, Crypto-Powered Novelty ID Platform"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Load decorative fonts via link tag (not available in next/font) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Pirata+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <div className="bg-gray-900 text-gray-200 min-h-screen flex flex-col">
            <UniversalHeader />
            <main className="flex-grow flex-1">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

// --- END OF FILE app/layout.tsx (Corrected for Global Styles and Layout) ---