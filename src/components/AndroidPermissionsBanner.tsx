import { useState, useEffect } from 'react';
import {
  Layers,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  Bell,
  Camera,
  Mic,
  Navigation,
} from 'lucide-react';
import {
  isAndroidNative,
  checkPermissionsStatus,
  requestAllPermissions,
  requestOverlayPermission,
  requestIgnoreBatteryOptimization,
  openAppSettings,
  type PermissionStatusSummary,
} from '../core/utils/permissionManager';

interface AndroidPermissionsBannerProps {
  language: 'ar' | 'en';
  standalone?: boolean;
}

export function AndroidPermissionsBanner({ language, standalone = false }: AndroidPermissionsBannerProps) {
  const [status, setStatus] = useState<PermissionStatusSummary | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [hasNativeBridge, setHasNativeBridge] = useState(false);

  useEffect(() => {
    setHasNativeBridge(isAndroidNative());
    checkPermissionsStatus().then(setStatus);
  }, []);

  const handleRequestAll = async () => {
    setRequesting(true);
    try {
      await requestAllPermissions({ promptOverlay: true });
      const updated = await checkPermissionsStatus();
      setStatus(updated);
    } finally {
      setRequesting(false);
    }
  };

  const isAr = language === 'ar';

  return (
    <div
      id="android-permissions-panel"
      className={`p-5 sm:p-6 rounded-3xl border ${
        standalone
          ? 'bg-[var(--surface-2)] border-[var(--accent)] shadow-2xl my-4'
          : 'bg-[var(--surface)] border-[var(--border)] shadow-lg'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--border-strong)] flex-shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-base font-bold text-[var(--text)]">
                {isAr ? 'الظهور فوق التطبيقات والحرية الكاملة للوكيل الذكي' : 'Display Over Other Apps & Full Freedom'}
              </strong>
              {status?.hasOverlay && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  {isAr ? 'إذن الظهور مفعل' : 'Overlay Active'}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
              {isAr
                ? 'يمنح هذا الإذن لوكيل آدم (ADEM) صلاحية العمل الدائم فوق التطبيقات والرد والتحكم في النظام والخلفية بدون توقف أو قيود من نظام أندرويد.'
                : 'Enables ADEM AI Agent to stay floating above apps, execute persistent background operations, and respond without OS interruption.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-request-all-permissions"
          onClick={handleRequestAll}
          disabled={requesting}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--accent)] text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 hover:opacity-90 cursor-pointer whitespace-nowrap self-stretch sm:self-auto"
        >
          <ShieldCheck size={16} />
          <span>
            {requesting
              ? (isAr ? 'جاري طلب الأذونات...' : 'Requesting...')
              : (isAr ? 'منح كافة الأذونات دفعة واحدة' : 'Grant All Permissions')}
          </span>
        </button>
      </div>

      {/* Permission Grid Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-2.5">
          <Layers size={18} className="text-[var(--accent)] flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[var(--text)] block truncate">
              {isAr ? 'فوق التطبيقات (Overlay)' : 'Draw Over Apps'}
            </span>
            <small className="text-[10px] text-[var(--muted)]">
              {status?.hasOverlay ? (isAr ? 'مفعل ✓' : 'Granted ✓') : (isAr ? 'مطلوب للمهام العائمة' : 'Needed for floating')}
            </small>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-2.5">
          <Zap size={18} className="text-amber-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[var(--text)] block truncate">
              {isAr ? 'العمل المستمر بالخلفية' : 'Background Execution'}
            </span>
            <small className="text-[10px] text-[var(--muted)]">
              {isAr ? 'تخطي قيود البطارية' : 'Ignore battery limits'}
            </small>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-2.5">
          <Mic size={18} className="text-emerald-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[var(--text)] block truncate">
              {isAr ? 'الميكروفون والصوت' : 'Microphone & Audio'}
            </span>
            <small className="text-[10px] text-[var(--muted)]">
              {status?.microphone === 'granted' ? (isAr ? 'مفعل ✓' : 'Granted ✓') : (isAr ? 'للأوامر الصوتية' : 'For voice commands')}
            </small>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-2.5">
          <Camera size={18} className="text-sky-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[var(--text)] block truncate">
              {isAr ? 'الكاميرا والموقع' : 'Camera & Location'}
            </span>
            <small className="text-[10px] text-[var(--muted)]">
              {isAr ? 'للرؤية والخرائط المباشرة' : 'Vision & Live Maps'}
            </small>
          </div>
        </div>
      </div>

      {/* Manual Granular Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]">
        <button
          type="button"
          id="btn-request-overlay"
          onClick={requestOverlayPermission}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] font-semibold transition-all cursor-pointer"
        >
          <Layers size={14} className="text-[var(--accent)]" />
          <span>{isAr ? 'طلب إذن الظهور فوق التطبيقات' : 'Request Overlay Permission'}</span>
        </button>

        <button
          type="button"
          id="btn-ignore-battery"
          onClick={requestIgnoreBatteryOptimization}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] font-semibold transition-all cursor-pointer"
        >
          <Zap size={14} className="text-amber-400" />
          <span>{isAr ? 'إلغاء قيود البطارية (العمل بالخلفية)' : 'Unrestricted Battery (Background)'}</span>
        </button>

        <button
          type="button"
          id="btn-open-settings"
          onClick={openAppSettings}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--text)] font-semibold transition-all cursor-pointer ml-auto"
        >
          <ExternalLink size={14} />
          <span>{isAr ? 'إعدادات التطبيق بالنظام' : 'App System Settings'}</span>
        </button>
      </div>
    </div>
  );
}
