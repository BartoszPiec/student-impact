import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student2Work - Zlecenia dla Studentow",
  description:
    "Platforma laczaca studentow z firmami. Znajdz zlecenia, buduj portfolio i zarabiaj jeszcze na studiach.",
  openGraph: {
    title: "Student2Work - Zlecenia dla Studentow",
    description:
      "Platforma laczaca studentow z firmami. Znajdz zlecenia, buduj portfolio i zarabiaj jeszcze na studiach.",
    type: "website",
    locale: "pl_PL",
    siteName: "Student2Work",
  },
  twitter: {
    card: "summary_large_image",
    title: "Student2Work - Zlecenia dla Studentow",
    description:
      "Platforma laczaca studentow z firmami. Znajdz zlecenia, buduj portfolio i zarabiaj jeszcze na studiach.",
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
        className="antialiased font-sans overflow-x-hidden"
      >
        {children}
      </body>
    </html>
  );
}
