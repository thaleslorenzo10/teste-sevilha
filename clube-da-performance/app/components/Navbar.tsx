"use client";
import Link from "next/link";
import { Logo } from "./Logo";

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo />
        <Link
          href="#pre-inscricao"
          className="grad-bg text-white font-poppins font-semibold text-sm px-5 py-2.5 rounded hover:opacity-90 transition-opacity"
        >
          Pré-inscrição
        </Link>
      </div>
    </nav>
  );
}
