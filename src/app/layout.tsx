import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monsters ink! - Learn ink! Smart Contract Development",
  description: "Interactive tutorial for learning ink! smart contract development on Polkadot and Substrate chains. Master Rust-based Web3 development with hands-on lessons.",
  keywords: "ink!, smart contracts, Polkadot, Substrate, Rust, Web3, blockchain development, tutorial",
  authors: [{ name: "Monsters ink! Team" }],
  openGraph: {
    title: "Monsters ink! - Learn ink! Smart Contract Development",
    description: "Interactive tutorial for learning ink! smart contract development on Polkadot and Substrate chains.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen`}
      >
        <div className="relative">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
          
          {/* Content */}
          <div className="relative">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
