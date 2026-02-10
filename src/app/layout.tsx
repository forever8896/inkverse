import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Press_Start_2P } from 'next/font/google';
import { Unbounded } from 'next/font/google';
import './globals.css';

const geistSans = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
});

const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
});

export const metadata: Metadata = {
  title: 'Monsters ink! - Learn ink! Smart Contract Development',
  description:
    'Interactive tutorial for learning ink! smart contract development on Polkadot and Substrate chains. Master Rust-based Web3 development with hands-on lessons.',
  keywords:
    'ink!, smart contracts, Polkadot, Substrate, Rust, Web3, blockchain development, tutorial',
  authors: [{ name: 'Monsters ink! Team' }],
  openGraph: {
    title: 'Monsters ink! - Learn ink! Smart Contract Development',
    description:
      'Interactive tutorial for learning ink! smart contract development on Polkadot and Substrate chains.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-black">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} ${unbounded.variable} antialiased bg-gradient-to-b from-[#0a0412] via-[#1a0a2e] to-[#0f0520] min-h-screen`}
      >
        <div className="relative">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />

          {/* Content */}
          <div className="relative">{children}</div>
        </div>
      </body>
    </html>
  );
}
