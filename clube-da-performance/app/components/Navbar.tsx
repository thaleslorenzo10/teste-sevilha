"use client";
import { Logo } from "./Logo";
import { CtaButton } from "./CtaButton";

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo />
        <CtaButton
          label="Fazer pré-inscrição"
          className="text-sm px-5 py-2.5"
        />
      </div>
    </nav>
  );
}
