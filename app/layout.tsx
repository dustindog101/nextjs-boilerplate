// --- START OF FILE app/layout.tsx (Modified) ---

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext"; // <-- IMPORT THE PROVIDER

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider> {/* <-- WRAP CHILDREN WITH THE PROVIDER */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

// --- END OF FILE app/layout.tsx (Modified) ---