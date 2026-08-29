export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="Adam AI Agent"><span className="brand-mark">A</span><span className="brand-word">Adam</span></div>;
}
