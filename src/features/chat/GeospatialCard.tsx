import { useState } from 'react';
import { Compass, Copy, Check, ExternalLink, MapPin, Navigation, Route } from 'lucide-react';
import { openSafeExternalUrl } from '../../core/utils/mobileWebHandler';

export interface GeospatialCardPayload {
  destination: string;
  origin?: string;
  coordinates?: { lat: number; lng: number };
  estimatedDistance?: string;
  estimatedDuration?: string;
  landmarks?: string[];
  recommendedRoute?: string;
  googleMapsUrl?: string;
}

interface GeospatialCardProps {
  payload: GeospatialCardPayload;
  language: 'ar' | 'en';
}

export function GeospatialCard({ payload, language }: GeospatialCardProps) {
  const isAr = language === 'ar';
  const [copied, setCopied] = useState(false);

  const coordsText = payload.coordinates
    ? `${payload.coordinates.lat.toFixed(4)}, ${payload.coordinates.lng.toFixed(4)}`
    : '';

  const copyCoords = () => {
    if (!coordsText) return;
    navigator.clipboard?.writeText(coordsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMap = () => {
    const url =
      payload.googleMapsUrl ||
      (payload.coordinates
        ? `https://www.google.com/maps/search/?api=1&query=${payload.coordinates.lat},${payload.coordinates.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(payload.destination)}`);
    openSafeExternalUrl(url, { title: payload.destination });
  };

  return (
    <div className="my-3 rounded-2xl border border-emerald-500/30 bg-slate-950/85 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border-b border-emerald-500/25 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Compass size={14} />
          </div>
          <div>
            <span className="font-bold text-slate-100">{payload.destination}</span>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span>{isAr ? 'محرك الملاحة والذكاء الجغرافي' : 'Geospatial & Route Engine'}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenMap}
          className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1"
        >
          <ExternalLink size={12} />
          <span>{isAr ? 'عرض في الخرائط ↗' : 'Google Maps ↗'}</span>
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Route Info Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {payload.estimatedDistance && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'المسافة المقدرة' : 'Est. Distance'}</span>
              <span className="font-bold text-slate-200 text-sm">{payload.estimatedDistance}</span>
            </div>
          )}
          {payload.estimatedDuration && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'الزمن المقدر' : 'Est. Duration'}</span>
              <span className="font-bold text-emerald-400 text-sm">{payload.estimatedDuration}</span>
            </div>
          )}
          {coordsText && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">{isAr ? 'الإحداثيات' : 'Coordinates'}</span>
                <span className="font-mono text-xs text-slate-200">{coordsText}</span>
              </div>
              <button
                type="button"
                onClick={copyCoords}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isAr ? 'نسخ الإحداثيات' : 'Copy'}
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
          )}
        </div>

        {/* Recommended route narrative */}
        {payload.recommendedRoute && (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5 text-xs">
              <Route size={13} />
              <span>{isAr ? 'إرشادات المسار والتنقل الموصى بها:' : 'Recommended Route & Waypoints:'}</span>
            </div>
            <p>{payload.recommendedRoute}</p>
          </div>
        )}

        {/* Landmarks */}
        {payload.landmarks && payload.landmarks.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <MapPin size={12} className="text-rose-400" />
              <span>{isAr ? 'أبرز المعالم على المسار:' : 'Key Waypoints & Landmarks:'}</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {payload.landmarks.map((lm, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                >
                  {lm}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
