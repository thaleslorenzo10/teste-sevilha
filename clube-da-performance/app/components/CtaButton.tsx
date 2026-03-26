"use client";
import { useModal } from "./ModalContext";

interface CtaButtonProps {
  label?: string;
  className?: string;
}

export function CtaButton({
  label = "Garantir minha pré-inscrição →",
  className = "",
}: CtaButtonProps) {
  const { openModal } = useModal();
  return (
    <button
      onClick={openModal}
      className={`grad-bg text-white font-poppins font-bold rounded hover:opacity-90 transition-opacity ${className}`}
    >
      {label}
    </button>
  );
}
