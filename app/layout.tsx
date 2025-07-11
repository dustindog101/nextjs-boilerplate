// --- START OF FILE app/layout.tsx (Modified) ---

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { UniversalHeader } from "./components/UniversalHeader"; // <-- IMPORT UNIVERSAL HEADER

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      {/* The body is now a flex container to ensure proper layout with the header */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <UniversalHeader /> {/* <-- HEADER IS NOW UNIVERSAL */}
          {/* The main content area grows to fill available space, pushing footers down */}
          <main className="flex-grow">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

// --- END OF FILE app/layout.tsx (Modified) ---