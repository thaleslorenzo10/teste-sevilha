import Image from "next/image";
import Link from "next/link";
import { Navbar } from "./components/Navbar";
import { Countdown } from "./components/Countdown";
import { PreInscricaoForm } from "./components/PreInscricaoForm";
import { LogoMark } from "./components/Logo";

// ─── DATA ────────────────────────────────────────────────────────────────────

const PILLARS = [
  { num: "01", title: "Estratégia e Finanças", desc: "Clareza de direção, metas e resultado financeiro real." },
  { num: "02", title: "Operação",              desc: "Processos mais eficientes, menos retrabalho, mais previsibilidade." },
  { num: "03", title: "Pessoas",               desc: "Desenvolvimento e alinhamento do time para crescer com você." },
  { num: "04", title: "Propósito",             desc: "Posicionamento claro do seu negócio no mercado contábil." },
];

const STEPS = [
  { title: "1 encontro ao vivo por semana",   desc: "Sessão exclusiva para donos — sem dispersão, com foco total em gestão." },
  { title: "Tema semanal com rotação",         desc: "Estratégia, operação, pessoas ou tema atual do mercado contábil." },
  { title: "Aplicação prática ("para casa")",  desc: "Cada sessão termina com uma ação concreta para implementar na semana." },
  { title: "Aulas gravadas + grupo de troca", desc: "Acesso ao histórico e comunidade de donos discutindo problemas reais." },
];

const PAINS = [
  { icon: "📉", text: "O faturamento cresce… mas a margem não acompanha" },
  { icon: "🔥", text: "O time trabalha muito, mas você sente desorganização constante" },
  { icon: "🧭", text: "Falta clareza de estratégia — crescer? nichar? ajustar preço ou valor?" },
  { icon: "⚙️", text: "Você resolve tudo e não consegue sair da operação" },
  { icon: "😮‍💨", text: "Sensação constante de estar 'apagando incêndio'" },
];

