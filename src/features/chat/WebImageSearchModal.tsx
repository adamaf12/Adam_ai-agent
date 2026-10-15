import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Globe,
  ExternalLink,
  Download,
  Check,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import type { Language } from '../../core/domain';

export interface WebImageItem {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  description?: string;
  source: string;
  pageUrl?: string;
  width?: number;
  height?: number;
  author?: string;
  license?: string;
}

interface WebImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelectImage: (image: WebImageItem, mode: 'insert_markdown' | 'send_now') => void;
  initialQuery?: string;
}

const QUICK_SEARCH_PRESETS = [
  { ar: 'أمن سيبراني', en: 'Cybersecurity' },
  { ar: 'اختراق أخلاقي', en: 'Ethical Hacking' },
  { ar: 'طرفية لينكس', en: 'Linux Terminal' },
  { ar: 'هندسة عكسية', en: 'Reverse Engineering' },
  { ar: 'خوارزميات وبرمجة', en: 'Computer Algorithms' },
  { ar: 'خوادم ومراكز بيانات', en: 'Data Center Servers' },
  { ar: 'ذكاء اصطناعي وروبوتات', en: 'Artificial Intelligence' },
  { ar: 'فضاء ومجرات', en: 'Space Nebula' },
  { ar: 'طبيعة ومعالم الجزائر', en: 'Algeria Landmarks' },
];

