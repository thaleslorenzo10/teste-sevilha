"use client";
import { useState, useEffect, useRef } from "react";
import { useModal } from "./ModalContext";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

function getUtms(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  UTM_KEYS.forEach((k) => {
    const v = params.get(k) ?? sessionStorage.getItem(k) ?? "";
    if (v) {
      result[k] = v;
      sessionStorage.setItem(k, v); // persiste durante a sessão
    }
  });
  return result;
}

function formatPhone(value: string) {
  let v = value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  else if (v.length > 0) v = `(${v}`;
  return v;
}

export function ModalForm() {
  const { open, closeModal } = useModal();
  const [submitted, setSubmitted] = useState(false);
  const [phone, setPhone] = useState("");
  const [utms, setUtms] = useState<Record<string, string>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  // Captura UTMs quando o modal abre
  useEffect(() => {
    if (open) {
      setUtms(getUtms());
      setSubmitted(false);
      setPhone("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Fecha ao pressionar Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    // Injeta UTMs no FormData
    Object.entries(utms).forEach(([k, v]) => data.set(k, v));
    // TODO: enviar data para seu backend/CRM aqui
    console.log("Dados capturados:", Object.fromEntries(data));
    setSubmitted(true);
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(10,12,30,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) closeModal(); }}
    >
      <div className="bg-navy w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Gradient top accent */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #3dd63a, #2bbfa0, #29b4f6)" }} />

        {/* Close button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors text-xl leading-none"
          aria-label="Fechar"
        >
          ✕
        </button>

        <div className="px-8 py-8">
          {submitted ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="font-poppins font-bold text-xl text-[#6ff0a0] mb-2">
                Pré-inscrição confirmada!
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Você receberá o link de acesso no dia<br />
                <strong className="text-white/80">02/04 às 12h</strong> pelo WhatsApp e e-mail.
              </p>
              <button
                onClick={closeModal}
                className="mt-6 text-white/40 hover:text-white/70 text-sm transition-colors"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <p className="font-poppins text-[0.68rem] font-bold tracking-[0.14em] uppercase text-[#2bbfa0] mb-1">
                Pré-inscrição
              </p>
              <h2 className="font-poppins font-bold text-2xl text-white mb-1">
                Garanta seu lugar na fila
              </h2>
              <p className="text-white/45 text-sm mb-7">
                Vagas liberadas em <strong className="text-white/70">02/04 às 12h</strong>. Pré-inscritos recebem o link primeiro.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Nome */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins text-[0.7rem] font-semibold tracking-wider uppercase text-white/40">
                    Nome completo
                  </label>
                  <input
                    name="nome"
                    type="text"
                    placeholder="Seu nome"
                    required
                    className="bg-white/[0.07] border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2bbfa0] transition-colors"
                  />
                </div>

                {/* E-mail */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins text-[0.7rem] font-semibold tracking-wider uppercase text-white/40">
                    E-mail
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="bg-white/[0.07] border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2bbfa0] transition-colors"
                  />
                </div>

                {/* Telefone */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins text-[0.7rem] font-semibold tracking-wider uppercase text-white/40">
                    Telefone / WhatsApp
                  </label>
                  <input
                    name="telefone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    required
                    className="bg-white/[0.07] border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2bbfa0] transition-colors"
                  />
                </div>

                {/* UTMs ocultos */}
                {UTM_KEYS.map((k) => (
                  <input key={k} type="hidden" name={k} value={utms[k] ?? ""} />
                ))}

                <button
                  type="submit"
                  className="mt-1 text-white font-poppins font-bold text-sm py-4 rounded-lg hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #3dd63a, #2bbfa0, #29b4f6)" }}
                >
                  Quero garantir minha pré-inscrição →
                </button>

                <p className="text-center text-white/25 text-xs">
                  Sem spam. Você receberá apenas o aviso de abertura das vagas.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
