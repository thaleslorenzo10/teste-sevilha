import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "./components/ModalContext";
import { ModalForm } from "./components/ModalForm";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Clube da Performance – Sevilha Performance",
  description:
    "Mentoria para donos de contabilidade que querem sair do caos e construir um negócio de verdade. Pré-inscrição aberta — vagas liberadas em 02/04 às 12h.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} ${inter.variable} antialiased`}>
        <ModalProvider>
          {children}
          <ModalForm />
        </ModalProvider>
      </body>
    </html>
  );
}
