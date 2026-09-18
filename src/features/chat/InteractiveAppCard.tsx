import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Code2,
  Download,
  ExternalLink,
  Sparkles,
  Gamepad2,
  Calculator,
  Laptop
} from 'lucide-react';
import type { Language, ViewId } from '../../core/domain';

interface InteractiveAppCardProps {
  title?: string;
  code: string;
  category?: 'game' | 'app' | 'tool';
  language?: Language;
  onOpenSandbox?: (appId?: string) => void;
  onNavigateView?: (view: ViewId, extraParam?: string) => void;
  appId?: string;
}

export function InteractiveAppCard({
  title,
  code,
  category = 'app',
  language = 'ar',
  onOpenSandbox,
  onNavigateView,
  appId,
}: InteractiveAppCardProps) {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'live' | 'code'>('live');
  const [isExpanded, setIsExpanded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const displayTitle = title || (
    category === 'game'
      ? (isAr ? 'لعبة تفاعلية حية (Interactive Game)' : 'Interactive Canvas Game')
      : code.toLowerCase().includes('calculator') || code.includes('حاسبة')
      ? (isAr ? 'الآلة الحاسبة الذكية التفاعلية (Smart Calculator)' : 'Smart Interactive Calculator')
      : (isAr ? 'تطبيق تفاعلي حي (Interactive Live App)' : 'Interactive Web Application')
  );

  const isCalculator = code.toLowerCase().includes('calculator') || code.includes('حاسبة');
  const isGame = category === 'game' || code.toLowerCase().includes('canvas') || code.includes('game');

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(displayTitle || 'app').replace(/\s+/g, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReload = () => {
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className="my-3 rounded-2xl border border-emerald-500/40 bg-slate-950/95 shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300">
      {/* Top Bar / Header */}
      <div className="p-3 sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-b border-emerald-500/30 flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
            {isCalculator ? (
              <Calculator size={18} />
            ) : isGame ? (
              <Gamepad2 size={18} />
            ) : (
              <Sparkles size={18} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                {displayTitle}
              </h4>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {isAr ? 'تفاعلي وحساب مباشر' : 'Live & Interactive'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {isAr
                ? 'أزرار استجابة فورية، حسابات دقيقة، وعناصر تحكم باللمس والمفاتيح'
                : 'Instant tactile feedback, accurate calculations & touch/keyboard ready'}
            </div>
          </div>
        </div>

        {/* View Switcher & Action Tools */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play size={12} />
              <span>{isAr ? 'التشغيل الحي' : 'Live App'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 size={12} />
              <span>{isAr ? 'الشفرة' : 'Code'}</span>
            </button>
          </div>

          {/* Reload State Button */}
          {activeTab === 'live' && (
            <button
              type="button"
              onClick={handleReload}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-colors cursor-pointer"
              title={isAr ? 'إعادة ضبط وتشغيل الحالة' : 'Reset / Reload state'}
            >
              <RotateCcw size={14} />
            </button>
          )}

          {/* Expand Height Toggle */}
          {activeTab === 'live' && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-colors cursor-pointer"
              title={isExpanded ? (isAr ? 'تصغير' : 'Collapse') : (isAr ? 'توسيع الإطار' : 'Expand')}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}

          {/* Download HTML Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-colors cursor-pointer"
            title={isAr ? 'تحميل كملف HTML مستقل' : 'Download HTML'}
          >
            <Download size={14} />
          </button>

          {/* Dedicated Studio Launcher */}
          {(onOpenSandbox || onNavigateView) && (
            <button
              type="button"
              onClick={() => {
                if (onOpenSandbox) {
                  onOpenSandbox(appId);
                } else if (onNavigateView) {
                  onNavigateView('apps', appId);
                }
              }}
              className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title={isAr ? 'فتح في استوديو التطبيقات المستقل' : 'Open in Sandbox Studio'}
            >
              <ExternalLink size={12} />
              <span className="hidden sm:inline">{isAr ? 'استوديو التطبيقات' : 'Studio'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Live Interactive Frame OR Code */}
      <div className="relative bg-slate-950">
        {activeTab === 'live' ? (
          <div
            className={`w-full transition-all duration-300 relative ${
              isExpanded ? 'h-[620px]' : 'h-[460px]'
            }`}
          >
            <iframe
              key={reloadKey}
              ref={iframeRef}
              srcDoc={code}
              title={displayTitle}
              sandbox="allow-scripts allow-forms allow-modals allow-pointer-lock allow-downloads"
              className="w-full h-full border-0 bg-transparent"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="p-3 sm:p-4 bg-slate-950">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
              <span className="font-mono text-emerald-400 font-bold">HTML5 / JavaScript / CSS3</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="hover:text-slate-200 flex items-center gap-1 font-sans text-xs"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الكود' : 'Copy Code')}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono overflow-x-auto max-h-[420px] leading-relaxed select-text">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Interactive Helper Footer */}
      <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Laptop size={13} className="text-emerald-400" />
          <span>
            {isCalculator
              ? (isAr ? '💡 جرب النقر على الأزرار مباشرة أو استخدام لوحة المفاتيح لإجراء الحسابات' : '💡 Click buttons or use your keyboard to calculate in real time')
              : isGame
              ? (isAr ? '🎮 استخدم أزرار الشاشة أو الأسهم في لوحة المفاتيح للعب' : '🎮 Use on-screen touch buttons or arrow keys to play')
              : (isAr ? '⚡ التطبيق يعمل تفاعلياً ومباشراً داخل المحادثة' : '⚡ Runs interactively inside chat')}
          </span>
        </span>
        <span className="font-mono text-[10px] text-slate-500">
          {(new Blob([code]).size / 1024).toFixed(1)} KB
        </span>
      </div>
    </div>
  );
}
