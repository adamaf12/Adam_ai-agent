import React, { useState } from 'react';
import { Globe, ExternalLink, Search, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export interface GroundingSource {
  title: string;
  url: string;
  domain?: string;
}

export interface GroundingSourcesProps {
  sources: GroundingSource[];
  queries?: string[];
  language: 'ar' | 'en';
}

export function GroundingSources({ sources, queries = [], language }: GroundingSourcesProps) {
  const [expanded, setExpanded] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  if (!sources.length && !queries.length) return null;

  const isAr = language === 'ar';
  const displayLimit = 4;
  const hasMore = sources.length > displayLimit;
  const visibleSources = expanded ? sources : sources.slice(0, displayLimit);

  const handleImageError = (url: string) => {
    setImageErrors(prev => ({ ...prev, [url]: true }));
  };

  return (
    <div
      id="grounding-sources-container"
      className="mt-3.5 pt-3 border-t border-slate-700/60 text-xs text-slate-300 select-text"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 font-medium text-slate-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Globe size={12} />
          </div>
          <span className="text-[12px] font-semibold text-slate-200">
            {isAr ? 'مصادر البحث المباشر في Google' : 'Grounded with Google Search'}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
            <CheckCircle2 size={10} />
            {isAr ? 'بيانات حية' : 'Live Real-time'}
          </span>
        </div>

        {hasMore && (
          <button
            id="toggle-more-sources-btn"
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800"
          >
            {expanded
              ? (isAr ? 'إخفاء الفائض' : 'Show less')
              : (isAr ? `عرض الكل (${sources.length})` : `Show all (${sources.length})`)}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Search Queries Used */}
      {queries.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Search size={10} />
            {isAr ? 'استعلامات البحث:' : 'Search queries:'}
          </span>
          {queries.map((q, idx) => (
            <span
              key={`query-${idx}`}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/70 text-[10px] text-slate-300 font-mono"
            >
              &ldquo;{q}&rdquo;
            </span>
          ))}
        </div>
      )}

      {/* Sources Grid / List */}
      {sources.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {visibleSources.map((source, index) => {
            const domain = source.domain || (() => {
              try {
                return new URL(source.url).hostname.replace(/^www\./, '');
              } catch {
                return 'web';
              }
            })();

            const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
            const hasImgError = imageErrors[source.url];

            return (
              <a
                key={`source-${index}-${source.url}`}
                id={`grounding-source-link-${index}`}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700/90 transition-all duration-150 text-left rtl:text-right shadow-sm"
              >
                {/* Favicon or Fallback Icon */}
                <div className="w-5 h-5 rounded-md bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-700/50">
                  {!hasImgError ? (
                    <img
                      src={faviconUrl}
                      alt=""
                      className="w-3.5 h-3.5 object-contain"
                      loading="lazy"
                      onError={() => handleImageError(source.url)}
                    />
                  ) : (
                    <Globe size={11} className="text-slate-400" />
                  )}
                </div>

                {/* Title and Domain */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-slate-200 truncate group-hover:text-indigo-300 transition-colors leading-snug">
                    {source.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <span>{domain}</span>
                  </p>
                </div>

                {/* External Link Icon */}
                <ExternalLink
                  size={12}
                  className="text-slate-500 group-hover:text-indigo-400 transition-colors flex-shrink-0 opacity-70 group-hover:opacity-100"
                />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
