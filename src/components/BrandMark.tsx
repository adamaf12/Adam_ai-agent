import { Sparkles } from 'lucide-react';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none group" aria-label="ADEM Executive AI">
      <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-[var(--accent-contrast)] shadow-md shadow-[var(--accent-glow)] transition-transform duration-300 group-hover:scale-105">
        <Sparkles size={16} className="fill-current animate-pulse" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--surface)]" />
      </div>
      {!compact && (
        <div className="flex flex-col text-start">
          <span className="text-sm font-black tracking-widest text-[var(--text)] font-mono leading-none">
            ADEM
          </span>
          <span className="text-[9px] text-[var(--muted)] font-semibold uppercase tracking-wider mt-0.5">
            Executive AI
          </span>
        </div>
      )}
    </div>
  );
}
