"use client";
import { useState } from "react";

export function PreInscricaoForm() {
  const [submitted, setSubmitted] = useState(false);
  const [wpp, setWpp] = useState("");

  function formatWpp(value: string) {
    let v = value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    return v;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="pre-inscricao" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="font-poppins text-[0.7rem] font-bold tracking-[0.14em] uppercase text-[#2bbfa0] mb-2">
            Pré-inscrição
          </p>
          <h2 className="font-poppins font-bold text-3xl text-navy mb-3">
            Garanta seu lugar na fila
          </h2>
          <p className="text-gray-500 text-sm">
            As vagas abrem em <strong className="text-navy">02/04 às 12h</strong>. Quem se pré-inscrever recebe o link antes de todo mundo.
          </p>
        </div>

        <div className="max-w-xl mx-auto bg-navy rounded-2xl p-10 md:p-12">
          {submitted ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="font-poppins font-bold text-xl text-[#6ff0a0] mb-2">
                Pré-inscrição confirmada!
              </h3>
              <p className="text-white/50 text-sm">
                Você receberá o link de acesso no dia 02/04 às 12h.<br />
                Fique atento ao seu WhatsApp e e-mail.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins text-[0.72rem] font-semibold tracking-wider uppercase text-white/40">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    required
                    className="bg-white/[0.07] border border-white/10 text-white placeholder-white/20 rounded-md px-4 py-3 text-sm outline-none focus:border-[#2bbfa0] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins text-[0.72rem] font-semibold tracking-wider uppercase text-white/40">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="bg-white/[0.07] border border-white/10 text-white placeholder-white/20 rounded-md px-4 py-3 text-sm outline-none focus:border-[#2bbfa0] transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins text-[0.72rem] font-semibold tracking-wider uppercase text-white/40">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={wpp}
                    onChange={(e) => setWpp(formatWpp(e.target.value))}
                    required
                    className="bg-white/[0.07] border border-white/10 text-white placeholder-white/20 rounded-md px-4 py-3 text-sm outline-none focus:border-[#2bbfa0] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins text-[0.72rem] font-semibold tracking-wider uppercase text-white/40">
                    Colaboradores
                  </label>
                  <select
                    required
                    defaultValue=""
                    className="bg-white/[0.07] border border-white/10 text-white rounded-md px-4 py-3 text-sm outline-none focus:border-[#2bbfa0] transition-colors appearance-none"
                  >
                    <option value="" disabled className="bg-navy">Selecione</option>
                    <option value="1-5" className="bg-navy">1 a 5 colaboradores</option>
                    <option value="6-10" className="bg-navy">6 a 10 colaboradores</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="grad-bg text-white font-poppins font-bold text-base py-4 rounded-md hover:opacity-90 transition-opacity w-full"
              >
                Quero garantir minha pré-inscrição →
              </button>
              <p className="text-center text-white/30 text-xs mt-3">
                Ao se pré-inscrever, você receberá o acesso às vagas em 02/04 às 12h pelo WhatsApp e e-mail.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
