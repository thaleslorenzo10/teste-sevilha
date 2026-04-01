import Image from "next/image";
import { Navbar } from "./components/Navbar";
import { Countdown } from "./components/Countdown";
import { CtaButton } from "./components/CtaButton";
import { LogoMark } from "./components/Logo";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const PAINS = [
  { icon: "📉", text: "O faturamento cresce… mas a margem não acompanha" },
  { icon: "🔥", text: "O time trabalha muito, mas você sente desorganização" },
  { icon: "🧭", text: "Falta clareza de estratégia — crescer? nichar? precificar?" },
  { icon: "⚙️", text: "Você resolve tudo e não consegue sair da operação" },
  { icon: "📊", text: "Não há gestão financeira real no seu negócio" },
  { icon: "😮‍💨", text: "Sensação constante de estar 'apagando incêndio'" },
];

const PILLARS = [
  { num: "01", title: "Estratégia e Finanças", desc: "Clareza de direção, metas e resultado financeiro real." },
  { num: "02", title: "Operação",              desc: "Processos eficientes, menos retrabalho, mais previsibilidade." },
  { num: "03", title: "Pessoas",               desc: "Desenvolvimento e alinhamento do time para crescer com você." },
  { num: "04", title: "Propósito",             desc: "Posicionamento claro do seu negócio no mercado contábil." },
];

const STEPS = [
  { n: "01", title: "1 encontro ao vivo por semana",   desc: "Sessão exclusiva para donos — sem dispersão, foco total em gestão." },
  { n: "02", title: "Tema semanal com rotação",         desc: "Estratégia, operação, pessoas ou tema atual do mercado." },
  { n: "03", title: 'Aplicação prática ("para casa")',  desc: "Cada sessão termina com uma ação concreta para a semana." },
];

const INCLUDED = [
  "Encontros ao vivo exclusivos para donos",
  "Aulas gravadas para revisar quando quiser",
  "Grupo de troca com outros donos",
  "Aplicação prática com acompanhamento",
  "Conteúdo baseado em +450 contabilidades atendidas",
  "Acesso ao calendário de temas mensais",
];

const MENTORS = [
  {
    name: "Bruno Silvestre",
    role: "Referência em performance e produtividade no setor contábil, com foco em entrega e margem",
    img: "/bruno.jpg",
  },
  {
    name: "Vicente Sevilha",
    role: "Empresário contábil há mais de 35 anos com visão estratégica e experiência prática",
    img: "/vicente.jpg",
  },
  {
    name: "Rodrigo Pires",
    role: "Especialista em Gestão Organizacional e de Pessoas, há 20 anos conectando estratégia, cultura e execução",
    img: "/rodrigo.jpg",
  },
];

