// --- START OF FILE app/layout.tsx ---

// IMPORTANT: This must be the first import to fix the broken localStorage polyfill in dev mode
import "../lib/localStorage-polyfill";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { UniversalHeader } from "./components/UniversalHeader";

// Load Inter font via next/font for optimal performance
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ID Pirate — Premium Novelty IDs",
  description: "The #1 source for premium novelty IDs. Fast turnaround, discreet shipping, and all security features included.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <div className="bg-[var(--bg)] text-[var(--text-primary)] min-h-screen flex flex-col">
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

// --- END OF FILE app/layout.tsx ---