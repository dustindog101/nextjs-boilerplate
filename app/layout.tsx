// --- START OF FILE app/layout.tsx ---

// IMPORTANT: This must be the first import to fix the broken localStorage polyfill in dev mode
import "../lib/localStorage-polyfill";

import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { UniversalHeader } from "./components/UniversalHeader";

// Load Space Grotesk for display/headings
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["600", "700"],
});

// Load DM Sans for body text
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ID Pirate — Premium Novelty IDs | Trusted Since 2024",
  description: "The #1 source for premium novelty IDs. Scannable barcodes, UV holograms, microprint. Fast turnaround, discreet shipping, and all security features included.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const hideHeaderForResellerHost =
    headerList.get("x-idpirate-reseller-host") === "1";

  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${dmSans.variable} antialiased`}>
        <AuthProvider>
          <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen flex flex-col">
            <UniversalHeader hideHeaderForResellerHost={hideHeaderForResellerHost} />
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