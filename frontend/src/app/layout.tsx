import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareNexus — AI Health Assistant",
  description:
    "AI-powered medical chatbot for primary healthcare triage. Get symptom assessment, severity scoring, and evidence-based health guidance.",
  keywords: [
    "medical chatbot",
    "health AI",
    "symptom checker",
    "healthcare triage",
    "CareNexus",
  ],
};

/**
 * Paints the browser chrome (mobile address bar, PWA splash) jet black so the
 * app does not flash white on load. `colorScheme` keeps native widgets dark.
 */
export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-void text-ink-2 antialiased`}>
        {children}
      </body>
    </html>
  );
}
