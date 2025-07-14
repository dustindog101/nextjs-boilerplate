// --- START OF FILE app/layout.tsx (Corrected for Global Styles and Layout) ---

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; // Ensure this import is present for global styles
import { AuthProvider } from "./contexts/AuthContext";
import { UniversalHeader } from "./components/UniversalHeader";

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
      {/* FIX: Simplified body classes. Background is now handled by globals.css and the main div inside the layout */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {/* FIX: The root container now enforces the background and flex layout */}
          {/* Also added font-pirate class here for potential global application if needed */}
          <div className="bg-gray-900 text-gray-200 min-h-screen flex flex-col">
            <UniversalHeader />
            {/* FIX: Main content takes up remaining space and has correct padding */}
            <main className="flex-grow flex-1">
              {children}
            </main>
            {/* Footer is now managed per page */}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

// --- END OF FILE app/layout.tsx (Corrected for Global Styles and Layout) ---