export function WebImageSearchModal({
  isOpen,
  onClose,
  language,
  onSelectImage,
  initialQuery = '',
}: WebImageSearchModalProps) {
  const isAr = language === 'ar';
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<WebImageItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<WebImageItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const q = initialQuery || (isAr ? 'أمن سيبراني' : 'Cybersecurity');
      setQuery(q);
      executeSearch(q);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setResults([]);
      setError(null);
      setPreviewImage(null);
    }
  }, [isOpen, initialQuery]);

  const executeSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/search/images?q=${encodeURIComponent(q)}&limit=12&lang=${language}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.images)) {
        setResults(data.images);
        if (data.images.length === 0) {
          setError(
            isAr
              ? 'لم يتم العثور على صور مطابقة، جرب كلمات بحث أخرى (بالعربية أو الإنجليزية).'
              : 'No web images found matching this query. Try different keywords.'
          );
        }
      } else {
        setError(data.error || (isAr ? 'تعذر جلب الصور من الإنترنت حالياً' : 'Failed to retrieve images'));
      }
    } catch (err: any) {
      setError(err?.message || (isAr ? 'حدث خطأ في الاتصال بالإنترنت' : 'Network search error'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch(query);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleCopyUrl = (img: WebImageItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(img.url);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[var(--surface)] border border-[var(--border-strong)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text)] flex items-center gap-2">
                <span>{isAr ? 'جلب صور حقيقية من الإنترنت' : 'Live Internet Image Search'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  Wikimedia & Web
                </span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {isAr
                  ? 'ابحث وجلب صوراً حية وعالية الدقة من الإنترنت لعرضها فوراً في المحادثة'
                  : 'Search and insert genuine high-res web photographs directly into the conversation'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar & Filters */}
        <div className="p-4 border-b border-[var(--border)] space-y-3 bg-[var(--surface)]">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute top-1/2 -translate-y-1/2 start-3 text-[var(--muted)] pointer-events-none"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAr ? 'اكتب ما تبحث عنه (مثال: أمن سيبراني، خريطة، روبوت، Linux)...' : 'Search internet images (e.g. Cybersecurity, Linux, AI, Satellite)...'}
                className="w-full ps-9 pe-4 py-2.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-blue-500 transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-[var(--muted)] hover:text-[var(--text)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => executeSearch(query)}
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span>{isAr ? 'بحث' : 'Search'}</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] text-[var(--muted)] flex-shrink-0 font-medium me-1">
              {isAr ? 'اقتراحات سريعة:' : 'Quick tags:'}
            </span>
            {QUICK_SEARCH_PRESETS.map((preset, idx) => {
              const label = isAr ? preset.ar : preset.en;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(label);
                    executeSearch(label);
                  }}
                  className="flex-shrink-0 px-2.5 py-1 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] text-[11px] transition cursor-pointer"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {loading && (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-[var(--muted)]">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <p className="text-xs sm:text-sm font-medium">
                {isAr ? 'جاري استرجاع الصور الحقيقية من الإنترنت…' : 'Retrieving high-resolution web media…'}
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="h-64 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-1">
                <ImageIcon size={24} />
              </div>
              <p className="text-xs sm:text-sm text-[var(--text)] font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] hover:border-blue-500/60 transition-all flex flex-col shadow-sm hover:shadow-lg"
                >
                  {/* Thumbnail */}
                  <div
                    className="relative aspect-video sm:aspect-square bg-slate-900 overflow-hidden cursor-pointer"
                    onClick={() => setPreviewImage(img)}
                  >
                    <img
                      src={img.thumbnail || img.url}
                      alt={img.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Dim Overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(img);
                        }}
                        className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/90 transition cursor-pointer"
                        title={isAr ? 'معاينة ملء الشاشة' : 'Full Preview'}
                      >
                        <Maximize2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleCopyUrl(img, e)}
                        className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/90 transition cursor-pointer"
                        title={isAr ? 'نسخ الرابط' : 'Copy URL'}
                      >
                        {copiedId === img.id ? <Check size={14} className="text-emerald-400" /> : <ExternalLink size={14} />}
                      </button>
                    </div>

                    {/* Resolution badge */}
                    {img.width && img.height && (
                      <span className="absolute bottom-1.5 start-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-mono text-slate-300 backdrop-blur-sm">
                        {img.width}×{img.height}
                      </span>
                    )}
                  </div>

                  {/* Info & Action */}
                  <div className="p-2.5 flex flex-col justify-between flex-1 gap-2">
                    <div>
                      <h4 className="text-[11px] font-semibold text-[var(--text)] line-clamp-1" title={img.title}>
                        {img.title}
                      </h4>
                      <p className="text-[9px] text-[var(--muted)] flex items-center justify-between mt-0.5">
                        <span className="truncate max-w-[120px]">{img.source}</span>
                        {img.license && <span className="opacity-70 truncate">{img.license.slice(0, 15)}</span>}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectImage(img, 'insert_markdown');
                          onClose();
                        }}
                        className="flex-1 py-1 px-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-[10px] font-medium transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={11} />
                        <span>{isAr ? 'إدراج' : 'Insert'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectImage(img, 'send_now');
                          onClose();
                        }}
                        className="py-1 px-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] text-[10px] font-medium transition cursor-pointer"
                        title={isAr ? 'إرسال مباشر إلى المحادثة' : 'Send to Chat immediately'}
                      >
                        {isAr ? 'إرسال' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-2)]/40 flex items-center justify-between text-xs text-[var(--muted)]">
          <span>
            {results.length > 0 ? (
              isAr ? `تم العثور على ${results.length} صورة حقيقية` : `Found ${results.length} real web images`
            ) : (
              isAr ? 'محرك البحث الإعلامي المباشر ADEM Web Image Fetcher' : 'ADEM Live Web Media Retrieval'
            )}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text)] transition cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>

      {/* Fullscreen Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-slate-700"
            />
            <div className="mt-3 flex items-center justify-between w-full px-2 text-white">
              <span className="text-xs font-medium truncate max-w-[60%]">{previewImage.title}</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  download={previewImage.title}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1 transition"
                >
                  <Download size={14} />
                  <span>{isAr ? 'تحميل' : 'Download'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onSelectImage(previewImage, 'insert_markdown');
                    setPreviewImage(null);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>{isAr ? 'إدراج في المحادثة' : 'Insert in Chat'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
