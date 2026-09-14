import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  CalendarCheck,
  Gamepad2,
  Calculator,
  Sparkles,
  Image as ImageIcon,
  PhoneCall,
  Bot,
  Brain,
  ShieldCheck,
  Settings,
  Youtube,
  Search,
  Globe,
  Code,
  Share2,
  MessageSquare,
  Send,
  Music,
  Languages,
  ExternalLink,
  ArrowUpRight,
  Check,
  X,
  Play,
  RotateCcw
} from 'lucide-react';
import type { ViewId } from '../../core/domain';

export interface AppLauncherData {
  id: string;
  type: 'view' | 'sandbox' | 'external';
  title: string;
  category: string;
  description: string;
  iconName: string;
  view?: ViewId;
  sandboxAppId?: string;
  externalUrl?: string;
  autoLaunch?: boolean;
  countdownSeconds?: number;
}

interface AppLauncherCardProps {
  data: AppLauncherData;
  language: 'ar' | 'en';
  onNavigateView?: (view: ViewId, extraParam?: string) => void;
  onOpenSandbox?: (appId: string) => void;
}

function getAppIcon(name: string, size = 20) {
  switch (name) {
    case 'MapPin': return <MapPin size={size} />;
    case 'CalendarCheck': return <CalendarCheck size={size} />;
    case 'Gamepad2': return <Gamepad2 size={size} />;
    case 'Calculator': return <Calculator size={size} />;
    case 'Sparkles': return <Sparkles size={size} />;
    case 'Image': return <ImageIcon size={size} />;
    case 'PhoneCall': return <PhoneCall size={size} />;
    case 'Bot': return <Bot size={size} />;
    case 'Brain': return <Brain size={size} />;
    case 'ShieldCheck': return <ShieldCheck size={size} />;
    case 'Settings': return <Settings size={size} />;
    case 'Youtube': return <Youtube size={size} />;
    case 'Search': return <Search size={size} />;
    case 'Globe': return <Globe size={size} />;
    case 'Code': return <Code size={size} />;
    case 'Share2': return <Share2 size={size} />;
    case 'MessageSquare': return <MessageSquare size={size} />;
    case 'Send': return <Send size={size} />;
    case 'Music': return <Music size={size} />;
    case 'Languages': return <Languages size={size} />;
    default: return <Sparkles size={size} />;
  }
}

export function AppLauncherCard({
  data,
  language,
  onNavigateView,
  onOpenSandbox,
}: AppLauncherCardProps) {
  const isAr = language === 'ar';
  const launchKey = `adem_autolaunched_${data.id || data.sandboxAppId || data.view || 'app'}`;
  const alreadyLaunched = typeof window !== 'undefined' && localStorage.getItem(launchKey) === 'true';
  const effectiveAutoLaunch = data.autoLaunch && !alreadyLaunched;

  const initialSeconds = data.countdownSeconds ?? 2;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLaunch = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsLaunched(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(launchKey, 'true');
    }

    if (data.type === 'external' && data.externalUrl) {
      window.open(data.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (data.sandboxAppId && onOpenSandbox) {
      onOpenSandbox(data.sandboxAppId);
      return;
    }

    if (data.view && onNavigateView) {
      onNavigateView(data.view, data.sandboxAppId);
      return;
    }

    // Fallback via Window CustomEvent
    window.dispatchEvent(
      new CustomEvent('adam_open_app', {
        detail: {
          view: data.view,
          sandboxAppId: data.sandboxAppId,
          url: data.externalUrl,
        },
      })
    );
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsCancelled(true);
  };

  useEffect(() => {
    if (!effectiveAutoLaunch || isCancelled || isLaunched) return;

    if (secondsLeft <= 0) {
      handleLaunch();
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [effectiveAutoLaunch, isCancelled, isLaunched, secondsLeft]);

  const progressPercent = Math.max(0, Math.min(100, ((initialSeconds - secondsLeft) / initialSeconds) * 100));

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/95 via-slate-950/90 to-emerald-950/30 shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* Top Countdown Progress Line */}
      {effectiveAutoLaunch && !isCancelled && !isLaunched && (
        <div className="h-1 w-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col gap-3.5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-inner flex items-center justify-center">
              {getAppIcon(data.iconName, 24)}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-100">{data.title}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                  {data.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {data.description}
              </p>
            </div>
          </div>
        </div>

        {/* Status & Feedback Indicator */}
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
          {isLaunched ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Check size={14} className="text-emerald-400" />
              <span>{isAr ? 'تم تشغيل التطبيق بنجاح 🚀' : 'App launched successfully 🚀'}</span>
            </div>
          ) : isCancelled ? (
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <RotateCcw size={14} />
              <span>{isAr ? 'تم إيقاف التوجيه التلقائي، يمكنك الدخول يدوياً' : 'Auto-launch paused, click Launch to open'}</span>
            </div>
          ) : effectiveAutoLaunch ? (
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                {isAr
                  ? `جاري التوجيه والدخول خلال ${secondsLeft} ثوانٍ...`
                  : `Auto-navigating in ${secondsLeft}s...`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-300">
              <Sparkles size={14} className="text-teal-400" />
              <span>{isAr ? 'التطبيق جاهز للتشغيل عند الطلب' : 'Ready to launch on demand'}</span>
            </div>
          )}

          {data.externalUrl && (
            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Globe size={11} />
              <span>External</span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
          {effectiveAutoLaunch && !isCancelled && !isLaunched && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all flex items-center gap-1 cursor-pointer"
            >
              <X size={13} />
              <span>{isAr ? 'إلغاء التوجيه' : 'Cancel'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleLaunch}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {data.type === 'external' ? (
              <>
                <ExternalLink size={14} />
                <span>{isAr ? 'دخول التطبيق ↗' : 'Launch External App ↗'}</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>{isAr ? 'دخول التطبيق الآن 🚀' : 'Launch App Now 🚀'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
