import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  X,
  Lock,
  Globe,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface InAppBrowserModalProps {
  language: 'ar' | 'en';
}

export function InAppBrowserModal({ language }: InAppBrowserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isAr = language === 'ar';

  useEffect(() => {
    const handleOpen = (e: CustomEvent<{ url: string; title?: string }>) => {
      if (e.detail?.url) {
        setUrl(e.detail.url);
        setTitle(e.detail.title || new URL(e.detail.url).hostname.replace(/^www\./, ''));
        setIsLoading(true);
        setIsOpen(true);
        setIframeKey((k) => k + 1);
      }
    };

    window.addEventListener('adam_open_inapp_browser' as any, handleOpen);
    return () => {
      window.removeEventListener('adam_open_inapp_browser' as any, handleOpen);
    };
  }, []);

  // Handle hardware back or escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !url) return null;

  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  })();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleOpenExternal = () => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
      }, 150);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-neutral-950/95 backdrop-blur-md animate-in fade-in duration-200"
      style={{ height: '100dvh', width: '100vw' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Mobile Bar */}
      <header className="flex items-center justify-between gap-2 px-3 py-2.5 bg-neutral-900/90 border-b border-neutral-800 text-white shrink-0 select-none">
        {/* Back / Close Action */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-xs font-semibold text-neutral-200 transition-all"
            aria-label={isAr ? 'رجوع للتطبيق' : 'Back to App'}
            title={isAr ? 'رجوع لتطبيق آدم' : 'Back to Adam'}
          >
            {isAr ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span>{isAr ? 'رجوع' : 'Back'}</span>
          </button>
        </div>

        {/* Address / Domain Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/60 max-w-[200px] sm:max-w-xs truncate text-[11px] text-neutral-300 font-mono">
          <Lock size={11} className="text-emerald-400 shrink-0" />
          <span className="truncate">{domain}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleOpenExternal}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-colors"
            title={isAr ? 'فتح في متصفح الهاتف الخارجي' : 'Open in External Browser'}
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">{isAr ? 'فتح بالمتصفح' : 'Browser'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title={isAr ? 'نسخ الرابط' : 'Copy link'}
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          <button
            type="button"
            onClick={handleReload}
            className={`p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors ${isLoading ? 'animate-spin text-emerald-400' : ''}`}
            title={isAr ? 'إعادة تحميل' : 'Reload'}
          >
            <RefreshCw size={14} />
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Safety / Web Compatibility Notice Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-neutral-900/60 border-b border-neutral-800/80 text-[11px] text-neutral-300 shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
          <span className="truncate">
            {isAr
              ? 'وضع التصفح الآمن للهاتف (يمنع خروجك من التطبيق ويحمي جلستك)'
              : 'Safe In-App Mobile Browser (Protects your session)'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleOpenExternal}
          className="text-emerald-400 hover:underline shrink-0 font-medium text-[11px] flex items-center gap-1"
        >
          <Smartphone size={12} />
          <span>{isAr ? 'فتح في تطبيق Chrome' : 'Open in Chrome'}</span>
        </button>
      </div>

      {/* Iframe View Container */}
      <div className="relative flex-1 w-full h-full bg-white overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-white z-10 p-4 text-center">
            <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium text-neutral-200 mb-1">{title || domain}</p>
            <p className="text-xs text-neutral-400 mb-4">
              {isAr ? 'جاري تحميل الموقع الخارجي بأمان...' : 'Loading external site safely...'}
            </p>
            <button
              type="button"
              onClick={handleOpenExternal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <ExternalLink size={14} />
              <span>{isAr ? 'فتح في متصفح خارجي فوراً' : 'Open in browser directly'}</span>
            </button>
          </div>
        )}

        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={url}
          title={title || 'Web View'}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          allow="camera; microphone; geolocation; clipboard-read; clipboard-write; fullscreen"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
