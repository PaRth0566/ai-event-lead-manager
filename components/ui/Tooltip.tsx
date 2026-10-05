import React from 'react';

export interface TooltipProps {
  /** Simple single-line text mode */
  label?: string;
  /** Rich multi-line insight content (use variant="rich") */
  content?: React.ReactNode;
  side?: 'top' | 'bottom';
  align?: 'left' | 'center' | 'right';
  /** 'rich' renders a wide insight card with an arrow instead of a compact label */
  variant?: 'default' | 'rich';
  className?: string;
  children: React.ReactNode;
}

/**
 * Lightweight CSS-only tooltip with a frosted-glass surface.
 * Reveals on hover and keyboard focus via a named Tailwind group —
 * no positioning JavaScript required.
 */

// Shared glassmorphism surface: translucent gradient + backdrop blur + soft ring
const glassSurface =
  'bg-gradient-to-b from-slate-800/80 to-slate-900/85 backdrop-blur-md ring-1 ring-white/10 shadow-xl shadow-slate-950/25 text-white';

// Smooth entrance: fade + gentle rise + scale, eased in both directions
const glassMotion =
  'transition-all duration-200 ease-out opacity-0 scale-[0.96] group-hover/tt:opacity-100 group-hover/tt:scale-100 group-focus-within/tt:opacity-100 group-focus-within/tt:scale-100';

export function Tooltip({
  label,
  content,
  side = 'top',
  align = 'center',
  variant = 'default',
  className = '',
  children,
}: TooltipProps) {
  const isRich = variant === 'rich' && Boolean(content);

  const posBase = side === 'top' ? 'bottom-full mb-2.5' : 'top-full mt-2.5';
  const xPos =
    align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';
  const slide =
    side === 'top'
      ? 'translate-y-1.5 group-hover/tt:translate-y-0 group-focus-within/tt:translate-y-0'
      : '-translate-y-1.5 group-hover/tt:translate-y-0 group-focus-within/tt:translate-y-0';

  const bubble = isRich
    ? `pointer-events-none absolute z-50 w-72 whitespace-normal rounded-xl p-3 text-left ${glassSurface} ${glassMotion} ${posBase} ${xPos} ${slide}`
    : `pointer-events-none absolute z-50 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium ${glassSurface} ${glassMotion} ${posBase} ${xPos} ${slide}`;

  const arrowAlign =
    align === 'left' ? 'left-3' : align === 'right' ? 'right-3' : 'left-1/2 -translate-x-1/2';
  const arrowPos = side === 'top' ? 'top-full -mt-1' : 'bottom-full -mb-1';

  return (
    <span className={`relative inline-flex group/tt max-w-full ${className}`}>
      {children}
      <span role="tooltip" className={`${bubble}`}>
        {isRich ? content : label}
        <span
          aria-hidden="true"
          className={`absolute h-2 w-2 rotate-45 bg-slate-900/85 backdrop-blur-md ${arrowAlign} ${arrowPos}`}
        />
      </span>
    </span>
  );
}
