import React from 'react';
import { LoaderCircle, Sparkles, Image as ImageIcon, Wand2 } from 'lucide-react';

export function StreamingIndicator({
  label,
  isImage,
  language = 'ar',
  prompt,
}: {
  label: string;
  isImage?: boolean;
  language?: 'ar' | 'en';
  prompt?: string;
}) {
  const isAr = language === 'ar';

  if (isImage) {
    return (
      <div className="message-row" role="status" aria-live="polite">
        <div className="message-avatar">
          <Sparkles size={16} className="text-indigo-400 animate-pulse" />
        </div>
        <div className="message-body w-full max-w-lg">
          <div className="message-meta">
            <span>Adam AI Vision</span>
            <span className="text-xs text-indigo-400 font-medium animate-pulse">
              {isAr ? 'جاري التوليد…' : 'Generating…'}
            </span>
          </div>
          
          <div className="my-2 rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-950/90 shadow-2xl relative">
            {/* Shimmer Placeholder Box */}
            <div className="w-full aspect-video relative flex flex-col items-center justify-center p-6 text-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950">
              {/* Animated Light Sweep Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
                  <ImageIcon size={24} className="animate-bounce" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white">
                    <Wand2 size={13} className="text-emerald-400" />
                    <span>{isAr ? 'جاري بناء المشهد البصري بدقة 8K' : 'Synthesizing 8K Photorealistic Frame'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs truncate font-mono">
                    {prompt || (isAr ? 'معالجة البرومبت وتوزيع الإضاءة السينمائية…' : 'Processing lighting and camera optics…')}
                  </p>
                </div>

                {/* Progress bar pulse */}
                <div className="w-48 bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 h-full w-full animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <LoaderCircle size={13} className="animate-spin text-indigo-400" />
                {label}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                FLUX ULTRA HD
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="streaming">
      <LoaderCircle size={15} className="spin" />
      <span>{label}</span>
    </div>
  );
}