const MENTORS = [
  {
    name: "Bruno Silvestre",
    role: "Referência em performance e produtividade no setor contábil, com foco em entrega e margem",
    img: "/bruno.jpg",
    initials: "BS",
  },
  {
    name: "Vicente Sevilha",
    role: "Empresário contábil há mais de 35 anos com visão estratégica e experiência prática",
    img: "/vicente.jpg",
    initials: "VS",
  },
  {
    name: "Rodrigo Pires",
    role: "Especialista em Gestão Organizacional e de Pessoas, há 20 anos conectando estratégia, cultura e execução",
    img: "/rodrigo.jpg",
    initials: "RP",
  },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      {/* Top bar */}
      <div className="grad-bg-h text-white text-center py-2.5 px-4 font-poppins font-semibold text-xs tracking-wide">
        🔒 Pré-inscrição aberta — Vagas liberadas em 02/04 às 12h00
      </div>

      <Navbar />

      {/* ─── HERO ──────────────────────────────────────────────── */}
      <section className="bg-navy py-20 md:py-24 relative overflow-hidden">
        {/* Glow decorations */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-brand-green/10 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-brand-blue/10 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 relative">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-green-300 font-poppins text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-sm mb-6">
            🏆 Clube da Performance
          </span>
          <h1 className="font-poppins font-extrabold text-4xl md:text-5xl text-white max-w-3xl mb-5 leading-tight">
            Mentoria para donos de contabilidade que querem{" "}
            <span className="grad-text">sair do caos</span> e construir um negócio de verdade
          </h1>
          <p className="text-white/60 text-lg max-w-xl mb-10">
            Uma jornada prática para estruturar estratégia, operação, finanças e pessoas — sem fórmula mágica e com aplicação direta no seu dia a dia.
          </p>
          <ul className="flex flex-col gap-3 mb-12">
            {[
              "1 encontro semanal ao vivo — exclusivo para donos",
              "Aplicação prática com "para casa" toda semana",
              "Conteúdo baseado em +450 contabilidades atendidas",
              "Sem fidelidade — fica só se fizer sentido",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                <span className="w-2 h-2 rounded-full grad-bg flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="#pre-inscricao" className="grad-bg text-white font-poppins font-bold px-10 py-4 rounded hover:opacity-90 transition-opacity inline-block">
            Garantir minha pré-inscrição →
          </Link>
        </div>
      </section>

      {/* ─── COUNTDOWN ─────────────────────────────────────────── */}
      <Countdown />

      {/* ─── PROBLEM ───────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-poppins text-xs font-bold tracking-[0.14em] uppercase text-[#2bbfa0] mb-2">O problema</p>
          <h2 className="font-poppins font-bold text-3xl text-navy mb-8 max-w-2xl">
            Se você tem uma contabilidade com até 10 colaboradores, provavelmente está vivendo isso:
          </h2>
          <ul className="flex flex-col gap-3">
            {PAINS.map((p) => (
              <li
                key={p.text}
                className="flex items-start gap-4 bg-white border border-gray-100 border-l-[3px] border-l-red-400 px-5 py-4 text-sm text-gray-700"
              >
                <span className="text-base flex-shrink-0">{p.icon}</span>
                {p.text}
              </li>
            ))}
          </ul>
          <p className="text-gray-400 text-sm italic mt-6">
            Você não está sozinho — isso é reflexo de um mercado que ficou mais complexo e exige gestão de verdade.
          </p>
        </div>
      </section>

      {/* ─── BREAK BELIEF ──────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-poppins text-xs font-bold tracking-[0.14em] uppercase text-[#2bbfa0] mb-2">A virada</p>
          <h2 className="font-poppins font-bold text-3xl text-navy mb-5 max-w-lg">
            O problema não é técnico. É gestão.
          </h2>
          <p className="text-gray-500 max-w-xl leading-relaxed">
            Durante anos, ser bom tecnicamente sustentava uma contabilidade. Hoje isso não é mais suficiente.
            <br /><br />
            Para crescer, você precisa dominar estratégia, finanças, processos e pessoas. Sem isso, sua empresa trava — mesmo com muito esforço.
          </p>
        </div>
      </section>

      {/* ─── PILLARS ───────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-poppins text-xs font-bold tracking-[0.14em] uppercase text-[#2bbfa0] mb-2">O Método</p>
          <h2 className="font-poppins font-bold text-3xl text-navy mb-8">
            Você vai evoluir sua contabilidade em 4 dimensões
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PILLARS.map((p) => (
              <div
                key={p.num}
                className="bg-white border border-gray-100 rounded-lg px-6 py-7 relative overflow-hidden"
                style={{ borderTop: "3px solid transparent", backgroundImage: "linear-gradient(white, white), linear-gradient(90deg, #3dd63a, #29b4f6)", backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box" }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ background: "linear-gradient(90deg, #3dd63a, #29b4f6)" }}
                />
                <p className="font-poppins text-[0.68rem] font-bold text-[#2bbfa0] uppercase tracking-widest mb-3">
                  Dimensão {p.num}
                </p>
                <h4 className="font-poppins font-bold text-navy text-base mb-2">{p.title}</h4>
                <p className="text-gray-400 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-poppins text-xs font-bold tracking-[0.14em] uppercase text-[#2bbfa0] mb-2">Como funciona</p>
          <h2 className="font-poppins font-bold text-3xl text-navy mb-8">
            Uma rotina simples, mas poderosa
          </h2>
          <div className="divide-y divide-gray-100">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex items-start gap-5 py-6">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-poppins font-bold text-base flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #3dd63a, #29b4f6)" }}
                >
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-poppins font-bold text-navy text-base mb-1">{s.title}</h4>
                  <p className="text-gray-500 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MENTORS ───────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-poppins text-xs font-bold tracking-[0.14em] uppercase text-[#2bbfa0] mb-2">Quem entrega</p>
          <h2 className="font-poppins font-bold text-3xl text-navy mb-3">
            Mentores com trajetória real no mercado contábil
          </h2>
          <p className="text-gray-500 text-sm mb-10 max-w-lg">
            Nada de teoria. O que você vai encontrar aqui é experiência acumulada em centenas de escritórios.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {MENTORS.map((m) => (
              <div key={m.name} className="bg-white border border-gray-100 rounded-xl overflow-hidden text-center">
                <div
                  className="relative w-full aspect-[4/3.8] overflow-hidden"
                  style={{ background: "linear-gradient(160deg, #3dd63a 0%, #2bbfa0 50%, #29b4f6 100%)" }}
                >
                  <Image
                    src={m.img}
                    alt={m.name}
                    fill
                    className="object-cover object-top"
                    onError={() => {}}
                  />
                </div>
                <div className="px-5 py-5">
                  <h4 className="font-poppins font-bold text-navy text-base mb-1">{m.name}</h4>
                  <p className="text-gray-400 text-sm leading-snug">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR WHO ───────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-poppins text-xs font-bold tracking-[0.14em] uppercase text-[#2bbfa0] mb-2">Compatibilidade</p>
          <h2 className="font-poppins font-bold text-3xl text-navy mb-8">
            Pra quem é — e pra quem não é
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-7">
              <h4 className="font-poppins font-bold text-xs uppercase tracking-widest text-green-500 mb-5">
                É pra você se…
              </h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-600">
                {[
                  "Você tem escritório com até 10 colaboradores",
                  "Quer estruturar a empresa de verdade",
                  "Sente que está perdido no crescimento",
                  "Quer sair do operacional e pensar mais estrategicamente",
                ].map((item) => (
                  <li key={item} className="flex gap-2 items-start">
                    <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-7">
              <h4 className="font-poppins font-bold text-xs uppercase tracking-widest text-red-400 mb-5">
                Não é pra você se…
              </h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-600">
                {[
                  "Você busca solução mágica ou atalho rápido",
                  "Não quer executar o que for discutido",
                  "Quer só mais conteúdo técnico contábil",
                ].map((item) => (
                  <li key={item} className="flex gap-2 items-start">
                    <span className="text-red-400 font-bold flex-shrink-0">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-poppins text-xs font-bold tracking-[0.14em] uppercase text-[#2bbfa0] mb-2">Investimento</p>
          <h2 className="font-poppins font-bold text-3xl text-navy mb-3">Acessível para quem quer evoluir</h2>
          <p className="text-gray-500 text-sm mb-8">Sem fidelidade. Sem risco. Fica só enquanto fizer sentido.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl">

            <div className="bg-white border-2 border-gray-100 rounded-xl p-8">
              <p className="font-poppins font-bold text-xs uppercase tracking-widest text-[#2bbfa0] mb-3">
                Até 5 colaboradores
              </p>
              <div className="font-poppins font-extrabold text-4xl text-navy mb-1">R$ 547</div>
              <p className="text-gray-400 text-xs mb-6">por mês · sem fidelidade</p>
              <ul className="flex flex-col gap-2.5 text-sm text-gray-500">
                {["1 encontro ao vivo/semana","Aulas gravadas","Grupo de troca","Aplicação prática semanal"].map(f => (
                  <li key={f} className="flex gap-2"><span className="text-green-500 font-bold">✓</span>{f}</li>
                ))}
              </ul>
            </div>

            <div className="bg-navy rounded-xl p-8 relative">
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-white font-poppins font-bold text-[0.65rem] uppercase tracking-widest px-4 py-1 rounded-full whitespace-nowrap"
                style={{ background: "linear-gradient(90deg, #3dd63a, #29b4f6)" }}
              >
                Mais contratado
              </div>
              <p className="font-poppins font-bold text-xs uppercase tracking-widest text-[#6ff0c0] mb-3">
                Até 10 colaboradores
              </p>
              <div className="font-poppins font-extrabold text-4xl text-white mb-1">R$ 647</div>
              <p className="text-white/40 text-xs mb-6">por mês · sem fidelidade</p>
              <ul className="flex flex-col gap-2.5 text-sm text-white/60">
                {["1 encontro ao vivo/semana","Aulas gravadas","Grupo de troca","Aplicação prática semanal"].map(f => (
                  <li key={f} className="flex gap-2"><span className="text-green-400 font-bold">✓</span>{f}</li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FORM ──────────────────────────────────────────────── */}
      <PreInscricaoForm />

      {/* ─── FOOTER ────────────────────────────────────────────── */}
      <footer className="bg-navy py-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <LogoMark size={30} />
          <div className="font-poppins text-left">
            <div className="font-bold text-white text-sm">Sevilha Performance</div>
            <div className="text-white/35 text-xs">© 2025 · Todos os direitos reservados</div>
          </div>
        </div>
        <p className="text-white/30 text-xs">
          Clube da Performance · Uma iniciativa Sevilha Performance
        </p>
      </footer>
    </>
  );
}
