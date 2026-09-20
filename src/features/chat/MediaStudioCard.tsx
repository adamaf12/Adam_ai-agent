import { useState } from 'react';
import { Check, Copy, Download, Eye, Palette, Play, Sparkles, Box, Compass } from 'lucide-react';
import type { ViewId } from '../../core/domain';

export interface MediaPaletteItem {
  name: string;
  hex: string;
  role?: string;
}

export interface MediaCardPayload {
  type: 'palette' | 'svg_vector' | 'prompt_craft' | 'asset_3d';
  title: string;
  palette?: MediaPaletteItem[];
  svgCode?: string;
  midjourneyPrompt?: string;
  negativePrompt?: string;
  aspectRatio?: string;
  description?: string;
  threeSpecs?: {
    geometry: string;
    material: string;
    lighting: string;
  };
}

interface MediaStudioCardProps {
  payload: MediaCardPayload;
  language: 'ar' | 'en';
  onRunPrompt?: (prompt: string) => void;
  onNavigateView?: (view: ViewId) => void;
}

export function MediaStudioCard({
  payload,
  language,
  onRunPrompt,
  onNavigateView,
}: MediaStudioCardProps) {
  const isAr = language === 'ar';
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDownloadSvg = () => {
    if (!payload.svgCode) return;
    const blob = new Blob([payload.svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${payload.title.toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'vector'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-3 rounded-2xl border border-purple-500/30 bg-slate-950/85 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border-b border-purple-500/25 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
            {payload.type === 'palette' && <Palette size={14} />}
            {payload.type === 'svg_vector' && <Compass size={14} />}
            {payload.type === 'asset_3d' && <Box size={14} />}
            {payload.type === 'prompt_craft' && <Sparkles size={14} />}
          </div>
          <div>
            <span className="font-bold text-slate-100">{payload.title}</span>
            <div className="text-[10px] text-purple-400 flex items-center gap-1">
              <span>{isAr ? 'محرك استوديو الميديا والمرئيات الذكي' : 'ADEM Visual & Media Engine'}</span>
            </div>
          </div>
        </div>

        {onNavigateView && (
          <button
            type="button"
            onClick={() => onNavigateView('media')}
            className="text-[11px] px-2.5 py-1 rounded-full bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-all cursor-pointer"
          >
            {isAr ? 'فتح الاستوديو ↗' : 'Open Studio ↗'}
          </button>
        )}
      </div>

      <div className="p-4 space-y-3.5">
        {payload.description && (
          <p className="text-xs text-slate-300 leading-relaxed">
            {payload.description}
          </p>
        )}

        {/* 1. PALETTE DISPLAY */}
        {payload.palette && payload.palette.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block">
              {isAr ? 'لوحة الألوان المستخرجة (انقر للنسخ):' : 'Extracted Color Palette (Click to copy):'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {payload.palette.map((c, idx) => {
                const isCopied = copiedText === `color-${idx}`;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCopy(c.hex, `color-${idx}`)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-left rtl:text-right transition-all group cursor-pointer"
                  >
                    <div
                      className="w-full h-8 rounded-lg mb-1.5 shadow-inner border border-white/10"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-slate-200">{c.hex}</span>
                      {isCopied ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} className="text-slate-500 group-hover:text-purple-400" />
                      )}
                    </div>
                    {c.name && (
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{c.name}</div>
                    )}
                    {c.role && (
                      <div className="text-[9px] text-purple-400/80 truncate">{c.role}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. SVG VECTOR PREVIEW */}
        {payload.svgCode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold flex items-center gap-1.5">
                <Eye size={13} className="text-purple-400" />
                <span>{isAr ? 'معاينة الرسم المتجهي الحي (SVG Vector):' : 'Live Vector Preview (SVG):'}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(payload.svgCode || '', 'svg-code')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedText === 'svg-code' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{isAr ? 'نسخ الكود' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Download size={12} />
                  <span>{isAr ? 'تحميل SVG' : 'Download'}</span>
                </button>
              </div>
            </div>

            {/* Rendered SVG container */}
            <div
              className="w-full min-h-[140px] max-h-[260px] p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center overflow-hidden [&>svg]:max-h-56 [&>svg]:w-auto [&>svg]:mx-auto"
              dangerouslySetInnerHTML={{ __html: payload.svgCode }}
            />
          </div>
        )}

        {/* 3. PROMPT CRAFT (Midjourney / SD3) */}
        {payload.midjourneyPrompt && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block">
              {isAr ? 'موجه Midjourney v6 / Flux السينمائي المحسن:' : 'Enhanced Midjourney v6 / Flux Prompt:'}
            </span>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 relative group">
              <pre className="whitespace-pre-wrap select-all font-sans text-xs pr-12 rtl:pr-0 rtl:pl-12">
                {payload.midjourneyPrompt}
              </pre>
              <div className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(payload.midjourneyPrompt || '', 'mj-prompt')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title={isAr ? 'نسخ الموجه' : 'Copy prompt'}
                >
                  {copiedText === 'mj-prompt' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
                {onRunPrompt && (
                  <button
                    type="button"
                    onClick={() => onRunPrompt(`ولد لي صورة: ${payload.midjourneyPrompt}`)}
                    className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors cursor-pointer"
                    title={isAr ? 'توليد الصورة فوراً' : 'Generate image now'}
                  >
                    <Play size={13} fill="currentColor" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. 3D ASSETS SPECS */}
        {payload.threeSpecs && (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
            <div className="font-semibold text-purple-400 flex items-center gap-1.5">
              <Box size={14} />
              <span>{isAr ? 'مواصفات المجسم ثلاثي الأبعاد (Three.js / OBJ):' : '3D Geometry & Material Specs:'}</span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div><strong>Geometry:</strong> {payload.threeSpecs.geometry}</div>
              <div><strong>Material:</strong> {payload.threeSpecs.material}</div>
              <div><strong>Lighting:</strong> {payload.threeSpecs.lighting}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
