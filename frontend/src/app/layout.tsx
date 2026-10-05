import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