const STATS = [
  { value: "+450", label: "Contabilidades atendidas" },
  { value: "100%", label: "Online e ao vivo" },
  { value: "0",    label: "Meses de fidelidade" },
];

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div className="grad-bg-h text-white text-center py-2.5 px-4 font-poppins font-semibold text-xs tracking-wide">
        🔒 Pré-inscrição aberta — Vagas liberadas em 09/04 às 16h00
      </div>

      <Navbar />

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="bg-navy py-20 md:py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(61,214,58,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 10% 80%, rgba(41,180,246,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="max-w-2xl">
            <span className="inline-block font-poppins text-[0.68rem] font-bold tracking-[0.18em] uppercase text-white/40 mb-5">
              Mentoria Exclusiva · Sevilha Performance
            </span>
            <h1 className="font-poppins font-extrabold text-4xl md:text-5xl text-white leading-tight mb-5">
              Mentoria para donos de contabilidade que querem{" "}
              <span className="grad-text">sair do caos operacional</span> e construir um negócio de verdade
            </h1>
            <p className="text-white/55 text-base md:text-lg max-w-xl mb-8 leading-relaxed">
              Uma jornada prática para estruturar estratégia, operação, finanças e pessoas — sem fórmula mágica e com aplicação direta no seu dia a dia.
            </p>
            <ul className="flex flex-col gap-2.5 mb-10">
              {[
                "1 encontro semanal ao vivo — exclusivo para donos",
                'Aplicação prática com "para casa" toda semana',
                "Conteúdo baseado em +450 contabilidades atendidas",
                "Sem fidelidade — fica só se fizer sentido",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/70 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full grad-bg flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <CtaButton
              label="Garantir minha pré-inscrição →"
              className="px-10 py-4 text-base"
            />
            <p className="text-white/30 text-xs mt-3">
              Sem compromisso. Vagas limitadas.
            </p>
          </div>
        </div>
      </section>

      {/* ── COUNTDOWN ───────────────────────────────────────── */}
      <Countdown />

      {/* ── PROBLEM ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-poppins text-[0.68rem] font-bold tracking-[0.16em] uppercase text-[#2bbfa0] mb-3">
            O Problema
          </p>
          <h2 className="font-poppins font-bold text-3xl text-navy mb-10 max-w-2xl">
            Se você tem uma contabilidade com até 10 colaboradores, provavelmente está vivendo isso:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {PAINS.map((p) => (
              <div
                key={p.text}
                className="flex items-start gap-4 bg-gray-50 border border-gray-100 border-l-[3px] border-l-red-400 px-5 py-4"
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{p.icon}</span>
                <span className="text-sm text-gray-700">{p.text}</span>
              </div>
            ))}
          </div>
          {/* Callout */}
          <div className="bg-navy rounded-xl px-7 py-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-white/70 text-sm leading-relaxed flex-1">
              Você não está sozinho — isso é reflexo de um mercado que ficou mais complexo e exige{" "}
              <strong className="text-white">gestão de verdade</strong>.{" "}
              <span className="grad-text font-semibold">A boa notícia: tem solução.</span>
            </p>
            <CtaButton label="Quero a solução →" className="px-6 py-3 text-sm flex-shrink-0" />
          </div>
        </div>
      </section>

      {/* ── BREAK BELIEF ────────────────────────────────────── */}
      <section className="py-20 bg-navy">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-poppins text-[0.68rem] font-bold tracking-[0.16em] uppercase text-[#2bbfa0] mb-3">
            A Virada
          </p>
          <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white mb-6 max-w-xl">
            O problema não é técnico.{" "}
            <span className="grad-text">É gestão.</span>
          </h2>
          <p className="text-white/55 max-w-lg mb-8 leading-relaxed">
            Durante anos, ser bom tecnicamente sustentava uma contabilidade. Hoje isso não é mais suficiente.
            Para crescer de verdade, você precisa dominar quatro pilares:
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            {["Estratégia", "Gestão Financeira", "Processos", "Pessoas"].map((tag) => (
              <span
                key={tag}
                className="font-poppins font-semibold text-sm px-5 py-2 rounded-full text-white border border-white/10"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-white/40 text-sm max-w-md">
            Sem dominar esses pilares, sua empresa trava — mesmo com muito esforço e dedicação.
          </p>
        </div>
      </section>

      {/* ── BIG IDEA ────────────────────────────────────────── */}
      <section className="py-20 bg-navy border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Left */}
            <div>
              <h2 className="font-poppins font-bold text-3xl text-white mb-5 leading-snug">
                O Clube da Performance não é mais um curso.{" "}
                <span className="grad-text">É uma jornada de gestão.</span>
              </h2>
              <p className="text-white/55 text-sm leading-relaxed mb-6">
                Essa mentoria foi criada a partir da vivência real no mercado contábil — não de teoria. Aqui você não vai encontrar fórmula mágica nem conteúdo genérico. Vai encontrar reflexão prática, aplicação real e evolução contínua do seu negócio.
              </p>
              <CtaButton label="Quero entrar →" className="px-8 py-3.5 text-sm" />
            </div>
            {/* Right */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white/[0.04] border border-white/8 rounded-xl p-6">
                <p className="font-poppins font-bold text-xs uppercase tracking-widest text-red-400 mb-4">
                  ✗ Você não vai encontrar
                </p>
                <ul className="flex flex-col gap-2.5 text-sm text-white/50">
                  {["Fórmula mágica ou atalho", '"Aperta botão e resolve"', "Conteúdo genérico sem aplicação"].map((i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <span className="text-red-400 flex-shrink-0">—</span>{i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/[0.04] border border-white/8 rounded-xl p-6">
                <p className="font-poppins font-bold text-xs uppercase tracking-widest text-[#2bbfa0] mb-4">
                  ✓ Você vai encontrar
                </p>
                <ul className="flex flex-col gap-2.5 text-sm text-white/70">
                  {["Reflexão prática e aplicável", "Aplicação real no seu negócio", "Evolução contínua com método"].map((i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <span className="text-[#3dd63a] flex-shrink-0">✓</span>{i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PILLARS ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-poppins text-[0.68rem] font-bold tracking-[0.16em] uppercase text-[#2bbfa0] mb-3">
            O Método
          </p>
          <h2 className="font-poppins font-bold text-3xl text-navy mb-10">
            Você vai evoluir sua contabilidade em{" "}
            <span className="grad-text">4 dimensões</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PILLARS.map((p) => (
              <div key={p.num} className="bg-white border border-gray-100 rounded-xl px-6 py-7 relative overflow-hidden shadow-sm">
                <div
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ background: "linear-gradient(90deg, #3dd63a, #29b4f6)" }}
                />
                <p className="font-poppins text-[0.65rem] font-bold text-[#2bbfa0] uppercase tracking-widest mb-3">
                  {p.num}
                </p>
                <h4 className="font-poppins font-bold text-navy text-base mb-2">{p.title}</h4>
                <p className="text-gray-400 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-poppins text-[0.68rem] font-bold tracking-[0.16em] uppercase text-[#2bbfa0] mb-3">
            Como Funciona
          </p>
          <h2 className="font-poppins font-bold text-3xl text-navy mb-10">
            Uma rotina simples, mas{" "}
            <span className="grad-text">poderosa</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Steps */}
            <div className="flex flex-col divide-y divide-gray-200">
              {STEPS.map((s, i) => (
                <div key={s.n} className="flex gap-5 py-6 first:pt-0 last:pb-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-poppins font-bold text-sm flex-shrink-0"
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
            {/* Included card */}
            <div className="bg-navy rounded-2xl p-8 flex flex-col">
              <div
                className="h-0.5 w-12 mb-6"
                style={{ background: "linear-gradient(90deg, #3dd63a, #29b4f6)" }}
              />
              <p className="font-poppins font-bold text-xs uppercase tracking-widest text-[#2bbfa0] mb-4">
                Tudo que está incluído
              </p>
              <ul className="flex flex-col gap-3 flex-1">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-white/65 items-start">
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-bold text-navy"
                      style={{ background: "linear-gradient(135deg, #3dd63a, #29b4f6)" }}
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <CtaButton
                label="Quero participar →"
                className="mt-8 py-3.5 text-sm w-full text-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR WHO ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-poppins font-bold text-3xl text-navy mb-10">
            Essa mentoria é pra <span className="grad-text">você?</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-7">
              <h4 className="font-poppins font-bold text-xs uppercase tracking-widest text-green-500 mb-5">
                Para quem é
              </h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-600">
                {[
                  "Donos de contabilidade com até 10 colaboradores",
                  "Quem quer estruturar a empresa de verdade",
                  "Quem sente que está perdido no crescimento",
                  "Quem quer sair do operacional definitivamente",
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
                Para quem não é
              </h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-600">
                {[
                  "Quem busca solução mágica ou atalho rápido",
                  "Quem não quer executar o que for discutido",
                  "Quem quer só mais conteúdo técnico contábil",
                  "Quem não está disposto a mudar a forma de gerir",
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

      {/* ── MENTORS ─────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-poppins text-[0.68rem] font-bold tracking-[0.16em] uppercase text-[#2bbfa0] mb-3">
            Os Mentores
          </p>
          <h2 className="font-poppins font-bold text-3xl text-navy mb-10">
            Os mentores do{" "}
            <span className="grad-text">Clube da Performance</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {MENTORS.map((m) => (
              <div key={m.name} className="bg-white border border-gray-100 rounded-2xl overflow-hidden text-center shadow-sm">
                <div
                  className="relative w-full"
                  style={{
                    aspectRatio: "4/3.8",
                    background: "linear-gradient(160deg, #3dd63a 0%, #2bbfa0 50%, #29b4f6 100%)",
                  }}
                >
                  <Image
                    src={m.img}
                    alt={m.name}
                    fill
                    className="object-cover object-top"
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

      {/* ── AUTHORITY / STATS ───────────────────────────────── */}
      <section className="py-20 bg-navy">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <p className="font-poppins text-[0.68rem] font-bold tracking-[0.16em] uppercase text-[#2bbfa0] mb-3">
                Sobre Nós
              </p>
              <h2 className="font-poppins font-bold text-3xl text-white mb-5 leading-snug">
                Sevilha Performance:{" "}
                <span className="grad-text">especialistas em contabilidade</span>
              </h2>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                A Sevilha Performance nasceu da experiência prática no mercado contábil. Ao longo de décadas, nossos mentores acompanharam centenas de escritórios — entendendo de perto as dores, os gargalos e o que realmente funciona para crescer com solidez.
              </p>
              {/* Stats */}
              <div className="flex gap-8 flex-wrap">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div
                      className="font-poppins font-extrabold text-4xl mb-1"
                      style={{
                        background: "linear-gradient(135deg, #3dd63a, #29b4f6)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {s.value}
                    </div>
                    <div className="text-white/40 text-xs">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right */}
            <div className="flex flex-col items-center gap-6">
              <div
                className="rounded-2xl p-8 w-full max-w-xs flex flex-col items-center gap-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <LogoMark size={56} />
                <div className="text-center">
                  <div className="font-poppins font-bold text-white text-lg">Sevilha Performance</div>
                  <div className="text-white/40 text-xs mt-1">Clube da Performance</div>
                </div>
                <p className="text-white/40 text-xs text-center leading-relaxed">
                  Mentoria baseada em resultado real no mercado contábil
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="font-poppins text-[0.68rem] font-bold tracking-[0.16em] uppercase text-[#2bbfa0] mb-3">
            Por que agora
          </p>
          <h2 className="font-poppins font-bold text-3xl md:text-4xl text-navy mb-5 leading-snug">
            Comece agora — e evolua sua contabilidade{" "}
            <span className="grad-text">com método</span>
          </h2>
          <p className="text-gray-500 text-base mb-10 max-w-lg mx-auto">
            Você pode continuar tentando sozinho… ou acelerar seu caminho com quem já vive isso há anos.
          </p>
          <CtaButton
            label="QUERO ENTRAR PARA O CLUBE DA PERFORMANCE"
            className="px-10 py-4 text-sm tracking-wide"
          />
          <p className="text-gray-300 text-xs mt-4">
            Sem fidelidade. Vagas abertas em 09/04 às 16h.
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-navy py-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <LogoMark size={28} />
          <div className="font-poppins text-left">
            <div className="font-bold text-white text-sm">Sevilha Performance</div>
            <div className="text-white/30 text-xs">© 2025 · Todos os direitos reservados</div>
          </div>
        </div>
        <p className="text-white/25 text-xs">
          Clube da Performance · Uma iniciativa Sevilha Performance
        </p>
      </footer>
    </>
  );
}
