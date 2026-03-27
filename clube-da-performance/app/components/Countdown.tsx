"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const TARGET = new Date("2026-04-02T12:00:00-03:00").getTime();

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, TARGET - Date.now());
      setTime({
        days:  Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins:  Math.floor((diff % 3600000) / 60000),
        secs:  Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: "Dias",  value: time.days },
    { label: "Horas", value: time.hours },
    { label: "Min",   value: time.mins },
    { label: "Seg",   value: time.secs },
  ];

  return (
    <section className="bg-gray-50 border-b border-gray-100 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start gap-12 flex-wrap">
          {/* Text */}
          <div className="flex-1 min-w-[220px]">
            <p className="font-poppins text-[0.7rem] font-bold tracking-[0.14em] uppercase text-[#2bbfa0] mb-2">
              Abertura das vagas
            </p>
            <h2 className="font-poppins font-bold text-2xl md:text-3xl text-navy mb-2">
              Vagas liberadas em<br />02/04 às 12h00
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Faça sua pré-inscrição agora e receba o link de acesso antes de todo mundo.
            </p>
            <Link
              href="#pre-inscricao"
              className="grad-bg text-white font-poppins font-bold text-sm px-8 py-3.5 rounded hover:opacity-90 transition-opacity inline-block"
            >
              Quero minha pré-inscrição →
            </Link>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {units.map((u, i) => (
              <>
                <div key={u.label} className="flex flex-col items-center">
                  <div className="bg-navy text-white font-poppins font-extrabold text-3xl w-[68px] h-[68px] flex items-center justify-center rounded-md tabular-nums">
                    {pad(u.value)}
                  </div>
                  <span className="text-[0.68rem] text-gray-400 uppercase tracking-wider mt-1">
                    {u.label}
                  </span>
                </div>
                {i < units.length - 1 && (
                  <span key={`sep-${i}`} className="font-poppins font-bold text-2xl text-navy/30 mb-5">:</span>
                )}
              </>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
