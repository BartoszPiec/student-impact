import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";


const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Student2Work",
  description: "Platforma łącząca studentów z firmami",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        suppressHydrationWarning={true}
        className={`${outfit.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
