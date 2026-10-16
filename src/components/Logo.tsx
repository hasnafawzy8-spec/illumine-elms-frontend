interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

export default function Logo({ size = 'md', variant = 'full', className = '' }: LogoProps) {
  const iconSizes = { sm: 28, md: 40, lg: 64 };
  const s = iconSizes[size];
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' };
  const subSizes = { sm: 'text-[9px]', md: 'text-[10px]', lg: 'text-sm' };

  const shield = (
    <svg width={s} height={s} viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield outline */}
      <path d="M50 4 L92 20 L92 58 C92 80 72 98 50 106 C28 98 8 80 8 58 L8 20 Z" fill="white" stroke="#1E6BB8" strokeWidth="4"/>
      {/* Globe grid lines */}
      <ellipse cx="50" cy="42" rx="30" ry="30" stroke="#1E6BB8" strokeWidth="2.5" fill="none"/>
      <ellipse cx="50" cy="42" rx="14" ry="30" stroke="#1E6BB8" strokeWidth="1.5" fill="none"/>
      <line x1="20" y1="42" x2="80" y2="42" stroke="#1E6BB8" strokeWidth="1.5"/>
      <line x1="23" y1="28" x2="77" y2="28" stroke="#1E6BB8" strokeWidth="1.5"/>
      <line x1="23" y1="56" x2="77" y2="56" stroke="#1E6BB8" strokeWidth="1.5"/>
      {/* Center figure - red */}
      <circle cx="50" cy="50" r="5" fill="#D42B2B"/>
      <path d="M42 72 Q50 62 58 72" stroke="#D42B2B" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <line x1="50" y1="55" x2="50" y2="68" stroke="#D42B2B" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="50" y1="60" x2="42" y2="66" stroke="#D42B2B" strokeWidth="3" strokeLinecap="round"/>
      <line x1="50" y1="60" x2="58" y2="66" stroke="#D42B2B" strokeWidth="3" strokeLinecap="round"/>
      {/* Left figure - amber */}
      <circle cx="30" cy="52" r="4" fill="#1A1A2E"/>
      <path d="M24 70 Q30 62 36 70" stroke="#C2660A" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <line x1="30" y1="56" x2="30" y2="67" stroke="#C2660A" strokeWidth="3" strokeLinecap="round"/>
      {/* Right figure - amber */}
      <circle cx="70" cy="52" r="4" fill="#1A1A2E"/>
      <path d="M64 70 Q70 62 76 70" stroke="#C2660A" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <line x1="70" y1="56" x2="70" y2="67" stroke="#C2660A" strokeWidth="3" strokeLinecap="round"/>
      {/* Banner at top */}
      <path d="M18 18 Q50 10 82 18 L80 26 Q50 18 20 26 Z" fill="white" stroke="#1E6BB8" strokeWidth="2"/>
      <text x="50" y="24" textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="8" fill="#1E6BB8">ILLUMINE</text>
    </svg>
  );

  if (variant === 'icon') return <div className={className}>{shield}</div>;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {shield}
      <div className="flex flex-col leading-tight">
        <span className={`font-bold text-[#1E6BB8] tracking-wide font-display ${textSizes[size]}`}>ILLUMINE</span>
        <span className={`text-slate-500 tracking-widest font-body uppercase ${subSizes[size]}`}>English Institute</span>
      </div>
    </div>
  );
}
