import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Student2Work — Zlecenia dla Studentów",
  description: "Platforma łącząca studentów z firmami. Znajdź zlecenia, buduj portfolio i zarabiaj jeszcze na studiach.",
  openGraph: {
    title: "Student2Work — Zlecenia dla Studentów",
    description: "Platforma łącząca studentów z firmami. Znajdź zlecenia, buduj portfolio i zarabiaj jeszcze na studiach.",
    type: "website",
    locale: "pl_PL",
    siteName: "Student2Work",
  },
  twitter: {
    card: "summary_large_image",
    title: "Student2Work — Zlecenia dla Studentów",
    description: "Platforma łącząca studentów z firmami. Znajdź zlecenia, buduj portfolio i zarabiaj jeszcze na studiach.",
  },
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
        className={`${jakarta.variable} antialiased font-sans overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
