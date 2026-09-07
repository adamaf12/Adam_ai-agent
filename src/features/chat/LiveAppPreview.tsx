import React, { useState, useMemo } from 'react';
import { Play, Code, Copy, Check, RefreshCw, ExternalLink, Sparkles, Smartphone, Monitor } from 'lucide-react';
import type { Language } from '../../core/domain';

interface LiveAppPreviewProps {
  content: string;
  language: Language;
}

export function LiveAppPreview({ content, language }: LiveAppPreviewProps) {
  const isArabic = language === 'ar' || /[\u0600-\u06FF]/.test(content);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'mobile'>('responsive');
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Extract the code block from markdown
  const extractedCode = useMemo(() => {
    // If the message contains an image and doesn't contain a clear HTML code fence, do not treat as app
    const hasImage = /!\[.*?\]\(https?:\/\/[^\s\)]+\)/i.test(content);
    const hasCodeFence = /```(?:html|jsx|tsx|javascript|js)?/i.test(content);
    if (hasImage && !hasCodeFence) return null;

    // Check for standard code fences
    const codeBlockRegex = /```(?:html|jsx|tsx|javascript|js)?\s*([\s\S]*?)```/g;
    let match;
    const blocks: string[] = [];
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match[1]?.trim()) {
        blocks.push(match[1].trim());
      }
    }

    if (blocks.length > 0) {
      // Find the most suitable HTML/interactive block
      const htmlBlock = blocks.find(b => b.includes('<html') || b.includes('<!DOCTYPE') || (b.includes('<div') && (b.includes('<script') || b.includes('<style') || b.includes('<button') || b.includes('<canvas'))));
      return htmlBlock || null;
    }

    // Unclosed code block during streaming
    const unclosedMatch = /```(?:html|jsx|tsx|javascript|js)?\s*([\s\S]+)$/i.exec(content);
    if (unclosedMatch && unclosedMatch[1]?.trim()) {
      const partial = unclosedMatch[1].trim();
      if (partial.includes('<!DOCTYPE') || partial.includes('<html') || partial.includes('<div') || partial.includes('<canvas')) {
        return partial;
      }
    }

    // Only accept raw HTML if it is a complete HTML document
    if (/<!DOCTYPE html>|<html\b/i.test(content)) {
      return content.trim();
    }

    return null;
  }, [content]);

  // Check if content is runnable
  const isRunnable = useMemo(() => {
    if (!extractedCode) return false;
    const lower = extractedCode.toLowerCase();
    const hasDocStructure = lower.includes('<!doctype') || lower.includes('<html');
    const hasInteractiveLogic = (lower.includes('<button') || lower.includes('<canvas') || lower.includes('<form') || lower.includes('<input')) &&
      (lower.includes('<script') || lower.includes('addeventlistener') || lower.includes('onclick') || lower.includes('function') || lower.includes('<style'));
    return hasDocStructure || hasInteractiveLogic;
  }, [extractedCode]);

  // Build a secure, self-contained HTML bundle
  const bundledHtml = useMemo(() => {
    if (!extractedCode) return '';
    let raw = extractedCode;

    // If it's already a full HTML document, inject error catcher and responsive meta
    if (raw.includes('<!DOCTYPE html>') || raw.includes('<html')) {
      // Ensure Tailwind or basic styling if not present
      if (!raw.includes('tailwindcss') && !raw.includes('<style')) {
        raw = raw.replace('<head>', '<head><script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>');
      }
      return raw;
    }

    // Wrap fragment into a modern sandboxed page
    return `<!DOCTYPE html>
<html lang="${language}" dir="${isArabic ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 1rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0b0f19;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #app-root {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div id="app-root">
    ${raw}
  </div>
  <script>
    window.onerror = function(msg, url, line) {
      console.warn('Applet Runtime Info:', msg, 'at line', line);
      return false;
    };
  </script>
</body>
</html>`;
  }, [extractedCode, language, isArabic]);

  if (!isRunnable || !extractedCode) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWindow = () => {
    const blob = new Blob([bundledHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="my-3.5 rounded-2xl border border-indigo-500/30 dark:border-indigo-500/20 bg-slate-900/95 shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-200">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-950/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-400" />
            {isArabic ? 'معاينة تفاعلية حية' : 'Live Interactive App'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Preview Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
            }`}
          >
            <Play size={12} className="fill-current" />
            {isArabic ? 'تشغيل وتجربة' : 'Live Preview'}
          </button>

          {/* Code Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
            }`}
          >
            <Code size={13} />
            {isArabic ? 'الكود' : 'Code'}
          </button>

          {/* Device Size Switcher (only in preview mode) */}
          {activeTab === 'preview' && (
            <button
              type="button"
              onClick={() => setDeviceMode(prev => (prev === 'responsive' ? 'mobile' : 'responsive'))}
              title={deviceMode === 'responsive' ? (isArabic ? 'عرض الهاتف' : 'Mobile View') : (isArabic ? 'عرض كامل' : 'Responsive View')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition cursor-pointer"
            >
              {deviceMode === 'responsive' ? <Smartphone size={14} /> : <Monitor size={14} />}
            </button>
          )}

          {/* Reload Button */}
          <button
            type="button"
            onClick={() => setReloadKey(k => k + 1)}
            title={isArabic ? 'إعادة تشغيل التطبيق' : 'Reload App'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition cursor-pointer"
          >
            <RefreshCw size={13} />
          </button>

          {/* External Window */}
          <button
            type="button"
            onClick={handleOpenWindow}
            title={isArabic ? 'فتح في نافذة مستقلة' : 'Open in New Window'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition cursor-pointer"
          >
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="p-3 bg-slate-950 flex flex-col items-center justify-center min-h-[380px]">
        {activeTab === 'preview' ? (
          <div
            className={`w-full transition-all duration-300 rounded-xl overflow-hidden border border-slate-800/80 bg-[#090d16] shadow-inner ${
              deviceMode === 'mobile' ? 'max-w-[360px] h-[520px]' : 'h-[460px]'
            }`}
          >
            <iframe
              key={reloadKey}
              srcDoc={bundledHtml}
              title="Interactive Live App Preview"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
              className="w-full h-full border-0 bg-transparent"
            />
          </div>
        ) : (
          <div className="w-full relative">
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-3 left-3 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg border border-slate-700 z-10 cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'نسخ الكود' : 'Copy Code')}
            </button>
            <pre className="p-4 pt-12 bg-slate-950 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto max-h-[460px] border border-slate-800/80 shadow-inner select-text">
              <code>{extractedCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
