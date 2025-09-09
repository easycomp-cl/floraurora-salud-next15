import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlorAurora Salud - Plataforma de Psicología",
  description: "Plataforma de videollamadas para sesiones de psicología",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        <div className="min-h-screen flex flex-col">
          {/* Navbar */}
          <Navbar />

          {/* Contenido principal */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <Footer />

          {/* Debug de autenticación (solo en desarrollo) */}
          {/* <AuthDebug /> */}
        </div>
      </body>
    </html>
  );
}
