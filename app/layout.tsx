// --- START OF FILE app/layout.tsx (Corrected for Global Styles and Layout) ---

// IMPORTANT: This must be the first import to fix the broken localStorage polyfill in dev mode
import "../lib/localStorage-polyfill";

import type { Metadata } from "next";
import { Inter, Uncial_Antiqua, Pirata_One } from "next/font/google";
import "./globals.css"; // Ensure this import is present for global styles
import { AuthProvider } from "./contexts/AuthContext";
import { UniversalHeader } from "./components/UniversalHeader";

// Load Inter font via next/font for optimal performance
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const uncial = Uncial_Antiqua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-uncial",
  display: "swap",
});

const pirata = Pirata_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pirata",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ID Pirate | Premium Novelty IDs",
    template: "%s | ID Pirate"
  },
  description: "Fast, Private, Crypto-Powered Novelty ID Platform. 1:1 replicas with scannable barcodes, UV holograms, and microprint.",
  keywords: ["novelty id", "fake id", "scannable id", "id pirate"],
  openGraph: {
    title: "ID Pirate | Premium Novelty IDs",
    description: "Fast, Private, Crypto-Powered Novelty ID Platform.",
    url: "https://idpirate.com",
    siteName: "ID Pirate",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ID Pirate | Premium Novelty IDs",
    description: "Fast, Private, Crypto-Powered Novelty ID Platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Decorative fonts are now loaded via next/font in the body class */}
      </head>
      <body className={`${inter.variable} ${uncial.variable} ${pirata.variable} antialiased`}>
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

// --- END OF FILE app/layout.tsx (Corrected for Global Styles and Layout) ---