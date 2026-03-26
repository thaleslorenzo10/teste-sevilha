export function LogoMark({ size = 38 }: { size?: number }) {
  const h = (size / 38) * 46;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 60 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGrad" x1="30" y1="0" x2="30" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3dd63a" />
          <stop offset="45%" stopColor="#2bbfa0" />
          <stop offset="100%" stopColor="#29b4f6" />
        </linearGradient>
      </defs>
      <path d="M8,38 C8,16 28,4 48,8"    stroke="url(#logoGrad)" strokeWidth="5.5" fill="none" strokeLinecap="round" />
      <path d="M14,38 C14,20 30,11 46,14" stroke="url(#logoGrad)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M20,38 C20,24 32,18 44,21" stroke="url(#logoGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M52,34 C52,56 32,68 12,64" stroke="url(#logoGrad)" strokeWidth="5.5" fill="none" strokeLinecap="round" />
      <path d="M46,34 C46,52 30,61 14,58" stroke="url(#logoGrad)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M40,34 C40,48 28,54 16,51" stroke="url(#logoGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={38} />
      <div className="font-poppins">
        <div className="font-bold text-[1.05rem] text-navy leading-tight">
          Sevilha Performance
        </div>
        <div className="text-[0.72rem] text-gray-400 leading-tight">
          Clube da Performance
        </div>
      </div>
    </div>
  );
}
