import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/Toaster";
import { WalletProvider } from "@/components/WalletProvider";
import { MarketsLoader } from "@/components/MarketsLoader";
import { CommissionLoader } from "@/components/CommissionLoader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Predicards — Open a Pack. Predict the Cup.",
  description:
    "World Cup prediction market meets Panini-style collectibles. Open packs, complete sets, activate parlays.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <head>
        {/* Apply the saved theme before first paint to avoid a light→dark flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('predicards-theme');if(t==='dark')document.documentElement.dataset.theme='dark';}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <WalletProvider>
          <MarketsLoader />
          <CommissionLoader />
          <Header />
          <main className="pt-16">{children}</main>
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
