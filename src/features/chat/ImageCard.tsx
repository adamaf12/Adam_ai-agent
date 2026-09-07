import React, { useState, useEffect, useRef } from 'react';
import { Download, ExternalLink, RefreshCw, AlertCircle, Sparkles, Copy, Check, ChevronDown, ChevronUp, Maximize2, X, Zap } from 'lucide-react';

export interface ImageCardProps {
  imageUrl: string;
  enhancedPrompt?: string;
  originalPrompt?: string;
  title?: string;
  aspectRatio?: string;
  engine?: string;
  language?: 'ar' | 'en';
}

function cleanPromptForUrl(prompt: string, maxLen = 650): string {
  if (!prompt) return '8k cinematic masterpiece photorealistic 85mm lens volumetric lighting';
  return prompt
    .replace(/:::[\s\S]*?:::/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/[^\p{L}\p{N}\s,.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function buildSpeedCandidates(
  rawUrl: string,
  prompt: string,
  seed: number,
  aspectRatio = '1:1',
  mode: 'flux' | 'turbo' = 'flux'
): string[] {
  if (rawUrl && rawUrl.startsWith('data:')) {
    return [rawUrl];
  }

  const cleanPrompt = cleanPromptForUrl(prompt, 650);
  const encodedFull = encodeURIComponent(cleanPrompt);

  let width = 1024;
  let height = 1024;
  if (aspectRatio === '16:9') {
    width = 1344;
    height = 768;
  } else if (aspectRatio === '9:16') {
    width = 768;
    height = 1344;
  } else if (aspectRatio === '4:3') {
    width = 1152;
    height = 864;
  }

  const urls: string[] = [];

  if (mode === 'turbo') {
    // Ultra-Fast Turbo Engine (1-2s response)
    urls.push(`https://pollinations.ai/p/${encodedFull}?width=${width}&height=${height}&model=turbo&nologo=true&seed=${seed}`);
    urls.push(`https://image.pollinations.ai/prompt/${encodedFull}?width=${width}&height=${height}&model=turbo&nologo=true&seed=${seed}`);
    urls.push(`https://pollinations.ai/p/${encodedFull}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`);
  } else {
    // Primary Flux.1 High-Performance HD Engine
    if (rawUrl) {
      urls.push(rawUrl);
    }
    urls.push(`https://pollinations.ai/p/${encodedFull}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`);
    urls.push(`https://image.pollinations.ai/prompt/${encodedFull}?width=${width}&height=${height}&model=turbo&nologo=true&seed=${seed}`);
  }

  return Array.from(new Set(urls.filter(Boolean)));
}

export function ImageCard({
  imageUrl,
  enhancedPrompt,
  originalPrompt,
  title,
  aspectRatio = '1:1',
  engine = 'Flux.1 High-Performance Engine',
  language = 'ar',
}: ImageCardProps) {
  const isAr = language === 'ar';
  const displayTitle = title || originalPrompt || (isAr ? 'صورة فائقة الدقة (Flux.1)' : 'Flux.1 Masterpiece');
  const displayPrompt = enhancedPrompt || originalPrompt || '';

  const [speedMode, setSpeedMode] = useState<'flux' | 'turbo'>('flux');
  const [seed, setSeed] = useState(() => Date.now());
  const [candidates, setCandidates] = useState<string[]>(() => buildSpeedCandidates(imageUrl, displayPrompt, Date.now(), aspectRatio, 'flux'));
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const freshSeed = Date.now();
    setSeed(freshSeed);
    const newCandidates = buildSpeedCandidates(imageUrl, displayPrompt, freshSeed, aspectRatio, speedMode);
    setCandidates(newCandidates);
    setCandidateIndex(0);
    setLoaded(false);
    setError(false);

    // Instant prefetch in browser cache
    if (newCandidates[0]) {
      const preloadImg = new Image();
      preloadImg.src = newCandidates[0];
    }
  }, [imageUrl, displayPrompt, aspectRatio, speedMode]);

  const currentUrl = candidates[candidateIndex] || candidates[0] || '';

  const handleSwitchMode = (newMode: 'flux' | 'turbo') => {
    if (newMode === speedMode) return;
    setSpeedMode(newMode);
    setLoaded(false);
    setError(false);
    const nextSeed = Date.now() + Math.floor(Math.random() * 100);
    setSeed(nextSeed);
    const nextCandidates = buildSpeedCandidates(imageUrl, displayPrompt, nextSeed, aspectRatio, newMode);
    setCandidates(nextCandidates);
    setCandidateIndex(0);
  };

  const handleRetry = () => {
    setError(false);
    setLoaded(false);
    const nextSeed = Date.now() + Math.floor(Math.random() * 1000);
    setSeed(nextSeed);
    const nextCandidates = buildSpeedCandidates(imageUrl, displayPrompt, nextSeed, aspectRatio, speedMode);
    setCandidates(nextCandidates);
    setCandidateIndex(0);
  };

  const handleError = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex(prev => prev + 1);
    } else {
      setError(true);
      setLoaded(true);
    }
  };

  const handleCopyPrompt = () => {
    if (!displayPrompt) return;
    navigator.clipboard?.writeText(displayPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDownloading) return;

    if (currentUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = currentUrl;
      a.download = `adem_${speedMode}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    setIsDownloading(true);
    try {
      const res = await fetch(currentUrl, { mode: 'cors' });
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `adem_${speedMode}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
    } catch {
      window.open(currentUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // Determine container aspect ratio style
  const aspectClass = aspectRatio === '16:9'
    ? 'aspect-[16/9]'
    : aspectRatio === '9:16'
    ? 'aspect-[9/16]'
    : aspectRatio === '4:3'
    ? 'aspect-[4/3]'
    : 'aspect-square';

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/95 shadow-2xl transition duration-300 ring-1 ring-white/5">
      {/* Top Header with Speed & Quality Badges */}
      <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Mode Switcher Pill */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => handleSwitchMode('flux')}
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium transition flex items-center gap-1 ${
                speedMode === 'flux'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={10} className={speedMode === 'flux' ? 'text-cyan-400' : 'text-slate-500'} />
              <span>Flux.1 HD</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('turbo')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition flex items-center gap-1 ${
                speedMode === 'turbo'
                  ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap size={10} className={speedMode === 'turbo' ? 'text-amber-400 fill-amber-400' : 'text-slate-500'} />
              <span>{isAr ? 'فائق السرعة (Turbo)' : 'Turbo 1s'}</span>
            </button>
          </div>

          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 text-[10px] font-mono hidden sm:inline-block">
            8K UHD
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">
            {aspectRatio}
          </span>
        </div>
      </div>

      {/* Image Stage with Loading Shimmer */}
      <div className={`relative w-full ${aspectClass} bg-slate-950 flex items-center justify-center overflow-hidden group`}>
        {/* Animated Loading Shimmer & Spinner */}
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/95 text-slate-300 gap-3 z-10">
            {/* Shimmer Wave Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Zap size={18} className="absolute text-cyan-400" />
            </div>
            <div className="text-center z-10">
              <p className="text-xs font-medium text-slate-200">
                {speedMode === 'turbo'
                  ? (isAr ? 'توليد فوري فائق السرعة عبر Turbo...' : 'Instant Turbo Generation in progress...')
                  : (isAr ? 'جاري رسم وتوليد الصورة بدقة 8K...' : 'Rendering 8K Cinematic Masterpiece...')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr ? 'محرك Flux.1 فائق الأداء • عدسة 85mm • إضاءة فيزيائية' : 'Flux.1 Engine • 85mm f/1.8 Optics • Volumetric Lighting'}
              </p>
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950 text-slate-300">
            <AlertCircle size={28} className="text-rose-400" />
            <p className="text-xs text-slate-300">
              {isAr ? 'تعذر تحميل الصورة من المحرك الحالي' : 'Failed to load image from engine'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/20"
              >
                <RefreshCw size={13} />
                <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
              </button>
              {speedMode !== 'turbo' && (
                <button
                  type="button"
                  onClick={() => handleSwitchMode('turbo')}
                  className="px-4 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Zap size={13} />
                  <span>{isAr ? 'تجربة الوضع السريع (Turbo)' : 'Try Turbo Mode'}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <img
              ref={imgRef}
              key={currentUrl}
              src={currentUrl}
              alt={displayTitle}
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onLoad={() => {
                setLoaded(true);
                setError(false);
              }}
              onError={handleError}
              className={`w-full h-full object-cover transition-all duration-300 cursor-pointer ${
                loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              onClick={() => setShowLightbox(true)}
            />
            {/* Quick Hover Overlay */}
            {loaded && (
              <button
                type="button"
                onClick={() => setShowLightbox(true)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md border border-white/10"
                title={isAr ? 'تكبير الصورة' : 'Zoom Image'}
              >
                <Maximize2 size={14} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        <div className="truncate font-medium text-slate-200 max-w-[45%]" title={displayTitle}>
          {displayTitle}
        </div>

        <div className="flex items-center gap-2">
          {displayPrompt && (
            <button
              type="button"
              onClick={() => setShowPrompt(!showPrompt)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer border ${
                showPrompt
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Sparkles size={12} className={showPrompt ? 'text-cyan-400' : 'text-slate-400'} />
              <span>{showPrompt ? (isAr ? 'إخفاء البرومبت' : 'Hide Details') : (isAr ? 'تفاصيل البرومبت' : 'Prompt Details')}</span>
              {showPrompt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}

          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
            title={isAr ? 'فتح في تبويب جديد' : 'Open in new tab'}
          >
            <ExternalLink size={13} />
          </a>

          <button
            type="button"
            onClick={handleDownloadClick}
            disabled={isDownloading}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm cursor-pointer shadow-blue-500/20"
          >
            {isDownloading ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            <span>{isDownloading ? (isAr ? 'جاري التحميل...' : 'Downloading...') : (isAr ? 'تحميل الصورة' : 'Download')}</span>
          </button>
        </div>
      </div>

      {/* Expanded Prompt Details Panel */}
      {showPrompt && displayPrompt && (
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300 text-[11px]">
                {isAr ? 'البرومبت السينمائي الموسّع بالذكاء الاصطناعي (8K Enriched Prompt):' : 'AI Enriched Cinematic 8K Prompt:'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ البرومبت' : 'Copy Prompt')}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-300 font-mono leading-relaxed bg-slate-900/90 p-3 rounded-xl border border-slate-800 select-all" dir="ltr">
            {displayPrompt}
          </p>

          {originalPrompt && originalPrompt !== displayPrompt && (
            <div className="text-[11px] text-slate-400 pt-1">
              <span className="font-medium text-slate-500">{isAr ? 'الطلب الأصلي للمستخدم: ' : 'Original User Request: '}</span>
              <span className="text-slate-300">{originalPrompt}</span>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition z-10"
          >
            <X size={20} />
          </button>
          <img
            src={currentUrl}
            alt={displayTitle}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

