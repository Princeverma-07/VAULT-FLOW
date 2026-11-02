import React from 'react';

interface MoneyMaxLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export const MoneyMaxLogo: React.FC<MoneyMaxLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}) => {
  const iconDimensions = {
    sm: { box: 26, stroke: 2.2, icon: 16 },
    md: { box: 34, stroke: 2.5, icon: 20 },
    lg: { box: 44, stroke: 2.8, icon: 26 },
    xl: { box: 56, stroke: 3.2, icon: 34 },
  }[size];

  const textSizeClasses = {
    sm: 'text-sm tracking-tight',
    md: 'text-base tracking-tight',
    lg: 'text-xl tracking-tight',
    xl: 'text-2xl tracking-tighter',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Premium Geometric Icon Mark */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-sm shadow-emerald-700/20 transition-transform hover:scale-105 active:scale-95"
        style={{
          width: `${iconDimensions.box}px`,
          height: `${iconDimensions.box}px`,
        }}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="mmBgGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#047857" />
              <stop offset="100%" stopColor="#065f46" />
            </linearGradient>
            <linearGradient id="mmMGrad" x1="10" y1="12" x2="30" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d1fae5" />
            </linearGradient>
            <linearGradient id="mmPeakGrad" x1="20" y1="8" x2="26" y2="15" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Deep Emerald Background with Subtle Inner Border */}
          <rect width="40" height="40" rx="11" fill="url(#mmBgGrad)" />
          <rect
            x="0.75"
            y="0.75"
            width="38.5"
            height="38.5"
            rx="10.25"
            stroke="white"
            strokeOpacity="0.22"
            strokeWidth="1.5"
          />

          {/* Dynamic Geometric 'M' with ascending MAX trajectory */}
          {/* Left Wing */}
          <path
            d="M10 27V14.5C10 13.67 10.67 13 11.5 13H12.8L18.4 21.8C19.15 22.95 20.85 22.95 21.6 21.8L27.2 13H28.5C29.33 13 30 13.67 30 14.5V27"
            stroke="url(#mmMGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Center Max Growth Surge Arrow (represents 'MAX' maximization) */}
          <path
            d="M20 9L23.8 13.5H16.2L20 9Z"
            fill="url(#mmPeakGrad)"
          />

          {/* Center INR Financial Precision Accent */}
          <circle cx="20" cy="26" r="1.4" fill="#a7f3d0" />
        </svg>
      </div>

      {/* Stylized Brand Typography */}
      {showText && (
        <div className={`flex items-baseline font-black leading-none ${textSizeClasses} ${textClassName}`}>
          <span className="text-slate-900 dark:text-white font-extrabold tracking-tight">
            MONEY
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-black tracking-wider ml-0.5">
            MAX
          </span>
        </div>
      )}
    </div>
  );
};
